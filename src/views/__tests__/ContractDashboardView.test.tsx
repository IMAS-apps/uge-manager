import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContractDashboardView } from '../ContractDashboardView';
import type { User } from '../../types';

// ── Supabase mock ──────────────────────────────────────────────────────────
vi.mock('../../lib/supabase', () => {
  const mockContracts = [
    {
      id: 1,
      nom_contracte: 'Contracte de Serveis Informàtics',
      tipus_contracte: 'Servei',
      organ_contractacio: 'UFAG Central',
      responsable_contracte: 'Joan García',
      prorrogable: true,
      modificable: false,
      sense_lots: false,
      prorrogues: '2',
      dossier: 'DOSS-001',
      segex: 'EXP-001',
      referencia_interna: 'RI-001',
      duracio_inicial: '4 anys',
      modificat: '',
      procediment_adjudicacio: 'Obert',
      detalls_addicionals: '',
      ppt_document: 'CSVPPT001',
      pcap_document: 'CSVPCAP001',
      resolucio_document: null,
      created_by: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockLots = [
    {
      id: 1,
      contract_id: 1,
      nom_lot: 'Lot 1',
      cpv: '72000000',
      adjudicatari: 'Empresa SA',
      import_comes: 50000,
      data_inici: '2024-01-01',
      data_fi: '2099-12-31',
      data_limit_comunicacio_proroga: null,
      data_inici_proroga: null,
      data_fi_proroga: null,
      centres: ['Residència Bonanova'],
      telefon: null,
      email: null,
      formalitzacio_document: null,
      notified_proroga_60: false,
      notified_proroga_30: false,
      notified_fi_proroga_60: false,
      notified_fi_proroga_30: false,
      notified_fi_60: false,
      notified_fi_30: false,
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  return {
    supabase: {
      from: vi.fn((table: string) => {
        const mockBuilder: any = {
          select: vi.fn(() => mockBuilder),
          order: vi.fn(() => mockBuilder),
          eq: vi.fn(() => mockBuilder),
          delete: vi.fn(() => mockBuilder),
          update: vi.fn(() => mockBuilder),
          then: vi.fn((onFulfilled: any) => 
            Promise.resolve({
              data: table === 'contracts' ? mockContracts : mockLots,
              error: null,
            }).then(onFulfilled)
          )
        };
        return mockBuilder;
      }),
    },
  };
});

// ── Component mocks ──────────────────────────────────────────────────────────
vi.mock('../../components/ContractEditModal', () => ({
  ContractEditModal: () => <div data-testid="contract-edit-modal" />,
}));

vi.mock('lucide-react', () => ({
  Filter: () => <div data-testid="filter-icon" />,
  X: () => <div data-testid="x-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Search: () => <div data-testid="search-icon" />,
  ClipboardList: () => <div data-testid="clipboard-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  FileDown: () => <div data-testid="file-down-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  ExternalLink: () => <div data-testid="external-link-icon" />,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUser(role: string): User {
  return { id: 'u1', email: 'u@test.com', full_name: 'Test', role };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ContractDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the "Control de contractes" heading', async () => {
    render(<ContractDashboardView user={makeUser('Administrador')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Control de contractes')).toBeInTheDocument();
    });
  });

  it('should show "Nou contracte" button for Administrador', async () => {
    render(<ContractDashboardView user={makeUser('Administrador')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Nou contracte')).toBeInTheDocument();
    });
  });

  it('should NOT show "Nou contracte" button for Lectura role', async () => {
    render(<ContractDashboardView user={makeUser('Lectura')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.queryByText('Nou contracte')).not.toBeInTheDocument();
    });
  });

  it('should NOT show "Nou contracte" button for Gestió role', async () => {
    render(<ContractDashboardView user={makeUser('Gestió')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.queryByText('Nou contracte')).not.toBeInTheDocument();
    });
  });

  it('should render a contract row with its name', async () => {
    render(<ContractDashboardView user={makeUser('Administrador')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Contracte de Serveis Informàtics')).toBeInTheDocument();
    });
  });

  it('should render PPT document button when ppt_document is set', async () => {
    render(<ContractDashboardView user={makeUser('Administrador')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      // Use getAllByText because 'PPT' is also in the table header
      const buttons = screen.getAllByText('PPT');
      expect(buttons.length).toBeGreaterThan(1);
    });
  });

  it('should render PCAP document button when pcap_document is set', async () => {
    render(<ContractDashboardView user={makeUser('Administrador')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      const buttons = screen.getAllByText('PCAP');
      expect(buttons.length).toBeGreaterThan(1);
    });
  });

  it('should show total count in the header', async () => {
    render(<ContractDashboardView user={makeUser('Administrador')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/1 registres/i)).toBeInTheDocument();
    });
  });

  it('should call onNavigate with "contract-form" when "Nou contracte" is clicked', async () => {
    const onNavigate = vi.fn();
    render(<ContractDashboardView user={makeUser('Administrador')} onNavigate={onNavigate} />);
    await waitFor(() => {
      expect(screen.getByText('Nou contracte')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Nou contracte'));
    expect(onNavigate).toHaveBeenCalledWith('contract-form');
  });

  it('should open the edit modal when the eye button is clicked', async () => {
    render(<ContractDashboardView user={makeUser('Administrador')} onNavigate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByTitle('Veure / Editar')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTitle('Veure / Editar'));
    expect(screen.getByTestId('contract-edit-modal')).toBeInTheDocument();
  });
});
