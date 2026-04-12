/**
 * MSW handlers for external API mocks.
 * Currently mocks the Google Gemini API used by processTextWithAI.
 * Import these handlers in tests that need AI API interception.
 */
import { http, HttpResponse } from 'msw';

export const GEMINI_URL_PATTERN =
  'https://generativelanguage.googleapis.com/v1beta/models/:model\\:generateContent';

export const handlers = [
  // Default: successful Gemini response
  http.post(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
    () => {
      return HttpResponse.json({
        candidates: [
          {
            content: {
              parts: [{ text: 'Text corregit correctament.' }],
            },
          },
        ],
      });
    }
  ),
];

// Handler that simulates an API error (e.g. quota exceeded)
export const geminiErrorHandler = http.post(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
  () => {
    return HttpResponse.json(
      { error: { message: 'Quota exceeded' } },
      { status: 429 }
    );
  }
);

// Handler that returns an empty candidates array
export const geminiEmptyCandidatesHandler = http.post(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
  () => {
    return HttpResponse.json({ candidates: [] });
  }
);
