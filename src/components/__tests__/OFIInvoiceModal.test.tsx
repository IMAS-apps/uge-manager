import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OFIInvoiceModal } from '../OFIInvoiceModal';
import type { OFI, User } from '../../types';
import { supabase } from '../../lib/supabase';

// ── Supabase mock ──────────────────────────────────────────────────────────
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('lucide-react', () => ({
  X: () => <span>X</span>,
  Eye: () => <span>Eye</span>,
  AlertCircle: () => <span>Alert</span>,
  FileText: () => <span>FileText</span>,
  Calendar: () => <span>Calendar</span>,
  Hash: () => <span>Hash</span>,
  Tag: () => <span>Tag</span>,
  Euro: () => <span>Euro</span>,
  Pencil: () => <span>Pencil</span>,
  Trash2: () => <span>Trash</span>,
  Save: () => <span>Save</span>,
  RotateCcw: () => <span>Reset</span>,
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeOFI(overrides: Partial<OFI> = {}): OFI {
  return {
    id: 1,
    codi_ofi: '001/26',
    expedient_ofi: 'EXP001',
    centre_servei: 'Residència Bonanova',
    area: 'Àrea Econòmica',
    justificacio_general: 'Justificació de prova',
    created_at: '2024-01-01T00:00:00Z',
    created_by: 'user-1',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeUser(role: string): User {
  return { id: 'u1', email: 'u@test.com', full_name: 'Test', role };
}

const defaultProps = {
  onClose: vi.fn(),
  onRefresh: vi.fn(),
};

function setupFacturesMock(factures: any[] = []) {
  (supabase.from as any).mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: factures, error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('OFIInvoiceModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupFacturesMock();
  });

  it('should render the OFI codi_ofi in the header', async () => {
    render(<OFIInvoiceModal ofi={makeOFI()} user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('001/26')).toBeInTheDocument();
    });
  });

  it('should render the centre_servei', async () => {
    render(<OFIInvoiceModal ofi={makeOFI()} user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Residència Bonanova')).toBeInTheDocument();
    });
  });

  it('should render the expedient_ofi', async () => {
    render(<OFIInvoiceModal ofi={makeOFI()} user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('EXP001')).toBeInTheDocument();
    });
  });

  it('should render the justificacio_general', async () => {
    render(<OFIInvoiceModal ofi={makeOFI()} user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Justificació de prova')).toBeInTheDocument();
    });
  });

  it('should show Edit button for Admin', async () => {
    render(<OFIInvoiceModal ofi={makeOFI()} user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Editar OFI')).toBeInTheDocument();
    });
  });

  it('should show Delete button for Admin', async () => {
    render(<OFIInvoiceModal ofi={makeOFI()} user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Editar OFI')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Editar OFI'));
    await waitFor(() => {
      expect(screen.getByText('Suprimir OFI')).toBeInTheDocument();
    });
  });

  it('should NOT show Edit button for non-Admin', async () => {
    render(<OFIInvoiceModal ofi={makeOFI()} user={makeUser('Gestió')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.queryByText('Editar')).not.toBeInTheDocument();
    });
  });

  it('should NOT show Delete button for non-Admin', async () => {
    render(<OFIInvoiceModal ofi={makeOFI()} user={makeUser('Lectura')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.queryByText('Eliminar OFI')).not.toBeInTheDocument();
    });
  });

  it('should show the area field', async () => {
    render(<OFIInvoiceModal ofi={makeOFI()} user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Àrea Econòmica')).toBeInTheDocument();
    });
  });

  it('should show empty factures state when no factures exist', async () => {
    setupFacturesMock([]);
    render(<OFIInvoiceModal ofi={makeOFI()} user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/cap factura/i)).toBeInTheDocument();
    });
  });

  it('should render a factura when one exists', async () => {
    setupFacturesMock([
      {
        id: 10,
        data: '2024-01-15',
        descripcio: 'Factura material sanitari',
        import_total: 1500,
        numero_factura: 'FAC001',
        numero_registre: 'REG001',
        periode: '2024-01',
        expedient: 'EXP001',
        record_id: null,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        records: null,
      },
    ]);
    render(<OFIInvoiceModal ofi={makeOFI()} user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Factura material sanitari')).toBeInTheDocument();
    });
  });

  it('should call onClose when X button is clicked', async () => {
    render(<OFIInvoiceModal ofi={makeOFI()} user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('X')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('X'));
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });
});
