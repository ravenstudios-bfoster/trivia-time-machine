import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format, differenceInMonths, differenceInWeeks, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";

const TimeCircuitDisplay = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTimeCircuitClick = () => {
    setClickCount((prev) => prev + 1);
    if (clickCount === 4) {
      toast.info("Accessing admin area...", {
        description: "This area is for game administrators only.",
      });
      navigate("/admin");
    } else if (clickCount > 0) {
      toast.info(`${5 - clickCount} more clicks to access admin area...`);
    }
  };

  const formatTimeDisplay = (date: Date) => {
    return {
      month: format(date, "MMM").toUpperCase(),
      day: format(date, "dd"),
      year: format(date, "yyyy"),
      hour: format(date, "hh"),
      minute: format(date, "mm"),
      isAM: format(date, "a") === "AM",
    };
  };

  const calculateTimeRemaining = (target: Date, current: Date) => {
    if (target < current) {
      return {
        months: "00",
        weeks: "00",
        days: "00",
        hours: "00",
        minutes: "00",
      };
    }

    const remainingMonths = differenceInMonths(target, current);
    const afterMonths = new Date(current);
    afterMonths.setMonth(afterMonths.getMonth() + remainingMonths);
    const remainingWeeks = Math.floor(differenceInDays(target, afterMonths) / 7);
    const afterWeeks = new Date(afterMonths);
    afterWeeks.setDate(afterWeeks.getDate() + remainingWeeks * 7);
    const remainingDays = differenceInDays(target, afterWeeks);
    const afterDays = new Date(afterWeeks);
    afterDays.setDate(afterDays.getDate() + remainingDays);
    const remainingHours = differenceInHours(target, afterDays);
    const afterHours = new Date(afterDays);
    afterHours.setHours(afterHours.getHours() + remainingHours);
    const remainingMinutes = differenceInMinutes(target, afterHours);

    return {
      months: String(remainingMonths).padStart(2, "0"),
      weeks: String(remainingWeeks).padStart(2, "0"),
      days: String(remainingDays).padStart(2, "0"),
      hours: String(remainingHours).padStart(2, "0"),
      minutes: String(remainingMinutes).padStart(2, "0"),
    };
  };

  const currentTimeDisplay = formatTimeDisplay(currentTime);
  const destinationTime = new Date(2025, 4, 17, 18, 30); // May 17, 2025, 6:30 PM
  const destinationTimeDisplay = formatTimeDisplay(destinationTime);
  const timeRemaining = calculateTimeRemaining(destinationTime, currentTime);

  return (
    <div className="relative w-full max-w-4xl mx-auto cursor-pointer" onClick={handleTimeCircuitClick}>
      {/* Desktop Time Circuit */}
      <div className="hidden lg:block">
        <img src="/images/time_circuit.png" alt="Time Circuit" className="w-full" />

        {/* Present Time Overlay */}
        <div className="present-time">
          <div className="present-time-container">
            <div className="time-circuit-display text-7xl led-green digit-month">{currentTimeDisplay.month}</div>
            <div className="time-circuit-display text-7xl led-green digit-day">{currentTimeDisplay.day}</div>
            <div className="time-circuit-display text-7xl led-green digit-year">{currentTimeDisplay.year}</div>
            <div className="time-circuit-display text-7xl led-green digit-hour">{currentTimeDisplay.hour}</div>
            <div className="time-circuit-display text-7xl led-green digit-minute">{currentTimeDisplay.minute}</div>
          </div>
        </div>

        {/* Time Remaining Overlay */}
        <div className="time-remaining">
          <div className="time-remaining-container">
            <div className="time-circuit-display text-6xl led-amber digit">{timeRemaining.months}</div>
            <div className="time-circuit-display text-6xl led-amber digit">{timeRemaining.weeks}</div>
            <div className="time-circuit-display text-6xl led-amber digit">{timeRemaining.days}</div>
            <div className="time-circuit-display text-6xl led-amber digit">{timeRemaining.hours}</div>
            <div className="time-circuit-display text-6xl led-amber digit">{timeRemaining.minutes}</div>
          </div>
        </div>
      </div>

      {/* Mobile Time Circuit */}
      <div className="lg:hidden space-y-4">
        {/* Destination Time */}
        <div className="bg-black/90 border-2 border-red-500/30 rounded-lg p-4 shadow-[0_0_15px_rgba(255,56,0,0.3)]">
          <div className="text-xs text-red-500 uppercase mb-2 font-mono">Destination Time</div>
          <div className="grid grid-cols-5 gap-2">
            <div className="time-circuit-display text-3xl led-red">{destinationTimeDisplay.month}</div>
            <div className="time-circuit-display text-3xl led-red">{destinationTimeDisplay.day}</div>
            <div className="time-circuit-display text-3xl led-red">{destinationTimeDisplay.year}</div>
            <div className="time-circuit-display text-3xl led-red">{destinationTimeDisplay.hour}</div>
            <div className="time-circuit-display text-3xl led-red">{destinationTimeDisplay.minute}</div>
          </div>
          <div className="grid grid-cols-5 gap-2 mt-1">
            <div className="text-[10px] text-center text-red-500/70">MONTH</div>
            <div className="text-[10px] text-center text-red-500/70">DAY</div>
            <div className="text-[10px] text-center text-red-500/70">YEAR</div>
            <div className="text-[10px] text-center text-red-500/70">HOUR</div>
            <div className="text-[10px] text-center text-red-500/70">MIN</div>
          </div>
        </div>

        {/* Present Time */}
        <div className="bg-black/90 border-2 border-green-500/30 rounded-lg p-4 shadow-[0_0_15px_rgba(0,255,0,0.3)]">
          <div className="text-xs text-green-500 uppercase mb-2 font-mono">Present Time</div>
          <div className="grid grid-cols-5 gap-2">
            <div className="time-circuit-display text-3xl led-green">{currentTimeDisplay.month}</div>
            <div className="time-circuit-display text-3xl led-green">{currentTimeDisplay.day}</div>
            <div className="time-circuit-display text-3xl led-green">{currentTimeDisplay.year}</div>
            <div className="time-circuit-display text-3xl led-green">{currentTimeDisplay.hour}</div>
            <div className="time-circuit-display text-3xl led-green">{currentTimeDisplay.minute}</div>
          </div>
        </div>

        {/* Time Remaining */}
        <div className="bg-black/90 border-2 border-amber-500/30 rounded-lg p-4 shadow-[0_0_15px_rgba(255,176,0,0.3)]">
          <div className="text-xs text-amber-500 uppercase mb-2 font-mono">Time Remaining</div>
          <div className="grid grid-cols-5 gap-2">
            <div className="time-circuit-display text-3xl led-amber">{timeRemaining.months}</div>
            <div className="time-circuit-display text-3xl led-amber">{timeRemaining.weeks}</div>
            <div className="time-circuit-display text-3xl led-amber">{timeRemaining.days}</div>
            <div className="time-circuit-display text-3xl led-amber">{timeRemaining.hours}</div>
            <div className="time-circuit-display text-3xl led-amber">{timeRemaining.minutes}</div>
          </div>
          <div className="grid grid-cols-5 gap-2 mt-1">
            <div className="text-[10px] text-center text-amber-500/70">MONTHS</div>
            <div className="text-[10px] text-center text-amber-500/70">WEEKS</div>
            <div className="text-[10px] text-center text-amber-500/70">DAYS</div>
            <div className="text-[10px] text-center text-amber-500/70">HOURS</div>
            <div className="text-[10px] text-center text-amber-500/70">MINS</div>
          </div>
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
