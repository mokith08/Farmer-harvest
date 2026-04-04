
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "", dangerouslyAllowBrowser: true });

/**
 * Common Text Assistant logic using Groq
 */
export const getMarketAssistantResponse = async (prompt: string, context: string) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are HarvestHub AI, a smart assistant for a local farmer's market platform. 
          Context: ${context}
          Help users find products, suggest recipes using seasonal local produce, and provide farming/pricing advice to sellers.
          Keep responses concise, helpful, and professional.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    return chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Groq AI Error:", error);
    return "I'm having trouble connecting to my AI brain right now.";
  }
};

/**
 * Get pricing advice for sellers
 */
export const getPriceAdvice = async (productName: string, description: string) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Suggest a competitive price for ${productName} (${description}) in a local farmer's market. Provide a range and a brief justification.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });
    return chatCompletion.choices[0]?.message?.content || "Could not get price advice.";
  } catch (error) {
    console.error("Groq AI Error:", error);
    return "Could not get price advice.";
  }
};

/**
 * Get recipe ideas based on a list of products
 */
export const getRecipeIdeas = async (products: string[]) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `I have these fresh products from the farmer's market: ${products.join(', ')}. 
          Suggest 3 creative and delicious recipe ideas I can cook with them. 
          For each recipe, provide a title, a brief description, and a list of other common pantry staples I might need.
          Format the output nicely with markdown.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });
    return chatCompletion.choices[0]?.message?.content || "I couldn't cook up any ideas right now. Try again later!";
  } catch (error) {
    console.error("Groq AI Error:", error);
    return "I couldn't cook up any ideas right now. Try again later!";
  }
};

/**
 * Generates structured recipe data from ingredients
 */
export const getRecipeFromIngredients = async (ingredients: string[]) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a specialized Indian Chef AI. Provide a detailed recipe as JSON.",
        },
        {
          role: "user",
          content: `Create a professional Indian style recipe using these ingredients: ${ingredients.join(', ')}. Return only JSON with these keys: title, prepTime, difficulty, ingredients (array of strings), instructions (array of strings), and nutritionTip.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });
    return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.error("Groq AI Recipe Error:", error);
    return null;
  }
};

/**
 * Fetches seasonal advice for the current month
 */
export const getSeasonalAdvice = async (month: string) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `What are the top 3 items in Indian Markets for ${month}? Also provide one sustainability tip. Return only JSON with these keys: advice (array of {item, reason}) and sustainabilityTip.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });
    return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.error("Groq AI Seasonal Error:", error);
    return null;
  }
};

/**
 * Generates realistic market and farmer data for UI mockups
 */
export const getProperMarketData = async () => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "Generate 2 realistic Indian Markets and 2 realistic Indian Farmers for a farmer's market app. Return as JSON with 'mandis' and 'farmers' arrays.",
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });
    return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
  } catch (error: any) {
    console.error("Groq Market Data Error:", error);
    return { mandis: [], farmers: [] };
  }
};

/**
 * Find nearby markets based on coordinates (Mocked for Groq as it lacks Maps Grounding)
 */
export const getNearbyMarkets = async (lat: number, lng: number) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Identify 3 active local farmer markets closest to coordinates ${lat}, ${lng}. Return only JSON with an array named 'markets' containing: {id, name, address, distance, days (array), hours, vendorsCount, imagePrompt}.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });
    const data = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
    return data.markets || [];
  } catch (error) {
    console.error("Groq Markets Error:", error);
    return [];
  }
};
