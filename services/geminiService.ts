import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

/**
 * Hardcoded API Key for immediate access.
 */
const HARDCODED_KEY = 'AIzaSyCTFJDV4BprVCaEHbHtJ242M_LS2mLdLX8';

/**
 * Helper to get an instance of GoogleGenAI.
 * It prioritizes the hardcoded key but allows the environment to override it
 * if the user selects a key via the AI Studio UI.
 */
const getAI = () => {
  const key = process.env.API_KEY || HARDCODED_KEY;
  return new GoogleGenAI({ apiKey: key });
};

const handleApiError = (error: any) => {
  console.error("API Error Details:", error);
  const msg = error.message || "";
  if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("exhausted")) {
    return "QUOTA_EXHAUSTED: This API key has reached its limit for today. Please use 'Manage Link' to switch to a fresh key.";
  }
  if (msg.includes("401") || msg.includes("API key not valid")) {
    return "INVALID_KEY: The current API key is not valid. Please update it in settings.";
  }
  return msg || "An unexpected error occurred.";
};

export const generateImagePro = async (prompt: string, aspectRatio: string = '1:1'): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: aspectRatio as any }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    throw new Error(handleApiError(error));
  }
};

export const editImage = async (base64Image: string, prompt: string, mimeType: string = 'image/png'): Promise<string | null> => {
  try {
    const ai = getAI();
    const base64Data = base64Image.split(',')[1] || base64Image;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt }
        ]
      }
    });
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error: any) {
    throw new Error(handleApiError(error));
  }
};

export const runChat = async (prompt: string, history: ChatMessage[], isThinking: boolean = false): Promise<string> => {
  try {
    const ai = getAI();
    const model = isThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    const config = isThinking ? { thinkingConfig: { thinkingBudget: 16000 } } : {};
    
    const contents = history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model,
      contents,
      config
    });
    return response.text || "No response text.";
  } catch (error: any) {
    throw new Error(handleApiError(error));
  }
};

export const thinkingChat = async (prompt: string, history: ChatMessage[] = []): Promise<string> => {
  return runChat(prompt, history, true);
};

export const generateVideoVeo = async (
  prompt: string, 
  image: string, 
  aspectRatio: '16:9' | '9:16',
  onProgress: (msg: string) => void
): Promise<string | null> => {
  try {
    const base64Data = image.split(',')[1] || image;
    const mimeType = image.split(';')[0].split(':')[1] || 'image/png';
    onProgress("Processing cinematic sequences...");
    
    const videoAi = getAI();
    let operation = await videoAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      image: { imageBytes: base64Data, mimeType },
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
    });

    while (!operation.done) {
      await new Promise(r => setTimeout(r, 8000));
      operation = await videoAi.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      const key = process.env.API_KEY || HARDCODED_KEY;
      const response = await fetch(`${downloadLink}&key=${key}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (error: any) {
    onProgress("System error: Operation failed.");
    throw new Error(handleApiError(error));
  }
};