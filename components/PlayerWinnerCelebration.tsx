import React from 'react';
import { Winner, BingoPattern } from '../types';
import Confetti from './Confetti';

interface PlayerWinnerCelebrationProps {
  winner: Winner;
}

const patternToFriendlyText = (pattern: BingoPattern): string => {
    switch (pattern) {
        case BingoPattern.ANY_LINE: return 'Línea o Diagonal';
        case BingoPattern.FOUR_CORNERS: return 'Cuatro Esquinas';
        case BingoPattern.FULL_CARD: return 'Cartón Lleno';
        default: return '';
    }
};

const PlayerWinnerCelebration: React.FC<PlayerWinnerCelebrationProps> = ({ winner }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 animate-pop"
    >
      <div 
        className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border-2 border-amber-400 w-full max-w-md m-4 text-center overflow-hidden"
      >
        <Confetti />
        <div className="relative z-20">
            <h1 className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 animate-pulse-strong">
                ¡GANASTE!
            </h1>
            <p className="text-xl md:text-2xl text-white mt-6 mb-2">Has ganado el</p>
            <p className="text-3xl md:text-4xl font-bold text-cyan-400">{winner.prize.name}</p>
            <p className="text-xl text-slate-300">({patternToFriendlyText(winner.prize.pattern)})</p>
            <p className="text-xl md:text-2xl text-slate-300 mt-2">({winner.prize.amount})</p>
            <p className="mt-8 text-slate-400">¡Felicidades! El juego continúa para los demás premios.</p>
        </div>
      </div>
    </div>
  );
};

export default PlayerWinnerCelebration;