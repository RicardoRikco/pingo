
// FIX: Import `PlayerCardData` to resolve type errors in `generateCardPool`.
import { BingoCard, CardNumber, BingoPattern, PlayerCardData } from '../types';

const BINGO_RANGES: { [key: number]: { min: number; max: number } } = {
  0: { min: 1, max: 15 },  // B
  1: { min: 16, max: 30 }, // I
  2: { min: 31, max: 45 }, // N
  3: { min: 46, max: 60 }, // G
  4: { min: 61, max: 75 }, // O
};

const getRandomNumbersInRange = (min: number, max: number, count: number): number[] => {
  const numbers = new Set<number>();
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(numbers);
};

export const generateBingoCard = (): BingoCard => {
  const card: BingoCard = Array(5).fill(null).map(() => Array(5).fill(0));
  for (let col = 0; col < 5; col++) {
    const { min, max } = BINGO_RANGES[col];
    const numbers = getRandomNumbersInRange(min, max, 5);
    for (let row = 0; row < 5; row++) {
      card[row][col] = numbers[row];
    }
  }
  card[2][2] = 'FREE'; // Center square
  return card;
};

export const generateCardPool = (count: number): PlayerCardData[] => {
  const cardPool: PlayerCardData[] = [];
  const cardStrings = new Set<string>();
  while(cardPool.length < count) {
      const newCard = generateBingoCard();
      const cardString = JSON.stringify(newCard);
      if(!cardStrings.has(cardString)) {
          cardStrings.add(cardString);
          cardPool.push({
            id: `BL-${(cardPool.length + 1).toString().padStart(3, '0')}`,
            card: newCard
          });
      }
  }
  return cardPool;
};

const checkWinAnyLine = (card: BingoCard, calledNumbers: Set<number>): boolean => {
  // Check for horizontal wins (rows)
  for (let i = 0; i < 5; i++) {
    if (card[i].every(num => num === 'FREE' || calledNumbers.has(num as number))) {
      return true;
    }
  }

  // Check for vertical wins (columns)
  for (let j = 0; j < 5; j++) {
    let isColumnComplete = true;
    for (let i = 0; i < 5; i++) {
      const num = card[i][j];
      if (num !== 'FREE' && !calledNumbers.has(num as number)) {
        isColumnComplete = false;
        break;
      }
    }
    if (isColumnComplete) {
      return true;
    }
  }

  // Check for diagonal win (top-left to bottom-right)
  let isDiagonal1Complete = true;
  for (let i = 0; i < 5; i++) {
    const num = card[i][i];
    if (num !== 'FREE' && !calledNumbers.has(num as number)) {
      isDiagonal1Complete = false;
      break;
    }
  }
  if (isDiagonal1Complete) {
    return true;
  }

  // Check for diagonal win (top-right to bottom-left)
  let isDiagonal2Complete = true;
  for (let i = 0; i < 5; i++) {
    const num = card[i][4 - i];
    if (num !== 'FREE' && !calledNumbers.has(num as number)) {
      isDiagonal2Complete = false;
      break;
    }
  }
  if (isDiagonal2Complete) {
    return true;
  }

  return false;
};

const checkWinFourCorners = (card: BingoCard, calledNumbers: Set<number>): boolean => {
  const corners = [card[0][0], card[0][4], card[4][0], card[4][4]];
  return corners.every(num => calledNumbers.has(num as number));
};

const checkWinFullCard = (card: BingoCard, calledNumbers: Set<number>): boolean => {
  return card.flat().every(num => num === 'FREE' || calledNumbers.has(num as number));
};


export const checkWin = (card: BingoCard, calledNumbers: Set<number>, pattern: BingoPattern): boolean => {
  switch (pattern) {
    case BingoPattern.ANY_LINE:
      return checkWinAnyLine(card, calledNumbers);
    case BingoPattern.FOUR_CORNERS:
      return checkWinFourCorners(card, calledNumbers);
    case BingoPattern.FULL_CARD:
      return checkWinFullCard(card, calledNumbers);
    default:
      return false;
  }
};