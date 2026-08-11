import { render, screen, waitFor } from '@testing-library/react';
import { EditModal } from '../EditModal';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../../lib/supabase';

// Mock del mòdul supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    }
  }
}));

const mockRecord = {
  id: 1,
  hora: '2024-04-24 10:00',
  email: 'test@test.com',
  nom: 'Test User',
  responsable_contracte: 'Responsable',
  centre_servei: 'Centre',
  organ_contractacio: 'Organ',
  justificacio: 'Justificacio',
  objecte_contracte: 'Objecte',
  caracteristiques_tecniques: 'Caracteristiques',
  tipus_contracte: 'Servei',
  tipus_despesa: 'Ordinària',
  termini_execucio: 12,
  codi_cpv: '12345678',
  partida_organica: '123',
  partida_programa: '456',
  partida_economica: '789',
  base_imposable: 1000,
  quota_iva: 210,
  detalls_addicionals: '',
  finalitzat: false,
  publicat: false,
  created_by: 'user-1',
  updated_at: '2024-04-24T10:00:00Z',
  num_rc: '220260015212'
};

const mockUser = {
  id: 'user-admin',
  full_name: 'Admin User',
  email: 'admin@test.com',
  role: 'Administrador'
};

describe('EditModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock per defecte (llista buida)
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null })
    });
  });

  it('should render num_rc correctly as a string', async () => {
    render(
      <EditModal 
        record={mockRecord as any} 
        user={mockUser as any} 
        mode="view" 
        onClose={vi.fn()} 
        onSave={vi.fn()} 
        onDeleteRequest={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/Carregant factures/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('220260015212')).toBeInTheDocument();
  });

  it('should calculate recognized credit from factures', async () => {
    const mockFactures = [
      { id: 1, import_total: 500, descripcio: 'F1', data: '2024-01-01' },
      { id: 2, import_total: 200, descripcio: 'F2', data: '2024-01-02' }
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockFactures, error: null })
    });

    render(
      <EditModal 
        record={mockRecord as any} 
        user={mockUser as any} 
        mode="view" 
        onClose={vi.fn()} 
        onSave={vi.fn()} 
        onDeleteRequest={vi.fn()} 
      />
    );

    // Esperar que el text de càrrega marxi
    await waitFor(() => {
      expect(screen.queryByText(/Carregant factures/i)).not.toBeInTheDocument();
    }, { timeout: 5000 });

    // Crèdit reconegut: 700
    expect(screen.getByText(/700,00/)).toBeInTheDocument();
  });

  it('should show the expedient field', async () => {
    const mockFactures = [
      { id: 1, import_total: 100, descripcio: 'F1', data: '2024-01-01', expedient: 'EXP-E2E' }
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockFactures, error: null })
    });

    render(
      <EditModal 
        record={mockRecord as any} 
        user={mockUser as any} 
        mode="view" 
        onClose={vi.fn()} 
        onSave={vi.fn()} 
        onDeleteRequest={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/EXP-E2E/)).toBeInTheDocument();
    });
  });

  it('should show Detalls OFI section when sistema_tramitacio is OFI', async () => {
    const ofiRecord = { ...mockRecord, sistema_tramitacio: 'OFI' };
    
    render(
      <EditModal 
        record={ofiRecord as any} 
        user={mockUser as any} 
        mode="edit" 
        onClose={vi.fn()} 
        onSave={vi.fn()} 
        onDeleteRequest={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/Carregant factures/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Detalls OFI')).toBeInTheDocument();
    expect(screen.getByText('Motivació de no contractació')).toBeInTheDocument();
    expect(screen.getByText('Explicació de no contractació')).toBeInTheDocument();
    expect(screen.getByText('Justificació del preu')).toBeInTheDocument();
    expect(screen.getByText('Explicació del preu')).toBeInTheDocument();
    expect(screen.getByText('Tramitat per OFI des de')).toBeInTheDocument();
  });

  it('should not show Detalls OFI section when sistema_tramitacio is not OFI', async () => {
    const adRecord = { ...mockRecord, sistema_tramitacio: 'AD' };
    
    render(
      <EditModal 
        record={adRecord as any} 
        user={mockUser as any} 
        mode="edit" 
        onClose={vi.fn()} 
        onSave={vi.fn()} 
        onDeleteRequest={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/Carregant factures/i)).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Detalls OFI')).not.toBeInTheDocument();
  });

  it('should render Justificació selecció tercer field below NIF', async () => {
    render(
      <EditModal 
        record={mockRecord as any} 
        user={{ ...mockUser, role: 'Lectura' } as any} 
        mode="view" 
        onClose={vi.fn()} 
        onSave={vi.fn()} 
        onDeleteRequest={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/Carregant factures/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Justificació selecció tercer')).toBeInTheDocument();
    const select = screen.getByRole('combobox', { name: /Justificació selecció tercer/i });
    expect(select).toBeInTheDocument();
  });
});
