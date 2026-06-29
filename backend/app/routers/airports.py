"""
RAPTOR Airport Router
Airport search and selection endpoints.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

import pandas as pd
from fastapi import APIRouter, HTTPException

from app.models import (
    Airport, AirportSearchResult, DashboardState,
    HistoricalStrike, SelectAirportRequest,
)
from app.state import app_state
from app.config import STRIKES_CSV, DEFAULT_HISTORICAL_DENSITY
from app.services.airport_db import airport_db
from app.services.weather import weather_service
from app.services.opensky import opensky_service
from app.services.risk_engine import (
    compute_aircraft_risk, compute_overall_risk, compute_forecast,
)

logger = logging.getLogger("raptor.router.airports")

router = APIRouter(prefix="/api/airports", tags=["airports"])


# ─── Historical Strike Cache — loaded once at startup ───

_strikes_df: Optional[pd.DataFrame] = None
_strikes_loaded = False


def _ensure_strikes_loaded():
    """Lazily load the FAA CSV once, then serve from cache."""
    global _strikes_df, _strikes_loaded
    if _strikes_loaded:
        return
    _strikes_loaded = True
    try:
        if STRIKES_CSV.exists():
            logger.info(f"Loading historical strikes CSV ({STRIKES_CSV})...")
            _strikes_df = pd.read_csv(
                STRIKES_CSV,
                low_memory=False,
                encoding="latin-1",
                usecols=lambda c: c in [
                    "AIRPORT_ID", "INCIDENT_DATE", "INCIDENT_MONTH", "INCIDENT_YEAR",
                    "TIME_OF_DAY", "LATITUDE", "LONGITUDE", "HEIGHT",
                    "PHASE_OF_FLIGHT", "SPECIES", "DAMAGE_LEVEL", "COST_REPAIRS",
                ],
            )
            if "AIRPORT_ID" in _strikes_df.columns:
                _strikes_df["AIRPORT_ID"] = _strikes_df["AIRPORT_ID"].astype(str).str.strip().str.upper()
            logger.info(f"Loaded {len(_strikes_df):,} historical strike records")
        else:
            logger.info("Strike CSV not found — historical data unavailable")
    except Exception as e:
        logger.error(f"Error loading strike CSV: {e}")


# ─── Routes ───

@router.get("/search", response_model=AirportSearchResult)
async def search_airports(q: str = ""):
    """Search airports by name or ICAO code."""
    if len(q.strip()) < 2:
        return AirportSearchResult(airports=[], count=0)

    results = airport_db.search_airports(q)
    return AirportSearchResult(airports=results, count=len(results))


@router.post("/select", response_model=DashboardState)
async def select_airport(request: SelectAirportRequest):
    """Select an airport and initialise all data."""
    icao = request.icao.strip().upper()

    # Find airport
    airport = airport_db.get_airport(icao)
    if not airport:
        raise HTTPException(status_code=404, detail=f"Airport {icao} not found")

    logger.info(f"Selecting airport: {airport.name} ({icao})")

    # Set airport
    await app_state.set_airport(airport)

    # Load runways and approach corridors
    runways = airport_db.get_runways(icao)
    corridors = airport_db.compute_approach_corridors(airport, runways)
    await app_state.set_runways(runways, corridors)

    # Load historical strike data (from cached DataFrame)
    await _load_historical_data(icao)

    # Fetch weather (with timeout protection)
    try:
        weather = await weather_service.fetch_weather(icao)
        if weather:
            await app_state.update_weather(weather)
    except Exception as e:
        logger.warning(f"Weather fetch failed: {e}")

    # Fetch aircraft (with timeout protection)
    try:
        aircraft_list, is_cached = await opensky_service.fetch_aircraft(
            airport.latitude, airport.longitude,
        )
        app_state.opensky_cached = is_cached
        app_state.opensky_cache_time = opensky_service.cache_time
    except Exception as e:
        logger.warning(f"OpenSky fetch failed: {e}")
        aircraft_list = []

    # Compute risk for each aircraft
    weather = app_state.weather
    aircraft_risks = []
    for ac in aircraft_list:
        risk = compute_aircraft_risk(
            ac, weather,
            airport.latitude, airport.longitude,
            app_state.historical_density,
        )
        aircraft_risks.append(risk)

    await app_state.update_aircraft(aircraft_risks)

    # Compute overall risk
    overall = compute_overall_risk(aircraft_risks)
    await app_state.update_overall_risk(overall)

    # Compute forecast
    forecast = compute_forecast(
        airport.latitude, airport.longitude,
        weather, app_state.historical_density,
    )
    await app_state.update_forecast(forecast)

    return app_state.get_dashboard_state()


async def _load_historical_data(icao: str):
    """Load historical strike data for this airport from the cached DataFrame."""
    _ensure_strikes_loaded()

    strikes = []
    density = DEFAULT_HISTORICAL_DENSITY
    available = False

    try:
        if _strikes_df is not None and "AIRPORT_ID" in _strikes_df.columns:
            airport_df = _strikes_df[_strikes_df["AIRPORT_ID"] == icao]

            if len(airport_df) > 0:
                available = True
                airport_strikes = len(airport_df)

                # Historical density (normalised)
                max_airport = _strikes_df["AIRPORT_ID"].value_counts().max()
                density = airport_strikes / max_airport if max_airport > 0 else 0.3

                # Build strike records (limit to 500 for performance)
                for _, row in airport_df.head(500).iterrows():
                    strike = HistoricalStrike(
                        latitude=float(row["LATITUDE"]) if pd.notna(row.get("LATITUDE")) else None,
                        longitude=float(row["LONGITUDE"]) if pd.notna(row.get("LONGITUDE")) else None,
                        date=str(row.get("INCIDENT_DATE", "")),
                        time_of_day=str(row.get("TIME_OF_DAY", "")),
                        species=str(row.get("SPECIES", "Unknown")) if pd.notna(row.get("SPECIES")) else "Unknown",
                        altitude_ft=float(row["HEIGHT"]) if pd.notna(row.get("HEIGHT")) else None,
                        phase_of_flight=str(row.get("PHASE_OF_FLIGHT", "")) if pd.notna(row.get("PHASE_OF_FLIGHT")) else "",
                        damage=str(row.get("DAMAGE_LEVEL", "None")) if pd.notna(row.get("DAMAGE_LEVEL")) else "None",
                        cost=float(row["COST_REPAIRS"]) if pd.notna(row.get("COST_REPAIRS")) else None,
                        airport_icao=icao,
                    )
                    strikes.append(strike)

                logger.info(f"Loaded {len(strikes)} historical strikes for {icao} (density: {density:.3f})")
            else:
                logger.info(f"No historical data for {icao} — using default density")
        else:
            logger.info("Strike data not loaded — using default density")

    except Exception as e:
        logger.error(f"Error loading historical data: {e}")

    await app_state.set_historical(strikes, density, available)
