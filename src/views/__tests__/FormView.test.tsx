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
});
