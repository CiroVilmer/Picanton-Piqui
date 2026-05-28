import { GoogleGenAI, type Schema } from '@google/genai';
import { storage } from 'wxt/utils/storage';

export const MODEL = 'gemini-3.1-pro-preview';

/**
 * Modelo del chat: flash-lite (GA) por baja latencia/costo — ideal para respuestas
 * cortas con personalidad. Mismo family que MODEL, así que la key del user suele tenerlo.
 * Fallback si no hay acceso: 'gemini-2.5-flash'.
 */
export const CHAT_MODEL = 'gemini-3.1-flash-lite';

export const apiKey = storage.defineItem<string>('local:gemini-api-key', {
  fallback: '',
});

async function getAiClient(): Promise<GoogleGenAI | null> {
  const key = (await apiKey.getValue()).trim();
  if (key.length === 0) return null;
  return new GoogleGenAI({ apiKey: key });
}

export async function hasApiKey(): Promise<boolean> {
  return (await apiKey.getValue()).trim().length > 0;
}

export type GenerateError = 'no-key' | 'auth' | 'parse' | 'network' | 'empty' | 'unknown';

export type GenerateResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: GenerateError; message?: string };

/** Turno de conversación para el chat (role en el formato de Gemini). */
export type ChatTurn = { role: 'user' | 'model'; text: string };

/** Clasifica un error de la API a un GenerateError según el mensaje. */
function classifyError(err: unknown): { error: GenerateError; message: string } {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  if (
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('api key') ||
    lower.includes('permission_denied')
  ) {
    return { error: 'auth', message };
  }
  if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch')) {
    return { error: 'network', message };
  }
  return { error: 'unknown', message };
}

export async function generateStructured<T>(
  systemPrompt: string,
  userPrompt: string,
  responseSchema: object,
  temperature: number = 0.2,
): Promise<GenerateResult<T>> {
  const ai = await getAiClient();
  if (!ai) return { ok: false, error: 'no-key' };

  try {
    console.debug('[piqui ai] request', {
      model: MODEL,
      systemPromptLen: systemPrompt.length,
      userPromptLen: userPrompt.length,
      userPromptPreview: userPrompt.slice(0, 800),
    });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature,
        responseMimeType: 'application/json',
        responseSchema: responseSchema as Schema,
      },
    });

    const text = response.text;
    console.debug('[piqui ai] response', {
      textLen: text?.length ?? 0,
      text,
      promptFeedback: response.promptFeedback,
      finishReason: response.candidates?.[0]?.finishReason,
    });

    if (!text || text.length === 0) {
      return { ok: false, error: 'empty', message: 'El modelo no devolvió texto.' };
    }

    try {
      return { ok: true, data: JSON.parse(text) as T };
    } catch (parseErr) {
      console.error('AI response parse failed', { text, parseErr });
      return { ok: false, error: 'parse', message: 'El modelo devolvió JSON inválido.' };
    }
  } catch (err) {
    console.error('generateStructured failed', err);
    const { error, message } = classifyError(err);
    return { ok: false, error, message };
  }
}

/**
 * Genera texto en streaming (chat). Arma `contents` desde los turnos, pasa el
 * system prompt como systemInstruction, y va llamando onChunk con cada delta.
 * Devuelve el texto completo acumulado, o un error clasificado.
 */
export async function streamText(
  systemPrompt: string,
  turns: ChatTurn[],
  onChunk: (delta: string) => void,
  temperature: number = 0.9,
): Promise<GenerateResult<string>> {
  const ai = await getAiClient();
  if (!ai) return { ok: false, error: 'no-key' };

  try {
    const contents = turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] }));
    const stream = await ai.models.generateContentStream({
      model: CHAT_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature,
        maxOutputTokens: 1024,
      },
    });

    let full = '';
    for await (const chunk of stream) {
      const delta = chunk.text; // string | undefined
      if (delta) {
        full += delta;
        onChunk(delta);
      }
    }

    if (full.length === 0) {
      return { ok: false, error: 'empty', message: 'El modelo no devolvió texto.' };
    }
    return { ok: true, data: full };
  } catch (err) {
    console.error('streamText failed', err);
    const { error, message } = classifyError(err);
    return { ok: false, error, message };
  }
}
