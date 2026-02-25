import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini AI client
// Note: NEXT_PUBLIC_GEMINI_API_KEY is injected by the platform
const getAI = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GenerationResult {
  files: GeneratedFile[];
  description: string;
}

export const generateCode = async (prompt: string, history: { role: string; content: string }[] = []): Promise<GenerationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
  
  const systemInstruction = `
    You are TechWiser, an expert AI Full-Stack Engineer and UI/UX Designer.
    Your task is to generate high-quality, production-ready React code using Tailwind CSS.
    
    CORE PRINCIPLES:
    1. LOVABLE UI: Design interfaces that feel "crafted," not just "coded." Use beautiful typography (Inter, Space Grotesk), subtle gradients, glassmorphism, and smooth animations (framer-motion).
    2. MULTI-LANGUAGE: If the user prompt starts with a language instruction like "[Respond in Hindi]", you MUST ensure that all user-facing text (titles, descriptions, button labels, placeholders) in the generated application is in that language. The code itself (variable names, logic) should remain in English.
    3. MOBILE FIRST: Every app must be fully responsive and feel like a native mobile app on small screens (touch-friendly targets, bottom navigation where appropriate).
    4. MODERN STACK: Use React 19, Tailwind CSS v4, and Lucide React icons.
    5. COMPONENT STRUCTURE: Organize code into logical components. Always include a main App.tsx that assembles the UI.
    6. Use 'lucide-react' for all icons.
    7. Use 'motion/react' for all animations.
    
    The JSON structure must be:
    {
      "files": [
        { "path": "App.tsx", "content": "..." },
        { "path": "components/Button.tsx", "content": "..." }
      ],
      "description": "Brief explanation of what was built"
    }
  `;

  // Format history for the model
  const formattedHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  // Add the current prompt
  const contents = [
    ...formattedHistory,
    { role: "user", parts: [{ text: `System: ${systemInstruction}\n\nUser Request: ${prompt}` }] }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          files: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                path: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ["path", "content"]
            }
          },
          description: { type: Type.STRING }
        },
        required: ["files", "description"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as GenerationResult;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("The AI returned an invalid response format. Please try again.");
  }
};
