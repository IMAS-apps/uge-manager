import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OFIFormView } from '../OFIFormView';
import type { User } from '../../types';
import { supabase } from '../../lib/supabase';

// ── Supabase mock ──────────────────────────────────────────────────────────
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('lucide-react', () => ({
  Save: () => <span>Save</span>,
  AlertCircle: () => <span>Alert</span>,
  CheckCircle2: () => <span>Check</span>,
  FilePlus2: () => <span>FilePlus</span>,
  Copy: () => <span>Copy</span>,
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function makeUser(role: string): User {
  return { id: 'u1', email: 'u@test.com', full_name: 'Test', role };
}

function setupEmptyOFIs() {
  const mockBuilder: any = {
    select: vi.fn(() => mockBuilder),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn(() => mockBuilder),
    single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
    then: vi.fn((onFulfilled: any) => Promise.resolve({ data: [], error: null }).then(onFulfilled))
  };
  (supabase.from as any).mockReturnValue(mockBuilder);
}

function setupExistingOFIs() {
  const mockBuilder: any = {
    select: vi.fn(() => mockBuilder),
    order: vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          codi_ofi: '001/26',
          expedient_ofi: 'EXP001',
          centre_servei: 'Residència Bonanova',
          area: 'Àrea Econòmica',
          justificacio_general: 'Text de justificació',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      error: null,
    }),
    insert: vi.fn(() => mockBuilder),
    single: vi.fn().mockResolvedValue({ data: { id: 2 }, error: null }),
    then: vi.fn((onFulfilled: any) => Promise.resolve({ data: [], error: null }).then(onFulfilled))
  };
  (supabase.from as any).mockReturnValue(mockBuilder);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('OFIFormView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupEmptyOFIs();
  });

  it('should render the "Nou OFI" heading', async () => {
    render(<OFIFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByText('Nou OFI')).toBeInTheDocument();
  });

  it('should render the "Dades de l\'OFI" section', async () => {
    render(<OFIFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByText("Dades de l'OFI")).toBeInTheDocument();
  });

  it('should render the Codi OFI input', async () => {
    render(<OFIFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByPlaceholderText('ex: 001/26')).toBeInTheDocument();
  });

  it('should render the Expedient OFI input', async () => {
    render(<OFIFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByPlaceholderText('ex: 1234567A')).toBeInTheDocument();
  });

  it('should render the Centre o servei input', async () => {
    render(<OFIFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Introduïu el centre/i)).toBeInTheDocument();
  });

  it('should render the Àrea selector', async () => {
    render(<OFIFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByText('Àrea *')).toBeInTheDocument();
  });

  it('should render the Desar OFI button', async () => {
    render(<OFIFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    expect(screen.getByText('Desar OFI')).toBeInTheDocument();
  });

  it('should show error when non-Admin tries to submit', async () => {
    setupEmptyOFIs();
    render(<OFIFormView user={makeUser('Gestió')} onSuccess={vi.fn()} />);

    // Fill required fields and submit
    fireEvent.change(screen.getByPlaceholderText('ex: 001/26'), {
      target: { value: '001/26' },
    });
    fireEvent.change(screen.getByPlaceholderText('ex: 1234567A'), {
      target: { value: 'EXP001' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Introduïu el centre/i), {
      target: { value: 'Centre Test' },
    });

    // Select àrea
    const areaSelect = screen.getByRole('combobox');
    fireEvent.change(areaSelect, { target: { value: 'Gerència' } });

    fireEvent.click(screen.getByText('Desar OFI'));

    await waitFor(() => {
      expect(screen.getByText(/No tens permisos per crear OFIs/i)).toBeInTheDocument();
    });
  });

  it('should show clone selector when existing OFIs are present', async () => {
    setupExistingOFIs();
    render(<OFIFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Clonar d\'un OFI existent:')).toBeInTheDocument();
    });
  });

  it('should NOT show clone selector when no OFIs exist', async () => {
    setupEmptyOFIs();
    render(<OFIFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);
    await waitFor(() => {
      expect(screen.queryByText("Clonar d'un OFI existent:")).not.toBeInTheDocument();
    });
  });

  it('should populate form fields when cloning an OFI', async () => {
    setupExistingOFIs();
    render(<OFIFormView user={makeUser('Administrador')} onSuccess={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Clonar d'un OFI existent:")).toBeInTheDocument();
    });

    // Find the clone selector and select the existing OFI
    const cloneSelect = screen.getByText('Selecciona un OFI per copiar-ne les dades...')
      .closest('select') as HTMLSelectElement;
    fireEvent.change(cloneSelect, { target: { value: '1' } });

    await waitFor(() => {
      const codiInput = screen.getByPlaceholderText('ex: 001/26') as HTMLInputElement;
      expect(codiInput.value).toBe('001/26');
    });
  });
});
