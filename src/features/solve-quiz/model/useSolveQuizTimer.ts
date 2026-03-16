import { useEffect, useRef, useState } from 'react';

/** HH:MM:SS 형식의 타이머 라벨을 생성한다 */
const buildTimerLabel = (hours: number, minutes: number, seconds: number): string =>
  `${String(hours).padStart(2, '0')}:` +
  `${String(minutes).padStart(2, '0')}:` +
  `${String(seconds).padStart(2, '0')}`;

/** 퀴즈 풀이 경과 시간을 추적하는 훅 */
export const useSolveQuizTimer = (): string => {
  const [currentTime, setCurrentTime] = useState<string>('00:00:00');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const startTime = Date.now();

    const tick = (): void => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      const seconds = elapsedSeconds % 60;
      setCurrentTime(buildTimerLabel(hours, minutes, seconds));

      const nextDelay = 1000 - ((Date.now() - startTime) % 1000);
      timeoutRef.current = setTimeout(tick, nextDelay);
    };

    tick();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return currentTime;
};
