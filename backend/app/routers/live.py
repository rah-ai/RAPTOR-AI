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
