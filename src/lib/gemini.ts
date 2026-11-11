import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "missing_key";
const genAI = new GoogleGenerativeAI(apiKey);

// Helper function to convert a File to a base64 string
async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface ClothingMetadata {
  name: string;
  category: string;
  type: string;
  brand: string;
  color: string;
  material: string;
  emoji: string;
}

export async function analyzeClothingImage(file: File): Promise<ClothingMetadata> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "missing_key";
  const genAI = new GoogleGenerativeAI(apiKey);

  const tryAnalyze = async (modelName: string) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `
      You are an expert fashion stylist AI. 
      Analyze the attached image of a clothing item or accessory. 
      Return ONLY a valid JSON object with the following structure, and no other text:
      {
        "name": "A short, catchy name for the item (e.g., 'Vintage Leather Jacket', 'Emerald Silk Scarf')",
        "category": "The specific type (e.g., 'top', 'bottom', 'outerwear', 'dress', 'skirt', 'blouse', 'shirt', 'tshirt', 'shoes', 'jewelry', 'scarf', 'accessory')",
        "type": "The specific style or fit (e.g., 'oversized', 'slim-fit', 'cropped', 'athletic', 'formal')",
        "brand": "The likely brand if visible or recognizable, otherwise 'Unknown Brand'",
        "color": "The primary color (e.g., 'black', 'navy', 'crimson')",
        "material": "The likely material (e.g., 'Denim', 'Cotton', 'Leather', 'Silk', 'Synthetic', 'Gold', 'Silver')",
        "emoji": "A single emoji that best represents the item (e.g., 🧥, 👖, 👗, 👠, 💍, 🧣)"
      }
    `;

    const imagePart = await fileToGenerativePart(file);
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const cleanedText = jsonMatch ? jsonMatch[0] : responseText;
    return JSON.parse(cleanedText) as ClothingMetadata;
  };

  try {
    // Try the user's requested model first with the new fresh API key
    return await tryAnalyze("gemini-3-flash-preview");
  } catch (error) {
    console.warn("Primary analysis failed, trying fallback models:", error);
    try {
      // Automatic fallback for reliability
      return await tryAnalyze("gemini-1.5-flash");
    } catch (fallbackError) {
      console.error("All Gemini API models failed:", fallbackError);
      return {
        name: 'Unknown Item',
        category: 'unknown',
        type: 'unknown',
        brand: 'Unknown Brand',
        color: 'unknown',
        material: 'unknown',
        emoji: '✨'
      };
    }
  }
}

export interface ReceiptItem extends ClothingMetadata {
  purchaseDate: string; // ISO date (YYYY-MM-DD) or '' if unknown
  price: string; // e.g. "$128.00" or '' if unknown
  retailer: string;
}

/**
 * Extracts purchased clothing items from a receipt / order-confirmation email.
 * Accepts pasted email text, a screenshot of the email, or both.
 */
export async function parseReceipt(input: { text?: string; file?: File }): Promise<ReceiptItem[]> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in .env file");
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
    You are an assistant that reads retail receipts, order confirmations and
    review-request emails and extracts the CLOTHING / ACCESSORY items purchased.
    Ignore shipping, tax, gift cards and non-wearable products.
    Return ONLY a valid JSON array (no other text). Each element:
    {
      "name": "Product name as in the email (e.g., 'Women's Cross Chill Performance Jacket')",
      "brand": "Retailer or brand (e.g., 'lululemon'), or 'Unknown Brand'",
      "retailer": "The store that sent the email, or ''",
      "category": "one of: top, bottom, outerwear, dress, skirt, blouse, shirt, tshirt, shoes, jewelry, scarf, accessory",
      "type": "fit or style if stated (e.g., 'performance', 'oversized'), else 'unknown'",
      "color": "primary color if stated or visible, else 'unknown'",
      "material": "material if stated, else 'unknown'",
      "emoji": "a single emoji representing the item",
      "purchaseDate": "YYYY-MM-DD if a date is present, else ''",
      "price": "price with currency symbol if present, else ''"
    }
    If no clothing items are found, return [].
  `;

  const parts: any[] = [prompt];
  if (input.text?.trim()) parts.push(`EMAIL TEXT:\n${input.text.trim()}`);
  if (input.file) parts.push(await fileToGenerativePart(input.file));
  if (parts.length === 1) throw new Error("Provide receipt text or an image.");

  const run = async (modelName: string) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    const match = responseText.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : responseText);
    return (Array.isArray(parsed) ? parsed : []) as ReceiptItem[];
  };

  try {
    return await run("gemini-3-flash-preview");
  } catch (error) {
    console.warn("Receipt parsing failed on primary model, trying fallback:", error);
    return await run("gemini-1.5-flash");
  }
}

export interface OutfitRecommendation {
  name: string;
  itemIds: string[];
  matchScore: number;
  seasonalFit: string;
  styleVibe: string;
  reasoning: string;
  imagePrompt: string;
}

export async function generateOutfitRecommendation(closetItems: any[], occasion: string, userProfile: any = null, lockedItemIds: string[] = []): Promise<OutfitRecommendation> {
  if (!(import.meta as any).env.VITE_GEMINI_API_KEY) {
    throw new Error("Missing VITE_GEMINI_API_KEY in .env file");
  }

  // If the closet is empty, return a fallback
  if (!closetItems || closetItems.length === 0) {
    return {
      name: "Empty Closet",
      itemIds: [],
      matchScore: 0,
      seasonalFit: "N/A",
      styleVibe: "Please upload some clothes first!",
      reasoning: "Your closet is empty.",
      imagePrompt: ""
    };
  }

  try {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "missing_key";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // We only send the necessary metadata to save tokens
    const simplifiedCloset = closetItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      color: item.color,
      material: item.material
    }));

    let profileContext = "";
    if (userProfile) {
      profileContext = `
      USER PROFILE (Use this to tailor the outfit and generate the image prompt):
      - Gender: ${userProfile.gender}
      - Body Type: ${userProfile.bodyType}
      - Height & Weight: ${userProfile.height || 'Unknown'} / ${userProfile.weight || 'Unknown'}
      - Skin Tone: ${userProfile.skinTone}
      - Hair Color: ${userProfile.hairColor}
      - Preferred Vibe: ${userProfile.styleVibe}
      - Fashion Persona: ${userProfile.fashionPersona?.join(', ') || 'Unknown'}
      - Custom Style Notes: ${userProfile.customStyle || 'None'}
      - Best Colors: ${userProfile.outfitColors?.map((c: any) => c.name).join(', ') || 'Any'}
      - Best Jewelry: ${userProfile.jewelry || 'Any'}
      
      The user has liked ${userProfile.likedOutfits?.length || 0} outfits before.
      `;
    }

    const prompt = `
      You are an expert fashion stylist AI with a sharp eye for occasion-specific dressing.
      The user is asking for an outfit for a SPECIFIC occasion: "${occasion}".
      
      ${profileContext}
      
      STRICT RULES:
      1. YOU MUST PRIORITIZE THE OCCASION "${occasion}" ABOVE ALL ELSE. If it's business, do NOT give casual.
      2. VARIETY: Do not repeat previous recommendations. The current timestamp is ${new Date().toISOString()}. Use this to ensure a unique result.
      3. CRITICAL: Learn from the user's past preferences (${userProfile?.likedOutfits?.join(', ') || 'None'}), but do NOT let them override the specific requirements of the "${occasion}" occasion.
      4. DISLIKES: Strictly avoid anything similar to: ${userProfile?.dislikedOutfits?.join(', ') || 'None'}.
      
      Here is the user's digital closet (in JSON format):
      ${JSON.stringify(simplifiedCloset, null, 2)}
      
      Pick a cohesive outfit using ONLY the items provided in the JSON above. 
      
      MANDATORY: You MUST include the following items in the outfit: ${lockedItemIds.length > 0 ? lockedItemIds.join(', ') : 'None specified'}. 
      Build the rest of the outfit around these pieces.
      
      Usually an outfit consists of 1 top and 1 bottom (or 1 dress), plus outerwear (optional) and shoes.
      
      Return ONLY a valid JSON object with the exact following structure, with NO comments inside the JSON, and no other text:
      {
        "name": "A catchy name for the outfit",
        "itemIds": ["id1", "id2"],
        "matchScore": 95,
        "seasonalFit": "Brief explanation of what weather this is good for",
        "styleVibe": "e.g., 'Minimalist Chic' or 'Streetwear'",
        "reasoning": "A short 1-sentence explanation of why these pieces work together for the occasion.",
        "imagePrompt": "A highly detailed, photographic prompt for an AI Image Generator (like Midjourney or DALL-E) to generate a picture of a person matching the User Profile exactly, wearing this exact outfit. Describe the clothing colors, materials, the person's physical features, and the background setting based on the occasion."
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Robustly extract JSON block
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const cleanedText = jsonMatch ? jsonMatch[0] : responseText;
    
    const data = JSON.parse(cleanedText) as OutfitRecommendation;
    return data;
  } catch (error) {
    console.error("Gemini API Error generating outfit:", error);
    throw error;
  }
}

export interface UserProfilePrediction {
  gender: string;
  bodyType: string;
  skinTone: string;
  hairColor: string;
  colorSeason: string;
  outfitColors: { name: string; hex: string }[];
  jewelry: string;
  makeup: string;
  fashionPersona: string[];
}

export async function analyzeUserProfileImage(file: File): Promise<UserProfilePrediction> {
  if (!(import.meta as any).env.VITE_GEMINI_API_KEY) {
    throw new Error("Missing VITE_GEMINI_API_KEY in .env file");
  }

  try {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "missing_key";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
      You are an expert personal stylist and color analyst. 
      Analyze the attached image of a person. 
      Return ONLY a valid JSON object with the exact following structure, with NO comments inside the JSON, predicting their traits:
      {
        "gender": "Female, Male, Androgynous, or Non-binary",
        "bodyType": "Slim, Athletic, Average, Curvy, or Plus Size",
        "skinTone": "Very Light, Light, Medium, Olive, Dark, or Deep",
        "hairColor": "e.g., Blonde, Brown, Black, Red, Pink",
        "colorSeason": "Their Seasonal Color Palette (e.g., Spring, Summer, Autumn, Winter)",
        "outfitColors": [
          {"name": "Navy Blue", "hex": "#000080"},
          {"name": "Emerald Green", "hex": "#50C878"}
        ],
        "jewelry": "Gold, Silver, or Rose Gold based on skin undertones",
        "makeup": "Brief recommendation for lip and blush shades (e.g., Warm peach, cool berry)",
        "fashionPersona": ["Sweet", "Feminine", "Hijab", "Minimalist"]
      }
    `;

    const imagePart = await fileToGenerativePart(file);

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    // Robustly extract JSON block
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const cleanedText = jsonMatch ? jsonMatch[0] : responseText;
    
    const data = JSON.parse(cleanedText) as UserProfilePrediction;
    return data;
  } catch (error) {
    console.error("Gemini API Error analyzing user profile:", error);
    throw error;
  }
}

/**
 * Generates a realistic 'Try On' image using the Imagen 3.0 Nano Banana 2 model.
 * This function uses a dedicated API key as requested.
 */
/**
 * Generates a realistic 'Try On' image using the Gemini 3.1 Flash Image model.
 * This version combines the user's uploaded photo with the outfit description.
 */
export async function generateTryOnImage(prompt: string, userImageUrl?: string): Promise<string> {
  const currentApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "missing_key";
  const tryOnAI = new GoogleGenerativeAI(currentApiKey);
  
  try {
    const model = tryOnAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });

    const contentParts: any[] = [prompt];

    if (userImageUrl) {
      try {
        const response = await fetch(userImageUrl);
        const blob = await response.blob();
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
        
        contentParts.push({
          inlineData: {
            data: base64Data,
            mimeType: blob.type
          }
        });
        
        // Add specific instruction for combining
        contentParts[0] = `Combine the style and clothing from the prompt below with the person in the attached image. The final result should show the person from the image wearing the outfit described. \n\nPROMPT: ${prompt}`;
      } catch (imageError) {
        console.warn("Failed to fetch user image for try-on, proceeding with prompt only:", imageError);
      }
    }

    const result = await model.generateContent(contentParts);
    const response = await result.response;
    
    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    
    if (part?.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    
    // Some models return text describing the image or a link
    const text = response.text();
    if (text.startsWith("http")) return text;
    
    throw new Error("No image data returned from model.");
  } catch (error) {
    console.error("Error generating Try On image:", error);
    throw error;
  }
}
