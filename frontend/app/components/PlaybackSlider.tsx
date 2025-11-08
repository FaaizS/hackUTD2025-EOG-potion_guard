"use client";

import { useState } from "react";

export default function PlaybackSlider() {
  // TODO(Araohat): This slider should control the "time" for
  // the historical data playback.
  const [time, setTime] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(Number(e.target.value));
    // TODO(Araohat): When this changes, call a function from
    // apiClient.ts to get historical data for this timestamp
    // and update the map/charts.
  };

  return (
    <div className="w-full mt-8">
      <h2 className="text-xl font-bold mb-4">Historical Playback</h2>
      <div className="flex items-center gap-4">
        <label htmlFor="time-slider" className="font-medium">Time:</label>
        <input
          id="time-slider"
          type="range"
          min="0"
          max="100"
          value={time}
          onChange={handleChange}
          className="w-full"
        />
        <span className="font-mono">{time}</span>
      </div>
    </div>
  );
}

