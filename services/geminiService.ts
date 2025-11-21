import { GoogleGenAI, Type } from "@google/genai";

// Helper to clean base64 string for API
const cleanBase64 = (data: string) => {
  return data.split(',')[1] || data;
};

const getMimeType = (data: string) => {
    const match = data.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    return match ? match[1] : 'image/jpeg';
};

export const generateSlideContent = async (base64Image: string): Promise<{ title: string; description: string }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found");
    return { title: "יום הולדת שמח!", description: "תמונה יפה מהאירוע." };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const mimeType = getMimeType(base64Image);
    const cleanData = cleanBase64(base64Image);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanData
            }
          },
          {
            text: "This is a photo for Daniel's 24th birthday presentation. Generate a funny, witty, or heartwarming title (max 5 words) and a short description (max 15 words) in Hebrew for this photo. Return JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["title", "description"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    throw new Error("No response text");

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { title: "יום הולדת לדניאל", description: "תמונה נהדרת!" };
  }
};
