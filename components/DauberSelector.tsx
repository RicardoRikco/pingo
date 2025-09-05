import React from 'react';
import { Dauber } from '../types';

const daubers: { id: Dauber, symbol: string, name: string }[] = [
  { id: 'star', symbol: '🌟', name: 'Estrella' },
  { id: 'flame', symbol: '🔥', name: 'Llama' },
  { id: 'diamond', symbol: '💎', name: 'Diamante' },
  { id: 'clover', symbol: '🍀', name: 'Trébol' },
];

interface DauberSelectorProps {
  currentDauber: Dauber;
  onSelect: (dauber: Dauber) => void;
}

const DauberSelector: React.FC<DauberSelectorProps> = ({ currentDauber, onSelect }) => {
  return (
    <div className="mb-8 bg-slate-800 p-4 rounded-xl border border-slate-700 animate-pop max-w-lg mx-auto">
      <h3 className="text-xl font-bold text-center text-cyan-400 mb-4">Elige tu Boli de la Suerte</h3>
      <div className="flex justify-center items-center gap-2 sm:gap-4">
        {daubers.map(({ id, symbol, name }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`
              flex flex-col items-center justify-center p-2 rounded-lg w-20 h-20 sm:w-24 sm:h-24
              transition-all duration-200 transform border-2
              ${currentDauber === id 
                ? 'bg-cyan-500 border-cyan-300 text-slate-900 scale-110 shadow-lg shadow-cyan-500/30' 
                : 'bg-slate-700 border-transparent text-white hover:bg-slate-600 hover:-translate-y-1'}
            `}
            aria-label={`Seleccionar ${name}`}
            aria-pressed={currentDauber === id}
          >
            <span className="text-3xl sm:text-4xl">{symbol}</span>
            <span className="font-semibold mt-1 text-xs sm:text-sm">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DauberSelector;
