

import { useState, useCallback, useEffect, useMemo } from 'react';
import * as api from '../services/mockApi';
import { GamePhase, Player, Prize, Winner, PlayerCardData, PlayerStatus, AppSettings } from '../types';

export const useGameState = () => {
  const [state, setState] = useState(api.getInitialState());
  const [isLoading, setIsLoading] = useState(true);

  const syncState = useCallback(async () => {
    setIsLoading(true);
    try {
        const freshState = await api.getGameState();
        setState(freshState);
    } catch (error) {
        console.error("Failed to sync state:", error);
        // Handle error appropriately, maybe show a toast notification
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncState();
    
    // Set up a poller to keep the reservation times updated for pending players
    const interval = setInterval(() => {
        if (state.players.some(p => p.status === PlayerStatus.PENDING)) {
            setState(currentState => ({ ...currentState, currentTime: Date.now() }));
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [syncState, state.players]);

  const generatePool = useCallback(async () => {
    await api.generatePool();
    syncState();
  }, [syncState]);
  
  const addPlayer = useCallback(async (playerName: string, selectedCards: PlayerCardData[]) => {
    await api.addPlayer(playerName, selectedCards);
    syncState();
  }, [syncState]);
  
  const confirmPayment = useCallback(async (playerId: string) => {
    await api.confirmPayment(playerId);
    syncState();
  }, [syncState]);

  const cancelOrder = useCallback(async (player: Player) => {
    await api.cancelOrder(player);
    syncState();
  }, [syncState]);

  const startGame = useCallback(async () => {
    await api.startGame();
    syncState();
  }, [syncState]);

  const drawNumber = useCallback(async (): Promise<Winner | null> => {
    setIsLoading(true);
    try {
      const result = await api.drawNumber();
      syncState(); // Sync state after the draw
      return result.winner;
    } catch(error) {
        console.error("Error drawing number:", error);
        syncState(); // Still sync state on error
        return null;
    }
    // setIsLoading is handled by syncState
  }, [syncState]);

  const resetGame = useCallback(async () => {
    await api.resetGame();
    syncState();
  }, [syncState]);
  
  const setCardPoolSize = useCallback(async (size: number) => {
      await api.setCardPoolSize(size);
      syncState();
  }, [syncState]);
  
  const setCardPrice = useCallback(async (price: number) => {
      await api.setCardPrice(price);
      syncState();
  }, [syncState]);
      
  const updatePrizeDistribution = useCallback(async (prize: 'first' | 'second' | 'third' | 'house', value: string) => {
    const percentage = parseInt(value, 10);
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
        await api.updatePrizeDistribution(prize, percentage);
        syncState();
    }
  }, [syncState]);
  
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    await api.updateSettings(newSettings);
    syncState();
  }, [syncState]);


  return {
    ...state,
    isLoading,
    setCardPoolSize,
    setCardPrice,
    updatePrizeDistribution,
    updateSettings,
    generatePool,
    addPlayer,
    confirmPayment,
    cancelOrder,
    startGame,
    drawNumber,
    resetGame,
  };
};