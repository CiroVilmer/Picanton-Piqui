import { storage } from 'wxt/utils/storage';
import { isAngryMode } from '../mood';
import { streamText, type ChatTurn, type GenerateResult } from './ai';
import { PIQUI_SYSTEM_PROMPT } from './piqui-prompt';

export type ChatRole = 'user' | 'piqui';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
};

/** Historial del chat, persistente. Sobrevive cerrar/reabrir la extensión. */
export const chatLog = storage.defineItem<ChatMessage[]>('local:chat', { fallback: [] });

/** Cuántos turnos del historial se mandan al modelo (cap de tokens). */
const MAX_TURNS = 20;

/** Tag de estado que se antepone al último mensaje del user (manifest §notas). */
export function stateTag(mood: number, hunger: number): string {
  const state = isAngryMode(mood) ? 'ANGRY' : 'HAPPY';
  return `[STATE: ${state} | hunger: ${hunger}%]`;
}

/**
 * Streamea la respuesta de Piqui. `history` ya incluye el mensaje del user recién
 * agregado como último elemento. Sólo ese último turno lleva el tag de estado; los
 * mensajes persistidos quedan con su texto crudo.
 */
export function streamPiquiReply(
  history: ChatMessage[],
  mood: number,
  hunger: number,
  onChunk: (delta: string) => void,
): Promise<GenerateResult<string>> {
  let recent = history.slice(-MAX_TURNS);
  // Gemini exige que el historial arranque en un turno 'user' y alterne.
  if (recent.length > 0 && recent[0].role === 'piqui') {
    recent = recent.slice(1);
  }

  const turns: ChatTurn[] = recent.map((m) => ({
    role: m.role === 'piqui' ? 'model' : 'user',
    text: m.text,
  }));

  const last = turns[turns.length - 1];
  if (last && last.role === 'user') {
    last.text = `${stateTag(mood, hunger)}\n${last.text}`;
  }

  return streamText(PIQUI_SYSTEM_PROMPT, turns, onChunk);
}
