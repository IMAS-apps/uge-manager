import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsView } from '../NotificationsView';
import type { User } from '../../types';
import { supabase } from '../../lib/supabase';

// ── Supabase mock ──────────────────────────────────────────────────────────
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('lucide-react', () => ({
  FilePlus: () => <span>FilePlus</span>,
  PenSquare: () => <span>PenSquare</span>,
  CheckCircle2: () => <span>Check</span>,
  Trash2: () => <span>Trash</span>,
  AlertCircle: () => <span>Alert</span>,
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeUser(role: string): User {
  return {
    id: 'u1',
    email: 'u@test.com',
    full_name: 'Test User',
    role,
    last_notifications_cleared_at: null,
  } as User;
}

const mockNewRequest = {
  id: 1,
  created_at: '2024-05-01T10:00:00Z',
  type: 'new_request',
  recipient_user_id: null,
  triggered_by_user_id: 'u2',
  triggered_by_name: 'Joan García',
  peticio_id: 42,
  peticio_objecte: 'Subministrament de material sanitari',
  changed_fields: [],
  is_read: false,
};

const mockRecordUpdated = {
  id: 2,
  created_at: '2024-05-02T12:00:00Z',
  type: 'record_updated',
  recipient_user_id: 'u1',
  triggered_by_user_id: 'u2',
  triggered_by_name: 'Maria López',
  peticio_id: 43,
  peticio_objecte: 'Servei de neteja',
  changed_fields: ['base_imposable', 'quota_iva'],
  is_read: true,
};

const mockRenewalAlert = {
  id: 3,
  created_at: '2024-05-03T09:00:00Z',
  type: 'renewal_alert',
  recipient_user_id: null,
  triggered_by_user_id: 'system',
  triggered_by_name: 'Sistema',
  peticio_id: 10,
  peticio_objecte: 'Contracte de manteniment ascensors',
  changed_fields: [],
  is_read: false,
};

function setupNotificationsMock(notifications: any[] = [], updateError: any = null) {
  const mockBuilder: any = {
    select: vi.fn(() => mockBuilder),
    order: vi.fn(() => mockBuilder),
    update: vi.fn(() => mockBuilder),
    in: vi.fn(() => mockBuilder),
    eq: vi.fn(() => mockBuilder),
    neq: vi.fn(() => mockBuilder),
    or: vi.fn(() => mockBuilder),
    gt: vi.fn(() => mockBuilder),
    then: vi.fn((onFulfilled: any) => Promise.resolve({ data: notifications, error: updateError }).then(onFulfilled))
  };
  (supabase.from as any).mockReturnValue(mockBuilder);
}

const defaultProps = {
  onNavigateToRecord: vi.fn(),
  onNavigateToContract: vi.fn(),
  onProfileUpdate: vi.fn(),
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('NotificationsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the "Notificacions" heading', async () => {
    setupNotificationsMock([]);
    render(<NotificationsView user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Notificacions')).toBeInTheDocument();
    });
  });

  it('should show the empty state when no notifications exist', async () => {
    setupNotificationsMock([]);
    render(<NotificationsView user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('No tens notificacions per mostrar.')).toBeInTheDocument();
    });
  });

  it('should render a "new_request" notification correctly', async () => {
    setupNotificationsMock([mockNewRequest]);
    render(<NotificationsView user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/Nova sol·licitud enviada/i)).toBeInTheDocument();
      expect(screen.getByText(/Subministrament de material sanitari/i)).toBeInTheDocument();
    });
  });

  it('should render a "record_updated" notification correctly', async () => {
    setupNotificationsMock([mockRecordUpdated]);
    render(<NotificationsView user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Registre actualitzat')).toBeInTheDocument();
    });
  });

  it('should render a "renewal_alert" notification with contract link', async () => {
    setupNotificationsMock([mockRenewalAlert]);
    render(<NotificationsView user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Alerta de data límit de comunicació de pròrroga')).toBeInTheDocument();
      expect(screen.getByText('Veure contracte →')).toBeInTheDocument();
    });
  });

  it('should call onNavigateToContract when renewal_alert "Veure contracte" is clicked', async () => {
    setupNotificationsMock([mockRenewalAlert]);
    render(<NotificationsView user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Veure contracte →')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Veure contracte →'));
    expect(defaultProps.onNavigateToContract).toHaveBeenCalledWith(10);
  });

  it('should call onNavigateToRecord when "Veure registre" is clicked for new_request', async () => {
    setupNotificationsMock([mockNewRequest]);
    render(<NotificationsView user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Veure registre →')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Veure registre →'));
    expect(defaultProps.onNavigateToRecord).toHaveBeenCalledWith(42);
  });

  it('should show the subtitle for Administrador role', async () => {
    setupNotificationsMock([]);
    render(<NotificationsView user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Totes les notificacions del sistema')).toBeInTheDocument();
    });
  });

  it('should show the subtitle for Peticions role', async () => {
    setupNotificationsMock([]);
    render(<NotificationsView user={makeUser('Peticions')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Canvis realitzats als teus registres per part de gestió')).toBeInTheDocument();
    });
  });

  it('should show the subtitle for Gestió role', async () => {
    setupNotificationsMock([]);
    render(<NotificationsView user={makeUser('Gestió')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Noves sol·licituds enviades per qualsevol usuari')).toBeInTheDocument();
    });
  });

  it('should show changed_fields when record_updated has changed fields', async () => {
    setupNotificationsMock([mockRecordUpdated]);
    render(<NotificationsView user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/base_imposable, quota_iva/i)).toBeInTheDocument();
    });
  });

  it('should disable the "Netejar totes" button when there are no notifications', async () => {
    setupNotificationsMock([]);
    render(<NotificationsView user={makeUser('Administrador')} {...defaultProps} />);
    await waitFor(() => {
      const btn = screen.getByText('Netejar totes les notificacions').closest('button');
      expect(btn).toBeDisabled();
    });
  });
});
