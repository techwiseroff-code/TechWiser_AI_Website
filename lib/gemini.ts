import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODELS } from "./openrouter";

/* =========================
   TYPES (FIXED)
========================= */

type ChatRole = "user" | "assistant" | "system";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

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

/* =========================
   SYSTEM PROMPT (IMPROVED)
========================= */

const SYSTEM_INSTRUCTION = `
You are TechWiser AI, an expert full-stack engineer.

STRICT RULES:
- Always return properly formatted code
- Always follow Markdown format:

### SUMMARY
text

### FILE: filename.tsx
\`\`\`tsx
code
\`\`\`

CRITICAL:
- NEVER break syntax
- ALWAYS escape quotes inside strings
- ALWAYS use valid TypeScript/React code
`;

/* =========================
   ROLE NORMALIZER (FIX)
========================= */

const normalizeRole = (role: string): ChatRole => {
  if (role === "assistant" || role === "system") return role;
  return "user";
};

/* =========================
   PARSER (HARDENED)
========================= */

function parseMarkdownResponse(content: string): GenerationResult {
  const result: GenerationResult = {
    files: [],
    description: "Code generated successfully.",
  };

  // Extract summary
  const summaryMatch = content.match(/###\s*SUMMARY\s*\n([\s\S]*?)(?=###\s*FILE:|$)/i);
  if (summaryMatch) {
    result.description = summaryMatch[1].trim();
  }

  // Extract files
  const fileRegex = /###\s*FILE:\s*([^\n]+)\n```[a-zA-Z]*\n([\s\S]*?)```/g;
  let match;

  while ((match = fileRegex.exec(content)) !== null) {
    result.files.push({
      path: match[1].trim(),
      content: sanitizeCode(match[2].trim()),
    });
  }

  if (result.files.length === 0) {
    throw new Error("AI response format invalid. No files found.");
  }

  return result;
}

/* =========================
   SANITIZER (VERY IMPORTANT)
========================= */

function sanitizeCode(code: string): string {
  return code
    // Fix unescaped quotes inside strings
    .replace(/'([^']*?)'s/g, "'$1\\'s")
    // Remove accidental double commas
    .replace(/,,+/g, ",")
    // Fix missing semicolons (basic)
    .replace(/([^;\n])\n/g, "$1;\n");
}

/* =========================
   OPENROUTER CALL
========================= */

const callOpenRouter = async (
  prompt: string,
  history: ChatMessage[],
  config: AIConfig
): Promise<GenerationResult> => {
  const apiKey =
    config.openRouterKey || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OpenRouter API key missing");
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_INSTRUCTION },
    ...history.map((msg): ChatMessage => ({
      role: normalizeRole(msg.role),
      content: msg.content,
    })),
    { role: "user", content: prompt },
  ];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error("OpenRouter Error: " + err);
  }

  const data = await res.json();
  return parseMarkdownResponse(data.choices[0].message.content);
};

/* =========================
   MAIN GENERATOR (FIXED)
========================= */

export const generateCode = async (
  prompt: string,
  history: ChatMessage[] = [],
  config: AIConfig = {}
): Promise<GenerationResult> => {
  const model = config.model || "gemini-2.5-flash";
  const isGemini = GEMINI_MODELS.some((m) => m.id === model);

  if (!isGemini) {
    return callOpenRouter(prompt, history, config);
  }

  const apiKey =
    config.geminiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  const contents = [
    ...history.map((msg) => ({
      role: normalizeRole(msg.role) === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
    {
      role: "user",
      parts: [
        {
          text: `${SYSTEM_INSTRUCTION}\n\nUser Request:\n${prompt}`,
        },
      ],
    },
  ];

  try {
    const res = await ai.models.generateContent({
      model,
      contents,
    });

    if (!res.text) throw new Error("Empty AI response");

    return parseMarkdownResponse(res.text);
  } catch (err: any) {
    console.error(err);
    throw new Error(err.message || "Gemini failed");
  }
};

/* =========================
   PROMPT ENHANCER
========================= */

export const enhancePrompt = async (
  input: string,
  config: AIConfig = {}
): Promise<string> => {
  const model = config.model || "gemini-2.5-flash";
  const isGemini = GEMINI_MODELS.some((m) => m.id === model);

  const system = `
Expand the idea into a professional product description (100-150 words).
Return only the paragraph.
`;

  if (!isGemini) {
    const apiKey =
      config.openRouterKey || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: input },
        ],
      }),
    });

    const data = await res.json();
    return data.choices[0].message.content.trim();
  }

  const apiKey =
    config.geminiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const ai = new GoogleGenAI({ apiKey });

  const res = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: `${system}\n\n${input}` }],
      },
    ],
  });

  return res.text?.trim() || "";
};