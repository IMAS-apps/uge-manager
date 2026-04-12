import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthView } from '../AuthView';

// ── Supabase mock ──────────────────────────────────────────────────────────
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}));

import { supabase } from '../../lib/supabase';

const mockSignIn = supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>;
const mockSignUp = supabase.auth.signUp as ReturnType<typeof vi.fn>;
const mockMaybeSingle = (supabase as any).maybeSingle as ReturnType<typeof vi.fn>;

// ── Helpers ────────────────────────────────────────────────────────────────

const mockProfile = {
  id: 'user-uuid-1',
  full_name: 'Joan Garcia',
  email: 'joan@example.com',
  role: 'Gestió',
};

const mockSession = {
  user: {
    id: 'user-uuid-1',
    email: 'joan@example.com',
    user_metadata: {},
  },
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('AuthView', () => {
  const onLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  it('should render the login form by default', () => {
    render(<AuthView onLogin={onLogin} />);
    expect(screen.getByRole('button', { name: /iniciar sessió/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/correu electrònic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contrasenya/i)).toBeInTheDocument();
    // Full name field only appears in register mode
    expect(screen.queryByLabelText(/nom complet/i)).not.toBeInTheDocument();
  });

  it('should render the brand name "IMAS"', () => {
    render(<AuthView onLogin={onLogin} />);
    expect(screen.getByRole('heading', { name: /imas/i })).toBeInTheDocument();
  });

  // ── Mode switching ───────────────────────────────────────────────────────

  it('should switch to register mode when the signup link is clicked', async () => {
    const user = userEvent.setup();
    render(<AuthView onLogin={onLogin} />);
    await user.click(screen.getByRole('button', { name: /registra't/i }));
    expect(screen.getByLabelText(/nom complet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar-se/i })).toBeInTheDocument();
  });

  it('should switch back to login mode when the login link is clicked from register mode', async () => {
    const user = userEvent.setup();
    render(<AuthView onLogin={onLogin} />);
    await user.click(screen.getByRole('button', { name: /registra't/i }));
    await user.click(screen.getByRole('button', { name: /inicia sessió/i }));
    expect(screen.queryByLabelText(/nom complet/i)).not.toBeInTheDocument();
  });

  // ── Login — happy path ───────────────────────────────────────────────────

  it('should call onLogin with user data when login succeeds', async () => {
    mockSignIn.mockResolvedValue({ data: { user: mockSession.user }, error: null });
    mockMaybeSingle.mockResolvedValue({ data: mockProfile, error: null });

    const user = userEvent.setup();
    render(<AuthView onLogin={onLogin} />);

    await user.type(screen.getByLabelText(/correu electrònic/i), 'joan@example.com');
    await user.type(screen.getByLabelText(/contrasenya/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sessió/i }));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'joan@example.com',
          full_name: 'Joan Garcia',
          role: 'Gestió',
        })
      );
    });
  });

  // ── Login — error path ───────────────────────────────────────────────────

  it('should display an error message when login credentials are invalid', async () => {
    mockSignIn.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });

    const user = userEvent.setup();
    render(<AuthView onLogin={onLogin} />);

    await user.type(screen.getByLabelText(/correu electrònic/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/contrasenya/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /iniciar sessió/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
    });
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('should clear the error message when switching between login and register modes', async () => {
    mockSignIn.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });

    const user = userEvent.setup();
    render(<AuthView onLogin={onLogin} />);

    await user.type(screen.getByLabelText(/correu electrònic/i), 'bad@example.com');
    await user.type(screen.getByLabelText(/contrasenya/i), 'bad');
    await user.click(screen.getByRole('button', { name: /iniciar sessió/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
    });

    // Switch to register clears the error
    await user.click(screen.getByRole('button', { name: /registra't/i }));
    expect(screen.queryByText(/invalid login credentials/i)).not.toBeInTheDocument();
  });

  // ── Register — happy path ─────────────────────────────────────────────────

  it('should show a success message after successful registration', async () => {
    mockSignUp.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<AuthView onLogin={onLogin} />);

    // Switch to register mode
    await user.click(screen.getByRole('button', { name: /registra't/i }));

    await user.type(screen.getByLabelText(/nom complet/i), 'Maria López');
    await user.type(screen.getByLabelText(/correu electrònic/i), 'maria@example.com');
    await user.type(screen.getByLabelText(/contrasenya/i), 'securepass123');
    await user.click(screen.getByRole('button', { name: /registrar-se/i }));

    await waitFor(() => {
      expect(screen.getByText(/registre correcte/i)).toBeInTheDocument();
    });
  });

  // ── Register — error path ─────────────────────────────────────────────────

  it('should display an error when registration fails', async () => {
    mockSignUp.mockResolvedValue({
      error: { message: 'Email already exists' },
    });

    const user = userEvent.setup();
    render(<AuthView onLogin={onLogin} />);

    await user.click(screen.getByRole('button', { name: /registra't/i }));
    await user.type(screen.getByLabelText(/nom complet/i), 'Existent User');
    await user.type(screen.getByLabelText(/correu electrònic/i), 'exists@example.com');
    await user.type(screen.getByLabelText(/contrasenya/i), 'password123');
    await user.click(screen.getByRole('button', { name: /registrar-se/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it('should disable the submit button while a request is in progress', async () => {
    // Never resolves → keeps loading state active
    mockSignIn.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();
    render(<AuthView onLogin={onLogin} />);

    await user.type(screen.getByLabelText(/correu electrònic/i), 'joan@example.com');
    await user.type(screen.getByLabelText(/contrasenya/i), 'password123');
    
    const submitBtn = screen.getByRole('button', { name: /iniciar sessió/i });
    await user.click(submitBtn);

    // Because the button shows a spinner and hides the text during loading,
    // its accessible name disappears. However, it still retains its DOM identity.
    expect(submitBtn).toBeDisabled();
  });
});
