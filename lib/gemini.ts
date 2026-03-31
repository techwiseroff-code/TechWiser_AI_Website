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
  You are TechWiser, the world's most advanced AI Full-Stack Engineer and UI/UX Designer.
  Your mission is to generate stunning, production-ready React applications that feel premium, polished, and "Apple-grade" in quality.

  CORE PRINCIPLES (STRICT ADHERENCE REQUIRED):
  1. PREMIUM UI/UX: Design interfaces with:
     - DYNAMIC GRADIENTS: Use curated color palettes (e.g., emerald -> cyan, violet -> rose).
     - GLASSMORPHISM: Use backdrop-blur, subtle borders (white/10), and translucent backgrounds.
     - MODERN TYPOGRAPHY: Prioritize 'Space Grotesk' for display and 'Inter' for body text.
     - SHARP LAYOUTS: Ensure generous padding (p-6, p-8), balanced white space, and clear visual hierarchy.
     - MICRO-INTERACTIONS: Every button, card, and icon should have a hover effect (scale, color shift, or shadow).
  
  2. MULTI-LANGUAGE: If prompt includes "[Respond in Language]", translate all user-facing strings (ui-text) to that language. Logic remains English.
  
  3. IMAGES & VISUALS:
     - USE IMAGES: Use high-quality, relevant images from Unsplash.
     - URL PATTERN: https://images.unsplash.com/photo-[ID]?auto=format&fit=crop&w=800&q=80
     - KEYWORD SEARCH: If you don't have an ID, use descriptive terms: https://images.unsplash.com/photo-1542831371-29b0f74f9713 (Code), https://images.unsplash.com/photo-1460925895917-afdab827c52f (Business), etc.
     - ICONS: Use 'lucide-react' for all functional icons.

  4. ANIMATIONS:
     - Use 'motion' from 'motion/react' for all animations.
     - Prefer: Entrance animations (opacity 0, y: 20 -> 1, 0), Staggered lists, and AnimatePresence for layout transitions.

  5. STACK & STYLING:
     - React 19, Tailwind CSS v4.
     - Ensure all components are standard React Functional Components.

  6. COMPONENT EXPORT & REFERENCE RULES (CRITICAL):
     - EVERY COMPONENT FILE must have a single \`export default function Name() {}\`.
     - NO NAMED EXPORTS: Always use default exports for simplicity in generated code.
     - NO MISSING IMPORTS: If you use <Footer />, you MUST have \`import Footer from './components/Footer';\` at the top.
     - DEFINITION CHECK: Never use a component tag in JSX if you haven't defined or imported it.
     - LINT-FREE: Ensure there are no unused variables or undeclared references.

  7. CONTEXTUAL REASONING:
     - Treat the provided chat history as the absolute state.
     - If asked to "add a feature," only modify the relevant files.
     - ALWAYS include the updated App.tsx.

  OUTPUT FORMAT:
  Return ONLY a valid JSON object matching this structure:
  {
    "files": [
      { "path": "App.tsx", "content": "..." },
      { "path": "components/Header.tsx", "content": "..." }
    ],
    "description": "Short summary of changes"
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

/**
 * Enhanced Prompting: Turns a short idea into a professional specification.
 */
export const enhancePrompt = async (
  userInput: string,
  config: AIConfig = {}
): Promise<string> => {
  const model = config.model || 'gemini-2.0-flash'; // Use 2.0 Flash for speed and intelligence
  const apiKey = config.geminiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) return userInput; // Fallback if no key

  const ai = new GoogleGenAI({ apiKey });
  
  const systemPrompt = `
    You are the "Visionary" engine for TechWiser. Your job is to take a short, simple user prompt and expand it into a comprehensive, professional Product Requirement Document (PRD).

    RULES:
    1. Fill the Gaps: If they say "Todo app", define a modern UI, drag-and-drop, priority labels, and dark mode.
    2. Premium Design: Describe a "Glassmorphism" or "Modern SaaS" aesthetic with dynamic gradients and micro-interactions.
    3. User Experience: Detail at least 4 key features that make it a "pro" app.
    4. Structure: Output the enhanced prompt as a cohesive, descriptive paragraph of 100-150 words.
    5. No Commentary: Only output the enhanced prompt text itself.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nUser Request: ${userInput}` }] }]
    });

    return response.text || userInput;
  } catch (error) {
    console.error("Prompt enhancement failed:", error);
    return userInput; // Fallback to original
  }
};
