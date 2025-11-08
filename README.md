# HackUTD 2025: Potion Guard
This is the EOG track challenge project. We are building a dashboard to find potion-stealing discrepancies!

## Tech Stack
- **Frontend**: Next.js
- **Backend**: Flask

## How to Run

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
flask --app app run --debug
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🚀 Task List

### 🧑‍💻 Araohat (Frontend)
Your main goal is to build the UI in `frontend/`. All your components are in `frontend/app/components/`. You can connect to the Flask server, which will be running on `http://127.0.0.1:5000`.

- **File**: `frontend/app/components/Map.tsx`
- **File**: `frontend/app/components/DiscrepancyTable.tsx`
- **File**: `frontend/app/components/PlaybackSlider.tsx`
- **File**: `frontend/app/lib/apiClient.ts`
- **Task**: Connect all components on the main `frontend/app/page.tsx`.

### 🐍 Abdullah (Backend)
Your main goal is to get the Flask server in `backend/` running and build the "pass-through" API endpoints. This unblocks Araohat. You will also work on the **Bonus Goal** (forecasting and route optimization) once the main routes are done.

- **File**: `backend/app.py`
- **Task**: Implement the pass-through routes: `/api/cauldrons`, `/api/tickets`, `/api/historical-data`.
- **Task**: Implement the bonus routes: `/api/forecast` and `/api/optimized-routes`.

### 🔬 Faaiz (Backend / Data Analysis)
Your main goal is to build the core analysis logic in the `backend/analysis/` module. This is the heart of the project.

- **File**: `backend/analysis/discrepancy_detector.py`
- **Task**: Implement the `find_discrepancies` function. This involves:
  - Calculating fill rates.
  - Identifying all drain events.
  - Applying the special formula `(Level_Before - Level_After) + (Fill_Rate * Drain_Time)` to find the true volume.
  - Comparing this to the `api/Tickets` data.
- **Task**: Once your module is ready, wire it up to the `/api/discrepancies` endpoint in `backend/app.py`.
