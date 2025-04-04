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
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return { month, day, year, hours, minutes };
  };

  const current = formatTimeCircuit(currentTime);
  const destination = formatTimeCircuit(new Date("1955-11-05"));
  const last = formatTimeCircuit(new Date("1985-10-26"));

  const TimeDisplay = ({ label, time, color }: { label: string; time: typeof current; color: string }) => (
    <div className="flex flex-col items-center">
      <span className="text-xs text-muted-foreground mb-1">{label}</span>
      <div className={`flex gap-1 ${color} font-mono text-lg md:text-2xl font-bold animate-glow`}>
        <div className="bg-black/60 backdrop-blur px-2 py-1 rounded border border-primary/20">{time.month}</div>
        <div className="bg-black/60 backdrop-blur px-2 py-1 rounded border border-primary/20">{time.day}</div>
        <div className="bg-black/60 backdrop-blur px-2 py-1 rounded border border-primary/20">{time.year}</div>
        <div className="bg-black/60 backdrop-blur px-2 py-1 rounded border border-primary/20">{time.hours}</div>
        <div className="bg-black/60 backdrop-blur px-2 py-1 rounded border border-primary/20">{time.minutes}</div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto bg-black/40 backdrop-blur-sm rounded-lg border border-primary/30 p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TimeDisplay label="DESTINATION TIME" time={destination} color="text-red-500" />
        <TimeDisplay label="PRESENT TIME" time={current} color="text-green-500" />
        <TimeDisplay label="LAST TIME DEPARTED" time={last} color="text-yellow-500" />
      </div>
    </div>
  );
};

export default TimeCircuitDisplay;
