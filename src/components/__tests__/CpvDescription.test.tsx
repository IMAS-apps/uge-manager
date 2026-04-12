import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CpvDescription } from '../CpvDescription';

// Mock Supabase — CpvDescription fetches from the cpv_codes table
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  },
}));

import { supabase } from '../../lib/supabase';

const mockMaybeSingle = supabase.maybeSingle as ReturnType<typeof vi.fn>;

describe('CpvDescription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when code is an empty string', () => {
    const { container } = render(<CpvDescription code="" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when code is shorter than 3 characters', async () => {
    const { container } = render(<CpvDescription code="33" />);
    // Component returns null early for short codes
    expect(container.firstChild).toBeNull();
  });

  it('should show loading text while fetching description', async () => {
    // Mock a slow response — maybeSingle never resolves during this test
    mockMaybeSingle.mockReturnValue(new Promise(() => {}));
    render(<CpvDescription code="33140000" />);
    await waitFor(() => {
      expect(screen.getByText('Cercant descripció...')).toBeInTheDocument();
    });
  });

  it('should display the description when Supabase returns a result', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { description_ca: 'Material mèdic consumible' },
      error: null,
    });
    render(<CpvDescription code="33140000" />);
    await waitFor(() => {
      expect(screen.getByText('Material mèdic consumible')).toBeInTheDocument();
    });
  });

  it('should render nothing when Supabase returns null data (code not found)', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const { container } = render(<CpvDescription code="99999999" />);
    await waitFor(() => {
      // description is null, loading is false → component returns null
      expect(container.firstChild).toBeNull();
    });
  });

  it('should render nothing when Supabase returns an error', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    });
    const { container } = render(<CpvDescription code="33140000" />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
