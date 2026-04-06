
/**
 * Image Generation Service using Hugging Face Inference API
 */

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";
const DEFAULT_MODEL = "stabilityai/stable-diffusion-3.5-large"; // You can change this to any HF model

const imageCache = new Map<string, string>();

/**
 * Generates an image using Hugging Face
 */
async function queryHF(prompt: string, model: string = DEFAULT_MODEL): Promise<string | null> {
  if (!HF_API_KEY) return null;

  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!response.ok) {
      console.error("HF Inference Error:", await response.text());
      return null;
    }

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("HF API Error:", error);
    return null;
  }
}

export const generateMarketImage = async (prompt: string): Promise<string> => {
  if (imageCache.has(prompt)) return imageCache.get(prompt)!;

  const result = await queryHF(
    `A realistic, professional photograph of ${prompt}, vibrant colors, Indian market style, high resolution.`
  );

  if (result) {
    imageCache.set(prompt, result);
    return result;
  }

  // Fallback to Unsplash
  return `https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800`;
};

export const generateProductImage = async (productName: string): Promise<string> => {
  const cacheKey = `prod_${productName}`;
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey)!;

  const result = await queryHF(
    `A high-quality, close-up studio photograph of fresh ${productName}, white background, vibrant colors, food photography.`
  );

  if (result) {
    imageCache.set(cacheKey, result);
    return result;
  }

  // Fallback to keyword-based Unsplash search (more accurate than Picsum seed)
  return `https://source.unsplash.com/400x400/?${encodeURIComponent(productName)},vegetable,fresh`;
};
