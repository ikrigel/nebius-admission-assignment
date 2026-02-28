from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
