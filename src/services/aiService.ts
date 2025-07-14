import { GoogleGenAI } from '@google/genai';

export interface IssueDraft {
  title: string;
  description: string;
  acceptanceCriteria?: string;
  dependencies?: string;
}

export interface EpicDraft {
  title: string;
  description: string;
}

export type AIBackend = 'openai' | 'gemini';

export async function generateIssue(
  prompt: string,
  backend: AIBackend = 'openai'
): Promise<IssueDraft> {
  const systemPrompt =
    'You are a helpful assistant that writes GitLab issue titles and descriptions in Markdown. Respond ONLY with valid JSON with keys "title", "description", "acceptanceCriteria", and "dependencies".';
  return generateDraft<IssueDraft>({ backend, systemPrompt, userPrompt: prompt });
}

export async function generateEpic(
  prompt: string,
  backend: AIBackend = 'openai'
): Promise<EpicDraft> {
  const systemPrompt =
    'You are a helpful assistant that writes GitLab epic titles and descriptions in Markdown. Respond ONLY with valid JSON with keys "title" and "description".';
  return generateDraft<EpicDraft>({ backend, systemPrompt, userPrompt: prompt });
}

async function generateDraft<T>({
  backend,
  systemPrompt,
  userPrompt,
  temperature = 0.5,
}: {
  backend: AIBackend;
  systemPrompt: string; 
  userPrompt: string;   
  temperature?: number;
}): Promise<T> {
  const fullPrompt = buildPrompt(systemPrompt, userPrompt);
  const raw = await callLLM(backend, fullPrompt, temperature);
  const jsonString = extractJson(raw);
  return safeJsonParse(jsonString);
}


function buildPrompt(systemPrompt: string, userPrompt: string): string {
  return `${systemPrompt}\n\n${userPrompt}`;
}


async function callLLM(
  backend: AIBackend,
  prompt: string,
  temperature: number,
): Promise<string> {
  switch (backend) {
    case 'gemini':
      return callGemini(prompt);
    case 'openai':
    default:
      return callOpenAI(prompt, temperature);
  }
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY');

  const genAI = new GoogleGenAI({ apiKey });
  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return result.text ?? JSON.stringify(result);
}

async function callOpenAI(prompt: string, temperature: number): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) throw new Error('Missing VITE_OPENAI_API_KEY');

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: prompt.split('\n\n')[0] },
        { role: 'user', content: prompt.split('\n\n').slice(1).join('\n\n') },
      ],
      temperature,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function extractJson(text: string): string {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  return jsonMatch ? jsonMatch[1].trim() : text.trim();
}

function safeJsonParse<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.warn('Failed to parse JSON from LLM. Returning fallback.', err);
    return {} as T;
  }
}

