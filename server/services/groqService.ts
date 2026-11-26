
import Groq from 'groq-sdk';

export async function generateGroqResponse(
  prompt: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing from environment variables.');
  }

  const groq = new Groq({ apiKey });

  const response = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      {
        role: 'system',
        content:
          'You are Auryx, a friendly and intelligent personal finance assistant. Help users understand their spending, budgets, and savings. Be clear, practical, and concise. Never invent financial figures. Use only the financial information provided in the prompt.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.6,
  });

  const text = response.choices[0]?.message?.content?.trim();

  if (!text) {
    throw new Error('Groq returned an empty response.');
  }

  return text;
}
