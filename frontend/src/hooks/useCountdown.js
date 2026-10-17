import { useState, useEffect } from "react";

export function useCountdown(targetTimestampSeconds) {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!targetTimestampSeconds) return { seconds: 0, isExpired: true, formatted: "00:00" };
    const now = Math.floor(Date.now() / 1000);
    const diff = Number(targetTimestampSeconds) - now;
    return {
      seconds: Math.max(0, diff),
      isExpired: diff <= 0,
      formatted: formatRemaining(Math.max(0, diff)),
    };
  });

  useEffect(() => {
    if (!targetTimestampSeconds) return;

    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = Number(targetTimestampSeconds) - now;
      if (diff <= 0) {
        setTimeLeft({ seconds: 0, isExpired: true, formatted: "Overdue" });
      } else {
        setTimeLeft({
          seconds: diff,
          isExpired: false,
          formatted: formatRemaining(diff),
        });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetTimestampSeconds]);

  return timeLeft;
}

function formatRemaining(totalSeconds) {
  if (totalSeconds <= 0) return "00:00";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
