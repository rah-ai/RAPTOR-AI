"""
RAPTOR Live Data Router
Live state endpoint and WebSocket for real-time updates.
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.models import LiveStateResponse
from app.state import app_state

logger = logging.getLogger("raptor.router.live")

router = APIRouter(prefix="/api/live", tags=["live"])


@router.get("/state", response_model=LiveStateResponse)
async def get_live_state():
    """Get current live dashboard state."""
    return app_state.get_live_state()

@router.websocket("")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket connection for global alerts."""
    await websocket.accept()
    app_state.websocket_clients.append(websocket)
    try:
        while True:
            # Keep connection open, wait for client messages if any
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in app_state.websocket_clients:
            app_state.websocket_clients.remove(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if websocket in app_state.websocket_clients:
            app_state.websocket_clients.remove(websocket)
