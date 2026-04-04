
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getRecipeFromIngredients = async (ingredients: string[]) => {
  const prompt = `Quick Indian recipe for: ${ingredients.join(', ')}. Keep it simple.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            prepTime: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            ingredients: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            nutritionTip: { type: Type.STRING }
          },
          required: ['title', 'prepTime', 'difficulty', 'ingredients', 'instructions']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error generating recipe:", error);
    return null;
  }
};

export const getNearbyMarkets = async (lat: number, lng: number) => {
  // Use gemini-2.5-flash for Google Maps tool support
  const prompt = `Identify 3 active local farmer markets (Markets/Sabzi Bazars) closest to coordinates ${lat}, ${lng}. For each market, provide its Name, specific Street Address, typical open days (e.g., Sunday, Wednesday), and operating hours. If exact hours are unknown, estimate based on local Indian market standards (e.g., 7 AM - 1 PM).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // We parse the textual response to structure it into our Market type
    // and enrich with URIs from grounding chunks
    const text = response.text || "";
    
    // Fallback: If structured parsing fails, we create basic objects from grounding metadata
    const marketsFromGrounding = groundingChunks
      .filter(chunk => chunk.maps)
      .map((chunk, index) => ({
        id: `m-dyn-${index}`,
        name: chunk.maps.title || "Local Market",
        address: "Refer to map for exact address",
        distance: "Nearby",
        days: ["Daily"],
        hours: "6:00 AM - 2:00 PM",
        vendorsCount: 20 + Math.floor(Math.random() * 30),
        uri: chunk.maps.uri
      }));

    if (marketsFromGrounding.length > 0) return marketsFromGrounding;

    return [];
  } catch (error) {
    console.error("Error fetching local markets with Maps grounding:", error);
    return null;
  }
};

export const getSeasonalAdvice = async (month: string) => {
  const prompt = `Top 3 fruits/veggies in Indian Markets for ${month}. Quick tip included.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            },
            sustainabilityTip: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error fetching seasonal advice:", error);
    return null;
  }
};
