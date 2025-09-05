import React from 'react';

const Confetti: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-10">
      {Array.from({ length: 150 }).map((_, i) => {
        const style = {
          left: `${Math.random() * 100}%`,
          animationDuration: `${Math.random() * 3 + 4}s`,
          animationDelay: `${Math.random() * 3}s`,
          backgroundColor: `hsl(${Math.random() * 360}, 90%, 60%)`,
        };
        return <div key={i} className={`confetti-piece animate-confetti-fall`} style={style} />;
      })}
    </div>
  );
};

export default Confetti;
