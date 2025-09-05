
import React, { useState } from 'react';
import * as api from '../services/mockApi';
import { Player, AppSettings } from '../types';

interface PlayerLoginViewProps {
  onLoginSuccess: (player: Player) => void;
  settings: AppSettings;
}

const PlayerLoginView: React.FC<PlayerLoginViewProps> = ({ onLoginSuccess, settings }) => {
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    setIsLoading(true);
    setError('');

    try {
      const player = await api.findPlayerByName(playerName);
      if (player) {
        onLoginSuccess(player);
      } else {
        setError('No se encontró ningún jugador con ese nombre. Asegúrate de que esté escrito exactamente como lo registraste.');
      }
    } catch (err) {
      setError('Ocurrió un error al buscar tu nombre. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-900 text-white p-4">
      <header className="text-center mb-10">
        {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="mx-auto h-24 w-auto mb-4"/>}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400">{settings.bingoName}</span>
        </h1>
        <p className="text-slate-400 mt-2">Sala de Juego</p>
      </header>
      <main className="w-full max-w-sm bg-slate-800 p-6 sm:p-8 rounded-xl border border-slate-700 shadow-2xl animate-pop">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="playerName" className="block text-slate-300 font-semibold mb-2">Ingresa tu Nombre</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-slate-700 text-white p-3 rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              placeholder="Tal como lo registraste"
              autoFocus
              aria-describedby="error-message"
            />
          </div>
          {error && <p id="error-message" className="text-amber-400 text-sm mb-4" aria-live="assertive">{error}</p>}
          <button
            type="submit"
            disabled={isLoading || !playerName.trim()}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
          >
            {isLoading ? 'Buscando...' : 'Entrar al Juego'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default PlayerLoginView;