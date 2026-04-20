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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          metadata: Json | null
          restaurant_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          metadata?: Json | null
          restaurant_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          metadata?: Json | null
          restaurant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      owned_restaurants: {
        Row: {
          address: string | null
          categories: string[]
          city: string
          created_at: string
          email: string | null
          hours: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          owner_id: string
          phone: string | null
          price_level: string | null
          quartier: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          categories?: string[]
          city?: string
          created_at?: string
          email?: string | null
          hours?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          owner_id: string
          phone?: string | null
          price_level?: string | null
          quartier?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          categories?: string[]
          city?: string
          created_at?: string
          email?: string | null
          hours?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          price_level?: string | null
          quartier?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          guests: number
          id: string
          reservation_date: string
          reservation_time: string
          restaurant_id: string
          restaurant_name: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guests: number
          id?: string
          reservation_date: string
          reservation_time: string
          restaurant_id: string
          restaurant_name: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          guests?: number
          id?: string
          reservation_date?: string
          reservation_time?: string
          restaurant_id?: string
          restaurant_name?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurant_owners: {
        Row: {
          created_at: string
          id: string
          is_owned_listing: boolean
          payment_enabled: boolean
          plan: Database["public"]["Enums"]["subscription_plan"]
          restaurant_id: string
          restaurant_name: string
          status: Database["public"]["Enums"]["subscription_status"]
          subscription_ends_at: string | null
          subscription_mode: string
          subscription_started_at: string | null
          trial_ends_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_owned_listing?: boolean
          payment_enabled?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          restaurant_id: string
          restaurant_name: string
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_ends_at?: string | null
          subscription_mode?: string
          subscription_started_at?: string | null
          trial_ends_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_owned_listing?: boolean
          payment_enabled?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          restaurant_id?: string
          restaurant_name?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_ends_at?: string | null
          subscription_mode?: string
          subscription_started_at?: string | null
          trial_ends_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurant_photos: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_hero: boolean
          restaurant_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_hero?: boolean
          restaurant_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_hero?: boolean
          restaurant_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string | null
          admin_plan: Database["public"]["Enums"]["admin_plan"]
          badges: string[]
          categories: string[]
          city: string
          created_at: string
          display_order: number
          email: string | null
          hours: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_pinned: boolean
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          place_id: string | null
          price_level: string | null
          quartier: string | null
          rating: number | null
          rating_count: number
          social_media: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          admin_plan?: Database["public"]["Enums"]["admin_plan"]
          badges?: string[]
          categories?: string[]
          city?: string
          created_at?: string
          display_order?: number
          email?: string | null
          hours?: string | null
          id: string
          is_active?: boolean
          is_featured?: boolean
          is_pinned?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          place_id?: string | null
          price_level?: string | null
          quartier?: string | null
          rating?: number | null
          rating_count?: number
          social_media?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          admin_plan?: Database["public"]["Enums"]["admin_plan"]
          badges?: string[]
          categories?: string[]
          city?: string
          created_at?: string
          display_order?: number
          email?: string | null
          hours?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_pinned?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          place_id?: string | null
          price_level?: string | null
          quartier?: string | null
          rating?: number | null
          rating_count?: number
          social_media?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
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
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      admin_plan: "Standard" | "Premium" | "Elite"
      event_type:
        | "restaurant_view"
        | "restaurant_click"
        | "whatsapp_click"
        | "direction_click"
        | "search_event"
      reservation_status: "pending" | "confirmed" | "cancelled"
      subscription_plan: "PRO" | "PREMIUM" | "ELITE"
      subscription_status: "trial" | "active" | "expired" | "cancelled"
      user_role: "admin" | "user"
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
      admin_plan: ["Standard", "Premium", "Elite"],
      event_type: [
        "restaurant_view",
        "restaurant_click",
        "whatsapp_click",
        "direction_click",
        "search_event",
      ],
      reservation_status: ["pending", "confirmed", "cancelled"],
      subscription_plan: ["PRO", "PREMIUM", "ELITE"],
      subscription_status: ["trial", "active", "expired", "cancelled"],
      user_role: ["admin", "user"],
    },
  },
} as const
