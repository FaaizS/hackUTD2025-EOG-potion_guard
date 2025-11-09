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
import Image from "next/image";
import { useEffect, useState } from "react";
import PlaybackSlider from "@/app/components/PlaybackSlider";
import OverflowForecast from "@/app/components/OverflowForecast";
import DiscrepancyTable from "@/app/components/DiscrepancyTable";
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
        
        // Initialize timeline to just before first data point (so stats show zero initially)
        if (dataWithTimes.length > 0) {
          const dates = dataWithTimes.map((d: any) => d.date).sort();
          const firstDate = new Date(dates[0] + "T00:00:00Z");
          // Set initial time to 1 hour before first data to ensure zero state
          const initialDate = new Date(firstDate.getTime() - 60 * 60 * 1000);
          setSelectedDateTime(initialDate.toISOString());
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
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-300">Loading Dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-3 text-sm text-gray-300">
          <Image src="/eog.png" alt="EOG Logo" width={32} height={32} />
          <span>EOG HackUTD Challenge</span>
        </div>
        <h1 className="text-6xl font-serif font-bold text-center text-golden my-6" style={{fontFamily: "'Young Serif', serif", color: "#FFD700"}}>
          Potion Guard
        </h1>

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
        
        {/* Discrepancy Table with Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-8">
          {/* Left Column: Discrepancy Table */}
          <div className="md:col-span-3">
            <DiscrepancyTable discrepancies={filteredDiscrepancies} />
          </div>

          {/* Right Column: Stacked Stats */}
          <div className="md:col-span-2 md:pt-16"> 
            <div className="mb-8">
              <p className="text-xl text-gray-300">Loss Incidents</p>
              <p className="text-6xl font-bold text-red-500">{totalLosses}</p>
            </div>
            <div>
              <p className="text-xl text-gray-300">Total Lost</p>
              <p className="text-6xl font-bold text-orange-500">{totalLostVolume.toFixed(1)}L</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
