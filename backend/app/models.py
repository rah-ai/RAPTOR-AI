"""
RAPTOR Pydantic Models
All data schemas for API request/response, internal state, and WebSocket messages.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ──────────────────────────────── ENUMS ────────────────────────────────

class RiskLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    EXTREME = "EXTREME"


class FlightPhase(str, Enum):
    GROUND = "ground"
    TAKEOFF = "takeoff"
    CLIMB = "climb"
    EN_ROUTE = "en_route"
    DESCENT = "descent"
    APPROACH = "approach"
    LANDING = "landing"


class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


# ──────────────────────────────── AIRPORT ────────────────────────────────

class Airport(BaseModel):
    icao: str
    name: str
    city: str = ""
    country: str = ""
    latitude: float
    longitude: float
    elevation_ft: float = 0.0
    type: str = ""


class Runway(BaseModel):
    airport_icao: str
    runway_id: str = ""
    length_ft: float = 0.0
    width_ft: float = 0.0
    bearing: float = 0.0  # Degrees
    le_latitude: Optional[float] = None
    le_longitude: Optional[float] = None
    he_latitude: Optional[float] = None
    he_longitude: Optional[float] = None


class ApproachCorridor(BaseModel):
    runway_id: str
    bearing: float
    polygon: list[list[float]]  # List of [lat, lon] pairs
    risk_level: RiskLevel = RiskLevel.LOW


# ──────────────────────────────── WEATHER ────────────────────────────────

class CloudLayer(BaseModel):
    cover: str  # SKC, FEW, SCT, BKN, OVC
    base_ft: Optional[int] = None


class WeatherData(BaseModel):
    icao: str
    raw_metar: str = ""
    observation_time: Optional[datetime] = None
    wind_direction: Optional[int] = None  # Degrees
    wind_speed: Optional[int] = None  # Knots
    wind_gust: Optional[int] = None  # Knots
    visibility_miles: Optional[float] = None
    temperature_c: Optional[float] = None
    dewpoint_c: Optional[float] = None
    altimeter: Optional[float] = None
    clouds: list[CloudLayer] = []
    ceiling_ft: Optional[int] = None  # Lowest BKN/OVC layer
    precipitation: bool = False
    flight_category: str = "VFR"  # VFR, MVFR, IFR, LIFR
    cached: bool = False
    cached_at: Optional[datetime] = None


# ──────────────────────────────── AIRCRAFT ────────────────────────────────

class Aircraft(BaseModel):
    icao24: str
    callsign: str = ""
    origin_country: str = ""
    latitude: float
    longitude: float
    altitude_ft: float = 0.0
    geo_altitude_ft: Optional[float] = None
    velocity_kts: float = 0.0
    heading: float = 0.0
    vertical_rate_fpm: float = 0.0
    on_ground: bool = False
    squawk: Optional[str] = None
    phase: FlightPhase = FlightPhase.EN_ROUTE
    last_updated: Optional[datetime] = None


# ──────────────────────────────── RISK ────────────────────────────────

class RiskFactor(BaseModel):
    name: str
    contribution: float  # 0-1 percentage contribution
    description: str = ""


class RiskScore(BaseModel):
    score: float = 0.0  # 0.0 - 1.0
    level: RiskLevel = RiskLevel.LOW
    rule_based_score: float = 0.0
    ml_score: float = 0.0
    factors: list[RiskFactor] = []
    primary_factor: str = ""


class AircraftRisk(BaseModel):
    aircraft: Aircraft
    risk: RiskScore


# ──────────────────────────────── ALERTS ────────────────────────────────

class Alert(BaseModel):
    id: str
    timestamp: datetime
    severity: AlertSeverity
    title: str
    message: str
    risk_level: Optional[RiskLevel] = None
    aircraft_callsign: Optional[str] = None


# ──────────────────────────────── HISTORICAL ────────────────────────────────

class HistoricalStrike(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    date: Optional[str] = None
    time_of_day: Optional[str] = None
    species: str = "Unknown"
    altitude_ft: Optional[float] = None
    phase_of_flight: str = ""
    damage: str = "None"
    cost: Optional[float] = None
    airport_icao: str = ""


# ──────────────────────────────── FORECAST ────────────────────────────────

class ForecastEntry(BaseModel):
    timestamp: datetime
    risk_score: float
    risk_level: RiskLevel
    is_dawn: bool = False
    is_dusk: bool = False
    label: str = ""


# ──────────────────────────────── DASHBOARD STATE ────────────────────────────────

class DashboardState(BaseModel):
    airport: Optional[Airport] = None
    weather: Optional[WeatherData] = None
    aircraft: list[AircraftRisk] = []
    overall_risk: RiskScore = Field(default_factory=RiskScore)
    forecast: list[ForecastEntry] = []
    alerts: list[Alert] = []
    historical_strikes: list[HistoricalStrike] = []
    runways: list[Runway] = []
    approach_corridors: list[ApproachCorridor] = []
    aircraft_count: int = 0
    last_updated: Optional[datetime] = None
    opensky_cached: bool = False
    opensky_cache_time: Optional[datetime] = None
    historical_data_available: bool = True


# ──────────────────────────────── API RESPONSES ────────────────────────────────

class AirportSearchResult(BaseModel):
    airports: list[Airport]
    count: int


class SelectAirportRequest(BaseModel):
    icao: str


class LiveStateResponse(BaseModel):
    airport: Optional[Airport] = None
    weather: Optional[WeatherData] = None
    aircraft: list[AircraftRisk] = []
    overall_risk: RiskScore = Field(default_factory=RiskScore)
    forecast: list[ForecastEntry] = []
    aircraft_count: int = 0
    last_updated: Optional[datetime] = None
    opensky_cached: bool = False


class WebSocketMessage(BaseModel):
    type: str = "state_update"
    data: Optional[LiveStateResponse] = None
    alert: Optional[Alert] = None
