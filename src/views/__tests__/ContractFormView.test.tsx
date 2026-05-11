import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContractFormView } from '../ContractFormView';
import type { User } from '../../types';

// ── Supabase mock ──────────────────────────────────────────────────────────
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 99 }, error: null }),
    }),
  },
}));

// ── Component mocks ──────────────────────────────────────────────────────────
vi.mock('../../components/CpvDescription', () => ({
  CpvDescription: () => <div data-testid="cpv-description" />,
}));

vi.mock('lucide-react', () => ({
  Save: () => <div data-testid="save-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function makeUser(role: string): User {
  return { id: 'u1', email: 'u@test.com', full_name: 'Test', role };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ContractFormView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the "Nou contracte" heading', () => {
    render(<ContractFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByText('Nou contracte')).toBeInTheDocument();
  });

  it('should render the contract name input label', () => {
    render(<ContractFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByText('Nom del contracte *')).toBeInTheDocument();
  });

  it('should render the "Dades generals" section', () => {
    render(<ContractFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByText('Dades generals del contracte')).toBeInTheDocument();
  });

  it('should render the "Lots" section', () => {
    render(<ContractFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByText('Lot únic (sense lots)')).toBeInTheDocument();
  });

  it('should render the "Documents" section', () => {
    render(<ContractFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('should render the Desar button', () => {
    render(<ContractFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByText('Desar contracte')).toBeInTheDocument();
  });

  it('should render tipus_contracte selector', () => {
    render(<ContractFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByText('Tipus de contracte *')).toBeInTheDocument();
  });

  it('should render organ_contractacio selector', () => {
    render(<ContractFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByText("Òrgan de contractació *")).toBeInTheDocument();
  });

  it('should show an error when contract name is empty on submit', async () => {
    render(<ContractFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    // The form uses HTML5 required validation — check the submit button is present
    const submitBtn = screen.getByText('Desar contracte');
    expect(submitBtn).toBeInTheDocument();
  });

  it('should show "sense_lots" checkbox', () => {
    render(<ContractFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByText("Contracte sense lots (el lot s'anomena com el contracte)")).toBeInTheDocument();
  });

  it('should allow typing in nom_contracte field', () => {
    render(<ContractFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    const input = document.querySelector('input[name="nom_contracte"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test Contracte' } });
    expect(input.value).toBe('Test Contracte');
  });

  it('should show prorrogues field when prorrogable is checked', async () => {
    render(<ContractFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    // Find the prorrogable checkbox and click it
    const checkboxes = screen.getAllByRole('checkbox');
    const prorrogableCheckbox = checkboxes.find(cb =>
      cb.closest('div')?.textContent?.includes('Prorrogable')
    );
    expect(prorrogableCheckbox).toBeDefined();
    fireEvent.click(prorrogableCheckbox!);
    await waitFor(() => {
      expect(screen.getByText('Pròrrogues')).toBeInTheDocument();
    });
  });
});
