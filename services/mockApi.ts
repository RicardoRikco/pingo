

import { GamePhase, Player, Prize, Winner, PlayerCardData, PlayerStatus, PublicGameState, BingoPattern, Dauber, SpecialNumbers, AppSettings } from '../types';
import { checkWin, generateCardPool as generateBingoCardPool } from './bingoService';

const BINGO_NUMBERS = Array.from({ length: 75 }, (_, i) => i + 1);
const RESERVATION_MINUTES = 2;
const NUMBER_BOMB_COUNT = 3; // How many numbers a "Bomba Loca" reveals in total

const initialPrizes: Prize[] = [
  { id: 3, name: 'Tercer Premio', amount: '0.00', pattern: BingoPattern.FOUR_CORNERS },
  { id: 2, name: 'Segundo Premio', amount: '0.00', pattern: BingoPattern.ANY_LINE },
  { id: 1, name: 'Primer Premio', amount: '0.00', pattern: BingoPattern.FULL_CARD },
];

interface GameState {
  gamePhase: GamePhase;
  prizes: Prize[];
  players: Player[];
  winners: Winner[];
  cardPool: PlayerCardData[];
  assignedCardIds: Set<string>;
  cardPoolSize: number;
  cardPrice: number;
  prizeDistribution: { first: number; second: number; third: number; house: number };
  calledNumbers: Set<number>;
  lastDrawnNumbers: number[];
  aiCallerMessage: string | null;
  totalRevenue: number;
  houseCut: number;
  currentTime: number;
  specialNumbers: SpecialNumbers;
  settings: AppSettings;
}

// In-memory "database"
let state: GameState = {
  gamePhase: GamePhase.SETUP,
  prizes: [...initialPrizes].sort((a,b) => a.id - b.id), // Ensure sorted by ID
  players: [],
  winners: [],
  cardPool: [],
  assignedCardIds: new Set(),
  cardPoolSize: 50,
  cardPrice: 2,
  prizeDistribution: { first: 50, second: 20, third: 10, house: 20 },
  calledNumbers: new Set(),
  lastDrawnNumbers: [],
  aiCallerMessage: null,
  totalRevenue: 0,
  houseCut: 0,
  currentTime: Date.now(),
  specialNumbers: { bomb: new Set() },
  settings: {
    bingoName: 'Bingo Loco',
    logoUrl: '',
    developerName: 'Un Genio Anónimo',
    adminPhoneNumber: '59100000000',
  },
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Internal Logic ---

const updateRevenueAndPrizes = () => {
    const confirmedPlayers = state.players.filter(p => p.status === PlayerStatus.CONFIRMED);
    const totalCardsSold = confirmedPlayers.reduce((sum, player) => sum + player.cards.length, 0);
    const revenue = totalCardsSold * state.cardPrice;
    const cut = revenue * (state.prizeDistribution.house / 100);
    
    state.totalRevenue = revenue;
    state.houseCut = cut;

    // We keep the patterns, but update amounts
    const prizeMap = {
        1: state.prizeDistribution.first,
        2: state.prizeDistribution.second,
        3: state.prizeDistribution.third,
    };

    state.prizes.forEach(prize => {
        const percentage = prizeMap[prize.id as keyof typeof prizeMap] || 0;
        prize.amount = (revenue * (percentage / 100)).toFixed(2);
    });
};

const checkAndExpireOrders = () => {
    const now = Date.now();
    const expiredPlayers = state.players.filter(p => 
      p.status === PlayerStatus.PENDING && p.reservationExpiry && p.reservationExpiry < now
    );
    if (expiredPlayers.length > 0) {
      expiredPlayers.forEach(p => {
        const cardIdsToRelease = p.cards.map(c => c.id);
        cardIdsToRelease.forEach(id => state.assignedCardIds.delete(id));
      });
      state.players = state.players.filter(p => !expiredPlayers.some(exp => exp.id === p.id));
    }
    state.currentTime = now;
};


// --- API Endpoints ---

export const getInitialState = (): GameState => {
    // Generate initial pool on first load
    if (state.cardPool.length === 0) {
        state.cardPool = generateBingoCardPool(state.cardPoolSize);
    }
    return JSON.parse(JSON.stringify({...state, assignedCardIds: Array.from(state.assignedCardIds), calledNumbers: Array.from(state.calledNumbers), specialNumbers: { bomb: Array.from(state.specialNumbers.bomb) } }));
};

export const getGameState = async (): Promise<GameState> => {
    await sleep(50);
    checkAndExpireOrders();
    updateRevenueAndPrizes();
    
    // Convert Sets to Arrays for serialization, similar to a real API response
    const serializableState = {
        ...state,
        assignedCardIds: new Set(state.assignedCardIds),
        calledNumbers: new Set(state.calledNumbers),
        specialNumbers: { bomb: new Set(state.specialNumbers.bomb) },
    };
    return Promise.resolve(serializableState);
};

export const getPublicGameState = async (): Promise<PublicGameState> => {
    await sleep(50);
     return Promise.resolve({
        gamePhase: state.gamePhase,
        calledNumbers: new Set(state.calledNumbers),
        lastDrawnNumbers: state.lastDrawnNumbers,
        winners: state.winners,
        prizes: state.prizes,
        aiCallerMessage: state.aiCallerMessage,
        specialNumbers: { bomb: new Set(state.specialNumbers.bomb) },
        settings: state.settings,
    });
};

export const findPlayerByName = async (name: string): Promise<Player | null> => {
    await sleep(150);
    checkAndExpireOrders();
    const foundPlayer = state.players.find(p => p.name.trim().toLowerCase() === name.trim().toLowerCase());
    // Return a copy to simulate API call and prevent direct state mutation
    return Promise.resolve(foundPlayer ? JSON.parse(JSON.stringify(foundPlayer)) : null);
};

export const changePlayerDauber = async (playerId: string, dauber: Dauber): Promise<void> => {
    await sleep(50);
    const player = state.players.find(p => p.id === playerId);
    if (player) {
        player.dauber = dauber;
    }
    return Promise.resolve();
};

export const setCardPoolSize = async (size: number) => {
    await sleep(20);
    state.cardPoolSize = size;
    return Promise.resolve();
};

export const setCardPrice = async (price: number) => {
    await sleep(20);
    state.cardPrice = price;
    return Promise.resolve();
};

export const updatePrizeDistribution = async (prize: 'first' | 'second' | 'third' | 'house', percentage: number) => {
    await sleep(20);
    state.prizeDistribution[prize] = percentage;
    return Promise.resolve();
};

export const updateSettings = async (newSettings: Partial<AppSettings>): Promise<void> => {
    await sleep(100);
    state.settings = { ...state.settings, ...newSettings };
    return Promise.resolve();
};

export const generatePool = async () => {
    await sleep(500); // Simulating heavier work
    state.players = [];
    state.assignedCardIds = new Set();
    state.cardPool = generateBingoCardPool(state.cardPoolSize);
    updateRevenueAndPrizes();
    return Promise.resolve();
};

export const addPlayer = async (playerName: string, selectedCards: PlayerCardData[]) => {
    await sleep(100);

    const existingPlayer = state.players.find(p => p.name.trim().toLowerCase() === playerName.trim().toLowerCase());
    if (existingPlayer) {
        throw new Error('Ya existe un jugador con este nombre. Por favor, elige otro (ej: Victor 2).');
    }

    const newPlayer: Player = {
      id: `${new Date().getTime()}-${playerName}`,
      name: playerName.trim(),
      cards: selectedCards,
      status: PlayerStatus.PENDING,
      dauber: 'star',
      reservationExpiry: Date.now() + RESERVATION_MINUTES * 60 * 1000,
    };
    state.players.push(newPlayer);
    selectedCards.forEach(c => state.assignedCardIds.add(c.id));
    return Promise.resolve(newPlayer);
};

export const confirmPayment = async (playerId: string) => {
    await sleep(100);
    const player = state.players.find(p => p.id === playerId);
    if (player) {
        player.status = PlayerStatus.CONFIRMED;
        player.reservationExpiry = undefined;
    }
    return Promise.resolve();
};

export const cancelOrder = async (playerToCancel: Player) => {
    await sleep(100);
    const cardIdsToRelease = playerToCancel.cards.map(c => c.id);
    state.players = state.players.filter(p => p.id !== playerToCancel.id);
    cardIdsToRelease.forEach(id => state.assignedCardIds.delete(id));
    return Promise.resolve();
};

export const startGame = async () => {
    await sleep(50);
    // Re-sort prizes from 3rd to 1st for gameplay order
    state.prizes.sort((a,b) => b.id - a.id);
    
    // Secretly select the "Bolas Locas"
    const shuffledNumbers = [...BINGO_NUMBERS].sort(() => 0.5 - Math.random());
    state.specialNumbers.bomb = new Set(shuffledNumbers.slice(0, 3)); // Select 3 bomb numbers

    state.gamePhase = GamePhase.PLAYING;
    return Promise.resolve();
};

export const drawNumber = async (): Promise<{ winner: Winner | null }> => {
    // Don't sleep here, let the API call be the delay
    const availableNumbers = BINGO_NUMBERS.filter(n => !state.calledNumbers.has(n));
    if (availableNumbers.length === 0 || state.winners.length >= state.prizes.length) {
        return Promise.resolve({ winner: null });
    }

    const drawnNumbers: number[] = [];
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const firstNumber = availableNumbers[randomIndex];
    drawnNumbers.push(firstNumber);

    const isBomb = state.specialNumbers.bomb.has(firstNumber);

    if (isBomb) {
        // It's a BOLA LOCA! Draw more numbers.
        const remainingAvailable = availableNumbers.filter(n => n !== firstNumber);
        const shuffled = remainingAvailable.sort(() => 0.5 - Math.random());
        const extraNumbers = shuffled.slice(0, NUMBER_BOMB_COUNT - 1);
        drawnNumbers.push(...extraNumbers);
    }
    
    state.lastDrawnNumbers = drawnNumbers;
    drawnNumbers.forEach(n => state.calledNumbers.add(n));
    
    // Get AI phrase in parallel by calling our secure serverless function
    const aiPhrasePromise = isBomb 
      ? Promise.resolve("¡BOMBA DE NÚMEROS!") 
      : fetch('/api/generate-phrase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: firstNumber })
        })
        .then(res => res.json())
        .then(data => data.phrase || `¡Salió el ${firstNumber}!`) // Fallback in case of fetch error
        .catch(err => {
            console.error("Error fetching AI phrase:", err);
            return `¡Salió el ${firstNumber}!`; // Fallback
        });

    const confirmedPlayers = state.players.filter(p => p.status === PlayerStatus.CONFIRMED);
    
    let newWinnerFound: Winner | null = null;
    
    // The prize we are currently playing for is the first one in the sorted list that isn't won yet.
    const currentPrize = state.prizes.find(p => !state.winners.some(w => w.prize.id === p.id));
    if (!currentPrize) {
        // Should not happen if we check winners.length vs prizes.length
        return Promise.resolve({ winner: null });
    }

    for (const player of confirmedPlayers) {
        for (const cardData of player.cards) {
            if (checkWin(cardData.card, state.calledNumbers, currentPrize.pattern)) {
                // Check if this player already won this specific prize (for cases where multiple players win on the same number)
                const alreadyWonThisPrize = state.winners.some(w => w.prize.id === currentPrize.id && w.player.id === player.id);
                if (!alreadyWonThisPrize) {
                     newWinnerFound = { 
                        prize: currentPrize, 
                        player,
                        winningCardId: cardData.id 
                    };
                    state.winners.push(newWinnerFound); // Push immediately to handle multiple winners on same draw
                }
            }
        }
    }

    if (state.winners.length >= state.prizes.length) {
      state.gamePhase = GamePhase.GAME_OVER;
    }
    
    // Wait for the AI phrase and update state
    state.aiCallerMessage = await aiPhrasePromise;
    
    // Return the first winner found in this draw cycle for the modal
    return Promise.resolve({ winner: newWinnerFound });
};


export const resetGame = async () => {
    await sleep(500);
    state.gamePhase = GamePhase.SETUP;
    state.players = [];
    state.winners = [];
    state.calledNumbers = new Set();
    state.lastDrawnNumbers = [];
    state.aiCallerMessage = null;
    state.assignedCardIds = new Set();
    state.cardPool = generateBingoCardPool(state.cardPoolSize);
    state.specialNumbers = { bomb: new Set() };
    // Reset and sort prizes back to default setup order
    state.prizes = [...initialPrizes].sort((a,b) => a.id - b.id);
    updateRevenueAndPrizes();
    return Promise.resolve();
};