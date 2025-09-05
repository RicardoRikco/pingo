

import React, { useState } from 'react';
import { AppSettings } from '../types';

interface LoginScreenProps {
  onLogin: (password: string) => boolean;
  settings: AppSettings;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, settings }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = onLogin(password);
    if (!success) {
      setError('Contraseña incorrecta. Inténtalo de nuevo.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-900 text-white p-4">
      <header className="text-center mb-10">
        {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="mx-auto h-24 w-auto mb-4"/>}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400">{settings.bingoName}</span>
        </h1>
        <p className="text-slate-400 mt-2">Panel de Administrador</p>
      </header>
      <main className="w-full max-w-sm bg-slate-800 p-6 sm:p-8 rounded-xl border border-slate-700 shadow-2xl animate-pop">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-slate-300 font-semibold mb-2">Contraseña de Administrador</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700 text-white p-3 rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              autoFocus
              aria-describedby="error-message"
            />
          </div>
          {error && <p id="error-message" className="text-red-400 text-sm mb-4" aria-live="assertive">{error}</p>}
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors transform hover:scale-105"
          >
            Ingresar
          </button>
        </form>
      </main>
    </div>
  );
};

export default LoginScreen;