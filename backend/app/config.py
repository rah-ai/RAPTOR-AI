"""
RAPTOR Configuration
Central configuration for all constants, API URLs, risk multipliers, and thresholds.
"""

import os
from pathlib import Path

# ──────────────────────────────── PATHS ────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODEL_PATH = DATA_DIR / "raptor_model.joblib"
AIRPORTS_CSV = DATA_DIR / "airports.csv"
RUNWAYS_CSV = DATA_DIR / "runways.csv"
STRIKES_CSV = DATA_DIR / "wildlife_strikes.csv"

# ──────────────────────────────── API URLs ────────────────────────────────
OPENSKY_API_URL = "https://opensky-network.org/api/states/all"
METAR_API_URL = "https://aviationweather.gov/api/data/metar"
OURAIRPORTS_AIRPORTS_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv"
OURAIRPORTS_RUNWAYS_URL = "https://davidmegginson.github.io/ourairports-data/runways.csv"

# ──────────────────────────────── POLLING INTERVALS ────────────────────────────────
OPENSKY_POLL_SECONDS = 15  # 15s to respect rate limits (unauthenticated ~10 req/min)
WEATHER_POLL_SECONDS = 300  # 5 minutes — METARs update every 30 min or on sig change

# ──────────────────────────────── GEOGRAPHY ────────────────────────────────
AIRPORT_RADIUS_KM = 50  # Radius around airport to fetch aircraft
KM_TO_DEG_LAT = 1 / 111.0  # Approximate conversion
KM_TO_DEG_LON_EQUATOR = 1 / 111.32

# Metres to feet
METRES_TO_FEET = 3.281

# ──────────────────────────────── RISK MULTIPLIERS ────────────────────────────────
# Layer 1: Rule-based scoring multipliers from aviation safety research
RISK_MULTIPLIERS = {
    "dawn": 1.8,        # 90 minutes around sunrise
    "dusk": 1.6,        # 90 minutes around sunset
    "spring": 1.7,      # March-May migration
    "autumn": 1.9,      # September-November migration
    "summer": 1.0,      # Normal
    "winter": 0.8,      # Low bird activity
    "low_ceiling": 1.5, # Cloud ceiling below 1500 ft
    "high_wind": 1.3,   # Wind speed > 15 knots
    "precipitation": 0.5,  # Birds shelter in rain
    "alt_below_500": 2.0,  # Critical altitude band
    "alt_500_1500": 1.5,
    "alt_1500_3000": 1.2,
    "alt_above_3000": 0.8,
}

# Dawn/dusk window in minutes around sunrise/sunset
DAWN_DUSK_WINDOW_MINUTES = 90

# ──────────────────────────────── RISK LEVELS ────────────────────────────────
RISK_LEVELS = {
    "LOW": {"min": 0.0, "max": 0.25, "color": "#0F4C29"},
    "MODERATE": {"min": 0.25, "max": 0.50, "color": "#7C4A00"},
    "HIGH": {"min": 0.50, "max": 0.75, "color": "#C41230"},
    "EXTREME": {"min": 0.75, "max": 1.0, "color": "#7B0D1E"},
}

# ──────────────────────────────── FEATURE ENCODING ────────────────────────────────
PHASE_ENCODING = {
    "ground": 0,
    "en_route": 0,
    "climb": 1,
    "takeoff": 1,
    "descent": 2,
    "approach": 2,
    "landing": 3,
}

SKY_CONDITION_ENCODING = {
    "CLR": 0, "SKC": 0, "CAVOK": 0,
    "FEW": 1,
    "SCT": 2,
    "BKN": 3,
    "OVC": 4,
    "VV": 4,
}

SEASON_ENCODING = {
    1: 0, 2: 0, 12: 0,        # Winter
    3: 1, 4: 1, 5: 1,         # Spring
    6: 2, 7: 2, 8: 2,         # Summer
    9: 3, 10: 3, 11: 3,       # Autumn
}

SEASON_NAMES = {0: "winter", 1: "spring", 2: "summer", 3: "autumn"}

# ──────────────────────────────── ALTITUDE BANDS ────────────────────────────────
def get_altitude_band(altitude_ft: float) -> int:
    """Return altitude band encoding: 0=above 3000, 1=1500-3000, 2=500-1500, 3=below 500."""
    if altitude_ft > 3000:
        return 0
    elif altitude_ft > 1500:
        return 1
    elif altitude_ft > 500:
        return 2
    else:
        return 3

# ──────────────────────────────── XGBOOST HYPERPARAMETERS ────────────────────────────────
XGBOOST_PARAMS = {
    "n_estimators": 200,
    "max_depth": 6,
    "learning_rate": 0.1,
    "objective": "binary:logistic",
    "eval_metric": "logloss",
    "random_state": 42,
    "use_label_encoder": False,
}

# ──────────────────────────────── SERVER ────────────────────────────────
HOST = "0.0.0.0"
PORT = 8000
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "*",  # Allow all for deployment — tighten for production
]

# Historical density default for airports not in FAA database
DEFAULT_HISTORICAL_DENSITY = 0.3

# Maximum alerts to keep in memory
MAX_ALERTS = 50

# Forecast parameters
FORECAST_HOURS = 6
FORECAST_INTERVAL_MINUTES = 30
