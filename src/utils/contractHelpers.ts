/**
 * contractHelpers.ts
 * Pure functions extracted from ContractDashboardView for testability.
 * These helpers contain critical business logic around contract date handling
 * and renewal alert thresholds.
 */

import { ContractLot } from '../types';

/**
 * Formats a date string (YYYY-MM-DD) to a locale-specific display string.
 * Returns '—' if the date is null/undefined/empty.
 */
export function formatDate(d?: string | null): string {
  if (!d) return '—';
  try {
    // Si d és una cadena de data pura (YYYY-MM-DD), afegim T00:00:00 per forçar parsing local.
    // Si ja té 'T' o espais (timestamp complet), la deixem tal qual.
    const dateToParse = (d.length === 10 && !d.includes('T') && !d.includes(' ')) 
      ? d + 'T00:00:00' 
      : d;
    
    const dt = new Date(dateToParse);
    
    // Si la data no és vàlida, dt.getTime() serà NaN
    if (isNaN(dt.getTime())) {
      return d;
    }

    return dt.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return d;
  }
}

/**
 * Computes the effective start and end dates across all lots of a contract.
 * - dataInici: earliest data_inici among all lots.
 * - dataFi: latest data_fi_proroga (if present) or data_fi among all lots.
 */
export function getContractDates(lots: ContractLot[]): { dataInici: string | null; dataFi: string | null } {
  let earliest: string | null = null;
  let latest: string | null = null;

  lots.forEach((lot) => {
    const start = lot.data_inici;
    const end = lot.data_fi_proroga || lot.data_fi;

    if (start) {
      if (!earliest || start < earliest) earliest = start;
    }
    if (end) {
      if (!latest || end > latest) latest = end;
    }
  });

  return { dataInici: earliest, dataFi: latest };
}

/**
 * Determines whether a contract is "vigent" (active) on a given reference date.
 * A contract with no lots or no end date is always considered vigent.
 * A contract is expired when dataFi < today (ISO string comparison).
 *
 * @param lots - Array of ContractLot for the contract.
 * @param today - ISO date string (YYYY-MM-DD) used as the reference date.
 *                Defaults to the current date if not provided (injectable for tests).
 */
export function isContractVigent(lots: ContractLot[], today?: string): boolean {
  const { dataFi } = getContractDates(lots);
  if (!dataFi) return true; // No end date → always vigent
  const reference = today ?? getTodayISO();
  return dataFi >= reference;
}

/**
 * Returns today's date as a YYYY-MM-DD ISO string (local time).
 * Extracted so tests can verify the helper without mocking Date.
 */
export function getTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Computes the CSS class for a contract row based on how close the next
 * critical deadline is across all its lots.
 *
 * Thresholds:
 *  - <= 30 days → intense red  ('bg-[#FFBABA] hover:bg-[#FF9B9B]')
 *  - <= 60 days → pastel red   ('bg-[#FFE5E5] hover:bg-[#FFD1D1]')
 *  - otherwise  → ''
 *
 * Critical dates checked per lot:
 *  - data_limit_comunicacio_proroga
 *  - data_fi_proroga
 *  - data_fi (only when contract.prorrogable === false)
 *
 * @param contract - Contract object with prorrogable flag and lots array.
 * @param today    - Optional ISO date string for deterministic testing.
 */
export function getRenewalTheme(
  contract: { prorrogable: boolean; lots?: ContractLot[] },
  today?: string
): string {
  const lots = contract.lots ?? [];
  if (lots.length === 0) return '';

  const referenceStr = today ?? getTodayISO();
  const referenceDate = new Date(referenceStr + 'T00:00:00');

  let minDaysUntilDeadline: number | null = null;

  lots.forEach((lot) => {
    const checkDates = [
      lot.data_limit_comunicacio_proroga,
      lot.data_fi_proroga,
    ];

    if (contract.prorrogable === false) {
      checkDates.push(lot.data_fi);
    }

    checkDates.forEach((dateStr) => {
      if (dateStr) {
        const deadlineDate = new Date(dateStr + 'T00:00:00');
        const diffTime = deadlineDate.getTime() - referenceDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0) {
          if (minDaysUntilDeadline === null || diffDays < minDaysUntilDeadline) {
            minDaysUntilDeadline = diffDays;
          }
        }
      }
    });
  });

  if (minDaysUntilDeadline === null) return '';

  if (minDaysUntilDeadline <= 30) return 'bg-[#FFBABA] hover:bg-[#FF9B9B]';
  if (minDaysUntilDeadline <= 60) return 'bg-[#FFE5E5] hover:bg-[#FFD1D1]';

  return '';
}
