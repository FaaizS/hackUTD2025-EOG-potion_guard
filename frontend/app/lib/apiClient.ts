// This file will contain all functions to call our Flask backend
const BACKEND_URL = "http://127.0.0.1:5000";

export async function getCauldrons() {
  // TODO(Araohat): Fetch from `${BACKEND_URL}/api/cauldrons`
  // For now, return placeholder data
  return [
    {id: 1, name: "Cauldron of Secrets", latitude: 32.98, longitude: -96.75},
    {id: 2, name: "Bubbling Vat", latitude: 32.99, longitude: -96.76}
  ];
}

export async function getDiscrepancies() {
  // TODO(Araohat): Fetch from `${BACKEND_URL}/api/discrepancies`
  // For now, return placeholder data
  return [
    {date: "2025-10-10", expected: 500, actual: 450, missing: 50, cauldron: "Cauldron of Secrets"}
  ];
}

// TODO(Araohat): Add more functions to call other endpoints as needed
// e.g., getHistoricalData(time), getOptimizedRoutes()

