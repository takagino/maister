import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GoogleGenAI } from '@google/genai';

type Bindings = {
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

app.get('/', (c) => c.text('Gemini Worker is running!'));

const extractJson = (rawString: string): string => {
  const start = rawString.indexOf('{');
  if (start === -1) return rawString;

  let depth = 0;
  for (let i = start; i < rawString.length; i++) {
    if (rawString[i] === '{') depth++;
    if (rawString[i] === '}') depth--;

    if (depth === 0) {
      return rawString.substring(start, i + 1);
    }
  }
  return rawString;
};

app.post('/api/gemini', async (c) => {
  try {
    const body = await c.req.json<{ prompt: string; instruction?: string }>();
    const userPrompt = body.prompt;
    const systemInstruction =
      body.instruction || 'あなたは有能なアシスタントです。';

    if (!userPrompt) {
      return c.json({ error: 'プロンプトが必要です' }, 400);
    }

    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'APIキーが設定されていません' }, 500);
    }

    const genai = new GoogleGenAI({ apiKey: apiKey });

    const result = await genai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      config: {
        responseMimeType: 'application/json',
        systemInstruction: systemInstruction,
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
    });

    const responseText = result.text;
    const cleanText = extractJson(responseText);
    const jsonResponse = JSON.parse(cleanText);

    return c.json({ result: jsonResponse });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'AIエラーが発生しました' }, 500);
  }
});

export default app;
