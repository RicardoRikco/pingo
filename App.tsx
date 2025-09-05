




import React, { useState, useEffect } from 'react';
import { GamePhase, Player, Prize, Winner, PlayerCardData, PlayerStatus, PublicGameState, BingoPattern, Dauber, SpecialNumbers, AppSettings } from './types';
import PlayerCard from './components/PlayerCard';
import Modal from './components/Modal';
import WinnerModal from './components/WinnerModal';
import CountdownTimer from './components/CountdownTimer';
import LoginScreen from './components/LoginScreen';
import StorefrontView from './components/StorefrontView';
import PlayerWinnerCelebration from './components/PlayerWinnerCelebration';
import PlayerLoginView from './components/PlayerLoginView';
import DauberSelector from './components/DauberSelector';
import { useGameState } from './hooks/useGameState';
import * as api from './services/mockApi';

const patternToFriendlyText = (pattern: BingoPattern): string => {
    switch (pattern) {
        case BingoPattern.ANY_LINE: return 'Línea o Diagonal';
        case BingoPattern.FOUR_CORNERS: return 'Cuatro Esquinas';
        case BingoPattern.FULL_CARD: return 'Cartón Lleno';
        default: return '';
    }
};

const dauberSymbols: Record<Dauber, string> = {
  star: '🌟',
  flame: '🔥',
  diamond: '💎',
  clover: '🍀',
};

const AppFooter: React.FC<{settings: AppSettings}> = ({ settings }) => (
    <footer className="text-center p-4 mt-auto text-slate-500 text-sm">
        <p>Desarrollado por {settings.developerName}</p>
    </footer>
);


const CardSelector: React.FC<{ 
    cardPool: PlayerCardData[],
    assignedCardIds: Set<string>,
    onConfirm: (selectedCards: PlayerCardData[]) => void 
}> = ({ cardPool, assignedCardIds, onConfirm }) => {
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const toggleCard = (cardData: PlayerCardData) => {
        if (assignedCardIds.has(cardData.id)) return; // Cannot select already assigned cards

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

    const handleConfirm = () => {
        const selectedCards = cardPool.filter(c => selected.has(c.id));
        if (selectedCards.length > 0) {
            onConfirm(selectedCards);
            setSelected(new Set());
        }
    };

    return (
        <div className="max-h-[70vh] flex flex-col">
            <p className="text-slate-300 mb-4">Selecciona una o más cartolas. Las cartolas en gris ya están asignadas.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto p-1 flex-grow">
                {cardPool.map(cardData => {
                    const isAssigned = assignedCardIds.has(cardData.id);
                    const isSelected = selected.has(cardData.id);
                    return (
                        <div 
                            key={cardData.id} 
                            onClick={() => toggleCard(cardData)} 
                            className={`
                                p-2 rounded-lg border-2 transition-all duration-200
                                ${isAssigned ? 'bg-slate-800 opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                                ${isSelected ? 'border-cyan-400 bg-slate-600 scale-105' : 'border-transparent bg-slate-700 hover:bg-slate-600'}
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
            <div className="pt-4 text-center">
                 <button onClick={handleConfirm} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:opacity-50" disabled={selected.size === 0}>
                    Confirmar Selección
                </button>
            </div>
        </div>
    );
};

const PlayerPendingView: React.FC<{ player: Player; cardPrice: number }> = ({ player, cardPrice }) => {
    return (
        <div className="min-h-screen flex justify-center items-center p-4">
            <div className="text-center space-y-6 bg-slate-800 p-8 rounded-xl animate-pop border border-slate-700 max-w-2xl">
                <div className="flex justify-center items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
                    <h2 className="text-3xl font-extrabold text-amber-400">Esperando Confirmación de Pago</h2>
                </div>
                <p className="text-slate-300 text-lg">
                    ¡Hola, <span className="font-bold text-white">{player.name}</span>! Hemos recibido tu selección de cartolas.
                </p>
                <p className="text-slate-400">
                    Tu lugar está reservado. En cuanto el administrador confirme tu pago, esta pantalla se actualizará automáticamente y podrás empezar a jugar. ¡No necesitas refrescar!
                </p>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-sm text-slate-400">Tu Pedido</p>
                    <p className="text-xl font-bold text-white">{player.cards.length} Cartola(s): {player.cards.map(c => c.id).join(', ')}</p>
                    <p className="text-2xl font-bold text-amber-400 mt-2">Total a Pagar: ${(player.cards.length * cardPrice).toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
};


// This component is for the remote player who joins via a link
const RemotePlayerView: React.FC<{ initialPlayer: Player, initialCardPrice: number }> = ({ initialPlayer, initialCardPrice }) => {
    const [player, setPlayer] = useState<Player | null>(initialPlayer);
    const [gameState, setGameState] = useState<PublicGameState | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Polling to get live game updates and player status
    useEffect(() => {
        const fetchAllData = async () => {
            if (!initialPlayer?.name) return;
            try {
                const [updatedPlayer, state] = await Promise.all([
                    api.findPlayerByName(initialPlayer.name),
                    api.getPublicGameState()
                ]);
                setPlayer(updatedPlayer); // Can become null if order is cancelled
                setGameState(state);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData(); // Initial fetch
        const intervalId = setInterval(fetchAllData, 3000); // Poll every 3 seconds

        return () => clearInterval(intervalId);
    }, [initialPlayer.name]);

    useEffect(() => {
        if (gameState?.settings.bingoName) {
            document.title = gameState.settings.bingoName;
        }
    }, [gameState?.settings.bingoName]);

    const handleDauberChange = async (newDauber: Dauber) => {
        if (!player) return;
        // Optimistic UI update
        const originalPlayerState = player;
        setPlayer(p => p ? { ...p, dauber: newDauber } : null);
        try {
            await api.changePlayerDauber(player.id, newDauber);
        } catch (e) {
            console.error("Failed to change dauber", e);
            // Revert on error
            setPlayer(originalPlayerState);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                 <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-cyan-500"></div>
            </div>
        );
    }

    if (!player) {
        return (
            <div className="min-h-screen flex justify-center items-center p-4">
                <div className="text-center space-y-6 bg-slate-800 p-8 rounded-xl animate-pop border border-slate-700 max-w-2xl">
                     <h2 className="text-3xl font-extrabold text-red-400">Orden No Encontrada</h2>
                     <p className="text-slate-300 text-lg">
                        Tu orden fue cancelada o ha expirado. Por favor, contacta al administrador.
                     </p>
                     <button onClick={() => window.location.href = '/?join'} className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        Volver a Intentar
                     </button>
                </div>
            </div>
        );
    }
    
    if (player.status === PlayerStatus.PENDING) {
        return <PlayerPendingView player={player} cardPrice={initialCardPrice} />;
    }
    
    const calledNumbers = gameState?.calledNumbers ?? new Set();
    const lastDrawnNumbers = gameState?.lastDrawnNumbers ?? [];
    const aiCallerMessage = gameState?.aiCallerMessage ?? null;
    const myWin = gameState?.winners.find(w => w.player.id === player.id);
    const currentPrize = gameState?.prizes.find(p => !gameState.winners.some(w => w.prize.id === p.id));
    const isBomb = lastDrawnNumbers.length > 1;


    if (gameState?.gamePhase === GamePhase.GAME_OVER && !myWin) {
        return (
             <div className="min-h-screen flex justify-center items-center p-4">
                <div className="text-center space-y-8 bg-slate-800 p-8 rounded-xl animate-pop">
                    <h2 className="text-5xl font-extrabold text-amber-400">¡El Juego Ha Terminado!</h2>
                    <p className="text-slate-300 text-xl">Gracias por jugar. ¡Revisa los resultados con el administrador!</p>
                     <div className="space-y-4">
                         {gameState.winners.map(winner => (
                            <div key={winner.prize.id} className="text-xl">
                                <span className="font-semibold text-fuchsia-400">{winner.prize.name} ({patternToFriendlyText(winner.prize.pattern)}): </span>
                                <span className="font-bold text-2xl text-white">{winner.player.name}</span>
                                <span className="text-slate-300"> (${winner.prize.amount})</span>
                            </div>
                         ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {myWin && <PlayerWinnerCelebration winner={myWin} />}

            <header className="text-center mb-8">
                {gameState?.settings.logoUrl && <img src={gameState.settings.logoUrl} alt="Logo" className="mx-auto h-20 w-auto mb-4"/>}
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                    <span className="text-slate-300">¡Hola, </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400">{player.name}!</span>
                </h1>
                <p className="text-slate-400 mt-2">Los números se marcarán automáticamente en tus cartolas. ¡Mucha suerte!</p>
            </header>

            {gameState?.gamePhase === GamePhase.SETUP && (
                <DauberSelector
                    currentDauber={player.dauber}
                    onSelect={handleDauberChange}
                />
            )}
            
            {currentPrize && gameState?.gamePhase === GamePhase.PLAYING && (
                 <div className="text-center mb-6 animate-pop">
                    <p className="text-lg text-slate-300">Ahora jugando por:</p>
                    <p className="text-3xl font-bold text-amber-400">
                        {currentPrize.name} ({patternToFriendlyText(currentPrize.pattern)})
                    </p>
                </div>
            )}

            {/* Current number display for non-winners during play */}
            {gameState?.gamePhase === GamePhase.PLAYING && !myWin && (
                <div className="max-w-md mx-auto mb-8 p-4 bg-slate-800 rounded-xl animate-pop border border-slate-700 flex flex-col justify-around items-center gap-4">
                   <div className="flex justify-around items-center w-full">
                       <div className="flex-grow">
                            <p className="text-sm text-slate-300 text-center mb-1">{isBomb ? '¡Bomba de Números!' : 'Último número'}</p>
                            <div className="flex justify-center items-center gap-2">
                                {lastDrawnNumbers.length > 0 ? lastDrawnNumbers.map(num => (
                                     <div key={num} className={`w-20 h-20 ${isBomb ? 'bg-red-500' : 'bg-slate-900'} rounded-full flex items-center justify-center text-4xl font-extrabold ${isBomb ? 'text-white' : 'text-amber-400'} border-4 ${isBomb ? 'border-red-300 animate-pulse-strong' : 'border-slate-700'}`}>
                                        {num}
                                    </div>
                                )) : (
                                     <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center text-5xl font-extrabold text-amber-400 border-4 border-slate-700">
                                        {'-'}
                                    </div>
                                )}
                            </div>
                       </div>
                       <div>
                            <p className="text-sm text-slate-300 text-center mb-1">Total Sacados</p>
                            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center text-5xl font-extrabold text-cyan-400 border-4 border-slate-700">
                                {calledNumbers.size}
                            </div>
                       </div>
                   </div>
                   {aiCallerMessage && (
                        <div className="mt-2 text-center bg-slate-700/50 p-3 rounded-lg w-full">
                            <p className={`text-sm ${isBomb ? 'text-red-400' : 'text-fuchsia-400'} font-semibold`}>{isBomb ? '¡BOLA LOCA!' : 'El Cantador Loco dice:'}</p>
                            <p className="text-lg font-medium text-white animate-pop">"{aiCallerMessage}"</p>
                        </div>
                    )}
                </div>
            )}
            
            <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {player.cards.map(cardData => (
                    <PlayerCard 
                        key={cardData.id}
                        cardData={cardData}
                        calledNumbers={calledNumbers}
                        isWinner={myWin?.winningCardId === cardData.id}
                        dauber={player.dauber}
                    />
                ))}
            </main>
        </div>
    );
};


const App: React.FC = () => {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isPlayerView, setIsPlayerView] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('bingo-loco-admin') === 'true');
  
  // UI and Session State
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [currentWinnerForModal, setCurrentWinnerForModal] = useState<Winner | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [countdownDuration, setCountdownDuration] = useState(1);
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);

  // Core Game State managed by our new custom hook!
  const gameState = useGameState();
  const {
      gamePhase,
      players,
      prizes,
      winners,
      cardPool,
      assignedCardIds,
      calledNumbers,
      lastDrawnNumbers,
      aiCallerMessage,
      specialNumbers,
      settings,
      cardPoolSize,
      setCardPoolSize,
      cardPrice,
      setCardPrice,
      prizeDistribution,
      updatePrizeDistribution,
      updateSettings,
      totalRevenue,
      houseCut,
      generatePool,
      addPlayer,
      confirmPayment,
      cancelOrder,
      startGame,
      drawNumber,
      resetGame,
      isLoading,
      currentTime
  } = gameState;

  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);

  const ADMIN_PASSWORD = 'loco'; // Our secret password
  const BINGO_NUMBERS = Array.from({ length: 75 }, (_, i) => i + 1);

  // Sync game settings to local state and document title
  useEffect(() => {
    if (settings) {
        setLocalSettings(settings);
        document.title = settings.bingoName;
    }
  }, [settings]);

  // Determine if we should show player view based on URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('join')) {
      setIsPlayerView(true);
    }
  }, []);
  
  // Pre-game countdown logic
  useEffect(() => {
    if (countdownRemaining === null) return;
    if (countdownRemaining <= 0) {
      startGame();
      setCountdownRemaining(null);
      return;
    }
    const interval = setInterval(() => {
      setCountdownRemaining(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdownRemaining, startGame]);

  const handleSettingsChange = (field: keyof AppSettings, value: string) => {
    if (localSettings) {
        setLocalSettings(prev => ({...prev!, [field]: value}));
    }
  };

  const handleSaveSettings = () => {
    if (localSettings) {
        updateSettings(localSettings);
        alert('¡Configuración guardada!');
    }
  };


  const handleLogin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('bingo-loco-admin', 'true');
        setIsAuthenticated(true);
        return true;
    }
    return false;
  };
  
  const handleStartGame = () => {
    const confirmedPlayers = players.filter(p => p.status === PlayerStatus.CONFIRMED);
    if (confirmedPlayers.length > 0) {
        startGame();
        setCountdownRemaining(null); // Ensure countdown is stopped
    } else {
        alert("Confirma al menos un jugador para comenzar.");
    }
  };

  const openCardSelectorModal = () => {
      if (!newPlayerName.trim()) {
          alert("Por favor, introduce un nombre para el jugador.");
          return;
      }
      setModalTitle(`Seleccionar Cartola(s) para ${newPlayerName}`);
      setIsSetupModalOpen(true);
  };

  const handleConfirmAddPlayer = async (selectedCards: PlayerCardData[]) => {
    try {
      await addPlayer(newPlayerName, selectedCards);
      setNewPlayerName('');
      setIsSetupModalOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Ocurrió un error inesperado al añadir el jugador.');
      }
    }
  };

  const handleCopyJoinLink = () => {
    const joinUrl = `${window.location.origin}${window.location.pathname}?join`;
    navigator.clipboard.writeText(joinUrl).then(() => {
      alert('¡Enlace para jugadores copiado al portapapeles!');
    }, (err) => {
      console.error('No se pudo copiar el enlace: ', err);
      alert('Error al copiar el enlace.');
    });
  };

  const handleStartCountdown = () => {
    if (countdownDuration > 0) {
      setCountdownRemaining(countdownDuration * 60);
    }
  };

  const handleStopCountdown = () => {
    setCountdownRemaining(null);
  };
  
  const handleDrawNumber = async () => {
    const winner = await drawNumber();
    if (winner) {
      setCurrentWinnerForModal(winner);
      setIsWinnerModalOpen(true);
    }
  };

  const handleCloseWinnerModal = () => {
      setIsWinnerModalOpen(false);
      if (winners.length >= prizes.length && gamePhase !== GamePhase.SETUP) {
          // This logic is now handled inside useGameState's drawNumber
      }
  };

  const handleResetGame = () => {
      resetGame();
      setCountdownRemaining(null);
  };

  const handleGeneratePool = () => {
    if (players.length > 0) {
        if (!confirm('Esto reiniciará a los jugadores y sus cartolas seleccionadas. ¿Estás seguro?')) {
            return;
        }
    }
    generatePool();
  };
  
  const renderSetupPhase = () => {
    const pendingPlayers = players.filter(p => p.status === PlayerStatus.PENDING);
    const confirmedPlayers = players.filter(p => p.status === PlayerStatus.CONFIRMED);
    const totalDistribution = prizeDistribution.first + prizeDistribution.second + prizeDistribution.third + prizeDistribution.house;

    return (
        <div className="space-y-8">
            {countdownRemaining !== null && (
                <div className="bg-slate-800 p-6 rounded-xl border-2 border-fuchsia-500/50 text-center animate-pop">
                    <h2 className="text-2xl text-slate-400 mb-4">El juego comienza en...</h2>
                    <CountdownTimer remainingSeconds={countdownRemaining} />
                    <button onClick={handleStopCountdown} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        Detener Temporizador
                    </button>
                </div>
            )}
            
            {localSettings && (
                <div>
                    <h2 className="text-2xl font-bold text-cyan-400 mb-4">Personalización</h2>
                    <div className="bg-slate-800 p-4 rounded-lg space-y-4">
                        <div>
                            <label className="block text-fuchsia-400 font-semibold mb-2">Nombre del Bingo</label>
                            <input
                                type="text"
                                value={localSettings.bingoName}
                                onChange={e => handleSettingsChange('bingoName', e.target.value)}
                                className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600"
                            />
                        </div>
                         <div>
                            <label className="block text-fuchsia-400 font-semibold mb-2">URL del Logo (Opcional)</label>
                            <input
                                type="text"
                                placeholder="https://ejemplo.com/logo.png"
                                value={localSettings.logoUrl}
                                onChange={e => handleSettingsChange('logoUrl', e.target.value)}
                                className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600"
                            />
                        </div>
                         <div>
                            <label className="block text-fuchsia-400 font-semibold mb-2">Número de WhatsApp para Pedidos</label>
                            <input
                                type="text"
                                placeholder="Ej: 59170012345 (con código de país)"
                                value={localSettings.adminPhoneNumber}
                                onChange={e => handleSettingsChange('adminPhoneNumber', e.target.value)}
                                className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600"
                            />
                        </div>
                         <div>
                            <label className="block text-fuchsia-400 font-semibold mb-2">Nombre del Desarrollador/Compañía</label>
                            <input
                                type="text"
                                value={localSettings.developerName}
                                onChange={e => handleSettingsChange('developerName', e.target.value)}
                                className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600"
                            />
                        </div>
                        <div className="text-right">
                            <button onClick={handleSaveSettings} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">Configuración del Juego</h2>
                <div className="bg-slate-800 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-fuchsia-400 font-semibold mb-2">Número de Cartolas</label>
                        <input
                            type="number"
                            value={cardPoolSize}
                            onChange={e => setCardPoolSize(Number(e.target.value))}
                            className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600"
                        />
                    </div>
                    <div>
                         <label className="block text-fuchsia-400 font-semibold mb-2">Precio por Cartola ($)</label>
                        <input
                            type="number"
                            value={cardPrice}
                            onChange={e => setCardPrice(Number(e.target.value))}
                            className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600"
                        />
                    </div>
                    <button onClick={handleGeneratePool} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors w-full">
                        Generar Cartolas
                    </button>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">Distribución de Premios</h2>
                <div className="bg-slate-800 p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {Object.entries({third: '3er Premio', second: '2do Premio', first: '1er Premio', house: 'La Casa'}).map(([key, label]) => (
                            <div key={key}>
                                <label className="block text-fuchsia-400 font-semibold mb-2">{label} (%)</label>
                                <input
                                    type="number"
                                    value={prizeDistribution[key as keyof typeof prizeDistribution]}
                                    onChange={e => updatePrizeDistribution(key as keyof typeof prizeDistribution, e.target.value)}
                                    className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600"
                                />
                            </div>
                        ))}
                    </div>
                    {totalDistribution !== 100 && (
                        <p className="text-center text-amber-400 font-semibold mb-4 animate-pulse">¡Cuidado! El total de la distribución es {totalDistribution}%, no 100%.</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 bg-slate-900/50 p-4 rounded-lg text-center gap-4">
                        <div>
                            <p className="text-sm text-slate-400">Ingresos Totales (Confirmados)</p>
                            <p className="text-2xl font-bold text-emerald-400">${totalRevenue.toFixed(2)}</p>
                        </div>
                         <div>
                            <p className="text-sm text-slate-400">Nuestra Ganancia (La Casa)</p>
                            <p className="text-2xl font-bold text-cyan-400">${houseCut.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-center">
                        {prizes.sort((a, b) => a.id - b.id).map(prize => (
                             <div key={prize.id} className="bg-slate-700 p-2 rounded-md">
                                <p className="text-sm font-semibold text-fuchsia-400">{prize.name} ({patternToFriendlyText(prize.pattern)})</p>
                                <p className="text-lg font-bold text-white">${prize.amount}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {countdownRemaining === null && (
                <div>
                    <h2 className="text-2xl font-bold text-cyan-400 mb-4">¡Crea Anticipación!</h2>
                    <div className="bg-slate-800 p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4">
                        <label htmlFor="countdown-minutes" className="font-semibold text-slate-300">Temporizador (minutos):</label>
                        <input
                            id="countdown-minutes"
                            type="number"
                            min="1"
                            value={countdownDuration}
                            onChange={e => setCountdownDuration(Number(e.target.value))}
                            className="w-24 bg-slate-700 text-white p-2 rounded-md border border-slate-600"
                        />
                        <button onClick={handleStartCountdown} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                            Iniciar Temporizador
                        </button>
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">Añadir Jugadores</h2>
                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <input
                    type="text"
                    value={newPlayerName}
                    onChange={e => setNewPlayerName(e.target.value)}
                    placeholder="Nombre del jugador (de WhatsApp)"
                    className="flex-grow bg-slate-700 text-white p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                <button onClick={openCardSelectorModal} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                    Añadir y Asignar Cartolas
                </button>
                </div>
            </div>

            {pendingPlayers.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-amber-400 mb-4">Órdenes Pendientes</h2>
                    <div className="space-y-3">
                        {pendingPlayers.map(p => {
                            const remainingTime = p.reservationExpiry ? Math.max(0, Math.round((p.reservationExpiry - currentTime) / 1000)) : 0;
                            const minutes = Math.floor(remainingTime / 60).toString().padStart(2, '0');
                            const seconds = (remainingTime % 60).toString().padStart(2, '0');
                            const totalToPay = p.cards.length * cardPrice;

                            return (
                                <div key={p.id} className="bg-slate-800 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-3">
                                            <p className="font-bold text-lg text-white">{dauberSymbols[p.dauber]} {p.name}</p>
                                            <div className="font-mono text-lg bg-slate-700 text-amber-400 px-2 py-1 rounded-md">
                                                {minutes}:{seconds}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-400">Cartolas: {p.cards.map(c => c.id).join(', ')}</p>
                                        <p className="text-sm font-semibold text-amber-400">Total a Pagar: ${totalToPay.toFixed(2)}</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                        <button onClick={() => {
                                            const text = `¡Hola ${p.name}! Te escribo para confirmar tu pedido de ${p.cards.length} cartola(s) de Bingo Loco (${p.cards.map(c => c.id).join(', ')}). El total es $${totalToPay.toFixed(2)}. Por favor, realiza el pago para asegurar tu lugar.`;
                                            window.open(`https://wa.me/${settings.adminPhoneNumber}?text=${encodeURIComponent(text)}`, '_blank');
                                        }} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors">
                                            Recordar Pago
                                        </button>
                                        <button onClick={() => confirmPayment(p.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors">
                                            Confirmar Pago
                                        </button>
                                        <button onClick={() => cancelOrder(p)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors">
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {confirmedPlayers.length > 0 && (
                 <div>
                    <h2 className="text-2xl font-bold text-green-400 mb-4">Jugadores Confirmados</h2>
                     <div className="bg-slate-800 p-3 rounded-lg mb-4">
                          <button
                                onClick={handleCopyJoinLink}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                            >
                                Copiar Enlace del Juego para Jugadores
                            </button>
                            <p className="text-center text-slate-400 text-sm mt-2">Envía este único enlace a todos tus jugadores confirmados.</p>
                     </div>
                    <div className="space-y-3">
                        {confirmedPlayers.map(p => (
                        <div key={p.id} className="bg-slate-800 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold text-lg text-white">{dauberSymbols[p.dauber]} {p.name}</p>
                                <p className="text-sm text-slate-400">Cartolas: {p.cards.map(c => c.id).join(', ')}</p>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="text-center pt-4">
                <button onClick={handleStartGame} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-2xl py-4 px-10 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" disabled={confirmedPlayers.length === 0}>
                    {countdownRemaining !== null ? '¡Empezar Ahora!' : '¡Comenzar Juego!'}
                </button>
            </div>
        </div>
    );
  };

  const renderPlayingPhase = () => {
    const confirmedPlayers = players.filter(p => p.status === PlayerStatus.CONFIRMED);
    const currentPrize = prizes.find(p => !winners.some(w => w.prize.id === p.id));
    const isBomb = lastDrawnNumbers.length > 1;

    return (
        <div className="space-y-6">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col xl:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 flex-shrink-0">
                    <button onClick={handleDrawNumber} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 px-6 rounded-lg text-lg w-full md:w-auto disabled:opacity-50 disabled:cursor-wait" disabled={winners.length >= prizes.length || isLoading}>
                        {isLoading ? 'Pensando...' : 'Sacar Número'}
                    </button>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-slate-400 hidden sm:inline">{isBomb ? '¡Bomba!' : 'Último:'}</span>
                         <div className="flex justify-center items-center gap-2">
                            {lastDrawnNumbers.length > 0 ? lastDrawnNumbers.map(num => (
                                 <div key={num} className={`w-20 h-20 ${isBomb ? 'bg-red-500' : 'bg-slate-900'} rounded-full flex items-center justify-center text-4xl font-extrabold ${isBomb ? 'text-white' : 'text-amber-400'} border-4 ${isBomb ? 'border-red-300 animate-pulse-strong' : 'border-slate-700'}`}>
                                    {num}
                                </div>
                            )) : (
                                 <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center text-5xl font-extrabold text-amber-400 border-4 border-slate-700">
                                    {'-'}
                                </div>
                            )}
                        </div>
                        {aiCallerMessage && (
                            <div className={`text-center animate-pop ${isBomb ? 'text-red-400' : 'text-white'}`}>
                                <p className="text-md font-medium">"{aiCallerMessage}"</p>
                            </div>
                        )}
                    </div>
                </div>
                 {currentPrize && (
                    <div className="text-center bg-slate-900/50 p-3 rounded-lg flex-grow">
                        <p className="text-md text-slate-300">Ahora jugando por:</p>
                        <p className="text-2xl font-bold text-amber-400 animate-pulse-strong">
                            {currentPrize.name} ({patternToFriendlyText(currentPrize.pattern)})
                        </p>
                    </div>
                 )}
                <div className="bg-slate-900/50 p-3 rounded-lg w-full xl:max-w-md">
                    <h3 className="text-sm font-bold text-cyan-400 mb-2 text-center">Números Sacados ({calledNumbers.size})</h3>
                    <div className="flex flex-wrap gap-1 justify-center max-h-24 overflow-y-auto">
                        {BINGO_NUMBERS.map(n => {
                            const isCalled = calledNumbers.has(n);
                            const isBombNumber = specialNumbers?.bomb.has(n);
                            return (
                                <div key={n} className={`relative w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${isCalled ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                                    {isBombNumber && !isCalled && <span className="absolute text-red-500 text-2xl top-[-10px] left-1/2 -translate-x-1/2">💣</span>}
                                    {n}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    {confirmedPlayers.map(player => (
                        <div key={player.id}>
                        <h3 className="text-2xl font-bold text-cyan-400 mb-3 ml-2">{dauberSymbols[player.dauber]} {player.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {player.cards.map(cardData => (
                                    <PlayerCard
                                        key={cardData.id}
                                        cardData={cardData}
                                        calledNumbers={calledNumbers}
                                        isWinner={winners.some(w => w.winningCardId === cardData.id)}
                                        dauber={player.dauber}
                                    />
                                ))}
                        </div>
                        </div>
                    ))}
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 sticky top-6">
                        <h3 className="text-xl font-bold text-cyan-400 mb-3">Ganadores</h3>
                        <ul className="space-y-3">
                            {prizes.sort((a,b) => b.id - a.id).map(prize => {
                                const winner = winners.find(w => w.prize.id === prize.id);
                                return (
                                    <li key={prize.id} className="bg-slate-700 p-3 rounded-lg">
                                        <div className="font-bold text-fuchsia-400">{prize.name} ({patternToFriendlyText(prize.pattern)})</div>
                                        <div className="text-lg text-white">{winner ? `🏆 ${winner.player.name}` : '...'}</div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  const renderGameOverPhase = () => (
    <div className="text-center space-y-8 bg-slate-800 p-8 rounded-xl animate-pop">
        <h2 className="text-5xl font-extrabold text-amber-400">¡Juego Terminado!</h2>
        <div className="space-y-4">
             {winners.map(winner => (
                <div key={winner.prize.id} className="text-xl">
                    <span className="font-semibold text-fuchsia-400">{winner.prize.name} ({patternToFriendlyText(winner.prize.pattern)}): </span>
                    <span className="font-bold text-2xl text-white">{winner.player.name}</span>
                    <span className="text-slate-300"> (${winner.prize.amount})</span>
                </div>
             ))}
        </div>
        <button onClick={handleResetGame} className="bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-2xl py-4 px-10 rounded-lg transition-transform transform hover:scale-105">
            Volver a comenzar el Bingo
        </button>
    </div>
  );

  // --- Main Router Logic ---
  const params = new URLSearchParams(window.location.search);
  const isAdminRoute = params.has('admin');

  if (!settings) {
    return (
        <div className="min-h-screen flex justify-center items-center">
             <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-cyan-500"></div>
        </div>
    );
  }

  if (isPlayerView) {
    if (!currentPlayer) {
      return <PlayerLoginView onLoginSuccess={setCurrentPlayer} settings={settings}/>;
    }
    return <div className="flex flex-col min-h-screen">
        <RemotePlayerView initialPlayer={currentPlayer} initialCardPrice={cardPrice} />
        <AppFooter settings={settings} />
    </div>;
  }
  
  if (isAdminRoute) {
    if (!isAuthenticated) {
      return <LoginScreen onLogin={handleLogin} settings={settings} />;
    }
    // Render Admin Panel
    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8 flex flex-col">
            {isLoading && (
                <div className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-50">
                    <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-cyan-500"></div>
                </div>
            )}
            <Modal isOpen={isSetupModalOpen} onClose={() => setIsSetupModalOpen(false)} title={modalTitle}>
                <CardSelector cardPool={cardPool} assignedCardIds={assignedCardIds} onConfirm={handleConfirmAddPlayer} />
            </Modal>
            <WinnerModal 
                isOpen={isWinnerModalOpen}
                onClose={handleCloseWinnerModal}
                winner={currentWinnerForModal}
                isFinalWinner={winners.length >= prizes.length}
            />
            <header className="text-center mb-8">
                {settings.logoUrl && <img src={settings.logoUrl} alt="Bingo Logo" className="mx-auto h-20 w-auto mb-4"/>}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400">{settings.bingoName}</span>
                <span className="block text-2xl text-slate-400 mt-2">Panel de Administrador</span>
                </h1>
            </header>
            <main className="flex-grow">
                {gamePhase === GamePhase.SETUP && renderSetupPhase()}
                {gamePhase === GamePhase.PLAYING && renderPlayingPhase()}
                {gamePhase === GamePhase.GAME_OVER && renderGameOverPhase()}
            </main>
            <AppFooter settings={settings} />
        </div>
    );
  }

  // Default to Storefront View
  return (
    <div className="flex flex-col min-h-screen">
        <StorefrontView cardPool={cardPool} cardPrice={cardPrice} adminPhoneNumber={settings.adminPhoneNumber} settings={settings} />
        <AppFooter settings={settings} />
    </div>
  );
};

export default App;