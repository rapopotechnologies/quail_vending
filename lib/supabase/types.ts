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
      machines: {
        Row: {
          address: string | null
          created_at: string
          id: string
          image_url: string | null
          location: string | null
          name: string
          profit_share_pct: number | null
          status: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          location?: string | null
          name: string
          profit_share_pct?: number | null
          status?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          location?: string | null
          name?: string
          profit_share_pct?: number | null
          status?: string
        }
        Relationships: []
      }
      partner_inquiries: {
        Row: {
          business_name: string
          contact_name: string
          created_at: string
          email: string
          id: string
          location: string | null
          message: string | null
          phone: string | null
          status: string
        }
        Insert: {
          business_name: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          location?: string | null
          message?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          business_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          location?: string | null
          message?: string | null
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      product_lots: {
        Row: {
          expiry_date: string
          id: string
          product_id: string
          qty: number
          received_at: string
        }
        Insert: {
          expiry_date: string
          id?: string
          product_id: string
          qty?: number
          received_at?: string
        }
        Update: {
          expiry_date?: string
          id?: string
          product_id?: string
          qty?: number
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          delivery_unit_cost_business: number | null
          delivery_unit_cost_retail: number | null
          id: string
          image_url: string | null
          item_id: string | null
          name: string
          notes: string | null
          pickup_unit_cost: number | null
          pricing_basis: string | null
          product_url: string | null
          projected_sell_price: number | null
          sell_price: number | null
          size_unit_oz: number | null
          source_vendor: string | null
          status: string
          units_per_case: number
          warehouse_par_level: number | null
          warehouse_qty: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          delivery_unit_cost_business?: number | null
          delivery_unit_cost_retail?: number | null
          id?: string
          image_url?: string | null
          item_id?: string | null
          name: string
          notes?: string | null
          pickup_unit_cost?: number | null
          pricing_basis?: string | null
          product_url?: string | null
          projected_sell_price?: number | null
          sell_price?: number | null
          size_unit_oz?: number | null
          source_vendor?: string | null
          status?: string
          units_per_case?: number
          warehouse_par_level?: number | null
          warehouse_qty?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          delivery_unit_cost_business?: number | null
          delivery_unit_cost_retail?: number | null
          id?: string
          image_url?: string | null
          item_id?: string | null
          name?: string
          notes?: string | null
          pickup_unit_cost?: number | null
          pricing_basis?: string | null
          product_url?: string | null
          projected_sell_price?: number | null
          sell_price?: number | null
          size_unit_oz?: number | null
          source_vendor?: string | null
          status?: string
          units_per_case?: number
          warehouse_par_level?: number | null
          warehouse_qty?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          entered_by: string | null
          id: string
          machine_id: string
          product_id: string
          qty: number
          sold_at: string
          unit_price: number
        }
        Insert: {
          entered_by?: string | null
          id?: string
          machine_id: string
          product_id: string
          qty: number
          sold_at?: string
          unit_price: number
        }
        Update: {
          entered_by?: string | null
          id?: string
          machine_id?: string
          product_id?: string
          qty?: number
          sold_at?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "public_location_impact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_location_impact: {
        Row: {
          address: string | null
          charity_estimate: number | null
          id: string | null
          image_url: string | null
          location: string | null
          name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_super_admin: { Args: never; Returns: boolean }
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
