import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getMarketAssistantResponse = async (prompt: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are HarvestHub AI, a smart assistant for a local farmer's market platform. 
        Context: ${context}
        Help users find products, suggest recipes using seasonal local produce, and provide farming/pricing advice to sellers.
        Keep responses concise, helpful, and professional.`,
      },
    });
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "I'm having trouble connecting to my AI brain right now.";
  }
};

export const getPriceAdvice = async (productName: string, description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a competitive price for ${productName} (${description}) in a local farmer's market. Provide a range and a brief justification.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "Could not get price advice.";
  }
};

export const getRecipeIdeas = async (products: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `I have these fresh products from the farmer's market: ${products.join(', ')}. 
      Suggest 3 creative and delicious recipe ideas I can cook with them. 
      For each recipe, provide a title, a brief description, and a list of other common pantry staples I might need.
      Format the output nicely with markdown.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "I couldn't cook up any ideas right now. Try again later!";
  }
};

const imageCache = new Map<string, string>();

const resizeBase64Image = (base64Str: string, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      // Use JPEG with 0.6 quality to significantly reduce size while maintaining decent look
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const generateMarketImage = async (prompt: string) => {
  if (imageCache.has(prompt)) {
    return imageCache.get(prompt)!;
  }

  try {
    // Using 3.1 for Markets to leverage Google Search context if available
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          {
            text: `A realistic, high-quality photograph of ${prompt}. Style: Authentic Indian context, vibrant, professional photography. Use real-world visual references from Google Search to ensure accuracy.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        },
        tools: [
          {
            googleSearch: {
              searchTypes: {
                webSearch: {},
                imageSearch: {},
              }
            },
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64 = `data:image/png;base64,${part.inlineData.data}`;
        const resized = await resizeBase64Image(base64, 800, 450);
        imageCache.set(prompt, resized);
        return resized;
      }
    }
    
    return `https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800`;
  } catch (error: any) {
    // Fallback to 2.5 if 3.1 fails (e.g. no user key selected yet)
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A professional photo of ${prompt}, Indian market style.` }],
        },
        config: { imageConfig: { aspectRatio: "16:9" } },
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64 = `data:image/png;base64,${part.inlineData.data}`;
          return await resizeBase64Image(base64, 800, 450);
        }
      }
    } catch (e) {}
    
    const lowerPrompt = prompt.toLowerCase();
    let fallback = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/800/450`;
    if (lowerPrompt.includes('market')) {
      fallback = "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=800";
    }
    return fallback;
  }
};

export const generateProductImage = async (productName: string) => {
  const cacheKey = `prod_${productName}`;
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey)!;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A high-quality, close-up studio photograph of fresh ${productName}. Style: Clean white background, vibrant natural colors, professional food photography, high resolution. Focus only on the ${productName}.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64 = `data:image/png;base64,${part.inlineData.data}`;
        const resized = await resizeBase64Image(base64, 512, 512);
        imageCache.set(cacheKey, resized);
        return resized;
      }
    }
    return `https://picsum.photos/seed/${encodeURIComponent(productName)}/400/400`;
  } catch (error) {
    console.error("Product Image Error:", error);
    return `https://picsum.photos/seed/${encodeURIComponent(productName)}/400/400`;
  }
};

export const getProperMarketData = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate 2 realistic Indian Markets and 2 realistic Indian Farmers for a farmer's market app. Return as JSON with 'mandis' and 'farmers' arrays. For each mandi, include: name, location, timing, contact, rating, description, imagePrompt. For each farmer, include: name, farm, location, specialty, bio, experience, imagePrompt.",
      config: {
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error("Market Data Error:", error);
    
    // Return high-quality mock data if AI fails (e.g. quota exceeded)
    return {
      mandis: [
        {
          name: "Azadpur Market",
          location: "New Delhi, Delhi",
          timing: "4:00 AM - 12:00 PM",
          contact: "+91 11 2740 0000",
          rating: 4.7,
          description: "One of Asia's largest fruit and vegetable markets, serving as a national distribution hub.",
          imagePrompt: "Close-up of fresh colorful Indian vegetables like tomatoes, carrots, and greens in a market"
        },
        {
          name: "Vashi APMC Market",
          location: "Navi Mumbai, Maharashtra",
          timing: "5:00 AM - 2:00 PM",
          contact: "+91 22 2788 0000",
          rating: 4.5,
          description: "A major agricultural produce market committee serving the Mumbai metropolitan region.",
          imagePrompt: "Close-up of fresh Indian fruits like mangoes, bananas, and oranges in a market"
        }
      ],
      farmers: [
        {
          name: "Harpreet Singh",
          farm: "Punjab Organic Acres",
          location: "Ludhiana, Punjab",
          specialty: "Basmati Rice & Wheat",
          bio: "Third-generation farmer dedicated to sustainable organic practices and preserving heirloom seeds.",
          experience: "25 Years",
          imagePrompt: "Close-up of fresh organic wheat grains and basmati rice in a farmer's hands"
        },
        {
          name: "Meenakshi Amma",
          farm: "Kerala Spice Garden",
          location: "Idukki, Kerala",
          specialty: "Black Pepper & Cardamom",
          bio: "Specializing in traditional spice cultivation and natural pest management techniques.",
          experience: "30 Years",
          imagePrompt: "Close-up of fresh green cardamom pods and black pepper on a wooden surface"
        }
      ]
    };
  }
};
