export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  last_notifications_cleared_at?: string;
}

export interface Record {
  id: number;
  hora: string;
  email: string;
  nom: string;
  responsable_contracte: string;
  centre_servei: string;
  organ_contractacio: string;
  justificacio: string;
  objecte_contracte: string;
  caracteristiques_tecniques: string;
  tipus_contracte: string;
  tipus_despesa: string;
  termini_execucio: number;
  codi_cpv: string;
  partida_organica: string;
  partida_programa: string;
  partida_economica: string;
  projecte_despesa_cap_vi?: string;
  base_imposable: number;
  quota_iva: number;
  fitxers_pressupost: { name: string, path: string, size: number }[];
  detalls_addicionals: string;
  motivacio_no_contractacio?: string;
  explicacio_no_contractacio?: string;
  justificacio_preu?: string;
  explicacio_preu?: string;
  data_ofi_inicial?: string | null;
  adjudicatari?: string;
  nif?: string;
  sistema_tramitacio: string;
  segex: string;
  reg_factura: string;
  relacio_q: string;
  relacio_o: string;
  finalitzat: boolean;
  publicat: boolean;
  created_by: string;
  updated_at: string;
  num_rc?: string | null;
  factures?: Factura[];
}

export interface Factura {
  id?: number;
  record_id?: number;
  expedient?: string;
  data: string;
  numero_registre: string;
  descripcio: string;
  periode: string;
  numero_factura: string;
  import_total: number;
  created_at?: string;
  updated_at?: string;
}

export interface OFI {
  id: number;
  codi_ofi: string;
  expedient_ofi: string;
  centre_servei: string;
  justificacio_general: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  total_import?: number;
  num_factures?: number;
  data_min?: string;
  data_max?: string;
}

export interface ContractLot {
  id?: number;
  contract_id?: number;
  nom_lot: string;
  cpv: string;
  adjudicatari: string;
  import_comes: number | null;
  data_inici: string;
  data_fi: string;
  data_limit_comunicacio_proroga: string;
  data_inici_proroga: string;
  data_fi_proroga: string;
  centres: string[];
  telefon?: string;
  email?: string;
  formalitzacio_document?: string | null;
  notified_proroga_60?: boolean;
  notified_proroga_30?: boolean;
  notified_fi_proroga_60?: boolean;
  notified_fi_proroga_30?: boolean;
  notified_fi_60?: boolean;
  notified_fi_30?: boolean;
  created_at?: string;
}

export interface Contract {
  id: number;
  nom_contracte: string;
  tipus_contracte: string;
  dossier: string;
  segex: string;
  referencia_interna: string;
  organ_contractacio: string;
  responsable_contracte: string;
  duracio_inicial: string;
  prorrogable: boolean;
  prorrogues: string;
  procediment_adjudicacio: string;
  modificable: boolean;
  modificat: string;
  sense_lots: boolean;
  detalls_addicionals: string;
  ppt_document: string | null;
  pcap_document: string | null;
  resolucio_document: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  lots?: ContractLot[];
}

export const RESPONSABLES = [
  "Direcció de la Residència Bonanova",
  "Direcció de la Residència Llar dels Ancians",
  "Direcció de la Residència Huialfàs",
  "Direcció de la Residència Oms-Sant Miquel",
  "Direcció de la Residència Miquel Mir",
  "Direcció de la Residència Sant Josep",
  "Direcció de la Residència Son Caulelles",
  "Direcció de la Residència Bartomeu Quetglas",
  "Direcció del Centre de dia Reina Sofia",
  "Direcció del Centre de dia Can Clar",
  "Cap del Servei d'Atenció Sociosanitària"
];

export const CENTRES_SERVEI = [
  "Residència Bonanova",
  "Residència Llar dels Ancians",
  "Residència Huialfàs",
  "Residència Oms-Sant Miquel",
  "Residència Miquel Mir",
  "Residència Sant Josep",
  "Residència Son Caulelles",
  "Residència Bartomeu Quetglas",
  "Centre de dia Reina Sofia",
  "Centre de dia Can Clar",
  "Centre de dia Son Perxana",
  "Oficines centrals d'Atenció Sociosanitària"
];

export const ORGANS = [
  "UFAG Residència Bonanova",
  "UFAG Residència Llar dels Ancians",
  "UFAG Residència Huialfàs",
  "UFAG Residència Oms-Sant Miquel",
  "UFAG Residència Miquel Mir",
  "UFAG Residència Sant Josep",
  "UFAG Residència Son Caulelles",
  "UFAG Residència Bartomeu Quetglas",
  "Vicepresidència",
  "Presidència"
];

export const SISTEMES_TRAMITACIO = [
  "AD", "ADO", "OFI", "REC", "CF", "R. PATRIMONIAL", "REBUTJAT (veure notes)"
];

export const PARTIDES_ORGANIQUES = ["00", "10", "20", "30", "40", "50", "60"];

export const MOTIVACIO_OPTIONS = [
  "",
  "a) Finalització del contracte o de les pròrrogues sense haver iniciat una nova licitació. No s’havia tramitat a temps el nou expedient i, per evitar perjudicis, el proveïdor va continuar prestant el servei.",
  "b) Finalització d’un concert social sense nova convocatòria.La prestació era imprescindible i no existia concert vigent.",
  "c) Licitació publicada però resultant deserta. La manca d’ofertes va obligar a mantenir la prestació per garantir el servei.",
  "d) Fraccionament per la naturalesa repetitiva de les despeses. Despeses recurrents que, per volum anual, superen els llindars de contracte menor.",
  "e) Manca de mitjans personals per planificar adequadament la contractació. Les càrregues de feina i la manca de personal varen impedir la tramitació a temps.",
  "f) Superació del crèdit del contracte vigent. Tot i existir contracte, s’havia esgotat la seva dotació i calia garantir el servei."
];

export const JUSTIFICACIO_PREU_OPTIONS = [
  "",
  "a) Consultes al mercat i comparatives amb altres proveïdors.\nS'han sol·licitat i comparat pressuposts amb diversos operadors econòmics, constatant-se que els preus facturats són equivalents o inferiors als habituals per serveis/subministraments de naturalesa similar. Aquestes consultes acrediten l'adequació dels imports al mercat actual.",
  "b) Informe econòmic del tècnic responsable.\nEl/la tècnic/a responsable ha emès un informe econòmic específic, incorporat com annex, en el qual analitza les tarifes aplicades i conclou que els imports són correctes, raonables i conformes als preus habituals del sector. Aquest informe serveix de fonament per justificar la proporcionalitat i adequació del cost de la prestació.",
  "c) Manteniment de preus d'un contracte o concert anterior.\nEn aquelles prestacions vinculades a un contracte, conveni o concert social ja finalitzat, els imports facturats coincideixen amb els preus que s'havien aplicat durant la vigència del contracte anterior, sense increments. Aquest fet constitueix un referent vàlid d'adequació al mercat i dona suport al valor econòmic aplicat."
];

// ── Contract module constants ────────────────────────────────────────────────

export const CONTRACTE_TIPUS = [
  "Subministrament",
  "Servei",
  "Obra",
  "Exclòs",
  "Privat"
];

export const CONTRACTE_ORGANS = [
  "UFAG Residència Bonanova",
  "UFAG Residència Llar dels Ancians",
  "UFAG Residència Huialfàs",
  "UFAG Residència Oms-Sant Miquel",
  "UFAG Residència Miquel Mir",
  "UFAG Residència Sant Josep",
  "UFAG Residència Son Caulelles",
  "UFAG Residència Bartomeu Quetglas",
  "Vicepresidència",
  "Gerència",
  "Presidència"
];

export const CONTRACTE_RESPONSABLES = [
  "Direcció de la Residència Bonanova",
  "Direcció de la Residència Llar dels Ancians",
  "Direcció de la Residència Huialfàs",
  "Direcció de la Residència Oms-Sant Miquel",
  "Direcció de la Residència Miquel Mir",
  "Direcció de la Residència Sant Josep",
  "Direcció de la Residència Son Caulelles",
  "Direcció de la Residència Bartomeu Quetglas",
  "Direcció del Centre de dia Reina Sofia",
  "Direcció del Centre de dia Can Clar",
  "Cap del Servei d'Atenció Sociosanitària",
  "Cap del Negociat dels Serveis Generals",
  "Direcció de varis centres"
];

export const PROCEDIMENTS_ADJUDICACIO = [
  "Obert harmonitzat",
  "Obert ordinari",
  "Obert simplificat",
  "Obert simplificat abreujat",
  "Restringit",
  "Acord marc",
  "Privat"
];

export const CENTRES_IMAS = [
  "Residència Bonanova",
  "Residència Llar dels Ancians",
  "Residència Bartomeu Quetglas",
  "Residència Huialfàs",
  "Residència Oms-Sant Miquel",
  "Residència Miquel Mir",
  "Residència Son Caulelles",
  "Residència Sant Josep",
  "Centre de dia Can Clar",
  "Centre de dia Reina Sofia",
  "Centre de dia L'Hospici",
  "Centre de dia Son Perxana"
];
