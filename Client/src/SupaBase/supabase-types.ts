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
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      Attendees: {
        Row: {
          allergies: string | null
          deleted: boolean
          deleted_by: string | null
          deleted_on: string | null
          emergency_contact: string | null
          id: number
          name: string
          own_transport: boolean | null
          surname: string
        }
        Insert: {
          allergies?: string | null
          deleted?: boolean
          deleted_by?: string | null
          deleted_on?: string | null
          emergency_contact?: string | null
          id?: number
          name: string
          own_transport?: boolean | null
          surname: string
        }
        Update: {
          allergies?: string | null
          deleted?: boolean
          deleted_by?: string | null
          deleted_on?: string | null
          emergency_contact?: string | null
          id?: number
          name?: string
          own_transport?: boolean | null
          surname?: string
        }
        Relationships: [
          {
            foreignKeyName: "Attendees_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
      PingTable: {
        Row: {
          counter: number
          id: number
        }
        Insert: {
          counter?: number
          id?: number
        }
        Update: {
          counter?: number
          id?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          first_name: string | null
          last_name: string | null
          onboarding_done: boolean
          uid: string
        }
        Insert: {
          first_name?: string | null
          last_name?: string | null
          onboarding_done?: boolean
          uid: string
        }
        Update: {
          first_name?: string | null
          last_name?: string | null
          onboarding_done?: boolean
          uid?: string
        }
        Relationships: []
      }
      RollCall: {
        Row: {
          attendee_id: number
          created_at: string
          created_by: string
          created_method: Database["public"]["Enums"]["RollCallMethod"]
          id: number
          roll_call_event_id: number
          status: Database["public"]["Enums"]["RollCallStatus"]
        }
        Insert: {
          attendee_id: number
          created_at?: string
          created_by: string
          created_method: Database["public"]["Enums"]["RollCallMethod"]
          id?: number
          roll_call_event_id: number
          status?: Database["public"]["Enums"]["RollCallStatus"]
        }
        Update: {
          attendee_id?: number
          created_at?: string
          created_by?: string
          created_method?: Database["public"]["Enums"]["RollCallMethod"]
          id?: number
          roll_call_event_id?: number
          status?: Database["public"]["Enums"]["RollCallStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "RollCall_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "Attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "RollCall_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "RollCall_roll_call_event_id_fkey"
            columns: ["roll_call_event_id"]
            isOneToOne: false
            referencedRelation: "RollCallEvent"
            referencedColumns: ["id"]
          },
        ]
      }
      RollCallEvent: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          counter: number | null
          created_at: string
          created_by: string
          description: string | null
          id: number
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          counter?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: number
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          counter?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "RollCallEvent_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "RollCallEvent_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["uid"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      RollCallMethod: "MANUAL" | "QR"
      RollCallStatus: "MISSING" | "PRESENT" | "ABSENT"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      RollCallMethod: ["MANUAL", "QR"],
      RollCallStatus: ["MISSING", "PRESENT", "ABSENT"],
    },
  },
} as const
