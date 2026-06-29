"""
RAPTOR Alert Feed Router
"""

from __future__ import annotations

from fastapi import APIRouter

from app.models import Alert
from app.state import app_state

router = APIRouter(prefix="/api", tags=["alerts"])


@router.get("/alerts", response_model=list[Alert])
async def get_alerts():
    """Get alert feed (max 50, newest first)."""
    return app_state.alerts
