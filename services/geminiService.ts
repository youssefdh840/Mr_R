
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

/**
 * Uses Gemini 2.5 Flash Image - Compatible with Free Tier keys.
 */
export const generateImagePro = async (prompt: string, aspectRatio: string = '1:1'): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

/**
 * Edits image using Gemini 2.5 Flash Image.
 */
export const editImage = async (base64Image: string, prompt: string, mimeType: string = 'image/png'): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

/**
 * Uses Gemini 3 Flash - Optimized for high-speed reasoning and free-tier access.
 */
export const thinkingChat = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 16000 }
    }
  });
  return response.text || "No response received.";
};

/**
 * Standard Chat Assistant using Gemini 3 Flash for maximum free-tier uptime.
 */
export const chatAssistant = async (prompt: string, history: {role: 'user' | 'model', text: string}[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));
  
  contents.push({ role: 'user', parts: [{ text: prompt }] });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents,
  });

  return response.text || "I couldn't generate a response.";
};

/**
 * Generates cinematic motion using the most accessible method.
 * Attempts Veo if possible, otherwise falls back to a high-fidelity image 
 * that the UI can animate with CSS to ensure functionality on free keys.
 */
export const generateVideoVeo = async (
  prompt: string, 
  image: string, 
  aspectRatio: '16:9' | '9:16',
  onProgress: (msg: string) => void
): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = image.split(',')[1] || image;
  const mimeType = image.split(';')[0].split(':')[1] || 'image/png';

  onProgress("Checking compatibility...");
  
  try {
    // Attempt real video generation
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

    onProgress("Processing cinematic sequences...");
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({operation: operation});
      onProgress("Still cooking... video generation usually takes 60-120 seconds.");
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      onProgress("Downloading cinematic result...");
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
    
    throw new Error("VIDEO_FAILED");
  } catch (error: any) {
    console.warn("Real video failed or restricted, switching to Cinematic Motion fallback...");
    onProgress("Free Tier: Generating High-Fidelity Cinematic Frame...");
    
    // Fallback: Generate a high-quality cinematic frame using the free image model
    const fallbackPrompt = `Cinematic 4k motion poster frame: ${prompt}. High drama, professional lighting, film grain.`;
    const result = await generateImagePro(fallbackPrompt, aspectRatio);
    
    if (result) {
      onProgress("Finalizing Motion Frame...");
      return result; // The UI will detect this is an image and apply CSS animation
    }
    
    throw error;
  }
};
