import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserManagementView } from '../UserManagementView';
import { supabase } from '../../lib/supabase';

// ── Supabase mock ──────────────────────────────────────────────────────────
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

const mockUsers = [
  { id: 'u1', email: 'admin@test.com', full_name: 'Admin User', role: 'Administrador' },
  { id: 'u2', email: 'gestio@test.com', full_name: 'Gestió User', role: 'Gestió' },
  { id: 'u3', email: 'peticions@test.com', full_name: 'Peticions User', role: 'Peticions' },
  { id: 'u4', email: 'lectura@test.com', full_name: 'Lectura User', role: 'Lectura' },
];

function setupMock(users = mockUsers, updateError: any = null) {
  (supabase.from as any).mockReturnValue({
    select: vi.fn().mockResolvedValue({ data: users, error: null }),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: updateError }),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('UserManagementView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMock();
  });

  it('should render the "Gestió d\'Usuaris" heading', async () => {
    render(<UserManagementView />);
    await waitFor(() => {
      expect(screen.getByText("Gestió d'Usuaris")).toBeInTheDocument();
    });
  });

  it('should render all users from the database', async () => {
    render(<UserManagementView />);
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Gestió User')).toBeInTheDocument();
      expect(screen.getByText('Peticions User')).toBeInTheDocument();
      expect(screen.getByText('Lectura User')).toBeInTheDocument();
    });
  });

  it('should render user emails', async () => {
    render(<UserManagementView />);
    await waitFor(() => {
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      expect(screen.getByText('gestio@test.com')).toBeInTheDocument();
    });
  });

  it('should render role selectors for each user', async () => {
    render(<UserManagementView />);
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBe(mockUsers.length);
    });
  });

  it('should show the Administrador role badge', async () => {
    render(<UserManagementView />);
    await waitFor(() => {
      const elements = screen.getAllByText('Administrador');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('should open confirm dialog when a role is changed', async () => {
    render(<UserManagementView />);
    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0);
    });
    // Change the second user (Gestió) to Lectura
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'Lectura' } });
    await waitFor(() => {
      expect(screen.getByText(/Confirmar canvi de rol/i)).toBeInTheDocument();
    });
  });

  it('should cancel the confirm dialog when Cancel·lar is clicked', async () => {
    render(<UserManagementView />);
    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0);
    });
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'Lectura' } });
    await waitFor(() => {
      expect(screen.getByText('Cancel·lar')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cancel·lar'));
    await waitFor(() => {
      expect(screen.queryByText(/Confirmar canvi de rol/i)).not.toBeInTheDocument();
    });
  });

  it('should show a success toast after confirming role change', async () => {
    render(<UserManagementView />);
    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0);
    });
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'Lectura' } });
    await waitFor(() => {
      expect(screen.getByText('Confirmar')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => {
      expect(screen.getByText('Rol actualitzat correctament')).toBeInTheDocument();
    });
  });

  it('should render a table row for each user', async () => {
    render(<UserManagementView />);
    await waitFor(() => {
      // 1 header row + 4 user rows
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBe(mockUsers.length + 1);
    });
  });
});
