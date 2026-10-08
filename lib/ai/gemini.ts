import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];

async function generateWithModelFallback(params: {
  systemInstruction?: string;
  contents: unknown;
  maxOutputTokens?: number;
  temperature?: number;
}): Promise<string> {
  let lastError: unknown = null;
  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents as string,
        config: {
          systemInstruction: params.systemInstruction,
          maxOutputTokens: params.maxOutputTokens ?? 2048,
          temperature: params.temperature ?? 0.8,
        },
      });
      if (response.text !== undefined && response.text !== null) {
        return response.text;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini] Model ${model} failed (${msg}), trying fallback...`);
      lastError = err;
    }
  }
  throw lastError ?? new Error('All Gemini fallback models failed');
}

export async function generateText(systemPrompt: string, userPrompt: string): Promise<string> {
  return generateWithModelFallback({
    systemInstruction: systemPrompt,
    contents: userPrompt,
    maxOutputTokens: 2048,
    temperature: 0.8,
  });
}

export async function chatWithHistory(
  systemPrompt: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  userMessage: string
): Promise<string> {
  let lastError: unknown = null;
  for (const model of FALLBACK_MODELS) {
    try {
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 1024,
          temperature: 0.9,
        },
        history,
      });
      const response = await chat.sendMessage({ message: userMessage });
      if (response.text) return response.text;
    } catch (err: unknown) {
      console.warn(`[Gemini chatWithHistory] Model ${model} failed, trying fallback...`);
      lastError = err;
    }
  }
  throw lastError ?? new Error('All Gemini chat fallback models failed');
}

export async function generateWithImage(
  systemPrompt: string,
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  return generateWithModelFallback({
    systemInstruction: systemPrompt,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: 'Hãy phân tích ảnh lòng bàn tay này.' },
        ],
      },
    ],
    maxOutputTokens: 2048,
    temperature: 0.8,
  });
}
