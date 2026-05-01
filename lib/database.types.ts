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
      activity_logs: {
        Row: {
          action_type: string
          child_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          points_earned: number | null
        }
        Insert: {
          action_type: string
          child_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number | null
        }
        Update: {
          action_type?: string
          child_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          category_en: string
          category_he: string
          content_en: string
          content_he: string
          created_at: string | null
          id: string
          image_url: string
          subtitle_en: string
          subtitle_he: string
          title_en: string
          title_he: string
        }
        Insert: {
          category_en: string
          category_he: string
          content_en: string
          content_he: string
          created_at?: string | null
          id?: string
          image_url: string
          subtitle_en: string
          subtitle_he: string
          title_en: string
          title_he: string
        }
        Update: {
          category_en?: string
          category_he?: string
          content_en?: string
          content_he?: string
          created_at?: string | null
          id?: string
          image_url?: string
          subtitle_en?: string
          subtitle_he?: string
          title_en?: string
          title_he?: string
        }
        Relationships: []
      }
      children: {
        Row: {
          avatar_id: string
          birth_date: string | null
          created_at: string | null
          current_month_cycle: number | null
          current_prescription_left: number | null
          current_prescription_right: number | null
          current_streak: number | null
          daily_reminder_time: string | null
          data_consent_at: string | null
          device_id: string | null
          expo_push_token: string | null
          family_id: string
          gender: string | null
          id: string
          is_active_session: boolean | null
          last_activity_date: string | null
          last_heartbeat: string | null
          linking_code: string | null
          linking_code_expires_at: string | null
          longest_streak: number | null
          name: string
          path_day: number | null
          path_theme_id: string | null
          session_device_id: string | null
          subscription_status: string
          total_points: number | null
          track_level: string | null
          updated_at: string | null
          vision_condition: string | null
          wears_glasses: boolean | null
        }
        Insert: {
          avatar_id?: string
          birth_date?: string | null
          created_at?: string | null
          current_month_cycle?: number | null
          current_prescription_left?: number | null
          current_prescription_right?: number | null
          current_streak?: number | null
          daily_reminder_time?: string | null
          data_consent_at?: string | null
          device_id?: string | null
          expo_push_token?: string | null
          family_id: string
          gender?: string | null
          id?: string
          is_active_session?: boolean | null
          last_activity_date?: string | null
          last_heartbeat?: string | null
          linking_code?: string | null
          linking_code_expires_at?: string | null
          longest_streak?: number | null
          name: string
          path_day?: number | null
          path_theme_id?: string | null
          session_device_id?: string | null
          subscription_status?: string
          total_points?: number | null
          track_level?: string | null
          updated_at?: string | null
          vision_condition?: string | null
          wears_glasses?: boolean | null
        }
        Update: {
          avatar_id?: string
          birth_date?: string | null
          created_at?: string | null
          current_month_cycle?: number | null
          current_prescription_left?: number | null
          current_prescription_right?: number | null
          current_streak?: number | null
          daily_reminder_time?: string | null
          data_consent_at?: string | null
          device_id?: string | null
          expo_push_token?: string | null
          family_id?: string
          gender?: string | null
          id?: string
          is_active_session?: boolean | null
          last_activity_date?: string | null
          last_heartbeat?: string | null
          linking_code?: string | null
          linking_code_expires_at?: string | null
          longest_streak?: number | null
          name?: string
          path_day?: number | null
          path_theme_id?: string | null
          session_device_id?: string | null
          subscription_status?: string
          total_points?: number | null
          track_level?: string | null
          updated_at?: string | null
          vision_condition?: string | null
          wears_glasses?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "children_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_completions: {
        Row: {
          child_id: string
          completed_at: string
          cycle_number: number
          day_number: number
          duration_seconds: number | null
          exercises_completed: number
          exercises_total: number
          id: string
          plan_id: string
          points_earned: number
        }
        Insert: {
          child_id: string
          completed_at?: string
          cycle_number: number
          day_number: number
          duration_seconds?: number | null
          exercises_completed?: number
          exercises_total: number
          id?: string
          plan_id: string
          points_earned?: number
        }
        Update: {
          child_id?: string
          completed_at?: string
          cycle_number?: number
          day_number?: number
          duration_seconds?: number | null
          exercises_completed?: number
          exercises_total?: number
          id?: string
          plan_id?: string
          points_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_completions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_completions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_plans: {
        Row: {
          created_at: string | null
          day_number: number
          description: string | null
          id: string
          is_rest_day: boolean | null
          title: string
          track_level: string
        }
        Insert: {
          created_at?: string | null
          day_number: number
          description?: string | null
          id?: string
          is_rest_day?: boolean | null
          title: string
          track_level: string
        }
        Update: {
          created_at?: string | null
          day_number?: number
          description?: string | null
          id?: string
          is_rest_day?: boolean | null
          title?: string
          track_level?: string
        }
        Relationships: []
      }
      exercise_categories: {
        Row: {
          color: string
          created_at: string | null
          icon_id: string | null
          id: string
          name_en: string
          name_he: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          icon_id?: string | null
          id: string
          name_en: string
          name_he: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          icon_id?: string | null
          id?: string
          name_en?: string
          name_he?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      exercise_completions: {
        Row: {
          child_id: string
          completed_at: string
          exercise_id: string
          id: string
          points_earned: number
        }
        Insert: {
          child_id: string
          completed_at?: string
          exercise_id: string
          id?: string
          points_earned?: number
        }
        Update: {
          child_id?: string
          completed_at?: string
          exercise_id?: string
          id?: string
          points_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercise_completions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_completions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          animation_id: string
          audio_path_en: string | null
          audio_path_he: string | null
          created_at: string | null
          default_duration_seconds: number | null
          default_reps: number | null
          description_en: string | null
          description_he: string | null
          exercise_type: string | null
          icon_id: string | null
          id: string
          instructions_en: Json | null
          instructions_he: Json | null
          reward_points: number
          status: string
          title_en: string
          title_he: string
          updated_at: string | null
        }
        Insert: {
          animation_id: string
          audio_path_en?: string | null
          audio_path_he?: string | null
          created_at?: string | null
          default_duration_seconds?: number | null
          default_reps?: number | null
          description_en?: string | null
          description_he?: string | null
          exercise_type?: string | null
          icon_id?: string | null
          id?: string
          instructions_en?: Json | null
          instructions_he?: Json | null
          reward_points?: number
          status?: string
          title_en: string
          title_he: string
          updated_at?: string | null
        }
        Update: {
          animation_id?: string
          audio_path_en?: string | null
          audio_path_he?: string | null
          created_at?: string | null
          default_duration_seconds?: number | null
          default_reps?: number | null
          description_en?: string | null
          description_he?: string | null
          exercise_type?: string | null
          icon_id?: string | null
          id?: string
          instructions_en?: Json | null
          instructions_he?: Json | null
          reward_points?: number
          status?: string
          title_en?: string
          title_he?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      families: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer_en: string
          answer_he: string
          created_at: string
          id: string
          question_en: string
          question_he: string
          sort_order: number
        }
        Insert: {
          answer_en?: string
          answer_he?: string
          created_at?: string
          id?: string
          question_en?: string
          question_he?: string
          sort_order?: number
        }
        Update: {
          answer_en?: string
          answer_he?: string
          created_at?: string
          id?: string
          question_en?: string
          question_he?: string
          sort_order?: number
        }
        Relationships: []
      }
      library_items: {
        Row: {
          category_color: string
          category_id: string | null
          category_name: string
          created_at: string | null
          enable_animation: boolean
          enable_audio: boolean
          exercise_id: string
          id: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          category_color?: string
          category_id?: string | null
          category_name: string
          created_at?: string | null
          enable_animation?: boolean
          enable_audio?: boolean
          exercise_id: string
          id?: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          category_color?: string
          category_id?: string | null
          category_name?: string
          created_at?: string | null
          enable_animation?: boolean
          enable_audio?: boolean
          exercise_id?: string
          id?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "exercise_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_themes: {
        Row: {
          background_colors: Json
          created_at: string | null
          current_glow: string
          cycle_position: number
          decoration: Json
          id: string
          locked_node_color: string
          locked_node_stroke: string
          name_en: string
          name_he: string
          node_color: string
          node_stroke: string
          path_color: string
          path_stroke: string
        }
        Insert: {
          background_colors: Json
          created_at?: string | null
          current_glow: string
          cycle_position: number
          decoration: Json
          id: string
          locked_node_color: string
          locked_node_stroke: string
          name_en: string
          name_he: string
          node_color: string
          node_stroke: string
          path_color: string
          path_stroke: string
        }
        Update: {
          background_colors?: Json
          created_at?: string | null
          current_glow?: string
          cycle_position?: number
          decoration?: Json
          id?: string
          locked_node_color?: string
          locked_node_stroke?: string
          name_en?: string
          name_he?: string
          node_color?: string
          node_stroke?: string
          path_color?: string
          path_stroke?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          daily_reminder_time: string | null
          email: string
          expo_push_token: string | null
          family_id: string | null
          first_name: string | null
          id: string
          is_active_session: boolean | null
          is_admin: boolean
          last_heartbeat: string | null
          last_name: string | null
          role: string
          session_device_id: string | null
        }
        Insert: {
          created_at?: string | null
          daily_reminder_time?: string | null
          email: string
          expo_push_token?: string | null
          family_id?: string | null
          first_name?: string | null
          id: string
          is_active_session?: boolean | null
          is_admin?: boolean
          last_heartbeat?: string | null
          last_name?: string | null
          role?: string
          session_device_id?: string | null
        }
        Update: {
          created_at?: string | null
          daily_reminder_time?: string | null
          email?: string
          expo_push_token?: string | null
          family_id?: string | null
          first_name?: string | null
          id?: string
          is_active_session?: boolean | null
          is_admin?: boolean
          last_heartbeat?: string | null
          last_name?: string | null
          role?: string
          session_device_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      vision_history: {
        Row: {
          child_id: string
          created_at: string | null
          id: string
          notes: string | null
          prescription_left: number | null
          prescription_right: number | null
          recorded_at: string
        }
        Insert: {
          child_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          prescription_left?: number | null
          prescription_right?: number | null
          recorded_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          prescription_left?: number | null
          prescription_right?: number | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vision_history_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_items: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          exercise_id: string
          id: string
          plan_id: string
          sequence_order: number
          target_reps: number | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          exercise_id: string
          id?: string
          plan_id: string
          sequence_order: number
          target_reps?: number | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          exercise_id?: string
          id?: string
          plan_id?: string
          sequence_order?: number
          target_reps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_session_lock_child: { Args: { p_child_id: string }; Returns: Json }
      check_session_lock_profile: { Args: { p_user_id: string }; Returns: Json }
      claim_treasure_bonus: { Args: { p_child_id: string }; Returns: Json }
      complete_daily_plan: {
        Args: {
          p_child_id: string
          p_duration_seconds?: number
          p_exercises_completed?: number
          p_exercises_total?: number
          p_plan_id: string
          p_points?: number
        }
        Returns: Json
      }
      create_child_profile: {
        Args: {
          p_birth_date: string
          p_data_consent_at: string
          p_family_id: string
          p_gender: string
          p_name: string
          p_prescription_left: number
          p_prescription_right: number
          p_vision_condition: string
          p_wears_glasses: boolean
        }
        Returns: Json
      }
      generate_linking_code: { Args: { child_id_param: string }; Returns: Json }
      get_child_session: { Args: { p_device_id: string }; Returns: Json }
      get_independent_child: { Args: never; Returns: Json }
      get_today_task: { Args: { p_child_id: string }; Returns: Json }
      heartbeat_child: {
        Args: { p_child_id: string; p_device_id: string }
        Returns: Json
      }
      heartbeat_profile: { Args: { p_device_id: string }; Returns: Json }
      is_admin_user: { Args: never; Returns: boolean }
      log_exercise_completion: {
        Args: { p_child_id: string; p_exercise_id: string }
        Returns: Json
      }
      register_activity_and_advance: {
        Args: {
          p_action_type: string
          p_child_id: string
          p_metadata?: Json
          p_points: number
        }
        Returns: {
          avatar_id: string
          birth_date: string | null
          created_at: string | null
          current_month_cycle: number | null
          current_prescription_left: number | null
          current_prescription_right: number | null
          current_streak: number | null
          daily_reminder_time: string | null
          data_consent_at: string | null
          device_id: string | null
          expo_push_token: string | null
          family_id: string
          gender: string | null
          id: string
          is_active_session: boolean | null
          last_activity_date: string | null
          last_heartbeat: string | null
          linking_code: string | null
          linking_code_expires_at: string | null
          longest_streak: number | null
          name: string
          path_day: number | null
          path_theme_id: string | null
          session_device_id: string | null
          subscription_status: string
          total_points: number | null
          track_level: string | null
          updated_at: string | null
          vision_condition: string | null
          wears_glasses: boolean | null
        }
        SetofOptions: {
          from: "*"
          to: "children"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      register_independent_user: {
        Args: {
          p_birth_date: string
          p_gender?: string
          p_name: string
          p_prescription_left?: number
          p_prescription_right?: number
          p_vision_condition?: string
          p_wears_glasses?: boolean
        }
        Returns: Json
      }
      release_session_child: { Args: { p_child_id: string }; Returns: Json }
      release_session_profile: { Args: never; Returns: Json }
      update_child_push_token: {
        Args: { p_child_id: string; p_token: string }
        Returns: Json
      }
      update_child_reminder_time: {
        Args: { p_child_id: string; p_time: string }
        Returns: Json
      }
      validate_and_link_child: {
        Args: { p_device_id: string; p_linking_code: string }
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
    Enums: {},
  },
} as const
<claude-code-hint v="1" type="plugin" value="supabase@claude-plugins-official" />
