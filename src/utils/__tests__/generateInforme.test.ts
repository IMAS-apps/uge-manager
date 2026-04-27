import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateInforme, generateComunicacioOFI } from '../generateInforme';
import { Record } from '../../types';

// Mock docx-templates to avoid real DOCX processing in tests
vi.mock('docx-templates', () => ({
  createReport: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<Record> = {}): Record {
  return {
    id: 42,
    hora: new Date().toISOString(),
    email: 'joan@example.com',
    nom: 'Joan Garcia',
    responsable_contracte: 'Direcció de la Residència Bonanova',
    centre_servei: 'Residència Bonanova',
    organ_contractacio: 'UFAG Residència Bonanova',
    justificacio: 'Necessitat urgent',
    objecte_contracte: 'Subministrament de material sanitari',
    caracteristiques_tecniques: 'Material estèril homologat',
    tipus_contracte: 'Subministrament',
    tipus_despesa: 'Menor',
    termini_execucio: 30,
    codi_cpv: '33140000',
    partida_organica: '10',
    partida_programa: '31',
    partida_economica: '62700',
    base_imposable: 1000,
    quota_iva: 210,
    fitxers_pressupost: [],
    detalls_addicionals: '',
    sistema_tramitacio: 'AD',
    segex: '',
    reg_factura: '',
    relacio_q: '',
    relacio_o: '',
    finalitzat: false,
    publicat: false,
    created_by: 'user-123',
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Record;
}

// ─── Template selection ───────────────────────────────────────────────────────

describe('generateInforme — template selection', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock fetch to return a valid ArrayBuffer
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response);

    // Mock DOM download trigger
    createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
    clickSpy = vi.fn();
    appendChildSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node: any) => {
        node.click = clickSpy;
        return node;
      });
    removeChildSpy = vi
      .spyOn(document.body, 'removeChild')
      .mockReturnValue({} as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch the AD template when sistema_tramitacio is AD', async () => {
    await generateInforme(makeRecord({ sistema_tramitacio: 'AD' }));
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('Informe_de_necessitats_AD.docx')
    );
  });

  it('should fetch the ADO template when sistema_tramitacio is ADO', async () => {
    await generateInforme(makeRecord({ sistema_tramitacio: 'ADO' }));
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('Informe_de_necessitats_ADO.docx')
    );
  });

  it('should fetch the OFI template when sistema_tramitacio is OFI', async () => {
    await generateInforme(makeRecord({ sistema_tramitacio: 'OFI' }));
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('Informe_de_necessitats_OFI.docx')
    );
  });

  it('should fetch the REC template when sistema_tramitacio is REC', async () => {
    await generateInforme(makeRecord({ sistema_tramitacio: 'REC' }));
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('Informe_de_necessitats_REC.docx')
    );
  });

  it('should throw when sistema_tramitacio is unsupported', async () => {
    await expect(
      generateInforme(makeRecord({ sistema_tramitacio: 'CF' }))
    ).rejects.toThrow('Sistema no suportat per a informes: CF');
  });

  it('should throw when the template fetch response is not ok', async () => {
    fetchSpy.mockResolvedValue({ ok: false, statusText: 'Not Found' } as Response);
    await expect(generateInforme(makeRecord())).rejects.toThrow(
      "Error en generar l'informe"
    );
  });
});

// ─── Import total calculation ──────────────────────────────────────────────

describe('generateInforme — import_total calculation', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
    vi.spyOn(document.body, 'appendChild').mockImplementation((n: any) => {
      n.click = vi.fn();
      return n;
    });
    vi.spyOn(document.body, 'removeChild').mockReturnValue({} as any);
  });

  afterEach(() => vi.restoreAllMocks());

  it('should calculate import total as base_imposable + quota_iva', async () => {
    const { createReport } = await import('docx-templates');
    await generateInforme(makeRecord({ base_imposable: 1000, quota_iva: 210 }));
    expect(createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          Import_total_: '1210.00 €',
        }),
      })
    );
  });

  it('should handle decimal amounts correctly (no floating point drift)', async () => {
    const { createReport } = await import('docx-templates');
    await generateInforme(makeRecord({ base_imposable: 99.99, quota_iva: 21.00 }));
    expect(createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          Import_total_: '120.99 €',
        }),
      })
    );
  });

  it('should map all record fields to template data correctly', async () => {
    const { createReport } = await import('docx-templates');
    const record = makeRecord();
    await generateInforme(record);
    expect(createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          record: expect.objectContaining({ id: record.id }),
          Organ_de_contractacio: record.organ_contractacio,
          Codi_dobjecte_contractual_CPV: record.codi_cpv,
          Termini_dexecucio_o_durada_previstaen: '30 dies',
        }),
      })
    );
  });
});

describe('generateComunicacioOFI', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
    vi.spyOn(document.body, 'appendChild').mockImplementation((n: any) => {
      n.click = vi.fn();
      return n;
    });
    vi.spyOn(document.body, 'removeChild').mockReturnValue({} as any);
  });

  afterEach(() => vi.restoreAllMocks());

  it('should fetch the Comunicacio_OFI template', async () => {
    await generateComunicacioOFI(makeRecord({ sistema_tramitacio: 'OFI' }));
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('Comunicacio_OFI_proveidors.docx')
    );
  });

  it('should map record and total correctly', async () => {
    const { createReport } = await import('docx-templates');
    const record = makeRecord({ id: 123, base_imposable: 100, quota_iva: 21 });
    await generateComunicacioOFI(record);
    expect(createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          record: expect.objectContaining({ id: 123 }),
          total: '121.00 €',
        }),
      })
    );
  });
});
