import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

/**
 * Hardcoded Free Tier API Key.
 */
const HARDCODED_KEY = 'AIzaSyCTFJDV4BprVCaEHbHtJ242M_LS2mLdLX8';

/**
 * Helper to get an instance of GoogleGenAI.
 */
const getAI = () => {
  const key = process.env.API_KEY || HARDCODED_KEY;
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Enhanced error parsing for Free Tier limitations.
 */
const handleApiError = (error: any) => {
  console.error("Gemini API Error:", error);
  const rawMsg = error.message || "";
  const errorJson = JSON.stringify(error).toLowerCase();

  // 1. Quota / Rate Limit (429)
  if (errorJson.includes("429") || errorJson.includes("quota") || errorJson.includes("resource_exhausted")) {
    if (errorJson.includes("limit: 0")) {
      return "MODEL_LOCKED: This free key cannot access this specific model. Text chat is available, but Image/Video generation usually requires a paid project.";
    }
    return "QUOTA_REACHED: You've sent too many requests. Please wait 60 seconds and try again.";
  }

  // 2. Invalid Key (401)
  if (errorJson.includes("401") || errorJson.includes("api key not valid")) {
    return "INVALID_KEY: The API key is not working. Please use 'Manage Link' to select a fresh one.";
  }

  // 3. Billing Required / Permission (403)
  if (errorJson.includes("403") || errorJson.includes("permission_denied")) {
    return "BILLING_REQUIRED: This feature (like Video) is locked on free accounts. Upgrade to a paid project in Google Cloud console.";
  }

  return rawMsg || "SYSTEM_ERROR: Connectivity issue. Check your internet or API key.";
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
    // Use gemini-3-flash-preview as the most reliable "Free" model.
    const model = isThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    const config = isThinking ? { thinkingConfig: { thinkingBudget: 8000 } } : {};
    
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
    return response.text || "No response received.";
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
    onProgress("Authenticating with Veo...");
    
    const videoAi = getAI();
    // Veo is restricted to billing-enabled projects.
    let operation = await videoAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      image: { imageBytes: base64Data, mimeType },
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
    });

    while (!operation.done) {
      await new Promise(r => setTimeout(r, 10000));
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
    onProgress("Motion Engine Offline.");
    throw new Error(handleApiError(error));
  }
};