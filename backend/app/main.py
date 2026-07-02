"""
RAPTOR — Real-time Avian Prediction and Threat Operations for Runways
FastAPI Application Entry Point
"""

from __future__ import annotations

import json
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import CORS_ORIGINS
from app.services.airport_db import airport_db
from app.services.scheduler import start_scheduler, stop_scheduler
from app.ml.predictor import predictor
from app.state import app_state

from app.routers import airports, live, historical, alerts, demo

# ──────────────────────────────── LOGGING ────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)-20s] %(levelname)-7s %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("raptor")


# ──────────────────────────────── LIFESPAN ────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("=" * 60)
    logger.info("  RAPTOR — Starting Up")
    logger.info("  Real-time Avian Prediction & Threat Operations for Runways")
    logger.info("=" * 60)

    # Load airport database
    await airport_db.initialize()

    # Load ML model
    predictor.load()

    # Start background scheduler
    start_scheduler()

    logger.info("RAPTOR is ready.")
    logger.info("=" * 60)

    yield

    # Shutdown
    stop_scheduler()
    logger.info("RAPTOR shutdown complete.")


# ──────────────────────────────── APP ────────────────────────────────

app = FastAPI(
    title="RAPTOR",
    description="Real-time Avian Prediction and Threat Operations for Runways",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(airports.router)
app.include_router(live.router)
app.include_router(historical.router)
app.include_router(alerts.router)
app.include_router(demo.router)


# ──────────────────────────────── WEBSOCKET ────────────────────────────────

@app.websocket("/ws/live")
async def websocket_live(ws: WebSocket):
    """WebSocket endpoint for live state updates."""
    await ws.accept()
    app_state.websocket_clients.append(ws)
    logger.info(f"WebSocket client connected ({len(app_state.websocket_clients)} total)")

    try:
        # Send initial state
        state = app_state.get_live_state()
        await ws.send_text(json.dumps({
            "type": "state_update",
            "data": state.model_dump(mode="json"),
        }))

        # Keep connection alive
        while True:
            # Wait for client messages (ping/pong or close)
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.debug(f"WebSocket error: {e}")
    finally:
        if ws in app_state.websocket_clients:
            app_state.websocket_clients.remove(ws)
        logger.info(f"WebSocket client disconnected ({len(app_state.websocket_clients)} total)")


# ──────────────────────────────── HEALTH ────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "RAPTOR",
        "model_loaded": predictor.is_loaded,
        "airport_db_loaded": airport_db._loaded,
        "current_airport": app_state.current_airport.icao if app_state.current_airport else None,
    }

@app.get("/api/ping")
async def ping():
    """Lightweight endpoint for keep-alive services (e.g., UptimeRobot)."""
    return {"status": "alive"}

# ──────────────────────────────── FRONTEND SERVING ────────────────────────────────

# Serve React frontend if dist folder exists (for unified deployment)
from app.config import BASE_DIR
frontend_dist = BASE_DIR / "dist"

if frontend_dist.exists() and frontend_dist.is_dir():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Catch-all route to serve React app for client-side routing."""
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    logger.info("Frontend 'dist' directory not found. API-only mode active.")
