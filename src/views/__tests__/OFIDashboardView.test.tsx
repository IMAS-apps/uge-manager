import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OFIDashboardView } from '../OFIDashboardView';
import type { User } from '../../types';

// ── Supabase mock ──────────────────────────────────────────────────────────
vi.mock('../../lib/supabase', () => {
  const mockOfis = [
    {
      id: 1,
      codi_ofi: '001/26',
      expedient_ofi: 'EXP001',
      centre_servei: 'Residència Bonanova',
      area: 'Àrea Econòmica',
      justificacio_general: 'Text de justificació',
      created_at: '2024-01-15T00:00:00Z',
      num_factures: 3,
      total_import: 15000,
      data_min: '2024-01-01',
      data_max: '2024-03-31',
      created_by: 'user-1',
      updated_at: '2024-01-15T00:00:00Z',
    },
    {
      id: 2,
      codi_ofi: '002/26',
      expedient_ofi: 'EXP002',
      centre_servei: 'Centre de Dia',
      area: 'Àrea Social',
      justificacio_general: 'Altra justificació',
      created_at: '2024-02-01T00:00:00Z',
      num_factures: 1,
      total_import: 5000,
      data_min: '2024-02-01',
      data_max: '2024-02-28',
      created_by: 'user-1',
      updated_at: '2024-02-01T00:00:00Z',
    },
  ];

  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockOfis, error: null }),
      }),
    },
  };
});

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock('../../components/OFIInvoiceModal', () => ({
  OFIInvoiceModal: () => <div data-testid="ofi-invoice-modal" />,
}));

vi.mock('../../utils/generateInforme', () => ({
  generateMemoriaOFI: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn().mockReturnValue({}),
    book_new: vi.fn().mockReturnValue({}),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Plus: () => <span>Plus</span>,
  Eye: () => <span>Eye</span>,
  FileDown: () => <span>FileDown</span>,
  Search: () => <span>Search</span>,
  AlertCircle: () => <span>Alert</span>,
  FilePlus2: () => <span>FilePlus</span>,
  ChevronUp: () => <span>▲</span>,
  ChevronDown: () => <span>▼</span>,
  Filter: () => <span>Filter</span>,
  X: () => <span>X</span>,
  ExternalLink: () => <span>ExtLink</span>,
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function makeUser(role: string): User {
  return { id: 'u1', email: 'u@test.com', full_name: 'Test', role };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('OFIDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the OFI list with codi values', async () => {
    render(<OFIDashboardView user={makeUser('Administrador')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('001/26')).toBeInTheDocument();
      expect(screen.getByText('002/26')).toBeInTheDocument();
    });
  });

  it('should render centre_servei values', async () => {
    render(<OFIDashboardView user={makeUser('Administrador')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Residència Bonanova')).toBeInTheDocument();
      expect(screen.getByText('Centre de Dia')).toBeInTheDocument();
    });
  });

  it('should show total count badge', async () => {
    render(<OFIDashboardView user={makeUser('Administrador')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/2 registres/i)).toBeInTheDocument();
    });
  });

  it('should filter OFIs by search term (codi_ofi)', async () => {
    render(<OFIDashboardView user={makeUser('Administrador')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('001/26')).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText(/codi, expedient/i);
    fireEvent.change(searchInput, { target: { value: '002' } });
    await waitFor(() => {
      expect(screen.queryByText('001/26')).not.toBeInTheDocument();
      expect(screen.getByText('002/26')).toBeInTheDocument();
    });
  });

  it('should filter OFIs by search term (centre_servei)', async () => {
    render(<OFIDashboardView user={makeUser('Administrador')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Residència Bonanova')).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText(/codi, expedient/i);
    fireEvent.change(searchInput, { target: { value: 'Centre de Dia' } });
    await waitFor(() => {
      expect(screen.queryByText('Residència Bonanova')).not.toBeInTheDocument();
      expect(screen.getByText('Centre de Dia')).toBeInTheDocument();
    });
  });

  it('should open OFIInvoiceModal when eye button is clicked', async () => {
    render(<OFIDashboardView user={makeUser('Administrador')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getAllByText('Eye').length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByText('Eye')[0]);
    expect(screen.getByTestId('ofi-invoice-modal')).toBeInTheDocument();
  });

  it('should show "Nou OFI" navigation button', async () => {
    render(<OFIDashboardView user={makeUser('Administrador')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Nou OFI')).toBeInTheDocument();
    });
  });

  it('should call onNavigate with "ofi-form" when Nou OFI is clicked', async () => {
    const onNavigate = vi.fn();
    render(<OFIDashboardView user={makeUser('Administrador')} onNavigate={onNavigate} />);
    await waitFor(() => {
      expect(screen.getByText('Nou OFI')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Nou OFI'));
    expect(onNavigate).toHaveBeenCalledWith('ofi-form');
  });
});
