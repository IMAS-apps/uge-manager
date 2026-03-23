export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            contracts: {
                Row: {
                    id: number
                    nom_contracte: string
                    tipus_contracte: string
                    dossier: string | null
                    segex: string | null
                    referencia_interna: string | null
                    organ_contractacio: string
                    responsable_contracte: string
                    duracio_inicial: string | null
                    prorrogable: boolean
                    prorrogues: string | null
                    procediment_adjudicacio: string | null
                    modificable: boolean
                    modificat: string | null
                    sense_lots: boolean
                    detalls_addicionals: string | null
                    ppt_document: Json | null
                    pcap_document: Json | null
                    resolucio_document: Json | null
                    created_by: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: number
                    nom_contracte: string
                    tipus_contracte: string
                    dossier?: string | null
                    segex?: string | null
                    referencia_interna?: string | null
                    organ_contractacio: string
                    responsable_contracte: string
                    duracio_inicial?: string | null
                    prorrogable?: boolean
                    prorrogues?: string | null
                    procediment_adjudicacio?: string | null
                    modificable?: boolean
                    modificat?: string | null
                    sense_lots?: boolean
                    detalls_addicionals?: string | null
                    ppt_document?: Json | null
                    pcap_document?: Json | null
                    resolucio_document?: Json | null
                    created_by: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: number
                    nom_contracte?: string
                    tipus_contracte?: string
                    dossier?: string | null
                    segex?: string | null
                    referencia_interna?: string | null
                    organ_contractacio?: string
                    responsable_contracte?: string
                    duracio_inicial?: string | null
                    prorrogable?: boolean
                    prorrogues?: string | null
                    procediment_adjudicacio?: string | null
                    modificable?: boolean
                    modificat?: string | null
                    sense_lots?: boolean
                    detalls_addicionals?: string | null
                    ppt_document?: Json | null
                    pcap_document?: Json | null
                    resolucio_document?: Json | null
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            contract_lots: {
                Row: {
                    id: number
                    contract_id: number
                    nom_lot: string
                    cpv: string | null
                    adjudicatari: string | null
                    import_comes: number | null
                    data_inici: string | null
                    data_fi: string | null
                    data_limit_comunicacio_proroga: string | null
                    data_inici_proroga: string | null
                    data_fi_proroga: string | null
                    centres: Json
                    created_at: string
                }
                Insert: {
                    id?: number
                    contract_id: number
                    nom_lot: string
                    cpv?: string | null
                    adjudicatari?: string | null
                    import_comes?: number | null
                    data_inici?: string | null
                    data_fi?: string | null
                    data_limit_comunicacio_proroga?: string | null
                    data_inici_proroga?: string | null
                    data_fi_proroga?: string | null
                    centres?: Json
                    created_at?: string
                }
                Update: {
                    id?: number
                    contract_id?: number
                    nom_lot?: string
                    cpv?: string | null
                    adjudicatari?: string | null
                    import_comes?: number | null
                    data_inici?: string | null
                    data_fi?: string | null
                    data_limit_comunicacio_proroga?: string | null
                    data_inici_proroga?: string | null
                    data_fi_proroga?: string | null
                    centres?: Json
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "contract_lots_contract_id_fkey"
                        columns: ["contract_id"]
                        isOneToOne: false
                        referencedRelation: "contracts"
                        referencedColumns: ["id"]
                    }
                ]
            }
            notifications: {
                Row: {
                    changed_fields: Json | null
                    created_at: string | null
                    id: number
                    is_read: boolean
                    peticio_id: number | null
                    peticio_objecte: string
                    read_by: Json
                    recipient_user_id: string | null
                    triggered_by_name: string
                    triggered_by_user_id: string
                    type: string
                }
                Insert: {
                    changed_fields?: Json | null
                    created_at?: string | null
                    id?: number
                    peticio_id?: number | null
                    peticio_objecte: string
                    read_by?: Json
                    recipient_user_id?: string | null
                    triggered_by_name: string
                    triggered_by_user_id: string
                    type: string
                }
                Update: {
                    changed_fields?: Json | null
                    created_at?: string | null
                    id?: number
                    is_read?: boolean
                    peticio_id?: number | null
                    peticio_objecte?: string
                    read_by?: Json
                    recipient_user_id?: string | null
                    triggered_by_name?: string
                    triggered_by_user_id?: string
                    type?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_peticio_id_fkey"
                        columns: ["peticio_id"]
                        isOneToOne: false
                        referencedRelation: "records"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    created_at: string | null
                    email: string
                    full_name: string
                    id: string
                    role: string
                }
                Insert: {
                    created_at?: string | null
                    email: string
                    full_name: string
                    id: string
                    role?: string
                }
                Update: {
                    created_at?: string | null
                    email?: string
                    full_name?: string
                    id?: string
                    role?: string
                }
                Relationships: []
            }
            records: {
                Row: {
                    base_imposable: number
                    caracteristiques_tecniques: string
                    codi_cpv: string
                    created_by: string
                    detalls_addicionals: string | null
                    email: string
                    finalitzat: boolean | null
                    fitxers_pressupost: Json
                    hora: string
                    id: number
                    justificacio: string
                    motivacio_no_contractacio: string | null
                    nom: string
                    objecte_contracte: string
                    organ_contractacio: string
                    partida_economica: string
                    partida_organica: string
                    partida_programa: string
                    publicat: boolean | null
                    quota_iva: number
                    reg_factura: string | null
                    relacio_o: string | null
                    relacio_q: string | null
                    responsable_contracte: string
                    segex: string | null
                    sistema_tramitacio: string | null
                    termini_execucio: number
                    tipus_contracte: string
                    tipus_despesa: string
                    updated_at: string | null
                }
                Insert: {
                    base_imposable: number
                    caracteristiques_tecniques: string
                    codi_cpv: string
                    created_by: string
                    detalls_addicionals?: string | null
                    email: string
                    finalitzat?: boolean | null
                    fitxers_pressupost?: Json
                    hora: string
                    id?: number
                    justificacio: string
                    motivacio_no_contractacio?: string | null
                    nom: string
                    objecte_contracte: string
                    organ_contractacio: string
                    partida_economica: string
                    partida_organica: string
                    partida_programa: string
                    publicat?: boolean | null
                    quota_iva: number
                    reg_factura?: string | null
                    relacio_o?: string | null
                    relacio_q?: string | null
                    responsable_contracte: string
                    segex?: string | null
                    sistema_tramitacio?: string | null
                    termini_execucio: number
                    tipus_contracte: string
                    tipus_despesa: string
                    updated_at?: string | null
                }
                Update: {
                    base_imposable?: number
                    caracteristiques_tecniques?: string
                    codi_cpv?: string
                    created_by?: string
                    detalls_addicionals?: string | null
                    email?: string
                    finalitzat?: boolean | null
                    fitxers_pressupost?: Json
                    hora?: string
                    id?: number
                    justificacio?: string
                    motivacio_no_contractacio?: string | null
                    nom?: string
                    objecte_contracte?: string
                    organ_contractacio?: string
                    partida_economica?: string
                    partida_organica?: string
                    partida_programa?: string
                    publicat?: boolean | null
                    quota_iva?: number
                    reg_factura?: string | null
                    relacio_o?: string | null
                    relacio_q?: string | null
                    responsable_contracte?: string
                    segex?: string | null
                    sistema_tramitacio?: string | null
                    termini_execucio?: number
                    tipus_contracte?: string
                    tipus_despesa?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database['public']

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never
