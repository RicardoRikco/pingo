import React from 'react';
import { Winner, BingoPattern } from '../types';
import Confetti from './Confetti';

interface WinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  winner: Winner | null;
  isFinalWinner: boolean;
}

const patternToFriendlyText = (pattern: BingoPattern): string => {
    switch (pattern) {
        case BingoPattern.ANY_LINE: return 'Línea o Diagonal';
        case BingoPattern.FOUR_CORNERS: return 'Cuatro Esquinas';
        case BingoPattern.FULL_CARD: return 'Cartón Lleno';
        default: return '';
    }
};

const WinnerModal: React.FC<WinnerModalProps> = ({ isOpen, onClose, winner, isFinalWinner }) => {
  if (!isOpen || !winner) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50"
    >
      <div 
        className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border-2 border-amber-400 w-full max-w-md m-4 text-center overflow-hidden animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <Confetti />
        <div className="relative z-20">
            <h1 className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 animate-pulse-strong">
                ¡BINGOOO!
            </h1>
            <p className="text-xl md:text-2xl text-white mt-6 mb-2">{winner.player.name} ha ganado el</p>
            <p className="text-3xl md:text-4xl font-bold text-cyan-400">{winner.prize.name}</p>
            <p className="text-xl text-slate-300">({patternToFriendlyText(winner.prize.pattern)})</p>
            <p className="text-xl md:text-2xl text-slate-300 mt-2">({winner.prize.amount})</p>

            <button
                onClick={onClose}
                className="mt-8 w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 text-xl"
            >
                {isFinalWinner ? 'Ver Resultados Finales' : 'Seguir Jugando'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default WinnerModal;