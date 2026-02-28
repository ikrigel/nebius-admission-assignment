"""
Vercel serverless entry point for the FastAPI application.

This module is used by Vercel's @vercel/python runtime.
It exports the FastAPI app object, which Vercel wraps in a serverless function handler.
"""

import sys
import os

# Add parent directory to Python path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.main import app

# Vercel's Python runtime automatically discovers the ASGI app object named 'app'
