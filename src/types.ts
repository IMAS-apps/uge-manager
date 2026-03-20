export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface Record {
  id: number;
  hora: string;
  email: string;
  nom: string;
  responsable_contracte: string;
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

export const ORGANS = [
  "UFAG Residència Bonanova",
  "UFAG Residència Llar dels Ancians",
  "UFAG Residència Huialfàs",
  "UFAG Residència Oms-Sant Miquel",
  "UFAG Residència Miquel Mir",
  "UFAG Residència Sant Josep",
  "UFAG Residència Son Caulelles",
  "UFAG Residència Bartomeu Quetglas",
  "Vicepresidència"
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
