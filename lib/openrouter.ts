export interface OpenRouterModel {
    id: string;
    name: string;
    description: string;
    contextLength: number;
    pricing: {
        prompt: string;   // cost per token (string from API)
        completion: string;
    };
    provider: string;
    isGemini?: boolean; // true for built-in Gemini models
}

// Built-in Gemini models (use Google GenAI SDK directly, no OpenRouter needed)
export const GEMINI_MODELS: OpenRouterModel[] = [
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Fast, efficient model ideal for quick code generation and iteration. Great balance of speed and quality.',
        contextLength: 1048576,
        pricing: { prompt: 'Free tier available', completion: 'Free tier available' },
        provider: 'Google',
        isGemini: true,
    },
];

// Popular coding-capable models to prioritize from OpenRouter results
const FEATURED_MODEL_IDS = new Set([
    'stepfun/step-3.5-flash:free',
    'arcee-ai/trinity-large-preview:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
]);

interface OpenRouterAPIModel {
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    pricing?: {
        prompt?: string;
        completion?: string;
    };
    supported_parameters?: string[];
    architecture?: {
        modality?: string;
    };
}

let cachedModels: OpenRouterModel[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
    // Return cache if fresh
    if (cachedModels && Date.now() - cacheTimestamp < CACHE_DURATION) {
        return cachedModels;
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.statusText}`);
        }

        const data = await response.json();
        const rawModels: OpenRouterAPIModel[] = data.data || [];

        // Filter to text-capable models, keeping only explicitly requested models
        const models: OpenRouterModel[] = rawModels
            .filter((m) => FEATURED_MODEL_IDS.has(m.id))
            .map((m) => {
                const provider = m.id.split('/')[0] || 'Unknown';
                return {
                    id: m.id,
                    name: m.name || m.id,
                    description: m.description || 'No description available.',
                    contextLength: m.context_length || 0,
                    pricing: {
                        prompt: m.pricing?.prompt || '0',
                        completion: m.pricing?.completion || '0',
                    },
                    provider: formatProvider(provider),
                };
            })
            .sort((a, b) => {
                const aFeatured = FEATURED_MODEL_IDS.has(a.id);
                const bFeatured = FEATURED_MODEL_IDS.has(b.id);
                if (aFeatured && !bFeatured) return -1;
                if (!aFeatured && bFeatured) return 1;
                return a.name.localeCompare(b.name);
            });

        cachedModels = models;
        cacheTimestamp = Date.now();
        return models;
    } catch (error) {
        console.error('Failed to fetch OpenRouter models:', error);
        // Return fallback models
        return getFallbackModels();
    }
}

function formatProvider(raw: string): string {
    const map: Record<string, string> = {
        'anthropic': 'Anthropic',
        'openai': 'OpenAI',
        'google': 'Google',
        'deepseek': 'DeepSeek',
        'meta-llama': 'Meta',
        'mistralai': 'Mistral',
        'qwen': 'Qwen',
        'cohere': 'Cohere',
    };
    return map[raw] || raw.charAt(0).toUpperCase() + raw.slice(1);
}

function getFallbackModels(): OpenRouterModel[] {
    return [
        { id: 'stepfun/step-3.5-flash:free', name: 'StepFun 3.5 Flash', description: 'Fast free model from StepFun.', contextLength: 8192, pricing: { prompt: '0', completion: '0' }, provider: 'StepFun' },
        { id: 'arcee-ai/trinity-large-preview:free', name: 'Trinity Large Preview', description: 'Free preview model by Arcee AI.', contextLength: 8192, pricing: { prompt: '0', completion: '0' }, provider: 'Arcee AI' },
        { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron 3 Nano', description: 'Nvidia lightweight model.', contextLength: 8192, pricing: { prompt: '0', completion: '0' }, provider: 'Nvidia' },
    ];
}

export function formatPricing(pricePerToken: string): string {
    const price = parseFloat(pricePerToken);
    if (isNaN(price) || price === 0) return 'Free';
    // Convert per-token to per-million-tokens
    const perMillion = price * 1_000_000;
    if (perMillion < 0.01) return '<$0.01/M';
    return `$${perMillion.toFixed(2)}/M`;
}

export function formatContextLength(length: number): string {
    if (length >= 1_000_000) return `${(length / 1_000_000).toFixed(1)}M`;
    if (length >= 1_000) return `${Math.round(length / 1_000)}K`;
    return `${length}`;
}
