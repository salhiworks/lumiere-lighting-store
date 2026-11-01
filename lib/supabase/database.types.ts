/*
 * Types for the tables in supabase/migrations, in the format `supabase gen types typescript` produces.
 * After changing the schema, regenerate with: npx supabase gen types typescript --project-id <your-project-ref> > lib/supabase/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13";
  };
  public: {
    Tables: {
      admin_users: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: { user_id?: string; created_at?: string };
        Relationships: [];
      };
      collections: {
        Row: { id: string; name: string; description: string; sort_order: number; created_at: string };
        Insert: { id: string; name: string; description?: string; sort_order?: number; created_at?: string };
        Update: { id?: string; name?: string; description?: string; sort_order?: number; created_at?: string };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          number: string;
          public_token: string;
          client_request_id: string | null;
          payment_status: "pending" | "processing" | "paid" | "failed" | "expired" | "canceled" | "needs_review";
          fulfillment_status: "unfulfilled" | "shipped" | "delivered";
          stock_reserved: boolean;
          currency: string;
          subtotal_cents: number;
          shipping_cents: number;
          total_cents: number;
          tax_cents: number | null;
          amount_paid_cents: number | null;
          provider: string;
          checkout_session_id: string | null;
          checkout_url: string | null;
          checkout_expires_at: string | null;
          payment_intent_id: string | null;
          customer_email: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          shipping_name: string | null;
          shipping_address: Json | null;
          carrier: string | null;
          tracking_number: string | null;
          tracking_url: string | null;
          admin_note: string | null;
          review_reason: string | null;
          created_at: string;
          updated_at: string;
          paid_at: string | null;
          released_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
        };
        Insert: never;
        Update: {
          fulfillment_status?: "unfulfilled" | "shipped" | "delivered";
          carrier?: string | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          admin_note?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: number;
          order_id: string;
          product_id: string;
          product_name: string;
          product_finish: string;
          product_slug: string;
          image_off: string;
          unit_price_cents: number;
          quantity: number;
          line_total_cents: number;
          currency: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          { foreignKeyName: "order_items_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
        ];
      };
      payment_events: {
        Row: { id: string; provider: string; type: string; order_id: string | null; result: string; received_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          finish: string;
          collection_id: string;
          price_cents: number;
          currency: string;
          stock: number;
          diameter_cm: number;
          summary: string;
          description: string;
          highlights: string[];
          specs: Json;
          image_off: string;
          image_on: string;
          image_alt: string;
          image_width: number;
          image_height: number;
          cord_drop: number;
          is_published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          name: string;
          finish: string;
          collection_id: string;
          price_cents: number;
          currency?: string;
          stock?: number;
          diameter_cm: number;
          summary: string;
          description: string;
          highlights?: string[];
          specs?: Json;
          image_off: string;
          image_on: string;
          image_alt: string;
          image_width: number;
          image_height: number;
          cord_drop?: number;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          finish?: string;
          collection_id?: string;
          price_cents?: number;
          currency?: string;
          stock?: number;
          diameter_cm?: number;
          summary?: string;
          description?: string;
          highlights?: string[];
          specs?: Json;
          image_off?: string;
          image_on?: string;
          image_alt?: string;
          image_width?: number;
          image_height?: number;
          cord_drop?: number;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
      checkout_create_order: {
        Args: { p_request_id: string; p_items: Json; p_currency: string; p_shipping_cents: number; p_provider: string; p_hold_minutes?: number };
        Returns: Json;
      };
      checkout_attach_session: { Args: { p_order_id: string; p_session_id: string; p_url: string; p_expires_at: string }; Returns: undefined };
      checkout_apply_outcome: {
        Args: { p_event_id: string | null; p_event_type: string | null; p_provider: string; p_order_id: string; p_session_id: string | null; p_outcome: string; p_details?: Json };
        Returns: Json;
      };
      checkout_orders_to_reconcile: { Args: { p_limit?: number }; Returns: { id: string; checkout_session_id: string | null; provider: string }[] };
      checkout_order_status: { Args: { p_token: string }; Returns: Json };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
