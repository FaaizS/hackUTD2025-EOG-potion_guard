/**
 * OverflowForecast Component
 * 
 * Displays real-time overflow predictions for all cauldrons
 * Features:
 * - 3-column grid layout for 12 cauldrons (3x4)
 * - Fill percentage display
 * - Overflow ETA in hours
 * - Conditional color coding based on urgency
 */

"use client";

import { useEffect, useState } from "react";
import { getForecast, getCauldrons } from "@/app/lib/apiClient";

interface ForecastData {
  cauldron_id: string;
  current_level: number;
  max_volume: number;
  r_fill: number;
  eta_minutes: number;
}

interface CauldronInfo {
  id: string;
  name: string;
}

interface OverflowForecastProps {
  currentDateTime: string;
}

export default function OverflowForecast({ currentDateTime }: OverflowForecastProps) {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [allCauldrons, setAllCauldrons] = useState<CauldronInfo[]>([]);
  const [selectedCauldron, setSelectedCauldron] = useState<(ForecastData & { cauldron_name: string }) | null>(null);

  useEffect(() => {
    // Fetch all cauldrons once on mount
    async function fetchCauldrons() {
      try {
        const cauldrons = await getCauldrons();
        setAllCauldrons(cauldrons);
      } catch (error) {
        console.error("Error fetching cauldrons:", error);
      }
    }
    fetchCauldrons();
  }, []);

  useEffect(() => {
    async function fetchForecast() {
      try {
        // Convert ISO datetime to Unix timestamp
        const endDateTimestamp = Math.floor(new Date(currentDateTime).getTime() / 1000);
        const data = await getForecast(endDateTimestamp);
        setForecastData(data);
      } catch (error) {
        console.error("Error fetching forecast:", error);
      }
    }

    if (currentDateTime) {
      fetchForecast();
    }
  }, [currentDateTime]);

  // Create a merged list: always show all cauldrons, with forecast data when available
  const displayData = allCauldrons.map(cauldron => {
    const forecast = forecastData.find(f => f.cauldron_id === cauldron.id);
    return {
      cauldron_id: cauldron.id,
      cauldron_name: cauldron.name,
      current_level: forecast?.current_level ?? 0,
      max_volume: forecast?.max_volume ?? 100,
      r_fill: forecast?.r_fill ?? 0,
      eta_minutes: forecast?.eta_minutes ?? 999,
    };
  });

  /**
   * Get status styling based on overflow urgency
   */
  const getStatusStyle = (etaMinutes: number) => {
    if (etaMinutes < 30) {
      return "bg-red-900/50 border-red-500/80 border-2";
    } else if (etaMinutes < 120) {
      return "bg-yellow-900/50 border-yellow-500/80 border-2";
    } else {
      return "bg-green-900/50 border-green-500/80 border-2";
    }
  };

  /**
   * Get status text color based on urgency
   */
  const getStatusTextColor = (etaMinutes: number) => {
    if (etaMinutes < 30) {
      return "text-red-700";
    } else if (etaMinutes < 120) {
      return "text-yellow-700";
    } else {
      return "text-green-700";
    }
  };

  return (
    <div className="w-full h-full bg-black/30 backdrop-blur-sm rounded-lg border-2 border-purple-300/50 p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-3" style={{fontFamily: "'Playfair Display', serif"}}>Overflow Forecast</h2>
      
      {allCauldrons.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Loading cauldrons...</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 flex-1 content-start">
          {displayData.map((cauldron) => {
            const fillPercentage = ((cauldron.current_level / cauldron.max_volume) * 100).toFixed(1);
            const overflowHours = (cauldron.eta_minutes / 60).toFixed(1);
            
            return (
              <div
                key={cauldron.cauldron_id}
                onClick={() => setSelectedCauldron(cauldron)}
                className={`p-2.5 rounded-lg ${getStatusStyle(cauldron.eta_minutes)} flex flex-col cursor-pointer hover:opacity-80 transition-opacity`}
              >
                <h3 className="font-bold text-[11px] mb-1.5 leading-tight break-words">
                  {cauldron.cauldron_name}
                </h3>
                
                <div className="space-y-0.5 text-[10px]">
                  <p className="font-semibold">
                    {fillPercentage}% Full
                  </p>
                  
                  <p className={`font-medium ${getStatusTextColor(cauldron.eta_minutes)}`}>
                    {cauldron.eta_minutes < 999 ? `Overflow: ${overflowHours}h` : 'No data'}
                  </p>
                  
                  <p className="text-gray-600 text-[9px]">
                    {cauldron.current_level.toFixed(0)}L / {cauldron.max_volume.toFixed(0)}L
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Cauldron Detail Modal */}
      {selectedCauldron && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCauldron(null)}
        >
          <div 
            className="bg-black/80 backdrop-blur-md rounded-lg border-2 border-purple-300/50 p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold" style={{fontFamily: "'Playfair Display', serif"}}>
                {selectedCauldron.cauldron_name}
              </h3>
              <button
                onClick={() => setSelectedCauldron(null)}
                className="text-gray-300 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            {/* Cauldron Details */}
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${getStatusStyle(selectedCauldron.eta_minutes)}`}>
                <p className="text-sm text-gray-300 mb-1">Status</p>
                <p className={`text-lg font-bold ${getStatusTextColor(selectedCauldron.eta_minutes)}`}>
                  {selectedCauldron.eta_minutes < 30 ? '🔴 Critical - Immediate Action Required' : 
                   selectedCauldron.eta_minutes < 120 ? '🟡 Warning - Action Needed Soon' : 
                   '🟢 Safe - No Immediate Concern'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-lg">
                  <p className="text-sm text-gray-300 mb-1">Current Level</p>
                  <p className="text-xl font-bold">{selectedCauldron.current_level.toFixed(1)}L</p>
                </div>
                
                <div className="bg-white/10 p-3 rounded-lg">
                  <p className="text-sm text-gray-300 mb-1">Max Capacity</p>
                  <p className="text-xl font-bold">{selectedCauldron.max_volume.toFixed(1)}L</p>
                </div>
                
                <div className="bg-white/10 p-3 rounded-lg">
                  <p className="text-sm text-gray-300 mb-1">Fill Percentage</p>
                  <p className="text-xl font-bold">
                    {((selectedCauldron.current_level / selectedCauldron.max_volume) * 100).toFixed(1)}%
                  </p>
                </div>
                
                <div className="bg-white/10 p-3 rounded-lg">
                  <p className="text-sm text-gray-300 mb-1">Fill Rate</p>
                  <p className="text-xl font-bold">{selectedCauldron.r_fill.toFixed(2)}L/min</p>
                </div>
              </div>
              
              <div className="bg-white/10 p-4 rounded-lg">
                <p className="text-sm text-gray-300 mb-1">Overflow ETA</p>
                <p className="text-2xl font-bold">
                  {selectedCauldron.eta_minutes < 999 
                    ? `${(selectedCauldron.eta_minutes / 60).toFixed(1)} hours (${selectedCauldron.eta_minutes.toFixed(0)} minutes)`
                    : 'No data available'}
                </p>
              </div>
              
              <div className="bg-white/10 p-3 rounded-lg">
                <p className="text-sm text-gray-300 mb-1">Cauldron ID</p>
                <p className="text-sm font-mono">{selectedCauldron.cauldron_id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

