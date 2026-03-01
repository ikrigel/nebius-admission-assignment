import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from backend.routers import summarize

# Set up logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(
    title="GitHub Repo Summarizer",
    description="API for analyzing GitHub repositories using LLMs",
    version="1.0.0",
)

# Configure CORS for development and Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (restricted in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(summarize.router)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


# Serve React frontend for all other routes (SPA fallback)
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """Serve React app for all non-API routes (SPA routing fallback)."""
    logger.debug(f"🔴 Catch-all route hit for path: {full_path}")

    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
    index_file = os.path.join(static_dir, "index.html")

    # Try to serve the requested file first (for assets like JS, CSS)
    requested_file = os.path.join(static_dir, full_path)
    logger.debug(f"📁 Checking file: {requested_file}")

    if os.path.isfile(requested_file):
        logger.info(f"✅ Serving file: {requested_file}")
        return FileResponse(requested_file)

    # Fall back to index.html for SPA routing
    logger.debug(f"📄 File not found, falling back to index.html")
    if os.path.isfile(index_file):
        logger.info(f"✅ Serving index.html for SPA routing")
        return FileResponse(index_file, media_type="text/html")

    logger.error(f"❌ index.html not found at {index_file}")
    return {"detail": "Not Found"}
