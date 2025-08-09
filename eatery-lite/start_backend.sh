#!/bin/bash

echo "🚀 Starting Eatery Lite Backend..."

# Navigate to backend directory
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Start the server
echo "🏃 Starting FastAPI server..."
echo "📡 Backend will be available at: http://localhost:8000"
echo "📚 API documentation: http://localhost:8000/docs"
echo ""
uvicorn main:app --reload --host 0.0.0.0 --port 8000
