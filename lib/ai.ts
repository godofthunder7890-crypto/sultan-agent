export type AIMessage = { role: 'user' | 'assistant'; content: string };

export type AISettings = {
  groqKey: string;
  openaiKey: string;
  geminiKey: string;
  serperKey: string;
};

const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
const GEMINI_MODELS = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'];

export function getProvider(model: string): 'groq' | 'openai' | 'gemini' {
  if (OPENAI_MODELS.includes(model)) return 'openai';
  if (GEMINI_MODELS.includes(model)) return 'gemini';
  return 'groq';
}

export async function callAI(
  messages: AIMessage[],
  model: string,
  settings: AISettings,
  systemPrompt: string,
): Promise<string> {
  const provider = getProvider(model);
  if (provider === 'openai') return callOpenAI(messages, model, settings.openaiKey, systemPrompt);
  if (provider === 'gemini') return callGemini(messages, model, settings.geminiKey, systemPrompt);
  return callGroq(messages, model, settings.groqKey, systemPrompt);
}

async function callGroq(messages: AIMessage[], model: string, key: string, system: string): Promise<string> {
  if (!key) throw new Error('Groq API key missing. Settings tab mein daalo → groq.com/keys (free hai)');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, ...messages],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content as string;
}

async function callOpenAI(messages: AIMessage[], model: string, key: string, system: string): Promise<string> {
  if (!key) throw new Error('OpenAI API key missing. Settings tab mein daalo → platform.openai.com/api-keys');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, ...messages],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content as string;
}

async function callGemini(messages: AIMessage[], model: string, key: string, system: string): Promise<string> {
  if (!key) throw new Error('Gemini API key missing. Settings tab mein daalo → aistudio.google.com');
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
      }),
    },
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text as string;
}

export async function webSearch(searchQuery: string, serperKey: string): Promise<string> {
  if (!serperKey) return 'Serper API key missing. Settings mein daalo → serper.dev (free 2500 searches/month)';
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: searchQuery, num: 5 }),
    });
    const data = await res.json();
    const results = (data.organic ?? []).slice(0, 5)
      .map((r: { title: string; snippet: string; link: string }, i: number) =>
        `${i + 1}. ${r.title}\n${r.snippet}\nSource: ${r.link}`)
      .join('\n\n');
    return results || 'Koi result nahi mila.';
  } catch {
    return 'Web search fail. Internet check karo.';
  }
}
