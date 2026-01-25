
import { GoogleGenAI, Type } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const improveContent = async (text: string): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Improve the following blog content. Make it more professional, engaging, and well-structured. Keep the same core message:\n\n${text}`,
    config: {
      temperature: 0.7,
      topP: 0.9,
    },
  });
  return response.text || text;
};

export const generateTagsAndDescription = async (title: string, content: string): Promise<{ tags: string[], description: string }> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on the blog title "${title}" and content provided, generate a compelling short SEO description and 5 relevant tags.\n\nContent:\n${content.substring(0, 1000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["description", "tags"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { description: '', tags: [] };
  }
};