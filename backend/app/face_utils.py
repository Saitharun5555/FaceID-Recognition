"""
Face utility functions.

Face detection and embedding extraction is handled client-side using face-api.js.
The backend receives float embeddings (128-dim arrays) and performs matching here.
"""
import numpy as np
from typing import Optional


def embedding_to_string(embedding: list) -> str:
    """Convert embedding list to comma-separated string for DB storage."""
    return ",".join(map(str, embedding))


def string_to_embedding(embedding_str: str) -> np.ndarray:
    """Convert stored string back to numpy array."""
    return np.array(list(map(float, embedding_str.split(","))))


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    if norm == 0:
        return 0.0
    return float(dot / norm)


def euclidean_distance(a: np.ndarray, b: np.ndarray) -> float:
    """Compute euclidean distance between two vectors."""
    return float(np.linalg.norm(a - b))


def compare_embeddings(
    known: np.ndarray,
    unknown: np.ndarray,
    threshold: float = 0.6,
) -> tuple[bool, float]:
    """
    Compare two face embeddings using cosine similarity.
    face-api.js TinyFaceDetector embeddings work well with cosine similarity.
    Returns (is_match, confidence_percent).
    """
    sim = cosine_similarity(known, unknown)
    is_match = sim >= threshold
    confidence = round(sim * 100, 2)
    return is_match, confidence
