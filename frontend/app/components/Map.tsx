/**
 * MapComponent
 * 
 * Interactive map displaying cauldron locations using Leaflet
 * Features:
 * - Markers for each cauldron
 * - Popup information on click
 * - Centered on Denton, TX area
 */

"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { getCauldrons } from "@/app/lib/apiClient";

// Configure custom cauldron marker icon
const cauldronIcon = L.icon({
  iconUrl: "/cauldron.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

L.Marker.prototype.options.icon = cauldronIcon;

interface Cauldron {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  max_volume?: number;
}

export default function MapComponent() {
  const [cauldrons, setCauldrons] = useState<Cauldron[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCauldrons() {
      try {
        const data = await getCauldrons();
        setCauldrons(data);
      } catch (error) {
        console.error("Error loading cauldrons:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCauldrons();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-600">Loading map...</p>
      </div>
    );
  }

  if (cauldrons.length === 0) {
    return (
      <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-600">No cauldron data available</p>
      </div>
    );
  }

  // Center map on Denton, TX area
  const centerLat = 33.2148;
  const centerLng = -97.133;

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border-2 border-purple-300/50">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        {/* Base map tiles from OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Place a marker for each cauldron */}
        {cauldrons.map((cauldron) => (
          <Marker
            key={cauldron.id}
            position={[cauldron.latitude, cauldron.longitude]}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-bold text-lg">{cauldron.name}</h3>
                <p className="text-sm text-gray-600">ID: {cauldron.id}</p>
                {cauldron.max_volume && (
                  <p className="text-sm">Max Capacity: {cauldron.max_volume}L</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {cauldron.latitude.toFixed(4)}, {cauldron.longitude.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
