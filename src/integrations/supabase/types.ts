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
      admin_users: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          is_super_admin: boolean | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_super_admin?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_super_admin?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          attendance_time: string
          created_at: string
          id: string
          participant_id: string
          session_date: string
          status: string
          updated_at: string
        }
        Insert: {
          attendance_time?: string
          created_at?: string
          id?: string
          participant_id: string
          session_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          attendance_time?: string
          created_at?: string
          id?: string
          participant_id?: string
          session_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "mv_attendance_summary"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "attendance_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_assets: {
        Row: {
          asset_url: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          asset_url: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          asset_url?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          is_locked: boolean | null
          name: string
          template_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_locked?: boolean | null
          name: string
          template_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_locked?: boolean | null
          name?: string
          template_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string
          certificate_type: string
          created_at: string
          external_id: string | null
          id: string
          image_url: string | null
          issue_date: string
          last_error: string | null
          participant_id: string
          program_name: string
          program_type: string
          retry_count: number | null
          sent_at: string | null
          sent_email_status: string | null
          template_id: string | null
          updated_at: string
          verification_url: string | null
        }
        Insert: {
          certificate_number: string
          certificate_type: string
          created_at?: string
          external_id?: string | null
          id?: string
          image_url?: string | null
          issue_date?: string
          last_error?: string | null
          participant_id: string
          program_name: string
          program_type: string
          retry_count?: number | null
          sent_at?: string | null
          sent_email_status?: string | null
          template_id?: string | null
          updated_at?: string
          verification_url?: string | null
        }
        Update: {
          certificate_number?: string
          certificate_type?: string
          created_at?: string
          external_id?: string | null
          id?: string
          image_url?: string | null
          issue_date?: string
          last_error?: string | null
          participant_id?: string
          program_name?: string
          program_type?: string
          retry_count?: number | null
          sent_at?: string | null
          sent_email_status?: string | null
          template_id?: string | null
          updated_at?: string
          verification_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "mv_attendance_summary"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "certificates_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_devices: {
        Row: {
          created_at: string | null
          device_id: string
          device_label: string
          device_type: string
          id: string
          is_active: boolean | null
          last_seen: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          device_label: string
          device_type?: string
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          device_label?: string
          device_type?: string
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      participants: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          organization: string | null
          qr_code: string | null
          qr_sent_at: string | null
          qr_sent_email_status: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          organization?: string | null
          qr_code?: string | null
          qr_sent_at?: string | null
          qr_sent_email_status?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          organization?: string | null
          qr_code?: string | null
          qr_sent_at?: string | null
          qr_sent_email_status?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string
          email_sent_status: string | null
          id: string
          participant_id: string | null
          phone: string
          program_id: string | null
          registration_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_sent_status?: string | null
          id?: string
          participant_id?: string | null
          phone: string
          program_id?: string | null
          registration_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_sent_status?: string | null
          id?: string
          participant_id?: string | null
          phone?: string
          program_id?: string | null
          registration_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "mv_attendance_summary"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "registrations_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_attendance_summary: {
        Row: {
          attendance_count: number | null
          email: string | null
          last_attendance: string | null
          name: string | null
          participant_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_admin_role: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      check_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      cleanup_inactive_devices: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fetch_admin_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          is_super: boolean
          is_admin: boolean
        }[]
      }
      refresh_attendance_summary: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
