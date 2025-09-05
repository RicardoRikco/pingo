import React from 'react';
import { PlayerCardData, CardNumber, Dauber } from '../types';

interface PlayerCardProps {
  cardData: PlayerCardData;
  playerName?: string;
  calledNumbers: Set<number>;
  isWinner: boolean;
  dauber: Dauber;
}

const bingoLetters = ['B', 'I', 'N', 'G', 'O'];

const dauberSymbols: Record<Dauber, string> = {
  star: '🌟',
  flame: '🔥',
  diamond: '💎',
  clover: '🍀',
};

const Cell: React.FC<{ 
  number: CardNumber; 
  isCalled: boolean;
  dauber: Dauber;
}> = ({ number, isCalled, dauber }) => {
  const isFree = number === 'FREE';
  const baseClasses = 'w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-md md:rounded-lg font-bold transition-all duration-300 transform';

  if (isFree) {
    return (
      <div className={`${baseClasses} bg-cyan-500 text-slate-900 text-lg md:text-xl lg:text-2xl scale-105 shadow-lg shadow-cyan-500/30`}>
        ★
      </div>
    );
  }

  if (isCalled) {
    return (
      <div className={`${baseClasses} bg-emerald-500 text-white text-2xl md:text-3xl lg:text-4xl scale-105 shadow-lg shadow-emerald-500/30 animate-pop`}>
        {dauberSymbols[dauber]}
      </div>
    );
  }

  return (
    <div className={`${baseClasses} bg-slate-700 text-slate-300 text-lg md:text-xl lg:text-2xl`}>
      {number}
    </div>
  );
};

const PlayerCard: React.FC<PlayerCardProps> = ({ 
  cardData, 
  playerName,
  calledNumbers, 
  isWinner, 
  dauber,
}) => {
  return (
    <div className={`bg-slate-800 p-4 rounded-xl border-2 transition-all duration-300 ${isWinner ? 'border-amber-400 shadow-lg shadow-amber-500/20' : 'border-slate-700'}`}>
      <div className="flex justify-between items-center mb-3">
        {playerName && <h3 className={`text-xl font-bold truncate ${isWinner ? 'text-amber-400' : 'text-cyan-400'}`}>{playerName}</h3>}
        <p className="text-sm font-semibold text-fuchsia-400">{cardData.id}</p>
      </div>

      <div className="grid grid-cols-5 gap-2 justify-center">
        {bingoLetters.map(letter => (
          <div key={letter} className="w-12 h-8 md:w-14 md:h-8 lg:w-16 lg:h-8 flex items-center justify-center text-fuchsia-400 font-extrabold text-2xl">
            {letter}
          </div>
        ))}
        {cardData.card.flat().map((num, index) => (
          <Cell 
            key={index} 
            number={num} 
            isCalled={num === 'FREE' || calledNumbers.has(num as number)} 
            dauber={dauber}
          />
        ))}
      </div>
      
      {isWinner && (
        <div className="mt-4 w-full bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg text-center animate-pop">
          GANADOR
        </div>
      )}
    </div>
  );
};

export default PlayerCard;