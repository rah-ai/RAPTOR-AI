"""
RAPTOR In-Memory State Manager
Manages the current application state for the selected airport.
Thread-safe state management with asyncio locks.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from app.models import (
    Airport, Aircraft, AircraftRisk, Alert, AlertSeverity,
    ApproachCorridor, DashboardState, ForecastEntry,
    HistoricalStrike, LiveStateResponse, RiskLevel, RiskScore,
    Runway, WeatherData,
)
from app.config import MAX_ALERTS


class AppState:
    """Singleton in-memory state for the currently active airport."""

    def __init__(self):
        self._lock = asyncio.Lock()
        self.current_airport: Optional[Airport] = None
        self.weather: Optional[WeatherData] = None
        self.aircraft: list[AircraftRisk] = []
        self.overall_risk: RiskScore = RiskScore()
        self.forecast: list[ForecastEntry] = []
        self.alerts: list[Alert] = []
        self.historical_strikes: list[HistoricalStrike] = []
        self.runways: list[Runway] = []
        self.approach_corridors: list[ApproachCorridor] = []
        self.last_updated: Optional[datetime] = None
        self.opensky_cached: bool = False
        self.opensky_cache_time: Optional[datetime] = None
        self.historical_data_available: bool = True
        self.historical_density: float = 0.3  # Default for intl airports
        self.live_bird_density: float = 0.0
        self.websocket_clients: list = []

    async def set_airport(self, airport: Airport):
        async with self._lock:
            self.current_airport = airport
            self.aircraft = []
            self.alerts = []
            self.overall_risk = RiskScore()
            self.forecast = []
            self.last_updated = datetime.now(timezone.utc)

    async def update_weather(self, weather: WeatherData):
        async with self._lock:
            self.weather = weather

    async def update_aircraft(self, aircraft: list[AircraftRisk]):
        async with self._lock:
            self.aircraft = aircraft
            self.aircraft.sort(key=lambda a: a.risk.score, reverse=True)
            self.last_updated = datetime.now(timezone.utc)

    async def update_overall_risk(self, risk: RiskScore):
        async with self._lock:
            old_level = self.overall_risk.level
            self.overall_risk = risk
            # Generate alert on level change
            if old_level != risk.level and self.current_airport:
                await self._add_alert_internal(risk)

    async def _add_alert_internal(self, risk: RiskScore):
        """Internal alert generation — must be called within lock."""
        severity = AlertSeverity.INFO
        if risk.level == RiskLevel.HIGH:
            severity = AlertSeverity.WARNING
        elif risk.level == RiskLevel.EXTREME:
            severity = AlertSeverity.CRITICAL

        alert = Alert(
            id=str(uuid4())[:8],
            timestamp=datetime.now(timezone.utc),
            severity=severity,
            title=f"Risk Level Changed to {risk.level.value}",
            message=f"Airport risk level is now {risk.level.value}. "
                    f"Primary factor: {risk.primary_factor}. "
                    f"Score: {risk.score:.1%}",
            risk_level=risk.level,
        )
        self.alerts.insert(0, alert)
        if len(self.alerts) > MAX_ALERTS:
            self.alerts = self.alerts[:MAX_ALERTS]

    async def add_aircraft_alert(self, aircraft_risk: AircraftRisk):
        """Generate alert for high-risk individual aircraft."""
        async with self._lock:
            if aircraft_risk.risk.level in (RiskLevel.HIGH, RiskLevel.EXTREME):
                alert = Alert(
                    id=str(uuid4())[:8],
                    timestamp=datetime.now(timezone.utc),
                    severity=AlertSeverity.WARNING if aircraft_risk.risk.level == RiskLevel.HIGH else AlertSeverity.CRITICAL,
                    title=f"High Risk Aircraft: {aircraft_risk.aircraft.callsign.strip() or aircraft_risk.aircraft.icao24}",
                    message=f"{aircraft_risk.aircraft.callsign.strip()} at {aircraft_risk.aircraft.altitude_ft:.0f}ft "
                            f"({aircraft_risk.aircraft.phase.value}) — Risk: {aircraft_risk.risk.score:.1%}. "
                            f"{aircraft_risk.risk.primary_factor}",
                    risk_level=aircraft_risk.risk.level,
                    aircraft_callsign=aircraft_risk.aircraft.callsign.strip(),
                )
                self.alerts.insert(0, alert)
                if len(self.alerts) > MAX_ALERTS:
                    self.alerts = self.alerts[:MAX_ALERTS]

    async def update_forecast(self, forecast: list[ForecastEntry]):
        async with self._lock:
            self.forecast = forecast

    async def set_historical(self, strikes: list[HistoricalStrike], density: float, available: bool):
        async with self._lock:
            self.historical_strikes = strikes
            self.historical_density = density
            self.historical_data_available = available

    async def set_runways(self, runways: list[Runway], corridors: list[ApproachCorridor]):
        async with self._lock:
            self.runways = runways
            self.approach_corridors = corridors

    def get_dashboard_state(self) -> DashboardState:
        return DashboardState(
            airport=self.current_airport,
            weather=self.weather,
            aircraft=self.aircraft,
            overall_risk=self.overall_risk,
            forecast=self.forecast,
            alerts=self.alerts,
            historical_strikes=self.historical_strikes,
            runways=self.runways,
            approach_corridors=self.approach_corridors,
            aircraft_count=len(self.aircraft),
            last_updated=self.last_updated,
            opensky_cached=self.opensky_cached,
            opensky_cache_time=self.opensky_cache_time,
            historical_data_available=self.historical_data_available,
        )

    def get_live_state(self) -> LiveStateResponse:
        return LiveStateResponse(
            airport=self.current_airport,
            weather=self.weather,
            aircraft=self.aircraft,
            overall_risk=self.overall_risk,
            forecast=self.forecast,
            aircraft_count=len(self.aircraft),
            last_updated=self.last_updated,
            opensky_cached=self.opensky_cached,
        )


# Global singleton
app_state = AppState()
