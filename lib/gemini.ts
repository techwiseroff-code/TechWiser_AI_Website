import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODELS } from "./openrouter";

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GenerationResult {
  files: GeneratedFile[];
  description: string;
}

export interface AIConfig {
  geminiKey?: string;
  openRouterKey?: string;
  model?: string;
}

const SYSTEM_INSTRUCTION = `
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
  8. EFFICIENCY: Only generate necessary files. Do not include package.json, tsconfig.json, or other config files unless explicitly asked. Focus on the source code.
  9. NO IMAGES: In generation avoid images. Do not use or generate any placeholder images or external image links. Use Lucide icons instead.
  10. FUNCTIONALITY: Make sure the website is fully functional and all buttons are clickable with appropriate event handlers.
  
  The JSON structure must be:
  {
    "files": [
      { "path": "App.tsx", "content": "..." },
      { "path": "components/Button.tsx", "content": "..." }
    ],
    "description": "Brief explanation of what was built"
  }
`;

const callOpenRouter = async (prompt: string, history: any[], config: AIConfig): Promise<GenerationResult> => {
  const apiKey = config.openRouterKey || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouter API Key is required for this model.");
  }

  const messages = [
    { role: "system", content: SYSTEM_INSTRUCTION + "\n\nRETURN JSON ONLY." },
    ...history.map(msg => ({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.content })),
    { role: "user", content: prompt }
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : "https://techwiser.ai",
      "X-Title": "TechWiser"
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages
    })
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || JSON.stringify(errorData);
    } catch {
      // If the error isn't JSON, try to read it as text
      const errorText = await response.text();
      if (errorText) errorMessage = errorText;
    }

    // Check for provider limits/errors
    if (response.status === 429 || errorMessage.toLowerCase().includes("limit") || errorMessage.toLowerCase().includes("quota")) {
      throw new Error(`OpenRouter Quota Exceeded (${config.model}): Please check your API credits or try a different free model.`);
    }

    throw new Error(`OpenRouter Error: ${errorMessage}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    return JSON.parse(content);
  } catch (e) {
    // Try to extract JSON if wrapped in markdown
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extractedContent = jsonMatch[1] !== undefined ? jsonMatch[1] : jsonMatch[0];
      try {
        return JSON.parse(extractedContent);
      } catch (parseAttemptError) {
        console.error("Failed to parse extracted JSON:", parseAttemptError, extractedContent.substring(0, 100));
        throw new Error("Could not parse the AI's generated code structure. Please try again.");
      }
    }
    console.error("Failed to parse OpenRouter response", e, content.substring(0, 100));
    throw new Error("Invalid format returned from AI model. Please try again.");
  }
};

export const generateCode = async (
  prompt: string,
  history: { role: string; content: string }[] = [],
  config: AIConfig = {}
): Promise<GenerationResult> => {
  const model = config.model || 'gemini-2.5-flash';

  // Check if model is a built-in Gemini model (uses Google GenAI SDK directly)
  const isGeminiModel = GEMINI_MODELS.some(m => m.id === model);

  if (!isGeminiModel) {
    return callOpenRouter(prompt, history, config);
  }

  // Use Google GenAI SDK
  const apiKey = config.geminiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please check your environment variables or settings.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Format history for the model
  const formattedHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  // Add the current prompt
  const contents = [
    ...formattedHistory,
    { role: "user", parts: [{ text: `System: ${SYSTEM_INSTRUCTION}\n\nUser Request: ${prompt}` }] }
  ];

  try {
    const response = await ai.models.generateContent({
      model: model, // Use the selected Gemini model
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
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Handle specific API errors like 429 Quota Exceeded
    if (error?.status === 429 || error?.message?.includes("exceeded your current quota") || error?.message?.includes("429")) {
      throw new Error("API Quota Exceeded: You have reached the rate limit for this model. Please try again later or use your own API key.");
    }
    // Generic re-throw with user-friendly message if possible
    throw new Error(error?.message || "Failed to communicate with the Gemini API. Please check your API key and internet connection.");
  }
};
