import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardView } from '../DashboardView';
import { User } from '../../types';
import React from 'react';

// ── Supabase mock ──────────────────────────────────────────────────────────
vi.mock('../../lib/supabase', () => {
  const mockData = [
    {
      id: 1,
      hora: '2024-01-01T10:00:00',
      objecte_contracte: 'Objecte 1',
      base_imposable: 1000,
      quota_iva: 210,
      sistema_tramitacio: 'AD',
      reg_factura: 'REG123',
      factures: [
        { import_total: 500 }
      ],
      responsable_contracte: 'Resp 1',
      publicat: false,
      finalitzat: false
    }
  ];
  return {
    supabase: {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    },
  };
});

// ── Lucide icons mock ───────────────────────────────────────────────────────
vi.mock('lucide-react', () => ({
  Filter: () => <div data-testid="filter-icon" />,
  X: () => <div data-testid="x-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Search: () => <div data-testid="search-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  FileDown: () => <div data-testid="file-down-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
}));

// ── Components mock ─────────────────────────────────────────────────────────
vi.mock('../../components/EditModal', () => ({
  EditModal: () => <div data-testid="edit-modal" />
}));

vi.mock('../../components/CpvDescription', () => ({
  CpvDescription: () => <div data-testid="cpv-description" />
}));

const mockUser: User = {
  id: 'user-1',
  full_name: 'Test User',
  email: 'test@example.com',
  role: 'Administrador'
};

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Crèdit disponible column and hide Reg. Factura', async () => {
    render(<DashboardView user={mockUser} onNavigate={vi.fn()} />);

    // Wait for the mock record's object to appear
    await waitFor(() => {
      expect(screen.getByText(/Objecte 1/i)).toBeInTheDocument();
    }, { timeout: 4000 });

    // Check headers
    expect(screen.getByText(/Crèdit Retingut/i)).toBeInTheDocument();
    expect(screen.getByText(/Crèdit disponible/i)).toBeInTheDocument();
    
    // Reg. Factura should NOT be in the header
    const headers = screen.getAllByRole('columnheader');
    const headerTexts = headers.map(h => h.textContent);
    expect(headerTexts.some(t => t?.includes('Reg. Factura'))).toBe(false);

    // Check values for record 1
    // Total: 1.210,00 €
    // Crèdit disponible: 1.210 - 500 = 710,00 €
    expect(screen.getByText(/1\.210,00/)).toBeInTheDocument();
    expect(screen.getByText(/710,00/)).toBeInTheDocument();
    
    // REG123 should NOT be visible in the table body
    expect(screen.queryByText('REG123')).not.toBeInTheDocument();
  });
});
