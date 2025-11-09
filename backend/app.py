from __future__ import annotations

import os
import sys
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple

from flask import Flask, jsonify, request
try:
    from flask_cors import CORS
except Exception:
    CORS = None

import math
import requests

# --- Import paths so we can reach analysis/ and fallback test module ---
HERE = os.path.abspath(os.path.dirname(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
ANALYSIS_DIR = os.path.join(HERE, "analysis")
if os.path.isdir(ANALYSIS_DIR) and ANALYSIS_DIR not in sys.path:
    sys.path.insert(0, ANALYSIS_DIR)

# --- Prefer teammate module; fall back to your scratch module if needed ---
try:
    from analysis.discrepancy_detector import (  # type: ignore
        detect_all_drains_from_records,
        match_tickets,
    )
    USING_FALLBACK = False
except Exception:
    try:
        from discrepancy_detector1 import (  # type: ignore
            detect_all_drains_from_records,
            match_tickets,
        )
        USING_FALLBACK = True
    except Exception as e:
        raise ImportError(
            "Could not import discrepancy detector. "
            "Create backend/analysis/discrepancy_detector.py (team) OR "
            "backend/discrepancy_detector1.py (your temp file)."
        ) from e

# ---- External challenge API base (public) ----
BASE_URL = os.getenv("CAULDRON_API_BASE", "https://hackutd2025.eog.systems")
ENDPOINTS = {
    "data": f"{BASE_URL}/api/Data",
    "tickets": f"{BASE_URL}/api/Tickets",
    "cauldrons": f"{BASE_URL}/api/Information/cauldrons",
    "market": f"{BASE_URL}/api/Information/market",
    "network": f"{BASE_URL}/api/Information/network",
}

# ---- Flask app ----
app = Flask(__name__)
if CORS:
    CORS(app, resources={r"/*": {"origins": "*"}})

# ---------------------------------
# Helpers
# ---------------------------------
def fetch_json(url: str, params: Optional[Dict[str, Any]] = None) -> Any:
    r = requests.get(url, params=params, timeout=60)
    r.raise_for_status()
    return r.json()

def to_dt(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone(timezone.utc)

def median(vals: List[float]) -> float:
    if not vals:
        return 0.0
    s = sorted(vals)
    n = len(s)
    m = n // 2
    return float(s[m]) if n % 2 else float(0.5 * (s[m - 1] + s[m]))

# ---------------------------------
# Root / Health
# ---------------------------------
@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "ok": True,
        "message": "CauldronWatch backend is running",
        "using_fallback_detector": USING_FALLBACK,
        "endpoints": [
            "/health",
            # legacy (kept):
            "/data?start_date=0&end_date=2000000000",
            "/tickets",
            "/cauldrons",
            "/market",
            "/network",
            "/drains?start_date=0&end_date=2000000000",
            "/matches?start_date=0&end_date=2000000000",
            "/bootstrap?start_date=0&end_date=2000000000",
            # required new API:
            "/api/cauldrons",
            "/api/tickets",
            "/api/historical-data?start_date=0&end_date=2000000000",
            # bonus:
            "/api/forecast",
            "/api/optimized-routes"
        ]
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True})

# ---------------------------------
# Legacy thin proxies (kept for compatibility)
# ---------------------------------
@app.route("/data", methods=["GET"])
def data_proxy_legacy():
    start = int(request.args.get("start_date", 0))
    end = int(request.args.get("end_date", 2_000_000_000))
    payload = fetch_json(ENDPOINTS["data"], params={"start_date": start, "end_date": end})
    return jsonify(payload)

@app.route("/tickets", methods=["GET"])
def tickets_proxy_legacy():
    return jsonify(fetch_json(ENDPOINTS["tickets"]))

@app.route("/cauldrons", methods=["GET"])
def cauldrons_proxy_legacy():
    return jsonify(fetch_json(ENDPOINTS["cauldrons"]))

@app.route("/market", methods=["GET"])
def market_proxy():
    return jsonify(fetch_json(ENDPOINTS["market"]))

@app.route("/network", methods=["GET"])
def network_proxy():
    return jsonify(fetch_json(ENDPOINTS["network"]))

# ---------------------------------
# Required pass-through routes (with /api prefix)
# ---------------------------------
@app.route("/api/cauldrons", methods=["GET"])
def api_cauldrons():
    return jsonify(fetch_json(ENDPOINTS["cauldrons"]))

@app.route("/api/tickets", methods=["GET"])
def api_tickets():
    return jsonify(fetch_json(ENDPOINTS["tickets"]))

@app.route("/api/historical-data", methods=["GET"])
def api_historical_data():
    start = int(request.args.get("start_date", 0))
    end = int(request.args.get("end_date", 2_000_000_000))
    payload = fetch_json(ENDPOINTS["data"], params={"start_date": start, "end_date": end})
    return jsonify(payload)

# ---------------------------------
# Computed endpoints (drains/matches/bootstrap) for your frontend convenience
# ---------------------------------
@app.route("/drains", methods=["GET"])
def drains_endpoint():
    start = int(request.args.get("start_date", 0))
    end = int(request.args.get("end_date", 2_000_000_000))
    records = fetch_json(ENDPOINTS["data"], params={"start_date": start, "end_date": end})
    drains = detect_all_drains_from_records(records)
    return jsonify({"drains": drains})

@app.route("/matches", methods=["GET"])
def matches_endpoint():
    start = int(request.args.get("start_date", 0))
    end = int(request.args.get("end_date", 2_000_000_000))
    eps_pct = float(request.args.get("eps_pct", 0.05))
    eps_abs = float(request.args.get("eps_abs", 5.0))
    dummy_penalty = float(request.args.get("dummy_penalty", 50.0))

    records = fetch_json(ENDPOINTS["data"], params={"start_date": start, "end_date": end})
    drains = detect_all_drains_from_records(records)
    tickets_payload = fetch_json(ENDPOINTS["tickets"])
    tickets = tickets_payload.get("transport_tickets", [])
    matches = match_tickets(drains, tickets, eps_pct=eps_pct, eps_abs=eps_abs, dummy_penalty=dummy_penalty)
    return jsonify({"matches": matches})

@app.route("/api/discrepancies", methods=["GET"])
def api_discrepancies():
    """
    Faaiz's main discrepancy detection endpoint.
    Returns a clean list of discrepancies for the frontend to display.
    """
    start = int(request.args.get("start_date", 0))
    end = int(request.args.get("end_date", 2_000_000_000))
    
    # Fetch the data
    records = fetch_json(ENDPOINTS["data"], params={"start_date": start, "end_date": end})
    tickets_payload = fetch_json(ENDPOINTS["tickets"])
    
    # Run Faaiz's analysis
    drains = detect_all_drains_from_records(records)
    discrepancies = match_tickets(drains, tickets_payload)
    
    return jsonify(discrepancies)

@app.route("/bootstrap", methods=["GET"])
def bootstrap():
    start = int(request.args.get("start_date", 0))
    end = int(request.args.get("end_date", 2_000_000_000))

    cauldrons = fetch_json(ENDPOINTS["cauldrons"])
    market = fetch_json(ENDPOINTS["market"])
    tickets_payload = fetch_json(ENDPOINTS["tickets"])
    tickets = tickets_payload.get("transport_tickets", [])
    history = fetch_json(ENDPOINTS["data"], params={"start_date": start, "end_date": end})

    # latest snapshot
    latest_ts = None
    latest_by_cid: Dict[str, Dict[str, float]] = {}
    seen_ts: Dict[str, datetime] = {}
    for rec in history:
        ts = to_dt(rec["timestamp"])
        if latest_ts is None or ts > latest_ts:
            latest_ts = ts
        for cid, vol in rec.get("cauldron_levels", {}).items():
            if cid not in seen_ts or ts >= seen_ts[cid]:
                seen_ts[cid] = ts
                latest_by_cid[cid] = {"volume": float(vol)}

    drains = detect_all_drains_from_records(history)
    matches = match_tickets(drains, tickets)

    return jsonify({
        "latest_ts": latest_ts.isoformat() if latest_ts else None,
        "cauldrons": cauldrons,
        "market": market,
        "latest_levels": latest_by_cid,
        "drains": drains,
        "matches": matches,
    })

# ---------------------------------
# BONUS: naive short-horizon forecast
# ---------------------------------
@app.route("/api/forecast", methods=["GET"])
def api_forecast():
    """
    For each cauldron, estimate short-term fill rate (EWMA of +slopes over recent window),
    then compute ETA to full: (max_volume - current_level) / max(r_fill, eps).
    Returns: [{cauldron_id, current_level, max_volume, r_fill, eta_minutes}]
    """
    window_minutes = int(request.args.get("window_minutes", 120))  # last 2h by default
    alpha = float(request.args.get("alpha", 0.3))  # EWMA smoothing
    end = int(request.args.get("end_date", 2_000_000_000))
    # pull a bit more history to compute slopes
    start = int(request.args.get("start_date", max(0, end - window_minutes * 120)))  # heuristic

    cauldrons = fetch_json(ENDPOINTS["cauldrons"])
    cap_by = {c["id"]: float(c.get("max_volume") or 0.0) for c in cauldrons}
    history = fetch_json(ENDPOINTS["data"], params={"start_date": start, "end_date": end})

    # build per-cauldron time series
    series: Dict[str, List[Tuple[datetime, float]]] = {}
    for rec in history:
        ts = to_dt(rec["timestamp"])
        for cid, vol in rec.get("cauldron_levels", {}).items():
            series.setdefault(cid, []).append((ts, float(vol)))
    # compute r_fill EWMA from positive slopes; find current level
    out: List[Dict[str, Any]] = []
    for cid, rows in series.items():
        rows.sort(key=lambda t: t[0])
        if len(rows) < 2:
            continue
        r_fill = 0.0
        have = False
        for i in range(1, len(rows)):
            dtm = max(1e-6, (rows[i][0] - rows[i-1][0]).total_seconds() / 60.0)
            slope = (rows[i][1] - rows[i-1][1]) / dtm
            if slope > 0:
                r_fill = alpha * slope + (1 - alpha) * r_fill
                have = True
        current_level = rows[-1][1]
        capacity = cap_by.get(cid, 0.0)
        if capacity <= 0:
            continue
        eps = 1e-6
        rate = max(r_fill, eps) if have else eps
        mins = (capacity - current_level) / rate if capacity > current_level else 0.0
        out.append({
            "cauldron_id": cid,
            "current_level": current_level,
            "max_volume": capacity,
            "r_fill": r_fill if have else 0.0,
            "eta_minutes": max(0.0, float(mins)),
        })
    return jsonify({"forecast": out})

# ---------------------------------
# BONUS: very-simple optimizer (greedy sketch)
# ---------------------------------
@app.route("/api/optimized-routes", methods=["POST"])
def api_optimized_routes():
    """
    Input JSON (optional):
      {
        "witches": 1,               # starting crew size
        "start_node": "market",     # start at market
        "unload_minutes": 15
      }

    Output: { "routes": [ {witch_id, stops:[{node_id, eta, action}] } ], "note": "...heuristic..." }
    This is a toy heuristic to unblock the frontend; replace with a real VRP later.
    """
    body = request.get_json(silent=True) or {}
    witches = int(body.get("witches", 1))
    unload_minutes = int(body.get("unload_minutes", 15))

    cauldrons = fetch_json(ENDPOINTS["cauldrons"])
    network = fetch_json(ENDPOINTS["network"])
    market = fetch_json(ENDPOINTS["market"])
    # latest snapshot
    history = fetch_json(ENDPOINTS["data"], params={"start_date": 0, "end_date": 2_000_000_000})

    # build latest volume by cauldron
    latest_by: Dict[str, Tuple[datetime, float]] = {}
    for rec in history:
        ts = to_dt(rec["timestamp"])
        for cid, vol in rec.get("cauldron_levels", {}).items():
            if cid not in latest_by or ts >= latest_by[cid][0]:
                latest_by[cid] = (ts, float(vol))

    # simple priority by % full descending
    caps = {c["id"]: float(c.get("max_volume") or 1.0) for c in cauldrons}
    targets = sorted(
        [{"cauldron_id": c["id"], "pct": (latest_by.get(c["id"], (None, 0.0))[1] / max(caps[c["id"]], 1.0))} for c in cauldrons],
        key=lambda r: r["pct"],
        reverse=True
    )

    # travel times dictionary (undirected)
    travel: Dict[Tuple[str, str], float] = {}
    for e in network.get("edges", []):
        a, b = e.get("from"), e.get("to")
        t = float(e.get("travel_time_minutes") or 0.0)
        if a and b:
            travel[(a, b)] = t
            travel[(b, a)] = t

    # make a naive star route from Market visiting the top-N fullest cauldrons
    market_id = market.get("id", "market")
    topN = min(len(targets), 5)  # keep short for UI demo
    stops = []
    now = datetime.now(timezone.utc)
    here = market_id
    for i in range(topN):
        cid = targets[i]["cauldron_id"]
        t_travel = travel.get((here, cid), 10.0)  # default 10 min if edge missing
        eta_arrive = now + timedelta(minutes=t_travel)
        # visit and drain, then return to market and unload
        t_back = travel.get((cid, market_id), 10.0)
        eta_unload = eta_arrive + timedelta(minutes=t_back + unload_minutes)
        stops.append({"from": here, "to": cid, "depart": now.isoformat(), "arrive": eta_arrive.isoformat()})
        stops.append({"from": cid, "to": market_id, "depart": eta_arrive.isoformat(), "arrive": (eta_arrive + timedelta(minutes=t_back)).isoformat(), "unload_minutes": unload_minutes})
        now = eta_unload
        here = market_id

    routes = [{"witch_id": f"witch_{i+1}", "stops": stops[i::witches]} for i in range(witches)]
    return jsonify({
        "routes": routes,
        "note": "Greedy demo: visit top-full cauldrons from Market, return and unload 15m each. Replace with proper VRP later."
    })

# ---------------------------------
# Dev server
# ---------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5001")), debug=True)
