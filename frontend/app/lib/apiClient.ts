/**
 * API Client Module
 * Handles all communication with the Flask backend server
 */

const BACKEND_URL = "http://127.0.0.1:5000";

/**
 * Fetches cauldron information including location and capacity
 * @returns Array of cauldron objects
 */
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
    return [];
  }
}

/**
 * Fetches discrepancy analysis results comparing actual drains with tickets
 * @returns Array of discrepancy objects with expected, actual, and missing volumes
 */
export async function getDiscrepancies() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/discrepancies`);
    if (!response.ok) {
      throw new Error(`Failed to fetch discrepancies: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching discrepancies:", error);
    return [];
  }
}

/**
 * Fetches historical cauldron level data for time-series analysis
 * @param startDate Unix timestamp for range start (default: 0)
 * @param endDate Unix timestamp for range end (default: far future)
 * @returns Array of historical data records
 */
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

/**
 * Fetches calculated drain events with true volumes
 * @param startDate Unix timestamp for range start (default: 0)
 * @param endDate Unix timestamp for range end (default: far future)
 * @returns Array of drain event objects
 */
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

/**
 * Fetches overflow forecast predictions for cauldrons
 * @returns Array of forecast objects with ETA to overflow
 */
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

