import OpenAI from "openai";

const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || "missing_key";
const openai = new OpenAI({ 
  apiKey,
  dangerouslyAllowBrowser: true // Required for client-side usage in Vite
});

export async function generateTryOnImageOpenAI(
  outfit: { top?: string; bottom?: string; shoes?: string; accessories?: string }, 
  userImageUrl?: string,
  clothingImageUrls: string[] = []
): Promise<string> {
  try {
    const prompt = `
Create a photorealistic virtual try-on. 
STRICT RULES:
- Do NOT create a new outfit
- Do NOT simplify the clothing
- Copy the exact clothing design, structure, and colors from the provided reference images
- Keep the exact same person, face, hijab, body shape, pose, lighting, background, and camera angle. 
- Replace only the clothing using these specific reference images: ${clothingImageUrls.join(", ")}. 
- Ensure realistic fabric folds, shadows, and texture. 
- Do not generate a new person.
    `.trim();

    // Fetch the user's image and convert to a square PNG
    const responseImage = await fetch(userImageUrl || "");
    const blob = await responseImage.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    
    // Scale down if image is too large (max 2048px on either side)
    const MAX_SIZE = 2048;
    let width = bitmap.width;
    let height = bitmap.height;
    if (width > height) {
      if (width > MAX_SIZE) {
        height = Math.round((height * MAX_SIZE) / width);
        width = MAX_SIZE;
      }
    } else {
      if (height > MAX_SIZE) {
        width = Math.round((width * MAX_SIZE) / height);
        height = MAX_SIZE;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    ctx.drawImage(bitmap, 0, 0, width, height);
    const pngBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
    const personFile = new File([pngBlob], "person.png", { type: "image/png" });

    // Process all clothing images
    const clothingFiles: File[] = await Promise.all(
      clothingImageUrls.map(async (url, index) => {
        const response = await fetch(url);
        const b = await response.blob();
        const bmp = await createImageBitmap(b);
        const c = document.createElement("canvas");
        c.width = 1024;
        c.height = 1024;
        const cx = c.getContext("2d");
        if (!cx) throw new Error("Could not get context");
        cx.drawImage(bmp, 0, 0, bmp.width, bmp.height, 0, 0, 1024, 1024);
        const pBlob = await new Promise<Blob>((res) => c.toBlob((bl) => res(bl!), "image/png"));
        return new File([pBlob], `clothing_${index}.png`, { type: "image/png" });
      })
    );

    // Prepare FormData for raw API call to bypass SDK validation
    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("image[]", personFile); // First image = person image
    
    // Append all clothing images
    clothingFiles.forEach(file => {
      formData.append("image[]", file);
    });
    
    formData.append("prompt", prompt);

    const apiResponse = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error("Full OpenAI Error Response:", errorData);
      throw new Error(errorData.error?.message || "OpenAI API request failed");
    }

    const result = await apiResponse.json();
    
    // After receiving response: read result.data[0].b64_json
    const imageBase64 = result.data[0]?.b64_json;
    
    if (!imageBase64) {
      console.log("Full OpenAI response:", result);
      throw new Error("No image returned from OpenAI");
    }

    // Convert to: data:image/png;base64,...
    const dataUrl = `data:image/png;base64,${imageBase64}`;
    
    // Return the data URL (Frontend uses this directly)
    return dataUrl;
  } catch (error) {
    console.error("OpenAI Image Edit Error:", error);
    throw error;
  }
}
