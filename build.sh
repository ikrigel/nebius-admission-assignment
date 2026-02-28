#!/bin/bash
set -e
export PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1
export RUSTFLAGS="-C target-feature=+crt-static"

echo "Python version: $(python3 --version)"
echo "Environment: PYO3_USE_ABI3_FORWARD_COMPATIBILITY=$PYO3_USE_ABI3_FORWARD_COMPATIBILITY"

# Ensure Python dependencies are installed with environment variable set
echo "Installing Python dependencies..."
pip install --upgrade pip setuptools wheel
pip install --prefer-binary -r requirements.txt 2>&1 || {
  echo "Binary-preferred install encountered an error, attempting standard install..."
  pip install -r requirements.txt
}

# Build frontend
echo "Building frontend..."
cd frontend && npm run build

echo "Build complete!"
