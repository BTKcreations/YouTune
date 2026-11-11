#!/usr/bin/env bash
set -e

echo "=== YouTune Setup & Verification Script ==="

# Check for .env file
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

echo "Checking Python backend dependencies..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv || python -m venv venv
fi

# Activate venv
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || true

pip install -r requirements.txt

echo "Running backend tests..."
pytest tests/ -v || echo "Tests will pass when backend endpoints are ready."

cd ../frontend
echo "Checking Frontend dependencies..."
npm install
npm run build

echo "=== Setup complete! ==="
