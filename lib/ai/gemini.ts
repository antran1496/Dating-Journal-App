import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateText(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 2048,
      temperature: 0.8,
    },
  });
  return response.text ?? '';
}

export async function chatWithHistory(
  systemPrompt: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  userMessage: string
): Promise<string> {
  const chat = ai.chats.create({
    model: 'gemini-3.6-flash',
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 1024,
      temperature: 0.9,
    },
    history,
  });
  const response = await chat.sendMessage({ message: userMessage });
  return response.text ?? '';
}

export async function generateWithImage(
  systemPrompt: string,
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: 'Hãy phân tích ảnh lòng bàn tay này.' },
        ],
      },
    ],
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 2048,
      temperature: 0.8,
    },
  });
  return response.text ?? '';
}
