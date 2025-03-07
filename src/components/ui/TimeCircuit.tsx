
import { useEffect, useState } from "react";
import { formatTime } from "@/lib/gameLogic";

interface TimeCircuitProps {
  label: string;
  value: string;
  color: 'red' | 'yellow' | 'blue';
  blinking?: boolean;
  className?: string;
}

const TimeCircuit = ({ 
  label, 
  value, 
  color = 'red',
  blinking = false,
  className = ''
}: TimeCircuitProps) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    if (blinking) {
      const interval = setInterval(() => {
        setIsVisible(prev => !prev);
      }, 500);
      
      return () => clearInterval(interval);
    } else {
      setIsVisible(true);
    }
  }, [blinking]);
  
  const colorClasses = {
    red: "red-circuit",
    yellow: "yellow-circuit",
    blue: "blue-circuit"
  };
  
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="text-xs text-gray-400 uppercase mb-1 font-['Orbitron']">{label}</div>
      <div className={`time-circuit-display ${colorClasses[color]} animate-time-circuit`}>
        <span className={isVisible ? "opacity-100" : "opacity-30"}>
          {value}
        </span>
      </div>
    </div>
  );
};

export interface TimerCircuitProps {
  timeInSeconds: number;
  isRunning?: boolean;
  className?: string;
}

export const TimerCircuit = ({ 
  timeInSeconds, 
  isRunning = true,
  className = ''
}: TimerCircuitProps) => {
  return (
    <TimeCircuit
      label="Time Remaining"
      value={formatTime(timeInSeconds)}
      color="red"
      blinking={isRunning && timeInSeconds <= 10}
      className={className}
    />
  );
};

export default TimeCircuit;
