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
      notifications: {
        Row: {
          audience: string
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          restaurant_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          audience?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          restaurant_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          audience?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          restaurant_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          created_at: string
          description: string | null
          discount: number | null
          id: string
          restaurant_id: string
          title: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount?: number | null
          id?: string
          restaurant_id: string
          title: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          discount?: number | null
          id?: string
          restaurant_id?: string
          title?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string | null
          name: string
          notes: string | null
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name: string
          notes?: string | null
          order_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name?: string
          notes?: string | null
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_mode: string
          id: string
          notes: string | null
          restaurant_id: string
          restaurant_name: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_mode?: string
          id?: string
          notes?: string | null
          restaurant_id: string
          restaurant_name: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_mode?: string
          id?: string
          notes?: string | null
          restaurant_id?: string
          restaurant_name?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
          customer_name: string | null
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
          customer_name?: string | null
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
          customer_name?: string | null
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
      restaurant_menu: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_onboarding_drafts: {
        Row: {
          created_at: string
          data: Json
          id: string
          step: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          step?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          step?: number
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
          updated_at: string
          uploaded_by: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_hero?: boolean
          restaurant_id: string
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_hero?: boolean
          restaurant_id?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
          url?: string | null
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string | null
          address_detail: string | null
          admin_plan: Database["public"]["Enums"]["admin_plan"]
          average_price: number | null
          badges: string[]
          banner_image: string | null
          categories: string[]
          city: string
          created_at: string
          cuisine_type: string | null
          description: string | null
          display_order: number
          email: string | null
          hours: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_pinned: boolean
          lat: number | null
          latitude: number | null
          lng: number | null
          longitude: number | null
          name: string
          opening_hours: Json
          phone: string | null
          place_id: string | null
          price_level: string | null
          price_range: string | null
          profile_image: string | null
          quartier: string | null
          rating: number | null
          rating_count: number
          social_media: Json | null
          status: string
          updated_at: string
          website: string | null
          whatsapp_link: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          address_detail?: string | null
          admin_plan?: Database["public"]["Enums"]["admin_plan"]
          average_price?: number | null
          badges?: string[]
          banner_image?: string | null
          categories?: string[]
          city?: string
          created_at?: string
          cuisine_type?: string | null
          description?: string | null
          display_order?: number
          email?: string | null
          hours?: string | null
          id: string
          is_active?: boolean
          is_featured?: boolean
          is_pinned?: boolean
          lat?: number | null
          latitude?: number | null
          lng?: number | null
          longitude?: number | null
          name: string
          opening_hours?: Json
          phone?: string | null
          place_id?: string | null
          price_level?: string | null
          price_range?: string | null
          profile_image?: string | null
          quartier?: string | null
          rating?: number | null
          rating_count?: number
          social_media?: Json | null
          status?: string
          updated_at?: string
          website?: string | null
          whatsapp_link?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          address_detail?: string | null
          admin_plan?: Database["public"]["Enums"]["admin_plan"]
          average_price?: number | null
          badges?: string[]
          banner_image?: string | null
          categories?: string[]
          city?: string
          created_at?: string
          cuisine_type?: string | null
          description?: string | null
          display_order?: number
          email?: string | null
          hours?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_pinned?: boolean
          lat?: number | null
          latitude?: number | null
          lng?: number | null
          longitude?: number | null
          name?: string
          opening_hours?: Json
          phone?: string | null
          place_id?: string | null
          price_level?: string | null
          price_range?: string | null
          profile_image?: string | null
          quartier?: string | null
          rating?: number | null
          rating_count?: number
          social_media?: Json | null
          status?: string
          updated_at?: string
          website?: string | null
          whatsapp_link?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      review_helpful_votes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          helpful_count: number
          id: string
          rating: number
          restaurant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          rating: number
          restaurant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          rating?: number
          restaurant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          payment_method: string
          plan: string
          price: number
          requested_at: string
          restaurant_id: string
          status: string
          updated_at: string
          user_id: string
          validated_at: string | null
          wave_reference: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payment_method?: string
          plan?: string
          price?: number
          requested_at?: string
          restaurant_id: string
          status?: string
          updated_at?: string
          user_id: string
          validated_at?: string | null
          wave_reference?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payment_method?: string
          plan?: string
          price?: number
          requested_at?: string
          restaurant_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          wave_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
      activate_subscription_test: {
        Args: { p_ownership_id: string; p_plan: string }
        Returns: Json
      }
      admin_activate_subscription: {
        Args: { p_restaurant_id: string }
        Returns: Json
      }
      cancel_order: { Args: { p_order_id: string }; Returns: Json }
      check_and_expire_trials: { Args: never; Returns: number }
      create_restaurant_with_owner: {
        Args: {
          p_address?: string
          p_average_price?: number
          p_cuisine_type?: string
          p_description?: string
          p_name: string
          p_phone?: string
          p_quartier?: string
        }
        Returns: Json
      }
      expire_my_trials: { Args: never; Returns: undefined }
      expire_trial_if_due: {
        Args: { p_restaurant_id: string }
        Returns: undefined
      }
      get_public_plans: {
        Args: never
        Returns: {
          plan: string
          restaurant_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_review: {
        Args: { p_comment: string; p_rating: number; p_review_id: string }
        Returns: Json
      }
      user_owns_restaurant: {
        Args: { _restaurant_id: string }
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
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "delivered"
        | "cancelled"
      reservation_status: "pending" | "confirmed" | "cancelled"
      subscription_plan: "PRO" | "PREMIUM" | "ELITE"
      subscription_status: "trial" | "active" | "expired" | "cancelled"
      user_role: "admin" | "user" | "restaurant_owner"
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
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivered",
        "cancelled",
      ],
      reservation_status: ["pending", "confirmed", "cancelled"],
      subscription_plan: ["PRO", "PREMIUM", "ELITE"],
      subscription_status: ["trial", "active", "expired", "cancelled"],
      user_role: ["admin", "user", "restaurant_owner"],
    },
  },
} as const
