import { GoogleGenAI } from '@google/genai';

export interface IssueSummary {
  summary: string;
}

export async function generateMilestoneSummary(
  milestoneTitle: string,
  issueTitles: string[],
  backend: 'openai' | 'gemini' = 'openai'
): Promise<IssueSummary> {
  const prompt = `Write a short summary for milestone "${milestoneTitle}" based on the following issues:\n${issueTitles
    .map((t, i) => `${i + 1}. ${t}`)
    .join('\n')}`;

  if (backend === 'gemini') {
    return generateSummaryWithGemini(prompt);
  } else if (backend === 'openai') {
    return generateSummaryWithOpenAI(prompt);
  } else {
    throw new Error(`Unsupported backend: ${backend}`);
  }
}

async function generateSummaryWithOpenAI(prompt: string): Promise<IssueSummary> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error('Missing VITE_OPENAI_API_KEY');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an assistant that summarizes software development milestones in Markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return { summary: data.choices[0].message.content.trim() };
}

async function generateSummaryWithGemini(prompt: string): Promise<IssueSummary> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY');
  }

  const genAI = new GoogleGenAI({ apiKey });

  const result = await genAI.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
  const text = result.text;

  return { summary: text || '' };
}
