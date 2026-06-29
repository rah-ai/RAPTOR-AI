"""
RAPTOR ML Predictor
Loads the trained XGBoost model and provides inference.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import numpy as np
import joblib

from app.config import MODEL_PATH

logger = logging.getLogger("raptor.predictor")

# Feature order must match training
FEATURE_ORDER = [
    "month", "hour", "phase_of_flight", "sky_condition",
    "precipitation", "altitude_band", "season", "historical_density",
]


class RaptorPredictor:
    """Loads and runs inference with the trained XGBoost model."""

    def __init__(self):
        self.model = None
        self._loaded = False

    def load(self):
        """Load the trained model from disk."""
        if not MODEL_PATH.exists():
            logger.warning(f"Model file not found at {MODEL_PATH}")
            logger.warning("Run 'python -m app.ml.train' first to train the model")
            return

        try:
            self.model = joblib.load(MODEL_PATH)
            self._loaded = True
            logger.info(f"ML model loaded from {MODEL_PATH}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")

    def predict(self, features: dict) -> float:
        """
        Predict bird strike probability.
        
        Args:
            features: Dict with keys matching FEATURE_ORDER
            
        Returns:
            Float probability 0.0 - 1.0
        """
        if not self._loaded or self.model is None:
            return 0.5  # Default when model unavailable

        try:
            # Build feature vector in correct order
            feature_vector = np.array([[
                features.get("month", 6),
                features.get("hour", 12),
                features.get("phase_of_flight", 0),
                features.get("sky_condition", 2),
                features.get("precipitation", 0),
                features.get("altitude_band", 2),
                features.get("season", 2),
                features.get("historical_density", 0.3),
            ]])

            # Get probability of positive class (strike)
            proba = self.model.predict_proba(feature_vector)[0][1]
            return float(np.clip(proba, 0.0, 1.0))

        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return 0.5

    @property
    def is_loaded(self) -> bool:
        return self._loaded


# Global singleton
predictor = RaptorPredictor()
