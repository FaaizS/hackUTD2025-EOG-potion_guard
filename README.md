# Potion Guard

A real-time monitoring system for detecting discrepancies in potion collection data. The system analyzes cauldron drain events and compares them with official transport tickets to identify potential theft or leakage.

## Tech Stack
- **Frontend**: Next.js (TypeScript, App Router)
- **Backend**: Flask (Python)
- **Mapping**: Leaflet / React-Leaflet
- **Data Analysis**: Pandas, NumPy

## Features

### Core Functionality
- **Interactive Map**: Visualizes cauldron locations with detailed popup information
- **Discrepancy Detection**: Identifies volume discrepancies between actual drains and reported tickets
- **Time Playback**: Allows time-travel through historical data with 6-hour intervals
- **Real-time Statistics**: Displays total cauldrons, loss incidents, and total volume lost

### Advanced Features
- **Overflow Forecasting**: Predicts when cauldrons will reach capacity using EWMA fill rate estimation
- **Route Optimization**: Generates optimal collection routes for witches to prevent overflows

## How to Run

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
flask --app app run --debug
```

The backend server will start on `http://127.0.0.1:5000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

### Backend (`/backend`)
- **`app.py`**: Main Flask server with API endpoints
  - Pass-through endpoints: `/api/cauldrons`, `/api/tickets`, `/api/historical-data`
  - Computed endpoints: `/api/discrepancies`, `/drains`, `/bootstrap`
  - Bonus endpoints: `/api/forecast`, `/api/optimized-routes`
- **`analysis/discrepancy_detector.py`**: Core analysis logic
  - `calculate_fill_rates()`: Determines fill rate for each cauldron
  - `detect_all_drains_from_records()`: Identifies drain events and calculates true volumes
  - `match_tickets()`: Compares calculated drains with official tickets

### Frontend (`/frontend`)
- **`app/page.tsx`**: Main dashboard page with state management
- **`app/components/Map.tsx`**: Interactive Leaflet map displaying cauldron locations
- **`app/components/DiscrepancyTable.tsx`**: Table showing theft and leakage incidents
- **`app/components/PlaybackSlider.tsx`**: Time-travel slider with auto-play functionality
- **`app/lib/apiClient.ts`**: API client for backend communication

## Data Analysis Algorithm

### 1. Fill Rate Calculation
Analyzes time-series data to find periods where cauldron levels are only increasing, then calculates the median fill rate (L/min) to avoid outliers.

### 2. Drain Detection
Scans through data to identify drain events where cauldron levels drop, recording start time, end time, and level changes.

### 3. True Volume Calculation
Applies compensation formula to account for continued filling during drains:
```
TRUE_VOLUME = (Level_Before - Level_After) + (Fill_Rate × Drain_Time)
```

### 4. Ticket Comparison
Groups drains and tickets by date and cauldron, then compares expected (tickets) vs actual (calculated drains) to identify discrepancies.

## API Endpoints

### Core Endpoints
- `GET /api/cauldrons` - Cauldron information and locations
- `GET /api/tickets` - Official transport tickets
- `GET /api/historical-data?start_date=<unix>&end_date=<unix>` - Time-series cauldron levels
- `GET /api/discrepancies` - Computed discrepancies with theft detection

### Bonus Endpoints
- `GET /api/forecast` - Overflow predictions using EWMA
- `POST /api/optimized-routes` - Optimal collection routes for witches
