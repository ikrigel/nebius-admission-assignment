import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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

# Include routes
app.include_router(summarize.router)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


# Mount static files from the React build
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
