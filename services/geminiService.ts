
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key) throw new Error("Neural link not activated. Click 'Activate AI Engine' to continue.");
  return key;
};

/**
 * Standard Image Generation using Gemini 2.5 Flash.
 */
export const generateImagePro = async (prompt: string, aspectRatio: string = '1:1'): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
    console.error("Image Gen Error:", error);
    if (error.message?.includes("API Key")) {
      throw new Error("Key Selection Required. Please re-activate system.");
    }
    throw new Error(error.message || "Failed to generate image.");
  }
};

/**
 * Image Editing using Gemini 2.5 Flash.
 */
export const editImage = async (base64Image: string, prompt: string, mimeType: string = 'image/png'): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
  } catch (err: any) {
    throw new Error(err.message || "Edit failed.");
  }
};

/**
 * Chat and Deep Reasoning Logic using Gemini 3 series models.
 */
export const runChat = async (prompt: string, history: ChatMessage[], isThinking: boolean = false): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
  } catch (err: any) {
    if (err.message?.includes("API Key")) {
      throw new Error("Activation Required. Please refresh or re-link engine.");
    }
    throw new Error(err.message || "Chat error occurred.");
  }
};

export const thinkingChat = async (prompt: string, history: ChatMessage[] = []): Promise<string> => {
  return runChat(prompt, history, true);
};

/**
 * Cinematic Video Generation using Veo 3.1.
 */
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
    
    const videoAi = new GoogleGenAI({ apiKey: getApiKey() });
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
      const response = await fetch(`${downloadLink}&key=${getApiKey()}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (err: any) {
    if (err.message?.includes("not found")) {
      throw new Error("API_KEY_REQUIRED");
    }
    onProgress("Veo requires paid API key. Using motion-frame fallback...");
    return await generateImagePro(`Cinematic motion frame: ${prompt}`, aspectRatio);
  }
};
