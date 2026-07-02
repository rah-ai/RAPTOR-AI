import os
import httpx
import logging
import asyncio
import random
from typing import Dict, Any

logger = logging.getLogger(__name__)

EBIRD_API_KEY = os.getenv("EBIRD_API_KEY")

async def fetch_live_bird_density(latitude: float, longitude: float, radius_km: int = 30) -> float:
    """
    Fetches live bird density data from Cornell's eBird API.
    If EBIRD_API_KEY is not set, mocks the response with realistic startup-demo data.
    """
    if not EBIRD_API_KEY:
        # Mocking mode for Demo/Pitch
        logger.info("EBIRD_API_KEY not found. Using sophisticated mock for live bird density.")
        # We simulate high flock density for the demo flight area (LGA/Hudson)
        if latitude and longitude and 40.7 <= latitude <= 40.8 and -74.1 <= longitude <= -73.8:
            return random.uniform(0.8, 0.95) # High density
            
        return random.uniform(0.05, 0.25)
        
    try:
        url = f"https://api.ebird.org/v2/data/obs/geo/recent?lat={latitude}&lng={longitude}&dist={radius_km}"
        headers = {"x-ebirdapitoken": EBIRD_API_KEY}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=3.0)
            
            if response.status_code == 200:
                data = response.json()
                total_sightings = len(data)
                density = min(total_sightings / 200.0, 1.0)
                return density
            else:
                logger.warning(f"eBird API returned {response.status_code}. Falling back to default.")
                return 0.1
                
    except Exception as e:
        logger.error(f"Error fetching from eBird API: {e}")
        return 0.1
