#!/bin/bash

echo "🚀 Starting Eatery Lite - Full Stack Application"
echo "================================================"
echo ""

# Function to start backend
start_backend() {
    echo "🔧 Starting Backend..."
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "📦 Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    pip install -r requirements.txt
    
    # Start backend server in background
    echo "🏃 Starting FastAPI server on port 8000..."
    uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting Frontend..."
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing npm dependencies..."
        npm install
    fi
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        echo "⚙️  Creating .env file..."
        echo "VITE_API_URL=http://localhost:8000" > .env
        echo "VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here" >> .env
        echo ""
        echo "⚠️  IMPORTANT: Please add your Google Maps API key to frontend/.env"
        echo "   Get one from: https://developers.google.com/maps/documentation/javascript/get-api-key"
        echo ""
    fi
    
    # Start frontend server in background
    echo "🏃 Starting Vite development server on port 5173..."
    npm run dev &
    FRONTEND_PID=$!
    cd ..
}

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start both servers
start_backend
sleep 3  # Give backend time to start
start_frontend
sleep 3  # Give frontend time to start

echo ""
echo "✅ Eatery Lite is now running!"
echo "📡 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Keep the script running
wait
