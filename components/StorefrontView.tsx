

import React, { useState } from 'react';
import { PlayerCardData, AppSettings } from '../types';

interface StorefrontViewProps {
  cardPool: PlayerCardData[];
  cardPrice: number;
  adminPhoneNumber: string;
  settings: AppSettings;
}

const StorefrontView: React.FC<StorefrontViewProps> = ({ cardPool, cardPrice, adminPhoneNumber, settings }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [playerName, setPlayerName] = useState('');

  const toggleCard = (cardData: PlayerCardData) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardData.id)) {
        newSet.delete(cardData.id);
      } else {
        newSet.add(cardData.id);
      }
      return newSet;
    });
  };

  const handleRequest = () => {
    if (!playerName.trim() || selected.size === 0) {
      alert('Por favor, introduce tu nombre y selecciona al menos una cartola.');
      return;
    }
    const cardList = Array.from(selected).join(', ');
    const total = selected.size * cardPrice;
    const text = `¡Hola! Soy ${playerName.trim()}, y quiero reservar las siguientes cartolas de ${settings.bingoName}: ${cardList}. El total a pagar es $${total.toFixed(2)}.`;
    const whatsappUrl = `https://wa.me/${adminPhoneNumber}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="bg-slate-900 text-white p-4 sm:p-6 lg:p-8 flex-grow">
      <header className="text-center mb-8">
        {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="mx-auto h-24 w-auto mb-4"/>}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400">{settings.bingoName}</span>
        </h1>
        <p className="text-slate-400 mt-2 max-w-2xl mx-auto">¡Bienvenido! Elige tus cartolas de la suerte y envíanos tu selección para unirte al juego.</p>
        <p className="mt-4 text-lg font-bold text-cyan-400">Cartolas Disponibles: {cardPool.length}</p>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-700 mb-6 sticky top-4 z-10 shadow-lg animate-pop">
          <h2 className="text-xl font-bold text-cyan-400 mb-3 text-center sm:text-left">Tu Selección</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Escribe tu nombre aquí"
              className="flex-grow w-full sm:w-auto bg-slate-700 text-white p-3 rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
            <div className="flex-shrink-0 text-center">
                <p className="text-slate-300">Cartolas: <span className="font-bold text-white">{selected.size}</span></p>
                <p className="text-slate-300">Total: <span className="font-bold text-white">${(selected.size * cardPrice).toFixed(2)}</span></p>
            </div>
            <button
              onClick={handleRequest}
              disabled={!playerName.trim() || selected.size === 0}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              Solicitar por WhatsApp
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {cardPool.map(cardData => {
            const isSelected = selected.has(cardData.id);
            return (
              <div
                key={cardData.id}
                onClick={() => toggleCard(cardData)}
                className={`
                  p-2 rounded-lg border-2 transition-all duration-200 transform hover:-translate-y-1 cursor-pointer
                  ${isSelected ? 'border-cyan-400 bg-slate-600 scale-105 shadow-lg shadow-cyan-500/20' : 'border-transparent bg-slate-700 hover:bg-slate-600'}
                `}
              >
                <p className="font-bold text-center text-fuchsia-400 mb-1">{cardData.id}</p>
                <div className="grid grid-cols-5 gap-1">
                  {cardData.card.flat().map((num, j) => (
                    <div key={j} className={`w-full aspect-square flex items-center justify-center rounded text-xs font-semibold ${num === 'FREE' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-200'}`}>
                      {num === 'FREE' ? '★' : num}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default StorefrontView;