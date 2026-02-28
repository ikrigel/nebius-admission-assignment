#!/bin/bash
set -e

echo "Building GitHub Repository Summarizer..."

# Build frontend
echo "Building frontend..."
cd frontend && npm run build

echo "Build complete!"
