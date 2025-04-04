import { useEffect, useState } from "react";

const TimeCircuitDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimeCircuit = (date: Date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return { month, day, year, hours, minutes };
  };

  // Calculate dates
  const current = formatTimeCircuit(currentTime);
  const destination = formatTimeCircuit(new Date(1974, 3, 4)); // April 4, 1974
  const last = formatTimeCircuit(new Date());

  // Single LED digit display
  const Digit = ({ value, color }: { value: string; color: string }) => (
    <div
      className={`relative w-12 h-16 flex items-center justify-center ${color} font-led text-4xl font-bold`}
      style={{
        textShadow: `0 0 10px currentColor`,
        background: "#000",
        border: "1px solid #222",
      }}
    >
      {value}
    </div>
  );

  // Time circuit separator
  const Separator = () => (
    <div className="w-3 flex items-center justify-center">
      <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
    </div>
  );

  const TimeDisplay = ({ label, time, color }: { label: string; time: typeof current; color: string }) => (
    <div className="relative">
      {/* Label above time circuit */}
      <div className="absolute -top-6 left-0 right-0 text-center">
        <span className="text-xs text-gray-400 tracking-[0.2em] font-mono">{label}</span>
      </div>

      {/* Time circuit panel */}
      <div
        className="relative bg-black border border-gray-800 shadow-inner p-2"
        style={{
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.8)",
        }}
      >
        <div className="flex items-center justify-center gap-[2px]">
          {/* Month */}
          <Digit value={time.month[0]} color={color} />
          <Digit value={time.month[1]} color={color} />
          <Separator />
          {/* Day */}
          <Digit value={time.day[0]} color={color} />
          <Digit value={time.day[1]} color={color} />
          <Separator />
          {/* Year */}
          <Digit value={time.year[0]} color={color} />
          <Digit value={time.year[1]} color={color} />
          <Separator />
          {/* Hours */}
          <Digit value={time.hours[0]} color={color} />
          <Digit value={time.hours[1]} color={color} />
          <Separator />
          {/* Minutes */}
          <Digit value={time.minutes[0]} color={color} />
          <Digit value={time.minutes[1]} color={color} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full max-w-[900px] mx-auto">
      {/* Main time circuit panel */}
      <div
        className="relative bg-[#111] rounded-sm p-8 shadow-2xl"
        style={{
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.9)",
        }}
      >
        <div className="flex flex-col gap-12">
          <TimeDisplay label="DESTINATION TIME" time={destination} color="text-red-500" />
          <TimeDisplay label="PRESENT TIME" time={current} color="text-green-500" />
          <TimeDisplay label="LAST TIME DEPARTED" time={last} color="text-yellow-500" />
        </div>
      </div>
    </div>
  );
};

export default TimeCircuitDisplay;

// Add this to your global CSS (e.g., globals.css)
/*
@font-face {
  font-family: 'LED';
  src: url('/fonts/digital-7.ttf') format('truetype');
}

.font-led {
  font-family: 'LED', monospace;
}
*/
