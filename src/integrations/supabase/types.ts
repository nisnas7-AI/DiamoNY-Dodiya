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
      access_logs: {
        Row: {
          card_id: string
          id: string
          page: string
          timestamp: string
        }
        Insert: {
          card_id: string
          id?: string
          page: string
          timestamp?: string
        }
        Update: {
          card_id?: string
          id?: string
          page?: string
          timestamp?: string
        }
        Relationships: []
      }
      admin_dashboard_preferences: {
        Row: {
          category_layouts: Json
          created_at: string
          hidden_widgets: Json
          id: string
          updated_at: string
          user_id: string
          widget_order: Json
        }
        Insert: {
          category_layouts?: Json
          created_at?: string
          hidden_widgets?: Json
          id?: string
          updated_at?: string
          user_id: string
          widget_order?: Json
        }
        Update: {
          category_layouts?: Json
          created_at?: string
          hidden_widgets?: Json
          id?: string
          updated_at?: string
          user_id?: string
          widget_order?: Json
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          id: string
          pin_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          pin_code?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          pin_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          country: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          event_type: string
          event_value: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          event_type: string
          event_value?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          event_type?: string
          event_value?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string
          custom_json_ld: Json | null
          excerpt: string | null
          faq_data: Json | null
          featured_image_url: string | null
          featured_media_type: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          custom_json_ld?: Json | null
          excerpt?: string | null
          faq_data?: Json | null
          featured_image_url?: string | null
          featured_media_type?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          custom_json_ld?: Json | null
          excerpt?: string | null
          faq_data?: Json | null
          featured_image_url?: string | null
          featured_media_type?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_default: boolean
          slug: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_default?: boolean
          slug: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_default?: boolean
          slug?: string
        }
        Relationships: []
      }
      brand_settings: {
        Row: {
          brand_id: string
          brand_name: string
          created_at: string
          footer_about_text: string
          id: string
          logo_url: string
          site_url: string
          support_email: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          brand_id?: string
          brand_name?: string
          created_at?: string
          footer_about_text?: string
          id?: string
          logo_url?: string
          site_url?: string
          support_email?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          brand_id?: string
          brand_name?: string
          created_at?: string
          footer_about_text?: string
          id?: string
          logo_url?: string
          site_url?: string
          support_email?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_settings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          brand_id: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_hidden: boolean
          is_updating_soon: boolean
          mto_story: string | null
          name: string
          name_en: string | null
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          brand_id?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_hidden?: boolean
          is_updating_soon?: boolean
          mto_story?: string | null
          name: string
          name_en?: string | null
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_hidden?: boolean
          is_updating_soon?: boolean
          mto_story?: string | null
          name?: string
          name_en?: string | null
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_images: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          lab_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          lab_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          lab_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_orders: {
        Row: {
          casting_started_at: string | null
          consultation_at: string | null
          created_at: string
          customer_email: string | null
          customer_grade: string | null
          customer_id: string | null
          customer_name: string | null
          customer_notes: string | null
          customer_phone: string | null
          delivered_at: string | null
          description: string | null
          designer_notes: string | null
          estimated_price: number | null
          final_price: number | null
          gold_color_override: string | null
          id: string
          last_modified_by: string | null
          order_name: string
          polishing_started_at: string | null
          product_id: string | null
          production_notes: string | null
          ready_at: string | null
          ring_size: string | null
          setting_started_at: string | null
          sketch_approved_at: string | null
          sketch_notes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          casting_started_at?: string | null
          consultation_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_grade?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          description?: string | null
          designer_notes?: string | null
          estimated_price?: number | null
          final_price?: number | null
          gold_color_override?: string | null
          id?: string
          last_modified_by?: string | null
          order_name: string
          polishing_started_at?: string | null
          product_id?: string | null
          production_notes?: string | null
          ready_at?: string | null
          ring_size?: string | null
          setting_started_at?: string | null
          sketch_approved_at?: string | null
          sketch_notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          casting_started_at?: string | null
          consultation_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_grade?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          description?: string | null
          designer_notes?: string | null
          estimated_price?: number | null
          final_price?: number | null
          gold_color_override?: string | null
          id?: string
          last_modified_by?: string | null
          order_name?: string
          polishing_started_at?: string | null
          product_id?: string | null
          production_notes?: string | null
          ready_at?: string | null
          ring_size?: string | null
          setting_started_at?: string | null
          sketch_approved_at?: string | null
          sketch_notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      design_assets: {
        Row: {
          approval_date: string | null
          client_approved: boolean | null
          created_at: string | null
          deal_id: string | null
          file_url: string | null
          id: string
          notes: string | null
          version_number: number | null
        }
        Insert: {
          approval_date?: string | null
          client_approved?: boolean | null
          created_at?: string | null
          deal_id?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          version_number?: number | null
        }
        Update: {
          approval_date?: string | null
          client_approved?: boolean | null
          created_at?: string | null
          deal_id?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          version_number?: number | null
        }
        Relationships: []
      }
      digital_card_settings: {
        Row: {
          about_text: string | null
          accent_color: string | null
          avatar_url: string | null
          bg_color: string | null
          created_at: string
          email: string | null
          facebook_url: string | null
          font_family: string | null
          icon_catalog_url: string | null
          icon_email_url: string | null
          icon_facebook_url: string | null
          icon_instagram_url: string | null
          icon_phone_url: string | null
          icon_whatsapp_url: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          phone: string | null
          primary_color: string | null
          text_color: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          about_text?: string | null
          accent_color?: string | null
          avatar_url?: string | null
          bg_color?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          font_family?: string | null
          icon_catalog_url?: string | null
          icon_email_url?: string | null
          icon_facebook_url?: string | null
          icon_instagram_url?: string | null
          icon_phone_url?: string | null
          icon_whatsapp_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          text_color?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          about_text?: string | null
          accent_color?: string | null
          avatar_url?: string | null
          bg_color?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          font_family?: string | null
          icon_catalog_url?: string | null
          icon_email_url?: string | null
          icon_facebook_url?: string | null
          icon_instagram_url?: string | null
          icon_phone_url?: string | null
          icon_whatsapp_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          text_color?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      homepage_categories: {
        Row: {
          category_slug: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_url: string | null
          name: string
          name_en: string | null
          updated_at: string
        }
        Insert: {
          category_slug?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          name: string
          name_en?: string | null
          updated_at?: string
        }
        Update: {
          category_slug?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          name?: string
          name_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homepage_section_settings: {
        Row: {
          background_color: string | null
          background_image_url: string | null
          background_opacity: number | null
          content: Json | null
          created_at: string | null
          display_order: number
          font_size: number | null
          id: string
          is_visible: boolean | null
          padding_bottom: number | null
          padding_top: number | null
          section_key: string
          section_name: string
          subtitle: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          background_image_url?: string | null
          background_opacity?: number | null
          content?: Json | null
          created_at?: string | null
          display_order?: number
          font_size?: number | null
          id?: string
          is_visible?: boolean | null
          padding_bottom?: number | null
          padding_top?: number | null
          section_key: string
          section_name: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          background_image_url?: string | null
          background_opacity?: number | null
          content?: Json | null
          created_at?: string | null
          display_order?: number
          font_size?: number | null
          id?: string
          is_visible?: boolean | null
          padding_bottom?: number | null
          padding_top?: number | null
          section_key?: string
          section_name?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          brand_id: string
          content: string | null
          created_at: string
          cta_primary_text: string | null
          cta_primary_url: string | null
          cta_secondary_text: string | null
          cta_secondary_url: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          key: string
          metadata: Json | null
          subtitle: string | null
          title: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          brand_id?: string
          content?: string | null
          created_at?: string
          cta_primary_text?: string | null
          cta_primary_url?: string | null
          cta_secondary_text?: string | null
          cta_secondary_url?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          key: string
          metadata?: Json | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          brand_id?: string
          content?: string | null
          created_at?: string
          cta_primary_text?: string | null
          cta_primary_url?: string | null
          cta_secondary_text?: string | null
          cta_secondary_url?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          key?: string
          metadata?: Json | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homepage_sections_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          closure_status: string | null
          consent_marketing_timestamp: string | null
          consent_privacy_policy: boolean | null
          consent_privacy_timestamp: string | null
          contacted_at: string | null
          conversation_summary: string | null
          created_at: string
          email: string
          estimated_budget: string | null
          event_target_date: string | null
          form_completed_at: string | null
          id: string
          ip_address: string | null
          jewelry_interest_type: string | null
          landing_page: string | null
          message: string
          metal_preference: string | null
          name: string
          phone: string | null
          referral_source: string | null
          ring_size: string | null
          source: string | null
          status: string | null
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          closure_status?: string | null
          consent_marketing_timestamp?: string | null
          consent_privacy_policy?: boolean | null
          consent_privacy_timestamp?: string | null
          contacted_at?: string | null
          conversation_summary?: string | null
          created_at?: string
          email: string
          estimated_budget?: string | null
          event_target_date?: string | null
          form_completed_at?: string | null
          id?: string
          ip_address?: string | null
          jewelry_interest_type?: string | null
          landing_page?: string | null
          message: string
          metal_preference?: string | null
          name: string
          phone?: string | null
          referral_source?: string | null
          ring_size?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          closure_status?: string | null
          consent_marketing_timestamp?: string | null
          consent_privacy_policy?: boolean | null
          consent_privacy_timestamp?: string | null
          contacted_at?: string | null
          conversation_summary?: string | null
          created_at?: string
          email?: string
          estimated_budget?: string | null
          event_target_date?: string | null
          form_completed_at?: string | null
          id?: string
          ip_address?: string | null
          jewelry_interest_type?: string | null
          landing_page?: string | null
          message?: string
          metal_preference?: string | null
          name?: string
          phone?: string | null
          referral_source?: string | null
          ring_size?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          ai_description: string | null
          ai_tags: string[] | null
          alt_text: string | null
          category_id: string | null
          created_at: string
          display_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          filename: string
          id: string
          original_filename: string | null
          product_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          ai_description?: string | null
          ai_tags?: string[] | null
          alt_text?: string | null
          category_id?: string | null
          created_at?: string
          display_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          filename: string
          id?: string
          original_filename?: string | null
          product_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          ai_description?: string | null
          ai_tags?: string[] | null
          alt_text?: string | null
          category_id?: string | null
          created_at?: string
          display_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          filename?: string
          id?: string
          original_filename?: string | null
          product_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      nfc_catalog_cards: {
        Row: {
          brand_id: string
          category_id: string | null
          created_at: string
          custom_link: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          long_text: string | null
          section: string
          short_text: string | null
          show_long_text: boolean
          show_short_text: boolean
          show_title: boolean
          title: string
        }
        Insert: {
          brand_id?: string
          category_id?: string | null
          created_at?: string
          custom_link?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          long_text?: string | null
          section?: string
          short_text?: string | null
          show_long_text?: boolean
          show_short_text?: boolean
          show_title?: boolean
          title: string
        }
        Update: {
          brand_id?: string
          category_id?: string | null
          created_at?: string
          custom_link?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          long_text?: string | null
          section?: string
          short_text?: string | null
          show_long_text?: boolean
          show_short_text?: boolean
          show_title?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "nfc_catalog_cards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfc_catalog_cards_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      order_actual_costs: {
        Row: {
          created_at: string
          description: string | null
          extras: number
          gold_cost: number
          id: string
          labor_cost: number
          order_id: string
          setting_cost: number
          stage: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          extras?: number
          gold_cost?: number
          id?: string
          labor_cost?: number
          order_id: string
          setting_cost?: number
          stage?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          extras?: number
          gold_cost?: number
          id?: string
          labor_cost?: number
          order_id?: string
          setting_cost?: number
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_actual_costs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "custom_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_expected_costs: {
        Row: {
          contingencies: number
          created_at: string
          final_quoted_price: number | null
          gold_cost: number
          id: string
          labor_cost: number
          order_id: string
          stone_setting_cost: number
          updated_at: string
        }
        Insert: {
          contingencies?: number
          created_at?: string
          final_quoted_price?: number | null
          gold_cost?: number
          id?: string
          labor_cost?: number
          order_id: string
          stone_setting_cost?: number
          updated_at?: string
        }
        Update: {
          contingencies?: number
          created_at?: string
          final_quoted_price?: number | null
          gold_cost?: number
          id?: string
          labor_cost?: number
          order_id?: string
          stone_setting_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_expected_costs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "custom_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_at_purchase: number
          product_id: string | null
          product_image_url: string | null
          product_name: string | null
          quantity: number
          selected_color: string | null
          selected_size: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_at_purchase?: number
          product_id?: string | null
          product_image_url?: string | null
          product_name?: string | null
          quantity?: number
          selected_color?: string | null
          selected_size?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_at_purchase?: number
          product_id?: string | null
          product_image_url?: string | null
          product_name?: string | null
          quantity?: number
          selected_color?: string | null
          selected_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          brand_id: string
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          notes: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          brand_id?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          created_at: string
          customer_id: string | null
          duration_seconds: number | null
          id: string
          lead_id: string | null
          page_path: string
          page_title: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          page_path: string
          page_title?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          page_path?: string
          page_title?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          content_blocks: Json | null
          created_at: string
          h1_title: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          seo_title: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          content_blocks?: Json | null
          created_at?: string
          h1_title?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          seo_title?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          content_blocks?: Json | null
          created_at?: string
          h1_title?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          seo_title?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_aeo_specs: {
        Row: {
          ai_summary: string | null
          certification_body: string | null
          created_at: string | null
          diamond_clarity: string | null
          diamond_color: string | null
          diamond_cut: string | null
          gemstone_type: string | null
          metal_type: string | null
          product_id: string
          total_carat_weight: number | null
          updated_at: string | null
        }
        Insert: {
          ai_summary?: string | null
          certification_body?: string | null
          created_at?: string | null
          diamond_clarity?: string | null
          diamond_color?: string | null
          diamond_cut?: string | null
          gemstone_type?: string | null
          metal_type?: string | null
          product_id: string
          total_carat_weight?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_summary?: string | null
          certification_body?: string | null
          created_at?: string | null
          diamond_clarity?: string | null
          diamond_color?: string | null
          diamond_cut?: string | null
          gemstone_type?: string | null
          metal_type?: string | null
          product_id?: string
          total_carat_weight?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_aeo_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          media_type: string | null
          product_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          media_type?: string | null
          product_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          media_type?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_stories: {
        Row: {
          ai_prompt_context: string | null
          category: string | null
          content_body: string | null
          created_at: string
          id: string
          is_default: boolean | null
          pull_quote: string | null
          specs: Json | null
          story_images: Json | null
          story_part_1: string | null
          story_part_2: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_prompt_context?: string | null
          category?: string | null
          content_body?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          pull_quote?: string | null
          specs?: Json | null
          story_images?: Json | null
          story_part_1?: string | null
          story_part_2?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_prompt_context?: string | null
          category?: string | null
          content_body?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          pull_quote?: string | null
          specs?: Json | null
          story_images?: Json | null
          story_part_1?: string | null
          story_part_2?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_variant_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          media_type: string | null
          variant_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          media_type?: string | null
          variant_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          media_type?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_available: boolean | null
          price_modifier: number | null
          product_id: string
          sku: string | null
          updated_at: string
          variant_type: string
          variant_value: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          price_modifier?: number | null
          product_id: string
          sku?: string | null
          updated_at?: string
          variant_type?: string
          variant_value: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          price_modifier?: number | null
          product_id?: string
          sku?: string | null
          updated_at?: string
          variant_type?: string
          variant_value?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ai_status: string | null
          ai_writing_style: string | null
          base_labor_markup: number | null
          brand_id: string
          category_id: string | null
          created_at: string
          description: string | null
          display_order: number | null
          external_url: string | null
          featured_review_id: string | null
          gold_type: string | null
          gold_weight_grams: number | null
          id: string
          is_active: boolean | null
          is_customizable: boolean | null
          is_diamond_jewelry: boolean | null
          is_engagement_ring: boolean | null
          is_featured: boolean | null
          is_gemstone_ring: boolean | null
          is_gold_linked: boolean | null
          is_mens_jewelry: boolean | null
          is_mens_pendant: boolean | null
          is_on_sale: boolean | null
          is_pearl_jewelry: boolean | null
          is_price_range: boolean | null
          is_vip: boolean | null
          is_vip_exclusive: boolean | null
          local_content_overrides: Json | null
          main_image_url: string | null
          marketing_copy: string | null
          mto_story: string | null
          name: string
          name_en: string | null
          original_price: number | null
          price: number | null
          price_from: number | null
          price_to: number | null
          product_story_id: string | null
          published_at: string | null
          sale_badge_text: string | null
          sale_price: number | null
          search_tags: string[] | null
          short_description: string | null
          sku: string | null
          slug: string
          stock_status: Database["public"]["Enums"]["stock_status"] | null
          stone_type: string | null
          stone_weight: string | null
          updated_at: string
          video_url: string | null
          vip_discount_percentage: number | null
        }
        Insert: {
          ai_status?: string | null
          ai_writing_style?: string | null
          base_labor_markup?: number | null
          brand_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          external_url?: string | null
          featured_review_id?: string | null
          gold_type?: string | null
          gold_weight_grams?: number | null
          id?: string
          is_active?: boolean | null
          is_customizable?: boolean | null
          is_diamond_jewelry?: boolean | null
          is_engagement_ring?: boolean | null
          is_featured?: boolean | null
          is_gemstone_ring?: boolean | null
          is_gold_linked?: boolean | null
          is_mens_jewelry?: boolean | null
          is_mens_pendant?: boolean | null
          is_on_sale?: boolean | null
          is_pearl_jewelry?: boolean | null
          is_price_range?: boolean | null
          is_vip?: boolean | null
          is_vip_exclusive?: boolean | null
          local_content_overrides?: Json | null
          main_image_url?: string | null
          marketing_copy?: string | null
          mto_story?: string | null
          name: string
          name_en?: string | null
          original_price?: number | null
          price?: number | null
          price_from?: number | null
          price_to?: number | null
          product_story_id?: string | null
          published_at?: string | null
          sale_badge_text?: string | null
          sale_price?: number | null
          search_tags?: string[] | null
          short_description?: string | null
          sku?: string | null
          slug: string
          stock_status?: Database["public"]["Enums"]["stock_status"] | null
          stone_type?: string | null
          stone_weight?: string | null
          updated_at?: string
          video_url?: string | null
          vip_discount_percentage?: number | null
        }
        Update: {
          ai_status?: string | null
          ai_writing_style?: string | null
          base_labor_markup?: number | null
          brand_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          external_url?: string | null
          featured_review_id?: string | null
          gold_type?: string | null
          gold_weight_grams?: number | null
          id?: string
          is_active?: boolean | null
          is_customizable?: boolean | null
          is_diamond_jewelry?: boolean | null
          is_engagement_ring?: boolean | null
          is_featured?: boolean | null
          is_gemstone_ring?: boolean | null
          is_gold_linked?: boolean | null
          is_mens_jewelry?: boolean | null
          is_mens_pendant?: boolean | null
          is_on_sale?: boolean | null
          is_pearl_jewelry?: boolean | null
          is_price_range?: boolean | null
          is_vip?: boolean | null
          is_vip_exclusive?: boolean | null
          local_content_overrides?: Json | null
          main_image_url?: string | null
          marketing_copy?: string | null
          mto_story?: string | null
          name?: string
          name_en?: string | null
          original_price?: number | null
          price?: number | null
          price_from?: number | null
          price_to?: number | null
          product_story_id?: string | null
          published_at?: string | null
          sale_badge_text?: string | null
          sale_price?: number | null
          search_tags?: string[] | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          stock_status?: Database["public"]["Enums"]["stock_status"] | null
          stone_type?: string | null
          stone_weight?: string | null
          updated_at?: string
          video_url?: string | null
          vip_discount_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_featured_review_id_fkey"
            columns: ["featured_review_id"]
            isOneToOne: false
            referencedRelation: "testimonials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_story_id_fkey"
            columns: ["product_story_id"]
            isOneToOne: false
            referencedRelation: "product_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_story_id_fkey"
            columns: ["product_story_id"]
            isOneToOne: false
            referencedRelation: "product_stories_public"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          banner_gradient: string | null
          banner_image_url: string | null
          banner_opacity: number | null
          banner_template: string | null
          banner_text: string | null
          banner_text_color: string | null
          banner_text_position: string | null
          content: string | null
          created_at: string
          cta_text: string | null
          cta_url: string | null
          description: string | null
          discount_code: string | null
          discount_percent: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          show_on_homepage: boolean | null
          slug: string
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          banner_gradient?: string | null
          banner_image_url?: string | null
          banner_opacity?: number | null
          banner_template?: string | null
          banner_text?: string | null
          banner_text_color?: string | null
          banner_text_position?: string | null
          content?: string | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          discount_code?: string | null
          discount_percent?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          show_on_homepage?: boolean | null
          slug: string
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          banner_gradient?: string | null
          banner_image_url?: string | null
          banner_opacity?: number | null
          banner_template?: string | null
          banner_text?: string | null
          banner_text_color?: string | null
          banner_text_position?: string | null
          content?: string | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          discount_code?: string | null
          discount_percent?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          show_on_homepage?: boolean | null
          slug?: string
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      robots_txt_history: {
        Row: {
          content: string
          created_at: string | null
          edited_by: string | null
          id: string
          note: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          edited_by?: string | null
          id?: string
          note?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          edited_by?: string | null
          id?: string
          note?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          brand_id: string
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean | null
          key: string
          metadata: Json | null
          title: string | null
          updated_at: string
        }
        Insert: {
          brand_id?: string
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          key: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          key?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_content_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      site_reviews: {
        Row: {
          created_at: string
          display_date: string | null
          display_order: number | null
          google_review_url: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          jewelry_item_name: string | null
          product_image_url: string | null
          product_link: string | null
          review_text: string
          reviewer_name: string
          seo_keywords: string[] | null
          star_rating: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_date?: string | null
          display_order?: number | null
          google_review_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          jewelry_item_name?: string | null
          product_image_url?: string | null
          product_link?: string | null
          review_text: string
          reviewer_name: string
          seo_keywords?: string[] | null
          star_rating?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_date?: string | null
          display_order?: number | null
          google_review_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          jewelry_item_name?: string | null
          product_image_url?: string | null
          product_link?: string | null
          review_text?: string
          reviewer_name?: string
          seo_keywords?: string[] | null
          star_rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      social_settings: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          is_enabled: boolean | null
          platform: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          platform: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          platform?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string
          id: string
          level: string
          message: string
          metadata: Json | null
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          message: string
          metadata?: Json | null
          source: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          source?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          content: string
          created_at: string
          customer_name: string
          display_order: number | null
          google_review_url: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          jewelry_item_name: string | null
          product_image_url: string | null
          product_link: string | null
          published_at: string | null
          rating: number | null
          seo_keywords: string[] | null
        }
        Insert: {
          content: string
          created_at?: string
          customer_name: string
          display_order?: number | null
          google_review_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          jewelry_item_name?: string | null
          product_image_url?: string | null
          product_link?: string | null
          published_at?: string | null
          rating?: number | null
          seo_keywords?: string[] | null
        }
        Update: {
          content?: string
          created_at?: string
          customer_name?: string
          display_order?: number | null
          google_review_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          jewelry_item_name?: string | null
          product_image_url?: string | null
          product_link?: string | null
          published_at?: string | null
          rating?: number | null
          seo_keywords?: string[] | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vip_login_attempts: {
        Row: {
          attempted_at: string
          id: string
          ip_hint: string | null
          phone_key: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          ip_hint?: string | null
          phone_key: string
        }
        Update: {
          attempted_at?: string
          id?: string
          ip_hint?: string | null
          phone_key?: string
        }
        Relationships: []
      }
      vip_members: {
        Row: {
          confirmed_at: string | null
          consent_date: string | null
          created_at: string
          credit_balance: number
          email: string | null
          full_name: string
          gender_preference: Database["public"]["Enums"]["gender_preference"]
          id: string
          is_active: boolean
          is_confirmed: boolean
          login_count: number
          marketing_consent: boolean
          phone_key: string
          pref_gold_color: string | null
          pref_jewelry_type: string | null
          pref_stone: string | null
          product_interests: string[] | null
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          consent_date?: string | null
          created_at?: string
          credit_balance?: number
          email?: string | null
          full_name: string
          gender_preference?: Database["public"]["Enums"]["gender_preference"]
          id?: string
          is_active?: boolean
          is_confirmed?: boolean
          login_count?: number
          marketing_consent?: boolean
          phone_key: string
          pref_gold_color?: string | null
          pref_jewelry_type?: string | null
          pref_stone?: string | null
          product_interests?: string[] | null
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          consent_date?: string | null
          created_at?: string
          credit_balance?: number
          email?: string | null
          full_name?: string
          gender_preference?: Database["public"]["Enums"]["gender_preference"]
          id?: string
          is_active?: boolean
          is_confirmed?: boolean
          login_count?: number
          marketing_consent?: boolean
          phone_key?: string
          pref_gold_color?: string | null
          pref_jewelry_type?: string | null
          pref_stone?: string | null
          product_interests?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      vip_personalized_offers: {
        Row: {
          created_at: string
          heading: string
          id: string
          is_read: boolean
          member_id: string
          message: string
          product_id: string | null
        }
        Insert: {
          created_at?: string
          heading: string
          id?: string
          is_read?: boolean
          member_id: string
          message: string
          product_id?: string | null
        }
        Update: {
          created_at?: string
          heading?: string
          id?: string
          is_read?: boolean
          member_id?: string
          message?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vip_personalized_offers_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "vip_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_personalized_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_product_rules: {
        Row: {
          created_at: string
          discount_percentage: number
          id: string
          is_vip_exclusive: boolean
          product_id: string
        }
        Insert: {
          created_at?: string
          discount_percentage?: number
          id?: string
          is_vip_exclusive?: boolean
          product_id: string
        }
        Update: {
          created_at?: string
          discount_percentage?: number
          id?: string
          is_vip_exclusive?: boolean
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_product_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_saved_items: {
        Row: {
          created_at: string
          id: string
          member_id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_saved_items_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "vip_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_saved_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      vip_special_dates: {
        Row: {
          created_at: string
          event_date: string
          event_name: string
          id: string
          member_id: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_name: string
          id?: string
          member_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_name?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_special_dates_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "vip_members"
            referencedColumns: ["id"]
          },
        ]
      }
      web_presence_settings: {
        Row: {
          created_at: string
          favicon_16: string | null
          favicon_180: string | null
          favicon_192: string | null
          favicon_32: string | null
          favicon_48: string | null
          favicon_512: string | null
          favicon_original_url: string | null
          favicon_version: number
          id: string
          og_image_url: string | null
          theme_color: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          favicon_16?: string | null
          favicon_180?: string | null
          favicon_192?: string | null
          favicon_32?: string | null
          favicon_48?: string | null
          favicon_512?: string | null
          favicon_original_url?: string | null
          favicon_version?: number
          id?: string
          og_image_url?: string | null
          theme_color?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          favicon_16?: string | null
          favicon_180?: string | null
          favicon_192?: string | null
          favicon_32?: string | null
          favicon_48?: string | null
          favicon_512?: string | null
          favicon_original_url?: string | null
          favicon_version?: number
          id?: string
          og_image_url?: string | null
          theme_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          user_id?: string
        }
        Relationships: []
      }
      welcome_email_settings: {
        Row: {
          benefits_text: string
          benefits_title: string
          coupon_code: string | null
          created_at: string
          cta_button_text: string
          cta_button_url: string
          designer_message: string
          facebook_url: string | null
          gift_text: string
          gift_title: string
          greeting_fallback: string
          greeting_template: string
          id: string
          instagram_url: string | null
          intro_text: string
          is_active: boolean | null
          logo_url: string | null
          privacy_note: string
          signature_name: string
          signature_title: string
          subject_line: string
          updated_at: string
        }
        Insert: {
          benefits_text?: string
          benefits_title?: string
          coupon_code?: string | null
          created_at?: string
          cta_button_text?: string
          cta_button_url?: string
          designer_message?: string
          facebook_url?: string | null
          gift_text?: string
          gift_title?: string
          greeting_fallback?: string
          greeting_template?: string
          id?: string
          instagram_url?: string | null
          intro_text?: string
          is_active?: boolean | null
          logo_url?: string | null
          privacy_note?: string
          signature_name?: string
          signature_title?: string
          subject_line?: string
          updated_at?: string
        }
        Update: {
          benefits_text?: string
          benefits_title?: string
          coupon_code?: string | null
          created_at?: string
          cta_button_text?: string
          cta_button_url?: string
          designer_message?: string
          facebook_url?: string | null
          gift_text?: string
          gift_title?: string
          greeting_fallback?: string
          greeting_template?: string
          id?: string
          instagram_url?: string | null
          intro_text?: string
          is_active?: boolean | null
          logo_url?: string | null
          privacy_note?: string
          signature_name?: string
          signature_title?: string
          subject_line?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      product_stories_public: {
        Row: {
          category: string | null
          content_body: string | null
          created_at: string | null
          id: string | null
          is_default: boolean | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content_body?: string | null
          created_at?: string | null
          id?: string | null
          is_default?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content_body?: string | null
          created_at?: string | null
          id?: string | null
          is_default?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings_public: {
        Row: {
          created_at: string | null
          id: string | null
          key: string | null
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          key?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          key?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      social_settings_public: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string | null
          is_enabled: boolean | null
          platform: string | null
          updated_at: string | null
        }
        Insert: {
          config?: never
          created_at?: string | null
          id?: string | null
          is_enabled?: boolean | null
          platform?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: never
          created_at?: string | null
          id?: string | null
          is_enabled?: boolean | null
          platform?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_vip_rate_limit: { Args: { p_phone: string }; Returns: boolean }
      get_analytics_device_distribution: {
        Args: never
        Returns: {
          device_count: number
          device_type: string
        }[]
      }
      get_analytics_time_series: {
        Args: { days_back?: number }
        Returns: {
          event_count: number
          event_date: string
        }[]
      }
      get_category_product_counts: {
        Args: never
        Returns: {
          category_slug: string
          product_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      verify_admin_pin: { Args: { pin_attempt: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "super_admin"
      gender_preference: "female" | "male" | "all"
      stock_status: "in_stock" | "made_to_order" | "out_of_stock"
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
      app_role: ["admin", "moderator", "user", "super_admin"],
      gender_preference: ["female", "male", "all"],
      stock_status: ["in_stock", "made_to_order", "out_of_stock"],
    },
  },
} as const
