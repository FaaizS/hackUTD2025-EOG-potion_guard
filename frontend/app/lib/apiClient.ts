// This file will contain all functions to call our Flask backend
const BACKEND_URL = "http://127.0.0.1:5000";

export async function getCauldrons() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/cauldrons`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cauldrons: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching cauldrons:", error);
    // Return empty array on error so UI doesn't break
    return [];
  }
}

export async function getDiscrepancies() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/discrepancies`);
    if (!response.ok) {
      throw new Error(`Failed to fetch discrepancies: ${response.statusText}`);
    }
    const data = await response.json();
    // Backend returns format: { date, cauldron_id, cauldron_name, expected_volume, actual_volume, missing_volume }
    return data;
  } catch (error) {
    console.error("Error fetching discrepancies:", error);
    // Return empty array on error so UI doesn't break
    return [];
  }
}

export async function getHistoricalData(startDate: number = 0, endDate: number = 2000000000) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/historical-data?start_date=${startDate}&end_date=${endDate}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch historical data: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return [];
  }
}

export async function getDrains(startDate: number = 0, endDate: number = 2000000000) {
  try {
    const response = await fetch(`${BACKEND_URL}/drains?start_date=${startDate}&end_date=${endDate}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch drains: ${response.statusText}`);
    }
    const data = await response.json();
    return data.drains || [];
  } catch (error) {
    console.error("Error fetching drains:", error);
    return [];
  }
}

export async function getForecast() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/forecast`);
    if (!response.ok) {
      throw new Error(`Failed to fetch forecast: ${response.statusText}`);
    }
    const data = await response.json();
    return data.forecast || [];
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return [];
  }
}

