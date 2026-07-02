import asyncio
import logging
import random
from typing import List
from datetime import datetime, timezone

from app.models import Airport, RiskLevel
from app.services.opensky import opensky_service
from app.services.risk_engine import compute_aircraft_risk
from app.state import app_state
import json

logger = logging.getLogger("raptor.global_monitor")

# Busiest global airports
GLOBAL_AIRPORTS = [
    Airport(icao="KJFK", name="John F. Kennedy International", iata="JFK", city="New York", country="USA", latitude=40.6413, longitude=-73.7781, elevation_ft=13),
    Airport(icao="EGLL", name="Heathrow", iata="LHR", city="London", country="UK", latitude=51.4700, longitude=-0.4543, elevation_ft=83),
    Airport(icao="OMDB", name="Dubai International", iata="DXB", city="Dubai", country="UAE", latitude=25.2532, longitude=55.3657, elevation_ft=62),
    Airport(icao="RJTT", name="Tokyo Haneda", iata="HND", city="Tokyo", country="Japan", latitude=35.5494, longitude=139.7798, elevation_ft=35),
    Airport(icao="LFPG", name="Charles de Gaulle", iata="CDG", city="Paris", country="France", latitude=49.0097, longitude=2.5479, elevation_ft=392),
    Airport(icao="YSSY", name="Sydney Kingsford Smith", iata="SYD", city="Sydney", country="Australia", latitude=-33.9461, longitude=151.1772, elevation_ft=21),
    Airport(icao="VABB", name="Chhatrapati Shivaji Maharaj", iata="BOM", city="Mumbai", country="India", latitude=19.0896, longitude=72.8656, elevation_ft=39),
]

async def poll_global_airports():
    """
    Polls the global airports to detect any extreme bird strike risks around the world.
    If an extreme risk is detected, it broadcasts a GLOBAL_ALERT via WebSockets.
    """
    logger.info("Starting global airport scan...")
    
    for airport in GLOBAL_AIRPORTS:
        # Don't poll the airport we are currently viewing (that's handled by main scheduler)
        if app_state.current_airport and app_state.current_airport.icao == airport.icao:
            continue
            
        try:
            # Random wait to avoid hammering OpenSky
            await asyncio.sleep(random.uniform(0.5, 2.0))
            
            aircraft_list, _ = await opensky_service.fetch_aircraft(airport.latitude, airport.longitude)
            
            for ac in aircraft_list:
                # We use default historical density for global scan
                risk = compute_aircraft_risk(ac, None, airport.latitude, airport.longitude, historical_density=0.3)
                
                if risk.risk.level == RiskLevel.EXTREME and risk.risk.score > 0.85:
                    logger.warning(f"GLOBAL ALERT: Extreme risk detected at {airport.icao} for {ac.callsign} (Score: {risk.risk.score:.2f})")
                    
                    if app_state.websocket_clients:
                        alert_data = {
                            "type": "global_alert",
                            "data": {
                                "airport": airport.model_dump(),
                                "aircraft_callsign": ac.callsign,
                                "risk_score": risk.risk.score,
                                "timestamp": datetime.now(timezone.utc).isoformat(),
                                "message": f"CRITICAL: Extreme avian risk detected at {airport.name} ({airport.icao})."
                            }
                        }
                        
                        message = json.dumps(alert_data)
                        disconnected = []
                        for ws in app_state.websocket_clients:
                            try:
                                await ws.send_text(message)
                            except Exception:
                                disconnected.append(ws)
                        
                        for ws in disconnected:
                            if ws in app_state.websocket_clients:
                                app_state.websocket_clients.remove(ws)
                                
                    # If we found an extreme risk, stop scanning to avoid alert spam
                    return
                    
        except Exception as e:
            logger.debug(f"Global monitor failed for {airport.icao}: {e}")
