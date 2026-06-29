"""
RAPTOR Historical Data Router
Historical strike records and risk forecast endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.models import ForecastEntry, HistoricalStrike
from app.state import app_state

router = APIRouter(prefix="/api", tags=["historical"])


@router.get("/historical/strikes", response_model=list[HistoricalStrike])
async def get_historical_strikes():
    """Get historical strike records for the current airport."""
    return app_state.historical_strikes


@router.get("/forecast", response_model=list[ForecastEntry])
async def get_forecast():
    """Get 6-hour risk forecast."""
    return app_state.forecast
