# Eatery Recommender Lite

A simplified version of the eatery recommender app where users can:

1. Create anonymous groups for location sharing
2. Share group URLs with friends 
3. Collaboratively add and view locations on a shared map
4. No login or authentication required

## Features

- **Anonymous Groups**: Create groups without user accounts
- **Shareable URLs**: Easy sharing with unique group IDs
- **Collaborative Mapping**: Multiple users can add locations to the same map
- **Real-time Updates**: See locations added by other users
- **Simplified UI**: Clean, focused interface

## Quick Start

### Option 1: Start Everything (Recommended)
```bash
cd eatery-lite
./start_all.sh
```

### Option 2: Start Services Separately

#### Frontend
```bash
cd eatery-lite
./start_frontend.sh
```

#### Backend  
```bash
cd eatery-lite
./start_backend.sh
```

### Option 3: Manual Setup

#### Frontend
```bash
cd eatery-lite/frontend
npm install
# Create .env file with your Google Maps API key
echo "VITE_API_URL=http://localhost:8000" > .env
echo "VITE_GOOGLE_MAPS_API_KEY=your_api_key_here" >> .env
npm run dev
```

#### Backend
```bash
cd eatery-lite/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Setup Requirements

1. **Google Maps API Key** (Required for map functionality)
   - Get one from: https://developers.google.com/maps/documentation/javascript/get-api-key
   - Add it to `frontend/.env` file as `VITE_GOOGLE_MAPS_API_KEY`

2. **Node.js** (v16 or higher) for frontend
3. **Python** (v3.8 or higher) for backend

## Usage

1. **Start the application** using one of the methods above
2. **Open your browser** to http://localhost:5173
3. **Create a group** by entering a name and optional description
4. **Share the URL** with friends (the URL will contain a unique group ID)
5. **Add locations** by clicking on the map and filling out the form
6. **View locations** added by all group members in real-time

## Architecture

### Frontend
- React + TypeScript + Vite
- Tailwind CSS for styling
- Google Maps integration
- Axios for API calls

### Backend
- FastAPI
- SQLite database (simplified)
- Pydantic schemas
- No authentication layer

## API Endpoints

- `POST /groups` - Create a new group
- `GET /groups/{group_id}` - Get group details and locations
- `POST /groups/{group_id}/locations` - Add location to group
- `DELETE /groups/{group_id}/locations/{location_id}` - Remove location

## Database Schema

### Groups
- id: uuid (primary key)
- name: string
- description: string (optional)
- created_at: timestamp

### Locations
- id: uuid (primary key) 
- group_id: uuid (foreign key)
- name: string
- description: string (optional)
- latitude: float
- longitude: float
- added_by: string (anonymous name)
- created_at: timestamp
