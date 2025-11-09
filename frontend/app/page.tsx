/**
 * Home Page - Potion Guard
 * 
 * Main dashboard displaying:
 * - Interactive map of cauldron locations
 * - Overflow forecast panel
 * - Time playback slider for filtering
 * - Statistics summary (incidents, volume lost)
 * - Discrepancy analysis table
 */

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import PlaybackSlider from "@/app/components/PlaybackSlider";
import OverflowForecast from "@/app/components/OverflowForecast";
import { getDiscrepancies } from "@/app/lib/apiClient";

// Dynamically import Map component with SSR disabled for Leaflet compatibility
const MapComponent = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
      <p className="text-gray-600">Loading map...</p>
    </div>
  ),
});

interface Discrepancy {
  date: string;
  cauldron_id: string;
  cauldron_name: string;
  expected_volume: number;
  actual_volume: number;
  missing_volume: number;
}

export default function Home() {
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");

  useEffect(() => {
    async function fetchDiscrepancies() {
      try {
        const data = await getDiscrepancies();
        
        // Assign times to 6-hour intervals throughout each day (0, 6, 12, 18)
        const dataWithTimes = data.map((d: Discrepancy) => {
          const sixHourIntervals = [0, 6, 12, 18];
          const randomInterval = sixHourIntervals[Math.floor(Math.random() * sixHourIntervals.length)];
          return {
            ...d,
            timestamp: `${d.date}T${String(randomInterval).padStart(2, '0')}:00:00Z`
          };
        });
        
        setDiscrepancies(dataWithTimes);
        
        // Initialize timeline to first data point at midnight
        if (dataWithTimes.length > 0) {
          const dates = dataWithTimes.map((d: any) => d.date).sort();
          const firstDate = new Date(dates[0] + "T00:00:00Z");
          setSelectedDateTime(firstDate.toISOString());
        }
      } catch (error) {
        console.error("Error fetching discrepancies:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDiscrepancies();
  }, []);

  // Calculate timeline date range from actual data
  const dates = discrepancies.map(d => d.date).sort();
  const minDate = dates[0] || "2025-10-30";
  const maxDate = dates[dates.length - 1] || "2025-11-09";

  // Filter discrepancies by selected datetime
  const selectedTime = new Date(selectedDateTime).getTime();
  const filteredDiscrepancies = discrepancies.filter((d: any) => {
    const itemTime = new Date(d.timestamp).getTime();
    return itemTime <= selectedTime;
  });

  // Calculate statistics from filtered data
  const totalLosses = filteredDiscrepancies.filter(d => d.missing_volume > 0).length;
  const totalLostVolume = filteredDiscrepancies
    .filter(d => d.missing_volume > 0)
    .reduce((sum, d) => sum + d.missing_volume, 0);

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-600">Loading Dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Potion Guard</h1>

        {/* Two-Column Layout: Map (60%) and Forecast (40%) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {/* Left Column: Map (60% width = 3/5 columns) */}
          <div className="md:col-span-3">
            <div className="h-[520px]">
              <MapComponent />
            </div>
          </div>
          
          {/* Right Column: Overflow Forecast (40% width = 2/5 columns) */}
          <div className="md:col-span-2">
            <div className="h-[520px]">
              <OverflowForecast currentDateTime={selectedDateTime} />
            </div>
          </div>
        </div>
        
        {/* Playback Slider */}
        {discrepancies.length > 0 && (
          <PlaybackSlider 
            minDate={minDate}
            maxDate={maxDate}
            currentDateTime={selectedDateTime}
            onDateTimeChange={setSelectedDateTime}
          />
        )}
        
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
            <p className="text-sm text-gray-600">Loss Incidents</p>
            <p className="text-3xl font-bold text-red-600">{totalLosses}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
            <p className="text-sm text-gray-600">Total Lost</p>
            <p className="text-3xl font-bold text-orange-600">{totalLostVolume.toFixed(1)}L</p>
          </div>
        </div>
        
        {/* Discrepancy Table */}
        <div className="w-full mt-8">
          <h2 className="text-2xl font-bold mb-4">
            Discrepancy Analysis 
            <span className="text-base font-normal text-gray-600 ml-2">
              (Showing {filteredDiscrepancies.length} of {discrepancies.length} records)
            </span>
          </h2>
          
          {filteredDiscrepancies.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No data available for this date range</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2">Date</th>
                    <th className="border border-gray-300 p-2">Cauldron</th>
                    <th className="border border-gray-300 p-2">Expected (L)</th>
                    <th className="border border-gray-300 p-2">Actual (L)</th>
                    <th className="border border-gray-300 p-2">Discrepancy (L)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDiscrepancies.map((item: Discrepancy, idx: number) => (
                    <tr key={idx} className={item.missing_volume > 0 ? "bg-red-50" : "bg-yellow-50"}>
                      <td className="border border-gray-300 p-2">{item.date}</td>
                      <td className="border border-gray-300 p-2">{item.cauldron_name}</td>
                      <td className="border border-gray-300 p-2">{item.expected_volume.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2">{item.actual_volume.toFixed(2)}</td>
                      <td className={`border border-gray-300 p-2 ${item.missing_volume > 0 ? "text-red-600 font-bold" : "text-yellow-700 font-bold"}`}>
                        {item.missing_volume > 0 ? '+' : ''}{item.missing_volume.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
