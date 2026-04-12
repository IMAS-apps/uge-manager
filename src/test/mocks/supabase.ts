/**
 * Mock del client Supabase per a tests unitaris i d'integració.
 * Substitueix el mòdul real per un objecte amb vi.fn() per evitar
 * connexions reals a la base de dades durant els tests.
 *
 * Ús: importa aquest mock al teu test o configura-ho via __mocks__/.
 */
import { vi } from 'vitest';

export const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  }),
  removeChannel: vi.fn(),
};

// Factory to reset all mocks between tests
export function resetSupabaseMocks() {
  Object.values(mockSupabaseClient.auth).forEach((fn) => {
    if (typeof fn === 'function' && 'mockReset' in fn) (fn as any).mockReset();
  });
}

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));
