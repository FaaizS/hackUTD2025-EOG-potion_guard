"""
Faaiz's Discrepancy Detection Module
This module analyzes cauldron data to find potion theft by comparing
calculated drain volumes with official transport tickets.
"""

import requests
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from collections import defaultdict

# The EOG API base URL
API_BASE_URL = "https://hackutd2025.eog.systems"


def get_data_from_api(endpoint: str) -> Any:
    """
    Helper function to fetch data from the EOG API.
    
    Args:
        endpoint: The API endpoint path (e.g., "/api/Tickets")
    
    Returns:
        JSON response from the API
    """
    try:
        url = f"{API_BASE_URL}{endpoint}"
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching data from {endpoint}: {e}")
        return None


def to_datetime(timestamp_str: str) -> datetime:
    """
    Convert ISO timestamp string to datetime object.
    
    Args:
        timestamp_str: ISO format timestamp string
    
    Returns:
        datetime object in UTC
    """
    return datetime.fromisoformat(timestamp_str.replace("Z", "+00:00")).astimezone(timezone.utc)


def calculate_fill_rates(records: List[Dict]) -> Dict[str, float]:
    """
    STEP 1: Calculate the fill rate (L/min) for each cauldron.
    
    Logic:
    - We look for periods where the level is ONLY increasing (no drains)
    - Calculate the rate of increase: (level_change) / (time_elapsed)
    - Use the median rate to avoid outliers
    
    Args:
        records: List of time-series data from api/Data
    
    Returns:
        Dictionary mapping {cauldron_id: fill_rate_in_L_per_min}
    """
    print("📊 Calculating fill rates for each cauldron...")
    
    # Group records by cauldron
    cauldron_data = defaultdict(list)
    
    for record in records:
        timestamp = to_datetime(record["timestamp"])
        cauldron_levels = record.get("cauldron_levels", {})
        
        for cauldron_id, level in cauldron_levels.items():
            cauldron_data[cauldron_id].append({
                "timestamp": timestamp,
                "level": float(level)
            })
    
    # Calculate fill rates for each cauldron
    fill_rates = {}
    
    for cauldron_id, data_points in cauldron_data.items():
        # Sort by timestamp
        data_points.sort(key=lambda x: x["timestamp"])
        
        rates = []
        
        # Look at consecutive pairs of points
        for i in range(1, len(data_points)):
            prev = data_points[i - 1]
            curr = data_points[i]
            
            time_diff_minutes = (curr["timestamp"] - prev["timestamp"]).total_seconds() / 60.0
            level_diff = curr["level"] - prev["level"]
            
            # Only consider periods where level is INCREASING (filling, not draining)
            if level_diff > 0 and time_diff_minutes > 0:
                rate = level_diff / time_diff_minutes
                rates.append(rate)
        
        # Use median to avoid outliers
        if rates:
            rates.sort()
            median_rate = rates[len(rates) // 2]
            fill_rates[cauldron_id] = median_rate
            print(f"  ✓ Cauldron {cauldron_id}: {median_rate:.2f} L/min")
        else:
            fill_rates[cauldron_id] = 0.0
            print(f"  ⚠️ Cauldron {cauldron_id}: No fill rate detected (no increasing periods)")
    
    return fill_rates


def detect_all_drains_from_records(records: List[Dict]) -> List[Dict]:
    """
    STEP 2 & 3: Find all drain events and calculate their TRUE volumes.
    
    This is the CORE function that Abdullah's app.py calls!
    
    Logic:
    1. Calculate fill rates first
    2. Scan through data to find drain events (where level drops)
    3. For each drain, apply the magic formula:
       TRUE_VOLUME = (Level_Before - Level_After) + (Fill_Rate × Drain_Time)
       
    Why this formula?
    - The cauldron is STILL FILLING during the drain
    - So the observed drop is LESS than what was actually taken
    - We need to add back what was filled during the drain
    
    Args:
        records: List of time-series data from api/Data
    
    Returns:
        List of drain events with calculated volumes
    """
    print("\n🔍 Detecting drain events...")
    
    # Step 1: Calculate fill rates
    fill_rates = calculate_fill_rates(records)
    
    # Step 2: Group records by cauldron
    cauldron_data = defaultdict(list)
    
    for record in records:
        timestamp = to_datetime(record["timestamp"])
        cauldron_levels = record.get("cauldron_levels", {})
        
        for cauldron_id, level in cauldron_levels.items():
            cauldron_data[cauldron_id].append({
                "timestamp": timestamp,
                "level": float(level)
            })
    
    # Step 3: Find drain events for each cauldron
    all_drains = []
    
    for cauldron_id, data_points in cauldron_data.items():
        # Sort by timestamp
        data_points.sort(key=lambda x: x["timestamp"])
        
        fill_rate = fill_rates.get(cauldron_id, 0.0)
        
        # Scan for drain events (consecutive points where level drops)
        i = 0
        while i < len(data_points) - 1:
            # Look for start of a drain (level drop)
            if data_points[i + 1]["level"] < data_points[i]["level"]:
                # Found a drain! Now find where it ends
                drain_start_idx = i
                drain_end_idx = i + 1
                
                # Continue while level is dropping or stable (not increasing)
                while (drain_end_idx < len(data_points) - 1 and 
                       data_points[drain_end_idx + 1]["level"] <= data_points[drain_end_idx]["level"]):
                    drain_end_idx += 1
                
                # Calculate drain details
                level_before = data_points[drain_start_idx]["level"]
                level_after = data_points[drain_end_idx]["level"]
                start_time = data_points[drain_start_idx]["timestamp"]
                end_time = data_points[drain_end_idx]["timestamp"]
                
                drain_time_minutes = (end_time - start_time).total_seconds() / 60.0
                
                # 🎯 THE MAGIC FORMULA 🎯
                # This accounts for the fact that the cauldron is STILL FILLING during the drain
                observed_drop = level_before - level_after
                filled_during_drain = fill_rate * drain_time_minutes
                true_volume = observed_drop + filled_during_drain
                
                # Only record significant drains (> 1L to filter noise)
                if true_volume > 1.0:
                    drain_event = {
                        "cauldron_id": cauldron_id,
                        "start_time": start_time.isoformat(),
                        "end_time": end_time.isoformat(),
                        "date": start_time.strftime("%Y-%m-%d"),  # For grouping by day
                        "level_before": level_before,
                        "level_after": level_after,
                        "drain_time_minutes": drain_time_minutes,
                        "fill_rate": fill_rate,
                        "true_volume": round(true_volume, 2)
                    }
                    all_drains.append(drain_event)
                    print(f"  🚨 Drain detected in {cauldron_id} on {drain_event['date']}: {true_volume:.2f}L")
                
                # Move past this drain
                i = drain_end_idx
            else:
                i += 1
    
    print(f"\n✅ Found {len(all_drains)} total drain events")
    return all_drains


def match_tickets(drains: List[Dict], tickets: List[Dict], 
                  eps_pct: float = 0.05, eps_abs: float = 5.0, 
                  dummy_penalty: float = 50.0) -> List[Dict]:
    """
    STEP 4: Compare calculated drains with official tickets to find discrepancies.
    
    This is the SECOND function that Abdullah's app.py calls!
    
    Logic:
    1. Group drains by date and cauldron
    2. Group tickets by date and cauldron
    3. Compare expected (tickets) vs actual (calculated drains)
    4. Identify theft (missing volume)
    
    Args:
        drains: List of drain events from detect_all_drains_from_records()
        tickets: List of transport tickets from api/Tickets
        eps_pct: Percentage tolerance for matching (default 5%)
        eps_abs: Absolute tolerance in liters (default 5L)
        dummy_penalty: Penalty for unmatched items
    
    Returns:
        List of discrepancy objects showing where potion was stolen
    """
    print("\n🔎 Comparing drains with tickets to find discrepancies...")
    
    # Step 1: Fetch cauldron names for better reporting
    cauldron_info = {}
    try:
        cauldrons_data = get_data_from_api("/api/Information/cauldrons")
        if cauldrons_data:
            for cauldron in cauldrons_data:
                cauldron_info[cauldron["id"]] = cauldron.get("name", cauldron["id"])
    except Exception as e:
        print(f"  ⚠️ Could not fetch cauldron names: {e}")
    
    # Step 2: Group drains by (date, cauldron_id)
    drains_by_day = defaultdict(lambda: defaultdict(float))
    
    for drain in drains:
        date = drain["date"]
        cauldron_id = drain["cauldron_id"]
        volume = drain["true_volume"]
        drains_by_day[date][cauldron_id] += volume
    
    # Step 3: Group tickets by (date, cauldron_id)
    # Note: tickets might be in a wrapper object
    if isinstance(tickets, dict):
        tickets = tickets.get("transport_tickets", [])
    
    tickets_by_day = defaultdict(lambda: defaultdict(float))
    
    for ticket in tickets:
        # Parse the timestamp to get the date
        timestamp = ticket.get("timestamp") or ticket.get("date")
        if timestamp:
            try:
                date = to_datetime(timestamp).strftime("%Y-%m-%d")
                cauldron_id = ticket.get("cauldron_id") or ticket.get("cauldronId")
                volume = float(ticket.get("volume", 0))
                tickets_by_day[date][cauldron_id] += volume
            except Exception as e:
                print(f"  ⚠️ Error parsing ticket: {e}")
                continue
    
    # Step 4: Compare and find discrepancies
    discrepancies = []
    
    # Get all unique (date, cauldron) pairs
    all_dates = set(drains_by_day.keys()) | set(tickets_by_day.keys())
    
    for date in sorted(all_dates):
        drain_cauldrons = drains_by_day.get(date, {})
        ticket_cauldrons = tickets_by_day.get(date, {})
        
        all_cauldrons = set(drain_cauldrons.keys()) | set(ticket_cauldrons.keys())
        
        for cauldron_id in all_cauldrons:
            actual_volume = drain_cauldrons.get(cauldron_id, 0.0)
            expected_volume = ticket_cauldrons.get(cauldron_id, 0.0)
            missing_volume = actual_volume - expected_volume
            
            cauldron_name = cauldron_info.get(cauldron_id, cauldron_id)
            
            discrepancy = {
                "date": date,
                "cauldron_id": cauldron_id,
                "cauldron_name": cauldron_name,
                "expected_volume": round(expected_volume, 2),
                "actual_volume": round(actual_volume, 2),
                "missing_volume": round(missing_volume, 2)
            }
            
            discrepancies.append(discrepancy)
            
            if abs(missing_volume) > eps_abs:
                if missing_volume > 0:
                    print(f"  🚨 THEFT DETECTED on {date} at {cauldron_name}: {missing_volume:.2f}L missing!")
                else:
                    print(f"  ℹ️ Extra tickets on {date} at {cauldron_name}: {-missing_volume:.2f}L")
            else:
                print(f"  ✅ Match on {date} at {cauldron_name}: {expected_volume:.2f}L")
    
    print(f"\n✅ Analysis complete: {len(discrepancies)} records checked")
    return discrepancies


# Legacy function for backwards compatibility
def find_discrepancies():
    """
    Legacy function - kept for backwards compatibility.
    This was in the original skeleton but Abdullah's code uses the newer functions above.
    """
    print("⚠️ Warning: Using legacy find_discrepancies() function")
    print("   Consider using detect_all_drains_from_records() and match_tickets() instead")
    
    # Fetch data directly
    records = get_data_from_api("/api/Data?start_date=0&end_date=2000000000")
    tickets_data = get_data_from_api("/api/Tickets")
    
    if not records or not tickets_data:
        return []
    
    # Use the new functions
    drains = detect_all_drains_from_records(records)
    discrepancies = match_tickets(drains, tickets_data)
    
    return discrepancies
