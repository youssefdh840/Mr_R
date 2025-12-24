
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getValidApiKey = () => {
  const key = process.env.API_KEY;
  // Rigorous check for valid key strings to prevent SDK "API Key must be set" errors
  if (!key || key === 'undefined' || key === 'null' || key.trim() === '') {
    throw new Error("API_KEY_NOT_FOUND");
  }
  return key;
};

/**
 * Uses Gemini 2.5 Flash Image - Reliable for Free Tier.
 */
export const generateImagePro = async (prompt: string, aspectRatio: string = '1:1'): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getValidApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
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
    if (error.message?.includes("API_KEY_NOT_FOUND")) {
      throw new Error("Activation Required: Please link your API Key.");
    }
    console.error("Image generation failed:", error);
    throw error;
  }
};

/**
 * Edits image using Gemini 2.5 Flash Image.
 */
export const editImage = async (base64Image: string, prompt: string, mimeType: string = 'image/png'): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getValidApiKey() });
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          { text: prompt }
        ]
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (err: any) {
    if (err.message?.includes("API_KEY_NOT_FOUND")) {
      throw new Error("Connection lost. Re-activation required.");
    }
    throw err;
  }
};

/**
 * Uses Gemini 3 Flash - Best for Free Tier speed and reasoning.
 */
export const thinkingChat = async (prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getValidApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 16000 }
      }
    });
    return response.text || "Thinking complete, but no text was returned.";
  } catch (err: any) {
    if (err.message?.includes("API_KEY_NOT_FOUND")) {
      throw new Error("Logic Engine Offline: Key Missing.");
    }
    throw err;
  }
};

/**
 * Standard Chat Assistant using Gemini 3 Flash.
 */
export const chatAssistant = async (prompt: string, history: {role: 'user' | 'model', text: string}[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getValidApiKey() });
    
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
    });

    return response.text || "I processed your request but have no response text.";
  } catch (err: any) {
    if (err.message?.includes("API_KEY_NOT_FOUND")) {
      throw new Error("Chat Offline: Please connect your Google AI Key to begin.");
    }
    throw err;
  }
};

/**
 * Generates cinematic motion or fallback frame.
 */
export const generateVideoVeo = async (
  prompt: string, 
  image: string, 
  aspectRatio: '16:9' | '9:16',
  onProgress: (msg: string) => void
): Promise<string | null> => {
  try {
    const apiKey = getValidApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = image.split(',')[1] || image;
    const mimeType = image.split(';')[0].split(':')[1] || 'image/png';

    onProgress("Initializing cinematic engine...");
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: base64Data,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    onProgress("Generating motion sequences...");
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({operation: operation});
      onProgress("Motion rendering in progress...");
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      onProgress("Finalizing cinematic download...");
      const response = await fetch(`${downloadLink}&key=${apiKey}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
    
    throw new Error("VIDEO_FAILED");
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found.")) {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
      }
      throw new Error("Key session expired. Please re-select your project key.");
    }

    onProgress("Switching to Motion Frame fallback...");
    const fallbackPrompt = `Cinematic high-motion still frame: ${prompt}. Professional cinematography.`;
    const result = await generateImagePro(fallbackPrompt, aspectRatio);
    return result;
  }
};
