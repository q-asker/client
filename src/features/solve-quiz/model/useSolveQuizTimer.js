import { useEffect, useState } from 'react';

const buildTimerLabel = (hours, minutes, seconds) =>
  `${String(hours).padStart(2, '0')}:` +
  `${String(minutes).padStart(2, '0')}:` +
  `${String(seconds).padStart(2, '0')}`;

export const useSolveQuizTimer = () => {
  const [currentTime, setCurrentTime] = useState('00:00:00');

  useEffect(() => {
    let seconds = 0;
    let minutes = 0;
    let hours = 0;
    const timer = setInterval(() => {
      seconds += 1;
      if (seconds === 60) {
        seconds = 0;
        minutes += 1;
      }
      if (minutes === 60) {
        minutes = 0;
        hours += 1;
      }
      setCurrentTime(buildTimerLabel(hours, minutes, seconds));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return currentTime;
};
