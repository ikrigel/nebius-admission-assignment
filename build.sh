#!/bin/bash
set -e

echo "Building GitHub Repository Summarizer..."

# Build frontend
echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Building frontend..."
npm run build

echo "Build complete!"
