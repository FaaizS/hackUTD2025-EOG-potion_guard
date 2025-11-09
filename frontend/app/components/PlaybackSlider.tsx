/**
 * PlaybackSlider Component
 * 
 * Interactive time-travel slider for filtering historical data
 * Features:
 * - 6-hour interval stepping
 * - Auto-play mode that advances time every second
 * - Reset and "Show All" controls
 * - Pause on manual slider interaction
 */

"use client";

import { useState, useEffect, useRef } from "react";

interface PlaybackSliderProps {
  minDate: string;
  maxDate: string;
  currentDateTime: string;
  onDateTimeChange: (dateTime: string) => void;
}

export default function PlaybackSlider({ minDate, maxDate, currentDateTime, onDateTimeChange }: PlaybackSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Convert date strings to timestamps for calculations
  const minTime = new Date(minDate + "T00:00:00").getTime();
  const maxTime = new Date(maxDate + "T23:59:59").getTime();
  const currentTime = new Date(currentDateTime).getTime();
  
  // Calculate current slider position as percentage (0-100)
  const totalRange = maxTime - minTime;
  const currentPosition = totalRange > 0 ? ((currentTime - minTime) / totalRange) * 100 : 0;

  // Auto-play functionality: advances time by 6 hours every second
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const sixHoursMs = 6 * 60 * 60 * 1000;
        const currentMs = new Date(currentDateTime).getTime();
        const newMs = currentMs + sixHoursMs;
        
        // Stop auto-play when reaching the end of timeline
        if (newMs >= maxTime) {
          setIsPlaying(false);
          onDateTimeChange(new Date(maxTime).toISOString());
          return;
        }
        
        // Round to nearest 6-hour interval (0, 6, 12, 18)
        const newDate = new Date(newMs);
        const hours = newDate.getHours();
        const roundedHours = Math.round(hours / 6) * 6 % 24;
        newDate.setHours(roundedHours, 0, 0, 0);
        
        onDateTimeChange(newDate.toISOString());
      }, 1000)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isPlaying, currentDateTime, maxTime, onDateTimeChange]);

  /**
   * Handles manual slider movement
   * Pauses auto-play and snaps to nearest 6-hour interval
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPlaying) {
      setIsPlaying(false);
    }
    
    const sliderValue = Number(e.target.value);
    const newTimestamp = minTime + (sliderValue / 100) * totalRange;
    
    // Snap to 6-hour intervals: 0, 6, 12, or 18
    const date = new Date(newTimestamp);
    const hour = date.getHours();
    const roundedHour = Math.floor(hour / 6) * 6;
    date.setHours(roundedHour, 0, 0, 0);
    
    onDateTimeChange(date.toISOString());
  };

  /**
   * Toggles auto-play mode
   * Restarts from beginning if already at the end
   */
  const handlePlayPause = () => {
    if (!isPlaying && currentTime >= maxTime) {
      const startDate = new Date(minDate + "T00:00:00");
      onDateTimeChange(startDate.toISOString());
    }
    setIsPlaying(!isPlaying);
  };

  /**
   * Resets timeline to the beginning
   */
  const handleReset = () => {
    setIsPlaying(false);
    const startDate = new Date(minDate + "T00:00:00");
    onDateTimeChange(startDate.toISOString());
  };

  /**
   * Formats datetime for display with date and time
   */
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  /**
   * Formats date only for range labels
   */
  const formatDateOnly = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="w-full mt-8 p-4 bg-gray-50 rounded-lg border border-gray-300">
      <h2 className="text-xl font-bold mb-4">Time Travel - Filter by Date & Time (6-hour intervals)</h2>
      <div className="space-y-3">
        {/* Playback Controls */}
        <div className="flex justify-center gap-3">
          <button
            onClick={handlePlayPause}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              isPlaying 
                ? "bg-orange-600 hover:bg-orange-700 text-white" 
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-colors"
          >
            ⏮ Reset
          </button>
          <button
            onClick={() => onDateTimeChange(new Date(maxDate + "T23:59:59").toISOString())}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          >
            ⏭ Show All
          </button>
        </div>

        {/* Slider */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600 w-24">
            {formatDateOnly(minDate)}
          </span>
          <input
            id="time-slider"
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={currentPosition}
            onChange={handleChange}
            className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-sm font-medium text-gray-600 w-24 text-right">
            {formatDateOnly(maxDate)}
          </span>
        </div>

        {/* Current Time Display */}
        <div className="text-center">
          <span className="text-lg font-bold text-blue-600">
            Viewing: {formatDateTime(currentDateTime)}
          </span>
          {isPlaying && (
            <span className="ml-3 text-sm text-green-600 font-medium animate-pulse">
              ● Playing
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

