"""
RAPTOR Background Scheduler
APScheduler jobs for polling OpenSky and weather APIs on a timer.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import httpx
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import OPENSKY_POLL_SECONDS, WEATHER_POLL_SECONDS
from app.state import app_state
from app.services.opensky import opensky_service
from app.services.weather import weather_service
from app.services.risk_engine import (
    compute_aircraft_risk, compute_overall_risk, compute_forecast,
)
from app.services.ebird import fetch_live_bird_density
from app.services.global_monitor import poll_global_airports

logger = logging.getLogger("raptor.scheduler")

scheduler = AsyncIOScheduler()


async def poll_aircraft():
    """Poll OpenSky for aircraft positions and recompute risk."""
    if app_state.current_airport is None:
        return

    airport = app_state.current_airport

    try:
        # Fetch aircraft
        aircraft_list, is_cached = await opensky_service.fetch_aircraft(
            airport.latitude, airport.longitude,
        )

        app_state.opensky_cached = is_cached
        app_state.opensky_cache_time = opensky_service.cache_time

        # Get current weather for risk calculation
        weather = app_state.weather

        # Compute risk for each aircraft
        aircraft_risks = []
        for ac in aircraft_list:
            risk = compute_aircraft_risk(
                ac, weather,
                airport.latitude, airport.longitude,
                app_state.historical_density,
                app_state.live_bird_density,
            )
            aircraft_risks.append(risk)

            # Generate alert for high-risk aircraft
            if risk.risk.score >= 0.5:
                await app_state.add_aircraft_alert(risk)

        # Update state
        await app_state.update_aircraft(aircraft_risks)

        # Compute overall airport risk
        overall = compute_overall_risk(
            aircraft_risks, app_state.historical_density, app_state.live_bird_density
        )
        await app_state.update_overall_risk(overall)

        # Update forecast
        forecast = compute_forecast(
            airport.latitude, airport.longitude,
            weather, app_state.historical_density, app_state.live_bird_density
        )
        await app_state.update_forecast(forecast)

        # Push to WebSocket clients
        await broadcast_state()

        logger.debug(
            f"Aircraft update: {len(aircraft_risks)} aircraft, "
            f"overall risk: {overall.score:.2%} ({overall.level.value})"
        )

    except Exception as e:
        logger.error(f"Aircraft poll error: {e}", exc_info=True)


async def poll_weather():
    """Poll weather API for current METAR."""
    if app_state.current_airport is None:
        return

    try:
        weather = await weather_service.fetch_weather(
            app_state.current_airport.icao,
        )
        if weather:
            await app_state.update_weather(weather)
            
        # Also poll eBird
        live_density = await fetch_live_bird_density(
            app_state.current_airport.latitude,
            app_state.current_airport.longitude,
        )
        app_state.live_bird_density = live_density

        if weather:
            logger.info(f"Weather & eBird updated: {weather.raw_metar[:40]}... (Live Density: {live_density:.2f})")

    except Exception as e:
        logger.error(f"Weather poll error: {e}", exc_info=True)


async def broadcast_state():
    """Push current state to all connected WebSocket clients."""
    if not app_state.websocket_clients:
        return

    state = app_state.get_live_state()
    message = json.dumps({
        "type": "state_update",
        "data": state.model_dump(mode="json"),
    })

    disconnected = []
    for ws in app_state.websocket_clients:
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.append(ws)

    # Clean up disconnected clients
    for ws in disconnected:
        if ws in app_state.websocket_clients:
            app_state.websocket_clients.remove(ws)


async def ping_self():
    """Ping own URL to prevent platform (Render/Koyeb) from sleeping."""
    url = os.getenv("RENDER_EXTERNAL_URL") or f"http://localhost:{os.getenv('PORT', 8000)}"
    ping_url = f"{url}/api/ping"
    try:
        async with httpx.AsyncClient() as client:
            await client.get(ping_url, timeout=5.0)
            logger.debug(f"Self-ping successful: {ping_url}")
    except Exception as e:
        logger.debug(f"Self-ping failed: {e}")


def start_scheduler():
    """Start background polling."""
    if scheduler.running:
        return

    scheduler.add_job(
        poll_aircraft,
        "interval",
        seconds=OPENSKY_POLL_SECONDS,
        id="poll_aircraft",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.add_job(
        poll_weather,
        "interval",
        seconds=WEATHER_POLL_SECONDS,
        id="poll_weather",
        replace_existing=True,
        max_instances=1,
    )

    scheduler.add_job(
        poll_global_airports,
        "interval",
        seconds=45,  # Scan globe every 45 seconds
        id="poll_global",
        replace_existing=True,
        max_instances=1,
    )

    scheduler.add_job(
        ping_self,
        "interval",
        minutes=10,
        id="ping_self",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.start()
    logger.info(
        f"Scheduler started: aircraft every {OPENSKY_POLL_SECONDS}s, "
        f"weather every {WEATHER_POLL_SECONDS}s, ping every 10m"
    )


def stop_scheduler():
    """Stop background polling."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
