class Timer {
  constructor(onUpdate) {
    this.startTime = null;
    this.elapsedTime = 0;
    this.intervalId = null;
    this.onUpdate = onUpdate; // 콜백 함수
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = Date.now() - this.elapsedTime;

    const tick = () => {
      if (!this.isRunning) return;
      this.elapsedTime = Date.now() - this.startTime;
      if (this.onUpdate) {
        this.onUpdate(this.elapsedTime);
      }
      const nextDelay = 1000 - (this.elapsedTime % 1000);
      this.intervalId = setTimeout(tick, nextDelay);
    };

    tick();
  }

  pause() {
    if (!this.isRunning) return;

    this.isRunning = false;
    clearTimeout(this.intervalId);
    this.intervalId = null;
  }

  reset() {
    this.pause();
    this.elapsedTime = 0;
    this.startTime = null;
  }

  stop() {
    this.pause();
    const finalTime = this.elapsedTime;
    this.elapsedTime = 0;
    this.startTime = null;
    return finalTime;
  }

  getElapsedTime() {
    return this.elapsedTime;
  }

  getFormattedTime() {
    return formatTime(this.elapsedTime);
  }
}

export const formatTime = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}시간 ${minutes % 60}분 ${seconds % 60}초`;
  } else if (minutes > 0) {
    return `${minutes}분 ${seconds % 60}초`;
  } else {
    return `${seconds}초`;
  }
};

export default Timer;
