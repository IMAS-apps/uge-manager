import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We must set up import.meta.env BEFORE importing the module under test
// We must set up import.meta.env BEFORE importing the module under test
// using vi.stubEnv.

describe('processTextWithAI', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  const setupFetch = (response: Partial<Response>) => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response as Response);
  };

  beforeEach(() => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key-123');
    // Default fetch mock to prevent any real network calls
    setupFetch({ ok: true, json: async () => ({ candidates: [] }) });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('should return the corrected text when the API responds successfully', async () => {
    setupFetch({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: '  Text corregit i netejat.  ' }] } },
        ],
      }),
    });
    const { processTextWithAI } = await import('../ai');
    const result = await processTextWithAI('text brut');
    expect(result).toBe('Text corregit i netejat.');
  });

  it('should return the original text unchanged when input is empty', async () => {
    const { processTextWithAI } = await import('../ai');
    const result = await processTextWithAI('');
    expect(result).toBe('');
  });

  it('should return the original text unchanged when input is only whitespace', async () => {
    const { processTextWithAI } = await import('../ai');
    const result = await processTextWithAI('   ');
    expect(result).toBe('   ');
  });

  it('should throw a descriptive error when the API key is not configured', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    const { processTextWithAI } = await import('../ai');
    await expect(processTextWithAI('text')).rejects.toThrow(
      "No s'ha configurat la clau d'API"
    );
  });

  it('should throw when the API response status is not ok', async () => {
    setupFetch({
      ok: false,
      json: async () => ({ error: { message: 'Quota exceeded' } }),
    });
    const { processTextWithAI } = await import('../ai');
    await expect(processTextWithAI('text')).rejects.toThrow('Quota exceeded');
  });

  it('should throw a fallback error message when non-ok response has no error body', async () => {
    setupFetch({
      ok: false,
      json: async () => { throw new Error('not json'); },
    });
    const { processTextWithAI } = await import('../ai');
    await expect(processTextWithAI('text')).rejects.toThrow(
      "L'API d'IA ha retornat un error desconegut."
    );
  });

  it('should throw when the API returns an empty candidates array', async () => {
    setupFetch({
      ok: true,
      json: async () => ({ candidates: [] }),
    });
    const { processTextWithAI } = await import('../ai');
    await expect(processTextWithAI('text')).rejects.toThrow(
      "Resposta no vàlida de l'assistent d'IA"
    );
  });

  it('should throw when the API returns no candidates field', async () => {
    setupFetch({
      ok: true,
      json: async () => ({}),
    });
    const { processTextWithAI } = await import('../ai');
    await expect(processTextWithAI('text')).rejects.toThrow(
      "Resposta no vàlida de l'assistent d'IA"
    );
  });

  it('should include the API key in the fetch call URL', async () => {
    setupFetch({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'ok' }] } }],
      }),
    });
    const { processTextWithAI } = await import('../ai');
    await processTextWithAI('text');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('test-api-key-123'),
      expect.any(Object)
    );
  });
});
