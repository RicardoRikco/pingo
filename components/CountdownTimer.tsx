import React from 'react';

interface CountdownTimerProps {
  remainingSeconds: number;
}

const formatTime = (seconds: number) => {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const CountdownTimer: React.FC<CountdownTimerProps> = ({ remainingSeconds }) => {
  return (
    <div className="text-8xl md:text-9xl font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400">
      {formatTime(remainingSeconds)}
    </div>
  );
};

export default CountdownTimer;
