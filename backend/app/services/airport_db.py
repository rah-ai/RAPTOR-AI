"""
RAPTOR Airport Database Service
Loads OurAirports CSV data, provides airport search and runway geometry.
Auto-downloads CSVs on first run.
"""

from __future__ import annotations

import logging
import math
from pathlib import Path
from typing import Optional

import httpx
import pandas as pd
import numpy as np

from app.config import (
    AIRPORTS_CSV, RUNWAYS_CSV, DATA_DIR,
    OURAIRPORTS_AIRPORTS_URL, OURAIRPORTS_RUNWAYS_URL,
)
from app.models import Airport, ApproachCorridor, RiskLevel, Runway

logger = logging.getLogger("raptor.airport_db")


class AirportDatabase:
    """Manages airport and runway data from OurAirports."""

    def __init__(self):
        self.airports_df: Optional[pd.DataFrame] = None
        self.runways_df: Optional[pd.DataFrame] = None
        self._loaded = False

    async def initialize(self):
        """Download CSVs if needed and load into memory."""
        DATA_DIR.mkdir(parents=True, exist_ok=True)

        # Download if not present
        if not AIRPORTS_CSV.exists():
            logger.info("Downloading airports.csv from OurAirports...")
            await self._download_file(OURAIRPORTS_AIRPORTS_URL, AIRPORTS_CSV)

        if not RUNWAYS_CSV.exists():
            logger.info("Downloading runways.csv from OurAirports...")
            await self._download_file(OURAIRPORTS_RUNWAYS_URL, RUNWAYS_CSV)

        # Load DataFrames
        logger.info("Loading airport database...")
        self.airports_df = pd.read_csv(AIRPORTS_CSV, low_memory=False)
        self.runways_df = pd.read_csv(RUNWAYS_CSV, low_memory=False)

        # Filter to airports with ICAO identifiers (medium & large airports)
        self.airports_df = self.airports_df[
            self.airports_df["ident"].str.match(r"^[A-Z]{4}$", na=False)
        ].copy()

        # Clean up
        self.airports_df["ident"] = self.airports_df["ident"].str.strip().str.upper()
        self.airports_df["name"] = self.airports_df["name"].fillna("")
        self.airports_df["municipality"] = self.airports_df["municipality"].fillna("")
        self.airports_df["iso_country"] = self.airports_df["iso_country"].fillna("")

        self._loaded = True
        logger.info(f"Loaded {len(self.airports_df)} airports and {len(self.runways_df)} runways")

    async def _download_file(self, url: str, dest: Path):
        """Download a file with httpx."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            dest.write_bytes(response.content)
            logger.info(f"Downloaded {dest.name} ({len(response.content)} bytes)")

    def search_airports(self, query: str, limit: int = 15) -> list[Airport]:
        """Search airports by partial name or ICAO code."""
        if not self._loaded or self.airports_df is None:
            return []

        q = query.strip().upper()
        if len(q) < 2:
            return []

        df = self.airports_df

        # Exact ICAO match first
        exact = df[df["ident"] == q]
        if not exact.empty:
            results = [self._row_to_airport(row) for _, row in exact.iterrows()]
        else:
            results = []

        # Partial ICAO match
        icao_match = df[
            (df["ident"].str.contains(q, case=False, na=False)) &
            (df["ident"] != q)
        ].head(limit)
        results.extend([self._row_to_airport(row) for _, row in icao_match.iterrows()])

        # Name / city match
        name_match = df[
            (df["name"].str.contains(query.strip(), case=False, na=False)) |
            (df["municipality"].str.contains(query.strip(), case=False, na=False))
        ].head(limit)
        seen_icao = {a.icao for a in results}
        for _, row in name_match.iterrows():
            if row["ident"] not in seen_icao:
                results.append(self._row_to_airport(row))
                seen_icao.add(row["ident"])

        return results[:limit]

    def get_airport(self, icao: str) -> Optional[Airport]:
        """Get a single airport by exact ICAO code."""
        if not self._loaded or self.airports_df is None:
            return None

        icao = icao.strip().upper()
        match = self.airports_df[self.airports_df["ident"] == icao]
        if match.empty:
            return None
        return self._row_to_airport(match.iloc[0])

    def get_runways(self, icao: str) -> list[Runway]:
        """Get all runways for an airport."""
        if not self._loaded or self.runways_df is None:
            return []

        # Match by airport_ident
        rwy_df = self.runways_df[
            self.runways_df["airport_ident"].str.upper() == icao.strip().upper()
        ]

        runways = []
        for _, row in rwy_df.iterrows():
            try:
                runway = Runway(
                    airport_icao=icao,
                    runway_id=str(row.get("id", "")),
                    length_ft=float(row.get("length_ft", 0) or 0),
                    width_ft=float(row.get("width_ft", 0) or 0),
                    bearing=float(row.get("le_heading_degT", 0) or 0),
                    le_latitude=self._safe_float(row.get("le_latitude_deg")),
                    le_longitude=self._safe_float(row.get("le_longitude_deg")),
                    he_latitude=self._safe_float(row.get("he_latitude_deg")),
                    he_longitude=self._safe_float(row.get("he_longitude_deg")),
                )
                runways.append(runway)
            except (ValueError, TypeError):
                continue

        return runways

    def compute_approach_corridors(
        self, airport: Airport, runways: list[Runway]
    ) -> list[ApproachCorridor]:
        """
        Compute approach corridor polygons for each runway.
        Each corridor is a trapezoid extending ~10nm from the runway threshold.
        """
        corridors = []
        for runway in runways:
            if runway.le_latitude is None or runway.le_longitude is None:
                continue

            # Approach corridor from the LE (lower end) side
            corridor = self._build_corridor(
                runway.le_latitude, runway.le_longitude,
                runway.bearing + 180,  # Approach is opposite to runway heading
                runway.runway_id + "_LE",
            )
            if corridor:
                corridors.append(corridor)

            # Approach corridor from the HE (higher end) side
            if runway.he_latitude is not None and runway.he_longitude is not None:
                he_bearing = (runway.bearing + 180) % 360
                corridor = self._build_corridor(
                    runway.he_latitude, runway.he_longitude,
                    runway.bearing,
                    runway.runway_id + "_HE",
                )
                if corridor:
                    corridors.append(corridor)

        return corridors

    def _build_corridor(
        self, lat: float, lon: float, approach_bearing: float, name: str,
        length_nm: float = 10.0, width_nm: float = 2.0,
    ) -> Optional[ApproachCorridor]:
        """Build a trapezoidal approach corridor polygon."""
        try:
            # Convert nautical miles to degrees (approximate)
            nm_to_deg_lat = 1.0 / 60.0
            nm_to_deg_lon = 1.0 / (60.0 * math.cos(math.radians(lat)))

            bearing_rad = math.radians(approach_bearing)
            perp_rad = math.radians((approach_bearing + 90) % 360)

            # Near end (runway threshold) — narrow
            half_near = width_nm * 0.3
            # Far end — wider
            half_far = width_nm * 0.7

            # Four corners of trapezoid
            points = []

            # Near left
            nlat = lat + half_near * nm_to_deg_lat * math.cos(perp_rad)
            nlon = lon + half_near * nm_to_deg_lon * math.sin(perp_rad)
            points.append([nlat, nlon])

            # Near right
            nlat = lat - half_near * nm_to_deg_lat * math.cos(perp_rad)
            nlon = lon - half_near * nm_to_deg_lon * math.sin(perp_rad)
            points.append([nlat, nlon])

            # Far right
            flat = lat + length_nm * nm_to_deg_lat * math.cos(bearing_rad)
            flon = lon + length_nm * nm_to_deg_lon * math.sin(bearing_rad)
            flat_r = flat - half_far * nm_to_deg_lat * math.cos(perp_rad)
            flon_r = flon - half_far * nm_to_deg_lon * math.sin(perp_rad)
            points.append([flat_r, flon_r])

            # Far left
            flat_l = flat + half_far * nm_to_deg_lat * math.cos(perp_rad)
            flon_l = flon + half_far * nm_to_deg_lon * math.sin(perp_rad)
            points.append([flat_l, flon_l])

            return ApproachCorridor(
                runway_id=name,
                bearing=approach_bearing,
                polygon=points,
            )
        except Exception as e:
            logger.warning(f"Failed to build corridor {name}: {e}")
            return None

    def _row_to_airport(self, row) -> Airport:
        return Airport(
            icao=str(row["ident"]).strip().upper(),
            name=str(row.get("name", "")),
            city=str(row.get("municipality", "")),
            country=str(row.get("iso_country", "")),
            latitude=float(row.get("latitude_deg", 0)),
            longitude=float(row.get("longitude_deg", 0)),
            elevation_ft=float(row.get("elevation_ft", 0) or 0),
            type=str(row.get("type", "")),
        )

    def _safe_float(self, val) -> Optional[float]:
        try:
            if pd.isna(val):
                return None
            return float(val)
        except (ValueError, TypeError):
            return None


# Global singleton
airport_db = AirportDatabase()
