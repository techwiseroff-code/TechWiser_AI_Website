import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODELS } from "./openrouter";

/* =========================
   TYPES
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
   SYSTEM PROMPT (STRICT)
========================= */

const SYSTEM_INSTRUCTION = `
You are TechWiser AI, expert full-stack engineer.

OUTPUT FORMAT (STRICT):

### SUMMARY
Short summary

### FILE: path/to/file.tsx
\`\`\`tsx
code
\`\`\`

CRITICAL RULES:
- NEVER generate duplicate files
- NEVER generate both App.tsx and src/App.tsx
- ONLY use ONE App file based on project structure
- ALWAYS overwrite existing files (same path)
- ALWAYS return valid TypeScript/React code
- ALWAYS escape quotes properly
`;

/* =========================
   HELPERS
========================= */

const normalizeRole = (role: string): ChatRole => {
  if (role === "assistant" || role === "system") return role;
  return "user";
};

const normalizePath = (path: string): string => {
  return path.trim().replace(/^\.\/+/, "").replace(/\\/g, "/");
};

const isAppFile = (path: string): boolean => {
  const p = normalizePath(path).toLowerCase();
  return p === "app.tsx" || p === "src/app.tsx";
};

/* =========================
   VALIDATION
========================= */

function validateAndFixFiles(files: GeneratedFile[]): GeneratedFile[] {
  const map = new Map<string, GeneratedFile>();

  for (const file of files) {
    const path = normalizePath(file.path);

    // overwrite duplicates safely
    map.set(path, {
      path,
      content: file.content.trim(),
    });
  }

  const finalFiles = [...map.values()];

  // ❗ CRITICAL: detect conflicting App.tsx
  const appFiles = finalFiles
    .map((f) => normalizePath(f.path).toLowerCase())
    .filter((p) => p === "app.tsx" || p === "src/app.tsx");

  const uniqueApp = new Set(appFiles);

  if (uniqueApp.size > 1) {
    throw new Error(
      "❌ AI generated multiple App entry files (App.tsx conflict). Regenerate."
    );
  }

  return finalFiles;
}

/* =========================
   PARSER (STRICT)
========================= */

function parseMarkdownResponse(content: string): GenerationResult {
  const result: GenerationResult = {
    files: [],
    description: "Generated successfully",
  };

  // Extract summary
  const summaryMatch = content.match(
    /###\s*SUMMARY\s*\n([\s\S]*?)(?=###\s*FILE:|$)/i
  );
  if (summaryMatch?.[1]) {
    result.description = summaryMatch[1].trim();
  }

  // Extract files
  const fileRegex =
    /###\s*FILE:\s*([^\n]+)\n```[a-zA-Z]*\n([\s\S]*?)```/g;

  let match: RegExpExecArray | null;

  while ((match = fileRegex.exec(content)) !== null) {
    result.files.push({
      path: normalizePath(match[1]),
      content: match[2].trim(),
    });
  }

  if (result.files.length === 0) {
    throw new Error("❌ Invalid AI response: No files found");
  }

  result.files = validateAndFixFiles(result.files);

  return result;
}

/* =========================
   OPENROUTER
========================= */

const callOpenRouter = async (
  prompt: string,
  history: ChatMessage[],
  config: AIConfig
): Promise<GenerationResult> => {
  const apiKey =
    config.openRouterKey || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  if (!apiKey) throw new Error("OpenRouter API key missing");

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
    const text = await res.text();
    throw new Error("OpenRouter Error: " + text);
  }

  const data = await res.json();
  return parseMarkdownResponse(data.choices[0].message.content);
};

/* =========================
   MAIN GENERATOR
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

  if (!apiKey) throw new Error("Gemini API key missing");

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

  const res = await ai.models.generateContent({
    model,
    contents,
  });

  if (!res.text) throw new Error("Empty Gemini response");

  return parseMarkdownResponse(res.text);
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
Expand this idea into a professional product description (100-150 words).
Return only text.
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