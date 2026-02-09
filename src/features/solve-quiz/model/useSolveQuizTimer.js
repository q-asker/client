import { useEffect, useRef, useState } from 'react';

const buildTimerLabel = (hours, minutes, seconds) =>
  `${String(hours).padStart(2, '0')}:` +
  `${String(minutes).padStart(2, '0')}:` +
  `${String(seconds).padStart(2, '0')}`;

export const useSolveQuizTimer = () => {
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const timeoutRef = useRef(null);

  useEffect(() => {
    const startTime = Date.now();

    const tick = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      const seconds = elapsedSeconds % 60;
      setCurrentTime(buildTimerLabel(hours, minutes, seconds));

      const nextDelay = 1000 - ((Date.now() - startTime) % 1000);
      timeoutRef.current = setTimeout(tick, nextDelay);
    };

    tick();

    return () => clearTimeout(timeoutRef.current);
  }, []);

  return currentTime;
};
