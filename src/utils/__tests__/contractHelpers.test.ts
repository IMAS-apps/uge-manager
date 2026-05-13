import { describe, it, expect } from 'vitest';
import {
  formatDate,
  getContractDates,
  isContractVigent,
  getRenewalTheme,
} from '../contractHelpers';
import type { ContractLot } from '../../types';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeLot(overrides: Partial<ContractLot> = {}): ContractLot {
  return {
    nom_lot: 'Lot de test',
    cpv: '',
    adjudicatari: '',
    import_comes: null,
    data_inici: '',
    data_fi: '',
    data_limit_comunicacio_proroga: '',
    data_inici_proroga: '',
    data_fi_proroga: '',
    centres: [],
    ...overrides,
  };
}

// ─── formatDate ─────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('should return "—" when date is null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('should return "—" when date is undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('should return "—" when date is an empty string', () => {
    expect(formatDate('')).toBe('—');
  });

  it('should format a valid ISO date to ca-ES locale', () => {
    const result = formatDate('2025-06-15');
    // ca-ES format: 15/06/2025
    expect(result).toMatch(/15\/06\/2025/);
  });

  it('should correctly format a full ISO timestamp', () => {
    const result = formatDate('2026-04-10T07:03:22.417Z');
    // The exact day might depend on the runner's timezone, but it shouldn't be "Invalid Date" or the original string
    // 2026-04-10T07:03:22.417Z is 10/04/2026 in many timezones (UTC, CET)
    expect(result).toMatch(/\d{2}\/\d{2}\/2026/);
    expect(result).not.toBe('2026-04-10T07:03:22.417Z');
    expect(result).not.toBe('Invalid Date');
  });

  it('should return the original string if it is not a valid date', () => {
    const invalid = 'not-a-date';
    expect(formatDate(invalid)).toBe(invalid);
  });
});

// ─── getContractDates ────────────────────────────────────────────────────────

describe('getContractDates', () => {
  it('should return nulls when lots array is empty', () => {
    expect(getContractDates([])).toEqual({ dataInici: null, dataFi: null });
  });

  it('should return the lot dates when there is a single lot', () => {
    const lots = [makeLot({ data_inici: '2024-01-01', data_fi: '2025-12-31' })];
    expect(getContractDates(lots)).toEqual({
      dataInici: '2024-01-01',
      dataFi: '2025-12-31',
    });
  });

  it('should pick the earliest start date across multiple lots', () => {
    const lots = [
      makeLot({ data_inici: '2024-06-01', data_fi: '2025-06-01' }),
      makeLot({ data_inici: '2023-01-01', data_fi: '2024-12-31' }),
    ];
    expect(getContractDates(lots).dataInici).toBe('2023-01-01');
  });

  it('should pick the latest end date across multiple lots', () => {
    const lots = [
      makeLot({ data_inici: '2024-01-01', data_fi: '2025-06-01' }),
      makeLot({ data_inici: '2024-01-01', data_fi: '2026-12-31' }),
    ];
    expect(getContractDates(lots).dataFi).toBe('2026-12-31');
  });

  it('should prefer data_fi_proroga over data_fi for the end date', () => {
    const lots = [
      makeLot({
        data_inici: '2024-01-01',
        data_fi: '2025-06-01',
        data_fi_proroga: '2027-01-01',
      }),
    ];
    expect(getContractDates(lots).dataFi).toBe('2027-01-01');
  });

  it('should return null for dataFi when all lots have empty end dates', () => {
    const lots = [makeLot({ data_inici: '2024-01-01', data_fi: '' })];
    expect(getContractDates(lots).dataFi).toBeNull();
  });
});

// ─── isContractVigent ────────────────────────────────────────────────────────

describe('isContractVigent', () => {
  it('should return true when lots array is empty (no end date)', () => {
    expect(isContractVigent([], '2025-06-15')).toBe(true);
  });

  it('should return true when there is no end date defined in any lot', () => {
    const lots = [makeLot({ data_inici: '2024-01-01', data_fi: '' })];
    expect(isContractVigent(lots, '2026-01-01')).toBe(true);
  });

  it('should return true when the contract end date is in the future', () => {
    const lots = [makeLot({ data_inici: '2024-01-01', data_fi: '2099-12-31' })];
    expect(isContractVigent(lots, '2026-01-01')).toBe(true);
  });

  it('should return true when the contract end date is exactly today', () => {
    const lots = [makeLot({ data_inici: '2024-01-01', data_fi: '2026-06-15' })];
    expect(isContractVigent(lots, '2026-06-15')).toBe(true);
  });

  it('should return false when the contract end date is in the past', () => {
    const lots = [makeLot({ data_inici: '2020-01-01', data_fi: '2021-12-31' })];
    expect(isContractVigent(lots, '2026-01-01')).toBe(false);
  });

  it('should return false when the contract expired yesterday', () => {
    const lots = [makeLot({ data_inici: '2024-01-01', data_fi: '2026-06-14' })];
    expect(isContractVigent(lots, '2026-06-15')).toBe(false);
  });

  it('should use data_fi_proroga over data_fi when determining vigency', () => {
    // data_fi is expired but proroga extends it
    const lots = [
      makeLot({
        data_inici: '2024-01-01',
        data_fi: '2020-01-01',
        data_fi_proroga: '2099-12-31',
      }),
    ];
    expect(isContractVigent(lots, '2026-01-01')).toBe(true);
  });
});

// ─── getRenewalTheme ─────────────────────────────────────────────────────────

describe('getRenewalTheme', () => {
  const TODAY = '2026-06-15';

  it('should return "" when there are no lots', () => {
    const contract = { prorrogable: true, lots: [] };
    expect(getRenewalTheme(contract, TODAY)).toBe('');
  });

  it('should return "" when all critical dates are in the past', () => {
    const contract = {
      prorrogable: true,
      lots: [makeLot({ data_limit_comunicacio_proroga: '2020-01-01', data_fi_proroga: '2021-01-01' })],
    };
    expect(getRenewalTheme(contract, TODAY)).toBe('');
  });

  it('should return "" when all critical dates are more than 60 days away', () => {
    const contract = {
      prorrogable: true,
      lots: [makeLot({ data_limit_comunicacio_proroga: '2027-01-01', data_fi_proroga: '2027-06-01' })],
    };
    expect(getRenewalTheme(contract, TODAY)).toBe('');
  });

  it('should return pastel red class when the nearest deadline is in 31–60 days', () => {
    // 30 days after TODAY = 2026-07-15, which is 30 days → intense red
    // Use 45 days → 2026-07-30
    const deadlineDate = '2026-07-30'; // 45 days after 2026-06-15
    const contract = {
      prorrogable: true,
      lots: [makeLot({ data_limit_comunicacio_proroga: deadlineDate })],
    };
    expect(getRenewalTheme(contract, TODAY)).toBe('bg-[#FFE5E5] hover:bg-[#FFD1D1]');
  });

  it('should return intense red class when the nearest deadline is within 30 days', () => {
    const deadlineDate = '2026-07-10'; // 25 days after 2026-06-15
    const contract = {
      prorrogable: true,
      lots: [makeLot({ data_limit_comunicacio_proroga: deadlineDate })],
    };
    expect(getRenewalTheme(contract, TODAY)).toBe('bg-[#FFBABA] hover:bg-[#FF9B9B]');
  });

  it('should return intense red class when the deadline is exactly today (0 days)', () => {
    const contract = {
      prorrogable: true,
      lots: [makeLot({ data_limit_comunicacio_proroga: TODAY })],
    };
    expect(getRenewalTheme(contract, TODAY)).toBe('bg-[#FFBABA] hover:bg-[#FF9B9B]');
  });

  it('should check data_fi when contract is NOT prorrogable', () => {
    const deadlineDate = '2026-07-05'; // 20 days away → intense red
    const contract = {
      prorrogable: false,
      lots: [makeLot({ data_fi: deadlineDate })],
    };
    expect(getRenewalTheme(contract, TODAY)).toBe('bg-[#FFBABA] hover:bg-[#FF9B9B]');
  });

  it('should NOT check data_fi when contract IS prorrogable', () => {
    // data_fi is within 30 days but prorrogable is true → should not trigger alert
    const contract = {
      prorrogable: true,
      lots: [
        makeLot({
          data_fi: '2026-07-05', // 20 days away (would be red if checked)
          data_limit_comunicacio_proroga: '2027-01-01', // far away
          data_fi_proroga: '2027-01-01', // far away
        }),
      ],
    };
    expect(getRenewalTheme(contract, TODAY)).toBe('');
  });

  it('should use the nearest deadline when a lot has multiple critical dates', () => {
    // data_fi_proroga in 20 days (intense red), data_limit in 45 days (pastel)
    const contract = {
      prorrogable: true,
      lots: [
        makeLot({
          data_limit_comunicacio_proroga: '2026-07-30', // 45 days → pastel
          data_fi_proroga: '2026-07-05', // 20 days → intense red
        }),
      ],
    };
    expect(getRenewalTheme(contract, TODAY)).toBe('bg-[#FFBABA] hover:bg-[#FF9B9B]');
  });

  it('should pick the most urgent deadline across multiple lots', () => {
    const contract = {
      prorrogable: true,
      lots: [
        makeLot({ data_limit_comunicacio_proroga: '2026-07-30' }), // 45 days → pastel
        makeLot({ data_fi_proroga: '2026-07-05' }), // 20 days → intense red
      ],
    };
    expect(getRenewalTheme(contract, TODAY)).toBe('bg-[#FFBABA] hover:bg-[#FF9B9B]');
  });
});
