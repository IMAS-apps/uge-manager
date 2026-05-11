import { describe, it, expect } from 'vitest';
import {
  RESPONSABLES,
  ORGANS,
  SISTEMES_TRAMITACIO,
  PARTIDES_ORGANIQUES,
  MOTIVACIO_OPTIONS,
  CONTRACTE_TIPUS,
  CONTRACTE_ORGANS,
  CONTRACTE_RESPONSABLES,
  PROCEDIMENTS_ADJUDICACIO,
  CENTRES_IMAS,
} from '../types';

// These tests guard against accidental renames or deletions of constant
// values that the UI relies on for selects, filters and DB consistency.

describe('RESPONSABLES', () => {
  it('should be a non-empty array', () => {
    expect(RESPONSABLES.length).toBeGreaterThan(0);
  });

  it('should include "Cap del Servei d\'Atenció Sociosanitària"', () => {
    expect(RESPONSABLES).toContain("Cap del Servei d'Atenció Sociosanitària");
  });
});

describe('ORGANS', () => {
  it('should include "Vicepresidència"', () => {
    expect(ORGANS).toContain('Vicepresidència');
  });

  it('should include "Presidència"', () => {
    expect(ORGANS).toContain('Presidència');
  });
});

describe('SISTEMES_TRAMITACIO', () => {
  it('should contain all expected tramitació codes', () => {
    const expected = ['AD', 'ADO', 'OFI', 'REC', 'CF', 'R. PATRIMONIAL', 'REBUTJAT (veure notes)'];
    expect(SISTEMES_TRAMITACIO).toEqual(expected);
  });

  it('should contain the generateInforme-supported codes (AD, ADO, OFI, REC)', () => {
    ['AD', 'ADO', 'OFI', 'REC'].forEach((code) => {
      expect(SISTEMES_TRAMITACIO).toContain(code);
    });
  });
});

describe('PARTIDES_ORGANIQUES', () => {
  it('should be an array of two-digit string codes', () => {
    PARTIDES_ORGANIQUES.forEach((p) => {
      expect(p).toMatch(/^\d{2}$/);
    });
  });
});

describe('MOTIVACIO_OPTIONS', () => {
  it('should start with an empty string option to allow "no selection"', () => {
    expect(MOTIVACIO_OPTIONS[0]).toBe('');
  });

  it('should have 7 options total (empty + 6 labelled)', () => {
    expect(MOTIVACIO_OPTIONS).toHaveLength(7);
  });
});

describe('CONTRACTE_TIPUS', () => {
  it('should contain all expected contract types', () => {
    const expected = ['Subministrament', 'Servei', 'Obra', 'Exclòs', 'Privat'];
    expect(CONTRACTE_TIPUS).toEqual(expected);
  });
});

describe('CONTRACTE_ORGANS', () => {
  it('should include "Gerència" (distinct from ORGANS which lacks it)', () => {
    expect(CONTRACTE_ORGANS).toContain('Gerència');
  });
});

describe('CONTRACTE_RESPONSABLES', () => {
  it('should include "Direcció de varis centres"', () => {
    expect(CONTRACTE_RESPONSABLES).toContain('Direcció de varis centres');
  });
});

describe('PROCEDIMENTS_ADJUDICACIO', () => {
  it('should contain "Obert harmonitzat"', () => {
    expect(PROCEDIMENTS_ADJUDICACIO).toContain('Obert harmonitzat');
  });

  it('should contain "Acord marc"', () => {
    expect(PROCEDIMENTS_ADJUDICACIO).toContain('Acord marc');
  });
});

describe('CENTRES_IMAS', () => {
  it('should be a non-empty array', () => {
    expect(CENTRES_IMAS.length).toBeGreaterThan(0);
  });

  it('should include "Residència Bonanova"', () => {
    expect(CENTRES_IMAS).toContain('Residència Bonanova');
  });

  it('should not contain duplicates', () => {
    const unique = new Set(CENTRES_IMAS);
    expect(unique.size).toBe(CENTRES_IMAS.length);
  });
});
