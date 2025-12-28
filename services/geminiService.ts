
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

/**
 * Helper to get an instance of GoogleGenAI.
 * We create it inside function calls to ensure it uses the most up-to-date API key
 * available in process.env.API_KEY after the user selects a key.
 */
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    console.error("Image Gen Error:", error);
    if (error.message?.includes("API key")) {
      throw new Error("Neural Link Error: Please ensure an API key is selected via the activation button.");
    }
    throw new Error(error.message || "Failed to generate image.");
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
  } catch (err: any) {
    throw new Error(err.message || "Edit failed.");
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
  } catch (err: any) {
    throw new Error(err.message || "Chat error occurred.");
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
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (err: any) {
    onProgress("Veo requires a valid billing account. Check settings or select a new key.");
    return await generateImagePro(`Cinematic motion frame: ${prompt}`, aspectRatio);
  }
};
