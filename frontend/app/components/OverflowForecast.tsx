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
  onCauldronClick?: (cauldronId: string) => void;
}

export default function OverflowForecast({ currentDateTime, onCauldronClick }: OverflowForecastProps) {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [allCauldrons, setAllCauldrons] = useState<CauldronInfo[]>([]);

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
                onClick={() => onCauldronClick?.(cauldron.cauldron_id)}
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
    </div>
  );
}

