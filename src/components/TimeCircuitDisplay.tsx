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
    // Ensure we're working with positive differences
    if (target < current) {
      return {
        months: "00",
        weeks: "00",
        days: "00",
        hours: "00",
        minutes: "00",
      };
    }

    // Calculate total differences
    const remainingMonths = differenceInMonths(target, current);

    // Adjust the date by removing months to calculate remaining weeks
    const afterMonths = new Date(current);
    afterMonths.setMonth(afterMonths.getMonth() + remainingMonths);
    const remainingWeeks = Math.floor(differenceInDays(target, afterMonths) / 7);

    // Adjust the date by removing weeks to calculate remaining days
    const afterWeeks = new Date(afterMonths);
    afterWeeks.setDate(afterWeeks.getDate() + remainingWeeks * 7);
    const remainingDays = differenceInDays(target, afterWeeks);

    // Adjust the date by removing days to calculate remaining hours
    const afterDays = new Date(afterWeeks);
    afterDays.setDate(afterDays.getDate() + remainingDays);
    const remainingHours = differenceInHours(target, afterDays);

    // Adjust the date by removing hours to calculate remaining minutes
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
  const timeRemaining = calculateTimeRemaining(destinationTime, currentTime);

  const displayStyles = {
    container: {
      display: "flex",
      justifyContent: "center",
      gap: "2px",
      padding: "0 4px",
    },
    digit: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "80px",
      background: "000000",
    },
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto cursor-pointer" onClick={handleTimeCircuitClick}>
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
