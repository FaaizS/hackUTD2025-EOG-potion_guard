"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import PlaybackSlider from "@/app/components/PlaybackSlider";
import { getDiscrepancies } from "@/app/lib/apiClient";

// Dynamically import Map component with SSR disabled
// This prevents the "window is not defined" error since Leaflet needs the browser
const MapComponent = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
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
        
        // Assign random times throughout each day to simulate gradual accumulation
        const dataWithTimes = data.map((d: Discrepancy) => {
          const randomHour = Math.floor(Math.random() * 24);
          return {
            ...d,
            timestamp: `${d.date}T${String(randomHour).padStart(2, '0')}:00:00`
          };
        });
        
        setDiscrepancies(dataWithTimes);
        
        // Set initial datetime to start of one day before first data (show 0 thefts)
        if (dataWithTimes.length > 0) {
          const dates = dataWithTimes.map((d: any) => d.date).sort();
          const firstDate = new Date(dates[0] + "T00:00:00");
          firstDate.setDate(firstDate.getDate() - 1);
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

  // Calculate date range from discrepancies
  const dates = discrepancies.map(d => d.date).sort();
  const maxDate = dates[dates.length - 1] || "2025-11-11";
  
  // Set minDate to one day before the first data point so slider starts at 0 thefts
  const firstDataDate = dates[0] || "2025-10-30";
  const minDateObj = new Date(firstDataDate);
  minDateObj.setDate(minDateObj.getDate() - 1);
  const minDate = minDateObj.toISOString().split('T')[0];

  // Filter discrepancies based on selected datetime (show only events before this time)
  const selectedTime = new Date(selectedDateTime).getTime();
  const filteredDiscrepancies = discrepancies.filter((d: any) => {
    const itemTime = new Date(d.timestamp).getTime();
    return itemTime <= selectedTime;
  });

  // Count total thefts
  const totalThefts = filteredDiscrepancies.filter(d => d.missing_volume > 0).length;
  const totalStolenVolume = filteredDiscrepancies
    .filter(d => d.missing_volume > 0)
    .reduce((sum, d) => sum + d.missing_volume, 0);

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-600">Loading Potion Guard Dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Potion Guard Dashboard</h1>

        <MapComponent />
        
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <p className="text-sm text-gray-600">Total Cauldrons</p>
            <p className="text-3xl font-bold text-blue-600">12</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
            <p className="text-sm text-gray-600">Theft Incidents</p>
            <p className="text-3xl font-bold text-red-600">{totalThefts}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
            <p className="text-sm text-gray-600">Total Stolen</p>
            <p className="text-3xl font-bold text-orange-600">{totalStolenVolume.toFixed(1)}L</p>
          </div>
        </div>
        
        {discrepancies.length > 0 && (
          <PlaybackSlider 
            minDate={minDate}
            maxDate={maxDate}
            currentDateTime={selectedDateTime}
            onDateTimeChange={setSelectedDateTime}
          />
        )}
        
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
                    <th className="border border-gray-300 p-2">Missing (L)</th>
                    <th className="border border-gray-300 p-2">Status</th>
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
                        {item.missing_volume.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {item.missing_volume > 0 ? (
                          <span className="px-2 py-1 bg-red-600 text-white rounded text-sm font-bold">
                            THEFT
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-600 text-white rounded text-sm">
                            Leakage
                          </span>
                        )}
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
