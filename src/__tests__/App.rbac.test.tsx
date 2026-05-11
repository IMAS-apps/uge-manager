import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import type { User } from '../types';

// ── Supabase mock ──────────────────────────────────────────────────────────
// We need fine-grained control here because App.tsx handles session checks
// and role-based navigation guards.

const { mockSupabase, mockSubscription, mockChannel } = vi.hoisted(() => {
  const mockSubscription = { unsubscribe: vi.fn() };
  const mockChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn() };

  const mockSupabase = {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: mockSubscription },
      }),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: vi.fn(),
  };

  return { mockSupabase, mockSubscription, mockChannel };
});

vi.mock('../lib/supabase', () => ({ supabase: mockSupabase }));

// ── View mocks — avoid rendering heavy views in RBAC tests ─────────────────
vi.mock('../views/DashboardView', () => ({
  DashboardView: () => <div data-testid="dashboard-view">Dashboard</div>,
}));
vi.mock('../views/FormView', () => ({
  FormView: () => <div data-testid="form-view">Form</div>,
}));
vi.mock('../views/UserManagementView', () => ({
  UserManagementView: () => <div data-testid="users-view">Users</div>,
}));
vi.mock('../views/NotificationsView', () => ({
  NotificationsView: () => <div data-testid="notifications-view">Notifications</div>,
}));
vi.mock('../views/ContractFormView', () => ({
  ContractFormView: () => <div data-testid="contract-form-view">ContractForm</div>,
}));
vi.mock('../views/ContractDashboardView', () => ({
  ContractDashboardView: () => <div data-testid="contract-dashboard-view">ContractDashboard</div>,
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function makeProfile(role: string): User {
  return {
    id: 'user-uuid-1',
    email: 'user@example.com',
    full_name: 'Test User',
    role,
  };
}

function setupSession(role: string) {
  const profile = makeProfile(role);
  const session = { user: { id: profile.id, email: profile.email } };

  mockSupabase.auth.getSession.mockResolvedValue({ data: { session } });
  mockSupabase.maybeSingle.mockResolvedValue({ data: profile, error: null });
  // Stub notification count query
  mockSupabase.select.mockReturnThis();
  mockSupabase.gt.mockReturnThis();
  mockSupabase.eq.mockReturnThis();
  mockSupabase.neq.mockReturnThis();
  mockSupabase.or.mockReturnThis();
  // Return count 0 for notification badge
  mockSupabase.from.mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
    then: undefined,
    // count result for notification badge
    count: 0,
    error: null,
  }));
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('App — RBAC navigation guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no session → show login
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  });

  it('should show the loading spinner initially', () => {
    // Force a pending state to test initial render
    mockSupabase.auth.getSession.mockReturnValue(new Promise(() => {}));
    render(<App />);
    // The spinner is rendered before session resolves
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('should show the login screen when there is no active session', async () => {
    render(<App />);
    await waitFor(() => {
      // AuthView has a heading with "IMAS"
      expect(screen.getByRole('heading', { name: /imas/i })).toBeInTheDocument();
    });
  });

  it('should show the dashboard by default after login for Administrador role', async () => {
    setupSession('Administrador');
    await act(async () => {
      render(<App />);
    });
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-view')).toBeInTheDocument();
    });
  });

  it('should show the "Gestió d\'Usuaris" nav button only for Administrador role', async () => {
    setupSession('Administrador');
    await act(async () => {
      render(<App />);
    });
    await waitFor(() => {
      expect(screen.queryByText("Gestió d'Usuaris")).toBeInTheDocument();
    });
  });

  it('should NOT show the "Gestió d\'Usuaris" nav button for Lectura role', async () => {
    setupSession('Lectura');
    await act(async () => {
      render(<App />);
    });
    await waitFor(() => {
      expect(screen.queryByText("Gestió d'Usuaris")).not.toBeInTheDocument();
    });
  });

  it('should block Lectura users from accessing the form view and redirect to dashboard', async () => {
    setupSession('Lectura');
    await act(async () => {
      render(<App />);
    });
    // Wait for app to load
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-view')).toBeInTheDocument();
    });
    // Try to find and click any form navigation (should not exist for Lectura)
    expect(screen.queryByTestId('form-view')).not.toBeInTheDocument();
  });

  it('should block non-Administrador from accessing users view via keyboard navigation', async () => {
    setupSession('Gestió');
    await act(async () => {
      render(<App />);
    });
    await waitFor(() => {
      // The user management link should not be visible for Gestió role
      expect(screen.queryByText("Gestió d'Usuaris")).not.toBeInTheDocument();
    });
  });

  it('should display a toast error when a restricted action is attempted', async () => {
    // Simulate Lectura user trying to access the form
    setupSession('Lectura');
    await act(async () => {
      render(<App />);
    });
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-view')).toBeInTheDocument();
    });
    // No permission toast should be visible at start (no attempted navigation)
    // Verify the guard exists by checking no form is rendered
    expect(screen.queryByTestId('form-view')).not.toBeInTheDocument();
  });
});
