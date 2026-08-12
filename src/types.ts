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
  motivacio_seleccio?: string;
  sistema_tramitacio: string;
  segex: string;
  reg_factura: string;
  relacio_q: string;
  relacio_o: string;
  finalitzat: boolean;
  publicat: boolean;
  adjudicat?: boolean;
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
  descripcio?: string;
  justificacio_general: string;
  area?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  total_import?: number;
  num_factures?: number;
  data_min?: string;
  data_max?: string;
}

export const AREES_OFI = [
  "Gerència",
  "Atenció Sociosanitària",
  "Serveis Socials, Infància y Familia",
  "Centres y Programes d'Atenció Integral a la Infància y Adolescència",
  "Inclusió Social",
  "Persones amb discapacitat",
  "Atenció Comunitària y Promoció de l'Autonomia Personal"
];

export const TEXTOS_JUSTIFICACIO_OFI: { [key: string]: string } = {
  "Gerència": "Gerència - pendent de descripció",
  "Atenció Sociosanitària": "La Direcció Insular d’Atenció Sociosanitària centra la seva tasca en la gestió de les residències per a gent gran i dels centres de dia que depenen de l’IMAS i en la consolidació del model assistencial basat en una atenció centrada en la persona. En aquest sentit, els objectius de l’àrea són ’ampliació de places, que es materialitza amb la posada en marxa de nous centres especialitzats i amb la modernització i l’adaptació a les necessitats concretes i particulars dels usuaris dels centres ja existents.",
  "Serveis Socials, Infància y Familia": "Serveis Socials, Infància y Familia- pendent de descripció",
  "Centres y Programes d'Atenció Integral a la Infància y Adolescència": "Centres y Programes d'Atenció Integral a la Infància y Adolescència- pendent de descripció",
  "Inclusió Social": "La direcció insular d’Inclusió Social atén les persones en risc o situació d’exclusió social a Mallorca. Té com a principal objectiu gestionar i subministrar amb qualitat i eficàcia els serveis, recursos i prestacions socials destinats a les persones que es troben en situació o risc d'exclusió social a Mallorca. Es tracta de cobrir les necessitats socials bàsiques d'aquest conjunt de la població i millorar-ne la qualitat de vida.",
  "Persones amb discapacitat": "Persones amb discapacitat- pendent de descripció",
  "Atenció Comunitària y Promoció de l'Autonomia Personal": "Atenció Comunitària y Promoció de l'Autonomia Personal- pendent de descripció"
};

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
  "a) Per finalització de contractes administratius i les corresponents prorrogues en el seu cas, i no haver iniciat nova licitació o bé tot i haver sortit a licitació encara no s’ha adjudicat el nou contracte administratiu. \nTot i haver-hi contracte l’objecte de la factura no es troba englobat dins el mateix.",
  "b) Per finalització de concerts de serveis socials i no haver tret a convocatòria un nou concert o bé tot i estar en licitació no s’ha adjudicat el nou concert.",
  "c) Tot i haver sortit a licitació un nou contracte administratiu, la adjudicació ha resultat deserta.",
  "d) Algunes despeses suposen un fraccionament per ser repetitives i gairebé periòdiques, i superen el llindars que requereix la Llei de Contractes del Sector Públic per licitar-les.",
  "e) Manca de personal al centre que dificulta la planificació de la contractació i realitzar propostes des d’altres enfocaments i perspectives als problemes que la contractació d’avui demanda.",
  "f) Per superació del crèdit contractat."
];

export const JUSTIFICACIO_PREU_OPTIONS = [
  "",
  "a) Sol·licitats i comparats pressuposts de proveïdors diferents, els preus dels serveis contractats i/o subministraments efectuats s’ajusten als preus de mercat.",
  "b) El/la tècnic/a responsable de la despesa ha realitzat consultes al mercat i ha emès l’informe econòmic que s’adjunta, que justifica que els preus aplicats s’ajusten al mercat.",
  "c) Els preus facturats es mantenen en les mateixes condicions que es venien aplicant durant la duració del contracte (o concert) anterior."
];

export const MOTIVACIO_SELECCIO_OPTIONS = [
  "",
  "tercer que disposa de la capacitat tècnica i mitjans materials immediats per a l'execució de la prestació en una situació de necessitat urgent no previsible que impossibilitava la tramitació prèvia",
  "tercer que compta amb coneixements tècnics o especialitzats de caràcter exclusiu en la matèria",
  "tercer que venia prestant el servei correctament i ha permès garantir la continuïtat d'un servei públic de caràcter essencial o ininterromput",
  "tercer que ha ofert la proposta econòmica més avantatjosa d'acord amb la relació qualitat-preu",
  "tercer que disposa del coneixement del context i l'històric de la instal·lació o servei per haver-hi actuat prèviament",
  "tercer que compta amb la condició de proveïdor únic o distribuïdor exclusiu del bé o servei en el mercat",
  "tercer que ha estat seleccionat per raons de compatibilitat tècnica i homogeneïtzació amb els equips o sistemes preexistents",
  "tercer que ofereix les millors garanties d'eficiència, eficàcia i solvència per a la realització de la prestació"
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
