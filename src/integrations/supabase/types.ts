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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          can_approve_requests: boolean | null
          can_edit_establishments: boolean | null
          can_manage_ads: boolean | null
          can_manage_users: boolean | null
          can_view_conversations: boolean | null
          created_at: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_approve_requests?: boolean | null
          can_edit_establishments?: boolean | null
          can_manage_ads?: boolean | null
          can_manage_users?: boolean | null
          can_view_conversations?: boolean | null
          created_at?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_approve_requests?: boolean | null
          can_edit_establishments?: boolean | null
          can_manage_ads?: boolean | null
          can_manage_users?: boolean | null
          can_view_conversations?: boolean | null
          created_at?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_rate_limit: {
        Row: {
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          first_attempt_at: string | null
          id: string
          ip_address: string
        }
        Insert: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          id?: string
          ip_address: string
        }
        Update: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          revoked_at: string | null
          token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
          behavior: string | null
          created_at: string
          display_order: number | null
          end_date: string | null
          establishment_id: string | null
          id: string
          image: string
          link: string | null
          position: string
          size: string | null
          start_date: string | null
          text: string | null
          title: string | null
        }
        Insert: {
          active?: boolean | null
          behavior?: string | null
          created_at?: string
          display_order?: number | null
          end_date?: string | null
          establishment_id?: string | null
          id?: string
          image: string
          link?: string | null
          position: string
          size?: string | null
          start_date?: string | null
          text?: string | null
          title?: string | null
        }
        Update: {
          active?: boolean | null
          behavior?: string | null
          created_at?: string
          display_order?: number | null
          end_date?: string | null
          establishment_id?: string | null
          id?: string
          image?: string
          link?: string | null
          position?: string
          size?: string | null
          start_date?: string | null
          text?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      business_notes: {
        Row: {
          content: string
          created_at: string
          establishment_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          establishment_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          establishment_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          category: string
          city_neighborhood: string
          created_at: string
          id: string
          last_message_at: string | null
          status: string | null
          unread_count: number | null
          updated_at: string
          user_email: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          category: string
          city_neighborhood: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string
          user_email: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          category?: string
          city_neighborhood?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string
          user_email?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: []
      }
      establishment_claims: {
        Row: {
          admin_notes: string | null
          birth_date: string | null
          cnpj: string
          cpf_hash: string | null
          created_at: string
          document_type: string | null
          establishment_id: string | null
          id: string
          requester_email: string | null
          requester_name: string | null
          requester_role: string | null
          requester_whatsapp: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          birth_date?: string | null
          cnpj: string
          cpf_hash?: string | null
          created_at?: string
          document_type?: string | null
          establishment_id?: string | null
          id?: string
          requester_email?: string | null
          requester_name?: string | null
          requester_role?: string | null
          requester_whatsapp?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          birth_date?: string | null
          cnpj?: string
          cpf_hash?: string | null
          created_at?: string
          document_type?: string | null
          establishment_id?: string | null
          id?: string
          requester_email?: string | null
          requester_name?: string | null
          requester_role?: string | null
          requester_whatsapp?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "establishment_claims_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_photos: {
        Row: {
          created_at: string
          establishment_id: string
          id: string
          is_main: boolean
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          establishment_id: string
          id?: string
          is_main?: boolean
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          establishment_id?: string
          id?: string
          is_main?: boolean
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "establishment_photos_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_requests: {
        Row: {
          address: string
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          birth_date: string | null
          category: Database["public"]["Enums"]["establishment_category"]
          category_2: string | null
          category_3: string | null
          cep: string | null
          cnpj: string | null
          cpf_hash: string | null
          created_at: string | null
          data_origin: string | null
          delivery_other: string | null
          delivery_type: string | null
          description: string | null
          document_type: string | null
          external_link: string | null
          favorite_images: Json | null
          google_maps_link: string | null
          has_delivery: boolean | null
          id: string
          images: Json | null
          name: string
          neighborhood: string
          neighborhood_normalized: string | null
          phone: string
          products_json: Json | null
          profile_image: string | null
          region: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          schedule: string | null
          state: string | null
          status: string | null
          terms_accepted_at: string | null
          terms_ip: string | null
          terms_version: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          birth_date?: string | null
          category: Database["public"]["Enums"]["establishment_category"]
          category_2?: string | null
          category_3?: string | null
          cep?: string | null
          cnpj?: string | null
          cpf_hash?: string | null
          created_at?: string | null
          data_origin?: string | null
          delivery_other?: string | null
          delivery_type?: string | null
          description?: string | null
          document_type?: string | null
          external_link?: string | null
          favorite_images?: Json | null
          google_maps_link?: string | null
          has_delivery?: boolean | null
          id?: string
          images?: Json | null
          name: string
          neighborhood: string
          neighborhood_normalized?: string | null
          phone: string
          products_json?: Json | null
          profile_image?: string | null
          region?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          schedule?: string | null
          state?: string | null
          status?: string | null
          terms_accepted_at?: string | null
          terms_ip?: string | null
          terms_version?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          birth_date?: string | null
          category?: Database["public"]["Enums"]["establishment_category"]
          category_2?: string | null
          category_3?: string | null
          cep?: string | null
          cnpj?: string | null
          cpf_hash?: string | null
          created_at?: string | null
          data_origin?: string | null
          delivery_other?: string | null
          delivery_type?: string | null
          description?: string | null
          document_type?: string | null
          external_link?: string | null
          favorite_images?: Json | null
          google_maps_link?: string | null
          has_delivery?: boolean | null
          id?: string
          images?: Json | null
          name?: string
          neighborhood?: string
          neighborhood_normalized?: string | null
          phone?: string
          products_json?: Json | null
          profile_image?: string | null
          region?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          schedule?: string | null
          state?: string | null
          status?: string | null
          terms_accepted_at?: string | null
          terms_ip?: string | null
          terms_version?: string | null
          user_id?: string | null
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
          category_2: string | null
          category_3: string | null
          cep: string | null
          city: string
          cnpj: string | null
          created_at: string | null
          delivery_other: string | null
          delivery_type: string | null
          description: string | null
          external_link: string | null
          website: string | null
          instagram: string | null
          contact_email: string | null
          favorite_images: Json | null
          google_maps_link: string | null
          has_delivery: boolean | null
          id: string
          images: Json | null
          is_destaque: boolean
          is_paid: boolean | null
          last_update: string | null
          latitude: number
          longitude: number
          name: string
          neighborhood: string | null
          neighborhood_normalized: string | null
          phone: string
          plan: string
          profile_image: string | null
          rating_average: number | null
          rating_count: number | null
          reference_point: string | null
          region: string | null
          schedule: string
          state: string | null
          whatsapp: string | null
        }
        Insert: {
          active?: boolean | null
          address: string
          banner_image?: string | null
          category: Database["public"]["Enums"]["establishment_category"]
          category_2?: string | null
          category_3?: string | null
          cep?: string | null
          city?: string
          cnpj?: string | null
          created_at?: string | null
          delivery_other?: string | null
          delivery_type?: string | null
          description?: string | null
          external_link?: string | null
          website?: string | null
          instagram?: string | null
          contact_email?: string | null
          favorite_images?: Json | null
          google_maps_link?: string | null
          has_delivery?: boolean | null
          id?: string
          images?: Json | null
          is_destaque?: boolean
          is_paid?: boolean | null
          last_update?: string | null
          latitude?: number
          longitude?: number
          name: string
          neighborhood?: string | null
          neighborhood_normalized?: string | null
          phone: string
          plan?: string
          profile_image?: string | null
          rating_average?: number | null
          rating_count?: number | null
          reference_point?: string | null
          region?: string | null
          schedule: string
          state?: string | null
          whatsapp?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string
          banner_image?: string | null
          category?: Database["public"]["Enums"]["establishment_category"]
          category_2?: string | null
          category_3?: string | null
          cep?: string | null
          city?: string
          cnpj?: string | null
          created_at?: string | null
          delivery_other?: string | null
          delivery_type?: string | null
          description?: string | null
          external_link?: string | null
          website?: string | null
          instagram?: string | null
          contact_email?: string | null
          favorite_images?: Json | null
          google_maps_link?: string | null
          has_delivery?: boolean | null
          id?: string
          images?: Json | null
          is_destaque?: boolean
          is_paid?: boolean | null
          last_update?: string | null
          latitude?: number
          longitude?: number
          name?: string
          neighborhood?: string | null
          neighborhood_normalized?: string | null
          phone?: string
          plan?: string
          profile_image?: string | null
          rating_average?: number | null
          rating_count?: number | null
          reference_point?: string | null
          region?: string | null
          schedule?: string
          state?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      highlight_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          establishment_id: string
          expires_at: string | null
          id: string
          image_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          starts_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          establishment_id: string
          expires_at?: string | null
          id?: string
          image_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          starts_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          establishment_id?: string
          expires_at?: string | null
          id?: string
          image_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          starts_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_requests_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
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
      notifications: {
        Row: {
          criado_em: string
          descricao_resumida: string | null
          destino: string
          id: string
          lido: boolean
          lido_em: string | null
          referencia_id: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          criado_em?: string
          descricao_resumida?: string | null
          destino?: string
          id?: string
          lido?: boolean
          lido_em?: string | null
          referencia_id?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          criado_em?: string
          descricao_resumida?: string | null
          destino?: string
          id?: string
          lido?: boolean
          lido_em?: string | null
          referencia_id?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      plan_configurations: {
        Row: {
          created_at: string
          display_label: string
          id: string
          max_products: number
          plan_name: string
          promotion_boost: number
          updated_at: string
          visibility_weight: number
        }
        Insert: {
          created_at?: string
          display_label: string
          id?: string
          max_products?: number
          plan_name: string
          promotion_boost?: number
          updated_at?: string
          visibility_weight?: number
        }
        Update: {
          created_at?: string
          display_label?: string
          id?: string
          max_products?: number
          plan_name?: string
          promotion_boost?: number
          updated_at?: string
          visibility_weight?: number
        }
        Relationships: []
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
          is_promotion: boolean
          name: string
          price: number
          promotion_description: string | null
          promotion_expiration: string | null
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          establishment_id: string
          id?: string
          image?: string | null
          images?: Json | null
          is_promotion?: boolean
          name: string
          price: number
          promotion_description?: string | null
          promotion_expiration?: string | null
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          establishment_id?: string
          id?: string
          image?: string | null
          images?: Json | null
          is_promotion?: boolean
          name?: string
          price?: number
          promotion_description?: string | null
          promotion_expiration?: string | null
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
          last_login_at: string | null
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
          last_login_at?: string | null
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
          last_login_at?: string | null
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
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          establishment_id: string
          id: string
          owner_reply: string | null
          owner_reply_created_at: string | null
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          establishment_id: string
          id?: string
          owner_reply?: string | null
          owner_reply_created_at?: string | null
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          establishment_id?: string
          id?: string
          owner_reply?: string | null
          owner_reply_created_at?: string | null
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_establishments: {
        Row: {
          created_at: string
          created_by: string | null
          establishment_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          establishment_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          establishment_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_establishments_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
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
      establishment_claims_public: {
        Row: {
          created_at: string | null
          document_status: string | null
          document_type: string | null
          establishment_id: string | null
          id: string | null
          reviewed_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          document_status?: never
          document_type?: string | null
          establishment_id?: string | null
          id?: string | null
          reviewed_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          document_status?: never
          document_type?: string | null
          establishment_id?: string | null
          id?: string | null
          reviewed_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "establishment_claims_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_requests_public: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["establishment_category"] | null
          cep: string | null
          created_at: string | null
          data_origin: string | null
          delivery_other: string | null
          delivery_type: string | null
          description: string | null
          document_status: string | null
          document_type: string | null
          external_link: string | null
          favorite_images: Json | null
          google_maps_link: string | null
          has_delivery: boolean | null
          id: string | null
          images: Json | null
          name: string | null
          neighborhood: string | null
          phone: string | null
          products_json: Json | null
          profile_image: string | null
          region: string | null
          schedule: string | null
          state: string | null
          status: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          category?:
            | Database["public"]["Enums"]["establishment_category"]
            | null
          cep?: string | null
          created_at?: string | null
          data_origin?: string | null
          delivery_other?: string | null
          delivery_type?: string | null
          description?: string | null
          document_status?: never
          document_type?: string | null
          external_link?: string | null
          favorite_images?: Json | null
          google_maps_link?: string | null
          has_delivery?: boolean | null
          id?: string | null
          images?: Json | null
          name?: string | null
          neighborhood?: string | null
          phone?: string | null
          products_json?: Json | null
          profile_image?: string | null
          region?: string | null
          schedule?: string | null
          state?: string | null
          status?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          category?:
            | Database["public"]["Enums"]["establishment_category"]
            | null
          cep?: string | null
          created_at?: string | null
          data_origin?: string | null
          delivery_other?: string | null
          delivery_type?: string | null
          description?: string | null
          document_status?: never
          document_type?: string | null
          external_link?: string | null
          favorite_images?: Json | null
          google_maps_link?: string | null
          has_delivery?: boolean | null
          id?: string | null
          images?: Json | null
          name?: string | null
          neighborhood?: string | null
          phone?: string | null
          products_json?: Json | null
          profile_image?: string | null
          region?: string | null
          schedule?: string | null
          state?: string | null
          status?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_approve_establishments: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_manage_roles: { Args: { _user_id: string }; Returns: boolean }
      check_admin_rate_limit: {
        Args: {
          _ip_address: string
          _max_attempts?: number
          _window_minutes?: number
        }
        Returns: {
          allowed: boolean
          attempts_remaining: number
          blocked_until: string
        }[]
      }
      check_email_exists: { Args: { _email: string }; Returns: boolean }
      cleanup_admin_rate_limits: { Args: never; Returns: number }
      cleanup_expired_promotions: { Args: never; Returns: number }
      create_admin_notification: {
        Args: {
          _descricao?: string
          _referencia_id: string
          _tipo: string
          _titulo: string
        }
        Returns: undefined
      }
      create_admin_session: {
        Args: {
          _expires_hours?: number
          _ip_address: string
          _token_hash: string
          _user_agent: string
          _user_id: string
        }
        Returns: string
      }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_adm_master: { Args: { _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_user: { Args: { _user_id: string }; Returns: boolean }
      is_authenticated_admin: { Args: never; Returns: boolean }
      normalize_neighborhood: {
        Args: { raw_neighborhood: string }
        Returns: string
      }
      revoke_admin_session: { Args: { _token_hash: string }; Returns: boolean }
      validate_admin_session: {
        Args: { _token_hash: string }
        Returns: {
          role: string
          user_id: string
          valid: boolean
        }[]
      }
      verify_recovery_pin: {
        Args: { _email: string; _pin_hash: string }
        Returns: string
      }
      norm_text: {
        Args: { _t: string }
        Returns: string
      }
      search_directory: {
        Args: {
          _categories?: string[] | null
          _category?: string | null
          _limit?: number
          _offset?: number
          _query: string
        }
        Returns: {
          category: string
          city: string | null
          description: string | null
          establishment_id: string
          establishment_name: string
          id: string
          image: string | null
          is_destaque: boolean | null
          is_paid: boolean | null
          kind: string
          name: string
          neighborhood: string | null
          plan: string | null
          price: number | null
          rating_average: number | null
          rating_count: number | null
          score: number
          unit: string | null
        }[]
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
      app_role:
        | "admin"
        | "user"
        | "adm_master"
        | "gestor"
        | "dono_empresa"
        | "pre_adm"
        | "empresario"
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
        | "sorveteria"
        | "acai"
        | "espetinho"
        | "moda"
        | "calcados"
        | "farmacia"
        | "pet_shop"
        | "papelaria"
        | "eletronicos"
        | "casa_construcao"
        | "floricultura"
        | "salao_beleza"
        | "barbearia"
        | "mecanica"
        | "academia"
        | "saude"
        | "educacao"
        | "assistencia_tecnica"
        | "reparos_manutencao"
        | "lavanderia"
        | "servicos_profissionais"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "admin",
        "user",
        "adm_master",
        "gestor",
        "dono_empresa",
        "pre_adm",
        "empresario",
      ],
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
        "sorveteria",
        "acai",
        "espetinho",
        "moda",
        "calcados",
        "farmacia",
        "pet_shop",
        "papelaria",
        "eletronicos",
        "casa_construcao",
        "floricultura",
        "salao_beleza",
        "barbearia",
        "mecanica",
        "academia",
        "saude",
        "educacao",
        "assistencia_tecnica",
        "reparos_manutencao",
        "lavanderia",
        "servicos_profissionais",
      ],
    },
  },
} as const
