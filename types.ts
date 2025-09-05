

export type CardNumber = number | 'FREE';
export type BingoCard = CardNumber[][];

export interface PlayerCardData {
  id: string; // e.g., 'BL-001'
  card: BingoCard;
}

export enum PlayerStatus {
  PENDING,
  CONFIRMED,
}

export type Dauber = 'star' | 'flame' | 'diamond' | 'clover';

export interface Player {
  id: string;
  name: string;
  cards: PlayerCardData[];
  status: PlayerStatus;
  dauber: Dauber;
  reservationExpiry?: number; // Timestamp for when a pending order expires
}

export enum BingoPattern {
  ANY_LINE = 'ANY_LINE',
  FOUR_CORNERS = 'FOUR_CORNERS',
  FULL_CARD = 'FULL_CARD',
}

export interface Prize {
  id: number;
  name: string;
  amount: string; 
  pattern: BingoPattern;
}

export interface Winner {
  prize: Prize;
  player: Player;
  winningCardId: string;
}

export enum GamePhase {
  SETUP,
  PLAYING,
  GAME_OVER,
}

export interface SpecialNumbers {
    bomb: Set<number>;
}

export interface AppSettings {
  bingoName: string;
  logoUrl: string;
  developerName: string;
  adminPhoneNumber: string;
}

// Data exposed to the remote player's view
export interface PublicGameState {
    gamePhase: GamePhase;
    calledNumbers: Set<number>;
    lastDrawnNumbers: number[];
    winners: Winner[];
    prizes: Prize[];
    aiCallerMessage: string | null;
    specialNumbers: SpecialNumbers; // Players can see which numbers were special after they're called
    settings: AppSettings;
}