"""
RAPTOR Weather Service
Fetches live METAR observations from aviationweather.gov.
Parses wind, visibility, clouds, ceiling, temperature, and precipitation.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.config import METAR_API_URL
from app.models import CloudLayer, WeatherData

logger = logging.getLogger("raptor.weather")

# Precipitation indicator codes from METAR
PRECIPITATION_CODES = {
    "RA", "SN", "DZ", "SG", "PL", "GR", "GS", "UP",
    "TSRA", "TSSN", "FZRA", "FZDZ", "+RA", "-RA",
    "+SN", "-SN", "+DZ", "-DZ", "SHRA", "SHSN",
}


class WeatherService:
    """Fetches and parses METAR weather data."""

    def __init__(self):
        self._cache: dict[str, WeatherData] = {}

    async def fetch_weather(self, icao: str) -> Optional[WeatherData]:
        """Fetch current METAR for an airport."""
        icao = icao.strip().upper()

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    METAR_API_URL,
                    params={"ids": icao, "format": "json"},
                )
                response.raise_for_status()
                data = response.json()

            if not data or not isinstance(data, list) or len(data) == 0:
                logger.warning(f"No METAR data for {icao}")
                return self._get_cached(icao)

            metar = data[0]
            weather = self._parse_metar(metar, icao)
            self._cache[icao] = weather
            logger.info(f"Weather updated for {icao}: {weather.raw_metar[:60]}...")
            return weather

        except Exception as e:
            logger.error(f"Weather fetch error for {icao}: {e}")
            return self._get_cached(icao)

    def _parse_metar(self, data: dict, icao: str) -> WeatherData:
        """Parse aviationweather.gov JSON METAR into WeatherData."""
        # Parse cloud layers
        clouds = []
        ceiling_ft = None
        raw_clouds = data.get("clouds", [])

        if isinstance(raw_clouds, list):
            for cloud in raw_clouds:
                cover = cloud.get("cover", "")
                base = cloud.get("base")
                base_ft = int(base) if base is not None else None

                clouds.append(CloudLayer(cover=cover, base_ft=base_ft))

                # Ceiling = lowest BKN or OVC layer
                if cover in ("BKN", "OVC", "VV") and base_ft is not None:
                    if ceiling_ft is None or base_ft < ceiling_ft:
                        ceiling_ft = base_ft

        # Parse raw METAR for precipitation
        raw_ob = data.get("rawOb", "")
        precipitation = False
        if raw_ob:
            tokens = raw_ob.split()
            for token in tokens:
                if any(code in token for code in PRECIPITATION_CODES):
                    precipitation = True
                    break

        # Also check pcp6hr (6-hour precipitation) if available
        pcp = data.get("pcp6hr")
        if pcp is not None and float(pcp) > 0:
            precipitation = True

        # Parse visibility
        visib = data.get("visib")
        visibility = None
        if visib is not None:
            try:
                vis_str = str(visib).replace("+", "")
                visibility = float(vis_str)
            except ValueError:
                visibility = None

        # Observation time
        obs_time = None
        report_time = data.get("reportTime")
        if report_time:
            try:
                obs_time = datetime.fromisoformat(report_time.replace("Z", "+00:00"))
            except (ValueError, TypeError):
                pass

        return WeatherData(
            icao=icao,
            raw_metar=raw_ob or "",
            observation_time=obs_time,
            wind_direction=data.get("wdir"),
            wind_speed=data.get("wspd"),
            wind_gust=data.get("wgst"),
            visibility_miles=visibility,
            temperature_c=data.get("temp"),
            dewpoint_c=data.get("dewp"),
            altimeter=data.get("altim"),
            clouds=clouds,
            ceiling_ft=ceiling_ft,
            precipitation=precipitation,
            flight_category=data.get("fltCat", "VFR"),
        )

    def _get_cached(self, icao: str) -> Optional[WeatherData]:
        """Return cached weather with cache flag."""
        cached = self._cache.get(icao)
        if cached:
            cached.cached = True
            cached.cached_at = datetime.now(timezone.utc)
            logger.info(f"Serving cached weather for {icao}")
        return cached


# Global singleton
weather_service = WeatherService()
