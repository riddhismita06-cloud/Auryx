
import Groq from 'groq-sdk';

type ChatRole = 'user' | 'assistant';

interface ChatHistoryMessage {
  role: ChatRole;
  content: string;
}

export async function generateGroqResponse(
  financialContext: string,
  history: ChatHistoryMessage[],
  currentMessage: string
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
          'You are Auryx, a friendly and intelligent personal finance assistant. Help users understand spending, budgets, savings and planned purchases. Be clear, practical and concise. Use only the financial data supplied. Never invent financial figures. Remember the conversation context and understand follow-up questions. Format answers using Markdown when useful.\n\n' +
          financialContext,
      },

      ...history,

      {
        role: 'user',
        content: currentMessage,
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
