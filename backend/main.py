import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from backend.routers import summarize

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
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
    index_file = os.path.join(static_dir, "index.html")

    # Try to serve the requested file first (for assets like JS, CSS)
    requested_file = os.path.join(static_dir, full_path)
    if os.path.isfile(requested_file):
        return FileResponse(requested_file)

    # Fall back to index.html for SPA routing
    if os.path.isfile(index_file):
        return FileResponse(index_file, media_type="text/html")

    return {"detail": "Not Found"}
