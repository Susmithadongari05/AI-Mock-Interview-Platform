import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error(
    '[Gemini] GEMINI_API_KEY is missing. Check your server .env file.',
  );
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Keep your existing model initially.
// You can override it using GEMINI_MODEL in server/.env.
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

const MAX_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 2000;

const wait = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

const isRetryableError = error => {
  const message = String(error?.message || '').toLowerCase();

  return (
    message.includes('503') ||
    message.includes('service unavailable') ||
    message.includes('high demand') ||
    message.includes('429') ||
    message.includes('resource exhausted') ||
    message.includes('rate limit') ||
    message.includes('500') ||
    message.includes('502') ||
    message.includes('504') ||
    message.includes('internal error') ||
    message.includes('temporarily unavailable')
  );
};

export const askGemini = async prompt => {
  if (!genAI) {
    throw new Error(
      'Gemini API key is missing. Configure GEMINI_API_KEY in server/.env.',
    );
  }

  if (!String(prompt || '').trim()) {
    throw new Error('Gemini prompt cannot be empty.');
  }

  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      console.log(
        `[Gemini] Using model: ${MODEL_NAME} (attempt ${attempt}/${MAX_ATTEMPTS})`,
      );

      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(
        String(prompt),
      );

      const response = result.response;
      const text = response.text();

      if (!text || !text.trim()) {
        throw new Error('Gemini returned an empty response.');
      }

      console.log('[Gemini] Response generated successfully.');

      return text;
    } catch (error) {
      lastError = error;

      console.error(
        `[Gemini] Attempt ${attempt}/${MAX_ATTEMPTS} failed:`,
        error?.message || error,
      );

      if (
        attempt === MAX_ATTEMPTS ||
        !isRetryableError(error)
      ) {
        break;
      }

      // Exponential backoff: 2 seconds, then 4 seconds.
      const delay =
        INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1);

      console.log(
        `[Gemini] Retrying in ${delay / 1000} seconds...`,
      );

      await wait(delay);
    }
  }

  throw new Error(
    `Gemini question generation failed after ${MAX_ATTEMPTS} attempts. ${
      lastError?.message || 'Unknown Gemini API error.'
    }`,
  );
};