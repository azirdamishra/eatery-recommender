#!/bin/bash

echo "🚀 Starting Eatery Lite Frontend..."

# Navigate to frontend directory
cd frontend

# Install dependencies if node_modules doesn't exist
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

# Start the development server
echo "🏃 Starting Vite development server..."
echo "🌐 Frontend will be available at: http://localhost:5173"
echo ""
npm run dev
