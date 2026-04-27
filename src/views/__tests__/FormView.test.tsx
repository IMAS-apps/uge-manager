import { render, screen, fireEvent } from '@testing-library/react';
import { FormView } from '../FormView';
import { mockSupabaseClient } from '../../test/mocks/supabase';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockUser = {
  id: 'user-1',
  full_name: 'Test User',
  email: 'test@test.com',
  role: 'Peticions'
};

describe('FormView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should allow entering a long numeric string in num_rc field', () => {
    render(<FormView user={mockUser as any} onSuccess={vi.fn()} />);
    
    const input = screen.getByPlaceholderText('ex: 220260015212') as HTMLInputElement;
    fireEvent.change(input, { target: { name: 'num_rc', value: '220260015212' } });
    
    expect(input.value).toBe('220260015212');
  });

  it('should display CPV field', async () => {
    render(<FormView user={mockUser as any} onSuccess={vi.fn()} />);
    
    expect(screen.getByText(/Codi d'objecte \(CPV\)/i)).toBeInTheDocument();
  });

  it('should show red warning when CPV is 8 digits but does not end in 0000', () => {
    render(<FormView user={mockUser as any} onSuccess={vi.fn()} />);
    
    const cpvInput = screen.getByPlaceholderText('12340000');
    fireEvent.change(cpvInput, { target: { name: 'codi_cpv', value: '12345000' } });
    
    const warning = screen.getByText(/S'ha d'introduir un CPV amb nivell de 4 dígits/i);
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveClass('text-red-600');
  });

  it('should not show warning when CPV is 8 digits and ends in 0000', () => {
    render(<FormView user={mockUser as any} onSuccess={vi.fn()} />);
    
    const cpvInput = screen.getByPlaceholderText('12340000');
    fireEvent.change(cpvInput, { target: { name: 'codi_cpv', value: '12340000' } });
    
    expect(screen.queryByText(/S'ha d'introduir un CPV amb nivell de 4 dígits/i)).not.toBeInTheDocument();
  });
});
