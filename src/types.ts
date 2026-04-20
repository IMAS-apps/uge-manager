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
  "a) Despesa que suposa fraccionament per ser repetitiva i gairebé periòdica, i supera els llindars que requereix la Llei de Contractes del Sector Públic per licitar-les.",
  "b) Despesa deguda a finalització de contractes administratius i les corresponents prorrogues en el seu cas, i no haver començat una nova licitació o bé tot i haver sortit a licitació encara no s'ha adjudicat el nou contracte administratiu.",
  "c) Despesa deguda a finalització de contractes administratius i les corresponents prorrogues en el seu cas, i tot i haver sortit a licitació, l'adjudicació ha resultat deserta.",
  "d) Despesa que ha superat els llindars de contractació menor a efectes de fraccionament de l'objecte.",
  "e) Despesa que no ha superat els llindars de contractació menor a efectes de fraccionament de l'objecte."
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
