from fastapi import APIRouter
from datetime import datetime, timezone
from app.models import (
    LiveStateResponse, Aircraft, AircraftRisk, RiskScore, RiskLevel,
    FlightPhase, WeatherData, CloudLayer
)
from app.services.risk_engine import compute_aircraft_risk, compute_overall_risk

router = APIRouter(prefix="/demo", tags=["Demo"])

@router.get("/1549", response_model=LiveStateResponse)
def get_flight_1549_demo():
    """
    Mock endpoint that feeds the historical data of US Airways Flight 1549 
    into the actual ML risk predictor engine, demonstrating backend evaluation.
    """
    # 1. Historical weather for KLGA, Jan 15, 2009
    demo_weather = WeatherData(
        icao="KLGA",
        raw_metar="METAR KLGA 152051Z 33011KT 10SM BKN035 M06/M14 A3032 RMK AO2 SLP265",
        observation_time=datetime(2009, 1, 15, 20, 51, tzinfo=timezone.utc),
        wind_direction=330,
        wind_speed=11,
        visibility_miles=10.0,
        temperature_c=-6.0,
        dewpoint_c=-14.0,
        altimeter=30.32,
        clouds=[CloudLayer(cover="BKN", base_ft=3500)],
        ceiling_ft=3500,
        precipitation=False,
        flight_category="VFR"
    )

    # 2. Historical telemetry for AWE1549 during climb out
    demo_aircraft = Aircraft(
        icao24="awe1549",
        callsign="AWE1549",
        origin_country="United States",
        latitude=40.785,
        longitude=-73.875,
        altitude_ft=2800,
        geo_altitude_ft=2850,
        velocity_kts=220,
        heading=320,
        vertical_rate_fpm=1200,
        on_ground=False,
        squawk="1549",
        phase=FlightPhase.CLIMB,
        last_updated=datetime(2009, 1, 15, 20, 27, 10, tzinfo=timezone.utc).isoformat()
    )

    # 3. Process the mocked data through the actual Risk Engine
    # KLGA coordinates
    klga_lat = 40.7772
    klga_lon = -73.8726
    
    # We pass the historical datetime into the risk engine so the ML model 
    # evaluates it as a winter afternoon (which drastically increases Canada Geese migration risk).
    historical_time = datetime(2009, 1, 15, 20, 27, 10, tzinfo=timezone.utc)

    aircraft_risk = compute_aircraft_risk(
        aircraft=demo_aircraft,
        weather=demo_weather,
        lat=klga_lat,
        lon=klga_lon,
        historical_density=4.5,  # High historical strike density at KLGA
        now=historical_time
    )

    overall = compute_overall_risk([aircraft_risk])

    return LiveStateResponse(
        airport=None,  # Not needed for simple demo payload, frontend merges it
        weather=demo_weather,
        aircraft=[aircraft_risk],
        overall_risk=overall,
        forecast=[],
        aircraft_count=1,
        last_updated=datetime.now(timezone.utc),
        opensky_cached=False
    )
