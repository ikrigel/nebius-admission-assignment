import os
import logging
from fastapi import FastAPI, HTTPException
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

    # Get the absolute path to the static files directory
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_dir = os.path.join(base_dir, "frontend", "dist")
    index_file = os.path.join(static_dir, "index.html")

    logger.debug(f"📂 Static dir: {static_dir}")
    logger.debug(f"📄 Index file: {index_file}")

    # Safely join paths and resolve to absolute path
    requested_file = os.path.abspath(os.path.join(static_dir, full_path))

    # Security: ensure requested_file is within static_dir
    try:
        rel_path = os.path.relpath(requested_file, static_dir)
        if rel_path.startswith(".."):
            logger.warning(f"⚠️ Path traversal attempt: {full_path}")
            raise HTTPException(status_code=404, detail="Not Found")
    except ValueError:
        logger.warning(f"⚠️ Invalid path: {full_path}")
        raise HTTPException(status_code=404, detail="Not Found")

    logger.debug(f"📁 Checking file: {requested_file}")

    # Try to serve static assets (JS, CSS, images, etc.)
    if os.path.isfile(requested_file):
        logger.info(f"✅ Serving asset: {requested_file}")
        return FileResponse(requested_file)

    # For SPA routing: if it's a route (not a file), serve index.html
    # Routes don't have file extensions in the last segment
    if "." not in os.path.basename(full_path) or full_path == "":
        logger.debug(f"📄 Route not found, falling back to index.html for SPA routing")
        if os.path.isfile(index_file):
            logger.info(f"✅ Serving index.html for SPA routing")
            return FileResponse(index_file, media_type="text/html")

    logger.error(f"❌ File not found: {requested_file}")
    raise HTTPException(status_code=404, detail="Not Found")
