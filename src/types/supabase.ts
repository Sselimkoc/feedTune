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
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      feeds: {
        Row: {
          category_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          icon: string | null
          id: string
          last_fetched: string | null
          last_updated: string | null
          title: string
          type: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          last_fetched?: string | null
          last_updated?: string | null
          title: string
          type?: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          last_fetched?: string | null
          last_updated?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      item_tags: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          tag_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rss_items: {
        Row: {
          author: string | null
          content: string | null
          created_at: string | null
          description: string | null
          feed_id: string
          feed_title: string | null
          feed_type: string | null
          guid: string | null
          id: string
          published_at: string | null
          thumbnail: string | null
          title: string
          url: string | null
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          feed_id: string
          feed_title?: string | null
          feed_type?: string | null
          guid?: string | null
          id?: string
          published_at?: string | null
          thumbnail?: string | null
          title: string
          url?: string | null
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          feed_id?: string
          feed_title?: string | null
          feed_type?: string | null
          guid?: string | null
          id?: string
          published_at?: string | null
          thumbnail?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_feed"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          item_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          item_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          item_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "rss_items"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          preferences: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          preferences?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      youtube_cache: {
        Row: {
          channel_title: string | null
          created_at: string | null
          description: string | null
          id: string
          rss_url: string
          thumbnail: string | null
          title: string | null
          updated_at: string | null
          youtube_id: string
        }
        Insert: {
          channel_title?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          rss_url: string
          thumbnail?: string | null
          title?: string | null
          updated_at?: string | null
          youtube_id: string
        }
        Update: {
          channel_title?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          rss_url?: string
          thumbnail?: string | null
          title?: string | null
          updated_at?: string | null
          youtube_id?: string
        }
        Relationships: []
      }
      youtube_items: {
        Row: {
          channel_title: string | null
          content_type: string | null
          created_at: string | null
          description: string | null
          feed_id: string
          id: string
          is_short: boolean | null
          published_at: string | null
          thumbnail: string | null
          title: string
          url: string | null
          video_id: string
        }
        Insert: {
          channel_title?: string | null
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          feed_id: string
          id?: string
          is_short?: boolean | null
          published_at?: string | null
          thumbnail?: string | null
          title: string
          url?: string | null
          video_id: string
        }
        Update: {
          channel_title?: string | null
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          feed_id?: string
          id?: string
          is_short?: boolean | null
          published_at?: string | null
          thumbnail?: string | null
          title?: string
          url?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_feed"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "feeds"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_migrations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clean_youtube_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      disable_youtube_rls_applied: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_table_policies: {
        Args: { table_name: string }
        Returns: {
          policyname: string
          tablename: string
          operation: string
          using_expr: string
          check_expr: string
        }[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
