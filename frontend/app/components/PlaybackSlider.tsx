"use client";

interface PlaybackSliderProps {
  minDate: string;
  maxDate: string;
  currentDateTime: string; // Now includes time
  onDateTimeChange: (dateTime: string) => void;
}

export default function PlaybackSlider({ minDate, maxDate, currentDateTime, onDateTimeChange }: PlaybackSliderProps) {
  // Convert to timestamps (start of min date, end of max date)
  const minTime = new Date(minDate + "T00:00:00").getTime();
  const maxTime = new Date(maxDate + "T23:59:59").getTime();
  const currentTime = new Date(currentDateTime).getTime();
  
  // Calculate slider position (0-100)
  const totalRange = maxTime - minTime;
  const currentPosition = totalRange > 0 ? ((currentTime - minTime) / totalRange) * 100 : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = Number(e.target.value);
    
    // Convert slider position to timestamp
    const newTimestamp = minTime + (sliderValue / 100) * totalRange;
    
    // Round to nearest 6-hour interval
    const date = new Date(newTimestamp);
    const hour = date.getHours();
    const roundedHour = Math.floor(hour / 6) * 6; // 0, 6, 12, or 18
    date.setHours(roundedHour, 0, 0, 0);
    
    onDateTimeChange(date.toISOString());
  };

  // Format date and time for display
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
      <div className="space-y-2">
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
        <div className="text-center">
          <span className="text-lg font-bold text-blue-600">
            Viewing: {formatDateTime(currentDateTime)}
          </span>
          <button
            onClick={() => onDateTimeChange(new Date(maxDate + "T23:59:59").toISOString())}
            className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Show All
          </button>
        </div>
      </div>
    </div>
  );
}

