export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contract_lots: {
        Row: {
          adjudicatari: string | null
          centres: Json
          contract_id: number
          cpv: string | null
          created_at: string
          data_fi: string | null
          data_fi_proroga: string | null
          data_inici: string | null
          data_inici_proroga: string | null
          data_limit_comunicacio_proroga: string | null
          email: string | null
          formalitzacio_document: string | null
          id: number
          import_comes: number | null
          nom_lot: string
          notified_fi_30: boolean | null
          notified_fi_60: boolean | null
          notified_fi_proroga_30: boolean | null
          notified_fi_proroga_60: boolean | null
          notified_proroga_30: boolean | null
          notified_proroga_60: boolean | null
          telefon: string | null
        }
        Insert: {
          adjudicatari?: string | null
          centres?: Json
          contract_id: number
          cpv?: string | null
          created_at?: string
          data_fi?: string | null
          data_fi_proroga?: string | null
          data_inici?: string | null
          data_inici_proroga?: string | null
          data_limit_comunicacio_proroga?: string | null
          email?: string | null
          formalitzacio_document?: string | null
          id?: number
          import_comes?: number | null
          nom_lot: string
          notified_fi_30?: boolean | null
          notified_fi_60?: boolean | null
          notified_fi_proroga_30?: boolean | null
          notified_fi_proroga_60?: boolean | null
          notified_proroga_30?: boolean | null
          notified_proroga_60?: boolean | null
          telefon?: string | null
        }
        Update: {
          adjudicatari?: string | null
          centres?: Json
          contract_id?: number
          cpv?: string | null
          created_at?: string
          data_fi?: string | null
          data_fi_proroga?: string | null
          data_inici?: string | null
          data_inici_proroga?: string | null
          data_limit_comunicacio_proroga?: string | null
          email?: string | null
          formalitzacio_document?: string | null
          id?: number
          import_comes?: number | null
          nom_lot?: string
          notified_fi_30?: boolean | null
          notified_fi_60?: boolean | null
          notified_fi_proroga_30?: boolean | null
          notified_fi_proroga_60?: boolean | null
          notified_proroga_30?: boolean | null
          notified_proroga_60?: boolean | null
          telefon?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_lots_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          created_by: string
          detalls_addicionals: string | null
          dossier: string | null
          duracio_inicial: string | null
          id: number
          modificable: boolean
          modificat: string | null
          nom_contracte: string
          organ_contractacio: string
          pcap_document: string | null
          ppt_document: string | null
          procediment_adjudicacio: string | null
          prorrogable: boolean
          prorrogues: string | null
          referencia_interna: string | null
          resolucio_document: string | null
          responsable_contracte: string
          segex: string | null
          sense_lots: boolean
          tipus_contracte: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          detalls_addicionals?: string | null
          dossier?: string | null
          duracio_inicial?: string | null
          id?: number
          modificable?: boolean
          modificat?: string | null
          nom_contracte: string
          organ_contractacio: string
          pcap_document?: string | null
          ppt_document?: string | null
          procediment_adjudicacio?: string | null
          prorrogable?: boolean
          prorrogues?: string | null
          referencia_interna?: string | null
          resolucio_document?: string | null
          responsable_contracte: string
          segex?: string | null
          sense_lots?: boolean
          tipus_contracte: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          detalls_addicionals?: string | null
          dossier?: string | null
          duracio_inicial?: string | null
          id?: number
          modificable?: boolean
          modificat?: string | null
          nom_contracte?: string
          organ_contractacio?: string
          pcap_document?: string | null
          ppt_document?: string | null
          procediment_adjudicacio?: string | null
          prorrogable?: boolean
          prorrogues?: string | null
          referencia_interna?: string | null
          resolucio_document?: string | null
          responsable_contracte?: string
          segex?: string | null
          sense_lots?: boolean
          tipus_contracte?: string
          updated_at?: string
        }
        Relationships: []
      }
      cpv_codes: {
        Row: {
          category_code: number | null
          check_digit: string | null
          class_code: number | null
          code_numeric: number | null
          contract_type: string | null
          depth_level: number | null
          description_ca: string | null
          description_es: string | null
          division: number | null
          group_code: number | null
        }
        Insert: {
          category_code?: number | null
          check_digit?: string | null
          class_code?: number | null
          code_numeric?: number | null
          contract_type?: string | null
          depth_level?: number | null
          description_ca?: string | null
          description_es?: string | null
          division?: number | null
          group_code?: number | null
        }
        Update: {
          category_code?: number | null
          check_digit?: string | null
          class_code?: number | null
          code_numeric?: number | null
          contract_type?: string | null
          depth_level?: number | null
          description_ca?: string | null
          description_es?: string | null
          division?: number | null
          group_code?: number | null
        }
        Relationships: []
      }
      factures: {
        Row: {
          created_at: string | null
          data: string | null
          descripcio: string | null
          expedient: string | null
          id: number
          import_total: number | null
          numero_factura: string | null
          numero_registre: string | null
          periode: string | null
          record_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          descripcio?: string | null
          expedient?: string | null
          id?: number
          import_total?: number | null
          numero_factura?: string | null
          numero_registre?: string | null
          periode?: string | null
          record_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string | null
          descripcio?: string | null
          expedient?: string | null
          id?: number
          import_total?: number | null
          numero_factura?: string | null
          numero_registre?: string | null
          periode?: string | null
          record_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factures_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "records"
            referencedColumns: ["id"]
          },
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
          is_read?: boolean
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
          },
        ]
      }
      ofi: {
        Row: {
          area: string | null
          centre_servei: string
          codi_ofi: string
          created_at: string | null
          created_by: string | null
          expedient_ofi: string
          id: number
          justificacio_general: string
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          centre_servei: string
          codi_ofi: string
          created_at?: string | null
          created_by?: string | null
          expedient_ofi: string
          id?: number
          justificacio_general: string
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          centre_servei?: string
          codi_ofi?: string
          created_at?: string | null
          created_by?: string | null
          expedient_ofi?: string
          id?: number
          justificacio_general?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ofi_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          last_notifications_cleared_at: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          last_notifications_cleared_at?: string | null
          role?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          last_notifications_cleared_at?: string | null
          role?: string
        }
        Relationships: []
      }
      records: {
        Row: {
          adjudicat: boolean | null
          adjudicatari: string | null
          base_imposable: number
          caracteristiques_tecniques: string
          centre_servei: string | null
          codi_cpv: string
          created_by: string
          data_ofi_inicial: string | null
          detalls_addicionals: string | null
          email: string
          explicacio_no_contractacio: string | null
          explicacio_preu: string | null
          finalitzat: boolean | null
          fitxers_pressupost: Json
          hora: string
          id: number
          justificacio: string
          justificacio_preu: string | null
          motivacio_no_contractacio: string | null
          motivacio_seleccio: string | null
          nif: string | null
          nom: string
          num_rc: string | null
          objecte_contracte: string
          organ_contractacio: string
          partida_economica: string
          partida_organica: string
          partida_programa: string
          projecte_despesa_cap_vi: string | null
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
          adjudicat?: boolean | null
          adjudicatari?: string | null
          base_imposable: number
          caracteristiques_tecniques: string
          centre_servei?: string | null
          codi_cpv: string
          created_by: string
          data_ofi_inicial?: string | null
          detalls_addicionals?: string | null
          email: string
          explicacio_no_contractacio?: string | null
          explicacio_preu?: string | null
          finalitzat?: boolean | null
          fitxers_pressupost?: Json
          hora: string
          id?: number
          justificacio: string
          justificacio_preu?: string | null
          motivacio_no_contractacio?: string | null
          motivacio_seleccio?: string | null
          nif?: string | null
          nom: string
          num_rc?: string | null
          objecte_contracte: string
          organ_contractacio: string
          partida_economica: string
          partida_organica: string
          partida_programa: string
          projecte_despesa_cap_vi?: string | null
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
          adjudicat?: boolean | null
          adjudicatari?: string | null
          base_imposable?: number
          caracteristiques_tecniques?: string
          centre_servei?: string | null
          codi_cpv?: string
          created_by?: string
          data_ofi_inicial?: string | null
          detalls_addicionals?: string | null
          email?: string
          explicacio_no_contractacio?: string | null
          explicacio_preu?: string | null
          finalitzat?: boolean | null
          fitxers_pressupost?: Json
          hora?: string
          id?: number
          justificacio?: string
          justificacio_preu?: string | null
          motivacio_no_contractacio?: string | null
          motivacio_seleccio?: string | null
          nif?: string | null
          nom?: string
          num_rc?: string | null
          objecte_contracte?: string
          organ_contractacio?: string
          partida_economica?: string
          partida_organica?: string
          partida_programa?: string
          projecte_despesa_cap_vi?: string | null
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
      ofi_with_aggregates: {
        Row: {
          centre_servei: string | null
          codi_ofi: string | null
          created_at: string | null
          created_by: string | null
          data_max: string | null
          data_min: string | null
          expedient_ofi: string | null
          id: number | null
          justificacio_general: string | null
          num_factures: number | null
          total_import: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ofi_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_contract_renewal_deadlines: { Args: never; Returns: undefined }
      get_user_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
