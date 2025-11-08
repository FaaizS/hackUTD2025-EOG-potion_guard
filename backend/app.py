from flask import Flask, jsonify
from flask_cors import CORS
import requests

# Import the analysis module
from analysis.discrepancy_detector import find_discrepancies

app = Flask(__name__)

# Enable CORS for the Next.js app
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# The EOG API base URL
API_BASE_URL = "https://hackutd2025.eog.systems"

# --- PASS-THROUGH ENDPOINTS (Abdullah's First Task) ---

@app.route("/api/cauldrons")
def get_cauldrons():
    # TODO(Abdullah): Fetch data from EOG's /api/Information/cauldrons
    # Add error handling.
    # For now, return placeholder data for Araohat to use.
    placeholder_cauldrons = [
        {"id": 1, "name": "Cauldron of Secrets", "latitude": 32.98, "longitude": -96.75},
        {"id": 2, "name": "Bubbling Vat", "latitude": 32.99, "longitude": -96.76}
    ]
    return jsonify(placeholder_cauldrons)

@app.route("/api/tickets")
def get_tickets():
    # TODO(Abdullah): Fetch data from EOG's /api/Tickets
    # Add error handling.
    return jsonify({"message": "TODO: Fetch /api/Tickets"})

@app.route("/api/historical-data")
def get_historical_data():
    # TODO(Abdullah): Fetch data from EOG's /api/Data
    # Add error handling.
    return jsonify({"message": "TODO: Fetch /api/Data"})

# --- CORE LOGIC ENDPOINT (Faaiz's Task) ---

@app.route("/api/discrepancies")
def get_discrepancies():
    # TODO(Faaiz): Wire up your analysis module here.
    # This endpoint should call find_discrepancies()
    # and return the results.
    results = find_discrepancies()
    return jsonify(results)

# --- BONUS ENDPOINTS (Abdullah's Second Task) ---

@app.route("/api/forecast")
def get_forecast():
    # TODO(Abdullah): Implement the bonus logic for forecasting overflows.
    return jsonify({"message": "TODO: Implement overflow forecast"})

@app.route("/api/optimized-routes")
def get_optimized_routes():
    # TODO(Abdullah): Implement the bonus logic for route optimization.
    return jsonify({"message": "TODO: Implement route optimization"})

if __name__ == "__main__":
    app.run(debug=True)

