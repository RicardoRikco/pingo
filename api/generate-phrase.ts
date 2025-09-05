import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { number } = request.body;

  if (!number || typeof number !== 'number') {
    return response.status(400).json({ error: 'A valid number is required.' });
  }
  
  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
      console.error("API key for Gemini is not set in environment variables.");
      // Provide a fallback phrase if the key is missing on the server
      return response.status(500).json({ phrase: `¡Salió el número ${number}!` });
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const getBingoLetter = (num: number): string => {
      if (num <= 15) return 'B';
      if (num <= 30) return 'I';
      if (num <= 45) return 'N';
      if (num <= 60) return 'G';
      return 'O';
  };

  const letter = getBingoLetter(number);
  const fullNumber = `${letter}-${number}`;
  
  const prompt = `You are a fun, witty, and slightly crazy bingo caller for a game called 'Bingo Loco'. The number just drawn is ${fullNumber}. Announce it with a very short, funny, rhyming phrase in Spanish. Keep it family-friendly and exciting. Examples for B-12: '¡B-12, que la suerte te roce!', for N-33: '¡N-33, para ganar esta vez!', for G-55: '¡G-55, a pegar el brinco!'. Be creative and vary your responses.`;

  try {
      const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
      });
      const phrase = result.text.replace(/\*/g, '').trim();
      return response.status(200).json({ phrase });
  } catch (error) {
      console.error("Error calling Gemini API:", error);
      // Return a fallback phrase on error
      return response.status(500).json({ phrase: `¡Salió el ${fullNumber}!` });
  }
}
