import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContractEditModal } from '../ContractEditModal';
import type { Contract, ContractLot, User } from '../../types';

// ── Supabase mock ──────────────────────────────────────────────────────────
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
}));

// ── Component mocks ──────────────────────────────────────────────────────────
vi.mock('../CpvDescription', () => ({
  CpvDescription: () => <div data-testid="cpv-description" />,
}));

vi.mock('lucide-react', () => ({
  X: () => <span>X</span>,
  Edit: () => <span>Edit</span>,
  Trash2: () => <span>Trash</span>,
  ExternalLink: () => <span>ExtLink</span>,
  Save: () => <span>Save</span>,
  Plus: () => <span>Plus</span>,
  ChevronDown: () => <span>▼</span>,
  ChevronUp: () => <span>▲</span>,
  AlertCircle: () => <span>Alert</span>,
  FileText: () => <span>File</span>,
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeLot(overrides: Partial<ContractLot> = {}): ContractLot {
  return {
    id: 1,
    contract_id: 1,
    nom_lot: 'Lot Principal',
    cpv: '72000000',
    adjudicatari: 'Empresa Test SL',
    import_comes: 10000,
    data_inici: '2024-01-01',
    data_fi: '2026-12-31',
    data_limit_comunicacio_proroga: '',
    data_inici_proroga: '',
    data_fi_proroga: '',
    centres: ['Residència Bonanova'],
    telefon: '612345678',
    email: 'test@empresa.com',
    formalitzacio_document: '',
    notified_proroga_60: false,
    notified_proroga_30: false,
    notified_fi_proroga_60: false,
    notified_fi_proroga_30: false,
    notified_fi_60: false,
    notified_fi_30: false,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 1,
    nom_contracte: 'Contracte Test',
    tipus_contracte: 'Servei',
    organ_contractacio: 'UFAG Central',
    responsable_contracte: 'Joan García',
    prorrogable: true,
    modificable: false,
    sense_lots: false,
    prorrogues: '2 anys',
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
    lots: [makeLot()],
    ...overrides,
  };
}

function makeUser(role: string): User {
  return { id: 'u1', email: 'u@test.com', full_name: 'Test', role };
}

const defaultProps = {
  onClose: vi.fn(),
  onSave: vi.fn(),
  onDeleteRequest: vi.fn(),
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ContractEditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the contract name in the header', () => {
    render(
      <ContractEditModal
        contract={makeContract()}
        user={makeUser('Administrador')}
        {...defaultProps}
      />
    );
    expect(screen.getByText('Contracte Test')).toBeInTheDocument();
  });

  it('should render contract ID in the header', () => {
    render(
      <ContractEditModal
        contract={makeContract()}
        user={makeUser('Administrador')}
        {...defaultProps}
      />
    );
    expect(screen.getByText('Contracte #1')).toBeInTheDocument();
  });

  it('should show Edit and Delete buttons for Admin in view mode', () => {
    render(
      <ContractEditModal
        contract={makeContract()}
        user={makeUser('Administrador')}
        {...defaultProps}
      />
    );
    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.getByText('Eliminar')).toBeInTheDocument();
  });

  it('should NOT show Edit and Delete buttons for non-Admin', () => {
    render(
      <ContractEditModal
        contract={makeContract()}
        user={makeUser('Lectura')}
        {...defaultProps}
      />
    );
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
  });

  it('should render the lot name', () => {
    render(
      <ContractEditModal
        contract={makeContract()}
        user={makeUser('Administrador')}
        {...defaultProps}
      />
    );
    expect(screen.getByText('Lot Principal')).toBeInTheDocument();
  });

  it('should render "PPT" document button when ppt_document is set', () => {
    render(
      <ContractEditModal
        contract={makeContract()}
        user={makeUser('Administrador')}
        {...defaultProps}
      />
    );
    expect(screen.getByText('Codi CSV PPT')).toBeInTheDocument();
  });

  it('should show "No introduït" for resolucio_document when null', () => {
    render(
      <ContractEditModal
        contract={makeContract({ resolucio_document: null })}
        user={makeUser('Administrador')}
        {...defaultProps}
      />
    );
    const noIntroduitsElements = screen.getAllByText('No introduït');
    expect(noIntroduitsElements.length).toBeGreaterThan(0);
  });

  it('should show Lots section with count', () => {
    render(
      <ContractEditModal
        contract={makeContract()}
        user={makeUser('Administrador')}
        {...defaultProps}
      />
    );
    expect(screen.getByText('Lots (1)')).toBeInTheDocument();
  });

  it('should show contract type in view mode', () => {
    render(
      <ContractEditModal
        contract={makeContract()}
        user={makeUser('Administrador')}
        {...defaultProps}
      />
    );
    expect(screen.getByText('Servei')).toBeInTheDocument();
  });

  it('should switch to edit mode when Editar is clicked', async () => {
    render(
      <ContractEditModal
        contract={makeContract()}
        user={makeUser('Administrador')}
        {...defaultProps}
      />
    );
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => {
      expect(screen.getByText('Desar')).toBeInTheDocument();
    });
  });

  it('should call onDeleteRequest when Eliminar is clicked', () => {
    render(
      <ContractEditModal
        contract={makeContract()}
        user={makeUser('Administrador')}
        {...defaultProps}
      />
    );
    fireEvent.click(screen.getByText('Eliminar'));
    expect(defaultProps.onDeleteRequest).toHaveBeenCalledOnce();
  });

  it('should call onClose when X button is clicked', () => {
    render(
      <ContractEditModal
        contract={makeContract()}
        user={makeUser('Administrador')}
        {...defaultProps}
      />
    );
    fireEvent.click(screen.getByText('X'));
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it('should show adjudicatari in lot view', async () => {
    render(
      <ContractEditModal
        contract={makeContract()}
        user={makeUser('Administrador')}
        {...defaultProps}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('Empresa Test SL')).toBeInTheDocument();
    });
  });

  it('should show centres in lot view', async () => {
    render(
      <ContractEditModal
        contract={makeContract()}
        user={makeUser('Administrador')}
        {...defaultProps}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('Residència Bonanova')).toBeInTheDocument();
    });
  });
});
