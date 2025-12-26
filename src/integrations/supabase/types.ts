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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      advertisements: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          image: string
          link: string | null
          position: string
          text: string | null
          title: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          image: string
          link?: string | null
          position: string
          text?: string | null
          title?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          image?: string
          link?: string | null
          position?: string
          text?: string | null
          title?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          category: string
          city_neighborhood: string
          created_at: string
          id: string
          status: string | null
          updated_at: string
          user_email: string
          user_name: string
        }
        Insert: {
          category: string
          city_neighborhood: string
          created_at?: string
          id?: string
          status?: string | null
          updated_at?: string
          user_email: string
          user_name: string
        }
        Update: {
          category?: string
          city_neighborhood?: string
          created_at?: string
          id?: string
          status?: string | null
          updated_at?: string
          user_email?: string
          user_name?: string
        }
        Relationships: []
      }
      establishment_requests: {
        Row: {
          address: string
          admin_notes: string | null
          category: Database["public"]["Enums"]["establishment_category"]
          created_at: string | null
          description: string | null
          external_link: string | null
          favorite_images: Json | null
          google_maps_link: string | null
          id: string
          images: Json | null
          name: string
          neighborhood: string
          phone: string
          products_json: Json | null
          profile_image: string | null
          region: string | null
          schedule: string | null
          status: string | null
          whatsapp: string | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
          category: Database["public"]["Enums"]["establishment_category"]
          created_at?: string | null
          description?: string | null
          external_link?: string | null
          favorite_images?: Json | null
          google_maps_link?: string | null
          id?: string
          images?: Json | null
          name: string
          neighborhood: string
          phone: string
          products_json?: Json | null
          profile_image?: string | null
          region?: string | null
          schedule?: string | null
          status?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
          category?: Database["public"]["Enums"]["establishment_category"]
          created_at?: string | null
          description?: string | null
          external_link?: string | null
          favorite_images?: Json | null
          google_maps_link?: string | null
          id?: string
          images?: Json | null
          name?: string
          neighborhood?: string
          phone?: string
          products_json?: Json | null
          profile_image?: string | null
          region?: string | null
          schedule?: string | null
          status?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      establishment_statistics: {
        Row: {
          banner_views: number | null
          establishment_id: string
          id: string
          last_updated: string | null
          page_views: number | null
          phone_clicks: number | null
        }
        Insert: {
          banner_views?: number | null
          establishment_id: string
          id?: string
          last_updated?: string | null
          page_views?: number | null
          phone_clicks?: number | null
        }
        Update: {
          banner_views?: number | null
          establishment_id?: string
          id?: string
          last_updated?: string | null
          page_views?: number | null
          phone_clicks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "establishment_statistics_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishments: {
        Row: {
          active: boolean | null
          address: string
          banner_image: string | null
          category: Database["public"]["Enums"]["establishment_category"]
          city: string
          created_at: string | null
          description: string | null
          external_link: string | null
          favorite_images: Json | null
          google_maps_link: string | null
          id: string
          images: Json | null
          is_paid: boolean | null
          last_update: string | null
          latitude: number
          longitude: number
          name: string
          neighborhood: string | null
          phone: string
          profile_image: string | null
          reference_point: string | null
          region: string | null
          schedule: string
          whatsapp: string | null
        }
        Insert: {
          active?: boolean | null
          address: string
          banner_image?: string | null
          category: Database["public"]["Enums"]["establishment_category"]
          city?: string
          created_at?: string | null
          description?: string | null
          external_link?: string | null
          favorite_images?: Json | null
          google_maps_link?: string | null
          id?: string
          images?: Json | null
          is_paid?: boolean | null
          last_update?: string | null
          latitude: number
          longitude: number
          name: string
          neighborhood?: string | null
          phone: string
          profile_image?: string | null
          reference_point?: string | null
          region?: string | null
          schedule: string
          whatsapp?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string
          banner_image?: string | null
          category?: Database["public"]["Enums"]["establishment_category"]
          city?: string
          created_at?: string | null
          description?: string | null
          external_link?: string | null
          favorite_images?: Json | null
          google_maps_link?: string | null
          id?: string
          images?: Json | null
          is_paid?: boolean | null
          last_update?: string | null
          latitude?: number
          longitude?: number
          name?: string
          neighborhood?: string | null
          phone?: string
          profile_image?: string | null
          reference_point?: string | null
          region?: string | null
          schedule?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          price: number
          product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          price: number
          product_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          price?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          establishment_id: string
          id: string
          image: string | null
          images: Json | null
          name: string
          price: number
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          establishment_id: string
          id?: string
          image?: string | null
          images?: Json | null
          name: string
          price: number
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          establishment_id?: string
          id?: string
          image?: string | null
          images?: Json | null
          name?: string
          price?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string | null
          email: string
          favorite_color: string | null
          full_name: string
          id: string
          recovery_pin_hash: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          email: string
          favorite_color?: string | null
          full_name: string
          id?: string
          recovery_pin_hash: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          email?: string
          favorite_color?: string | null
          full_name?: string
          id?: string
          recovery_pin_hash?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recovery_attempts: {
        Row: {
          attempted_at: string | null
          email: string
          id: string
          ip_address: string | null
          success: boolean | null
        }
        Insert: {
          attempted_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean | null
        }
        Update: {
          attempted_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      verify_recovery_pin: {
        Args: { _email: string; _pin_hash: string }
        Returns: string
      }
      verify_recovery_pin_enhanced: {
        Args: {
          _birth_date: string
          _email: string
          _full_name: string
          _pin_hash: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
      establishment_category:
        | "restaurante"
        | "lanchonete"
        | "padaria"
        | "supermercado"
        | "açougue"
        | "hortifruti"
        | "pizzaria"
        | "hamburgueria"
        | "bar"
        | "cafe"
        | "outro"
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
    Enums: {
      app_role: ["admin", "user"],
      establishment_category: [
        "restaurante",
        "lanchonete",
        "padaria",
        "supermercado",
        "açougue",
        "hortifruti",
        "pizzaria",
        "hamburgueria",
        "bar",
        "cafe",
        "outro",
      ],
    },
  },
} as const
