export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      children: {
        Row: {
          id: string
          family_id: string
          name: string
          linking_code: string | null
          linking_code_expires_at: string | null
          device_id: string | null
          created_at: string
          birth_date: string | null
          gender: string | null
          vision_condition: string
          wears_glasses: boolean
          current_prescription_left: number | null
          current_prescription_right: number | null
          data_consent_at: string | null
          subscription_status: string
          updated_at: string
          track_level: 'child' | 'teen' | 'adult'
          total_points: number
          current_streak: number
          longest_streak: number
          path_day: number
          current_month_cycle: number
          path_theme_id: string
          last_activity_date: string | null
          expo_push_token: string | null
          daily_reminder_time: string | null
          is_active_session: boolean
          last_heartbeat: string | null
          session_device_id: string | null
          avatar_id: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          linking_code?: string | null
          linking_code_expires_at?: string | null
          device_id?: string | null
          created_at?: string
          birth_date?: string | null
          gender?: string | null
          vision_condition?: string
          wears_glasses?: boolean
          current_prescription_left?: number | null
          current_prescription_right?: number | null
          data_consent_at?: string | null
          subscription_status?: string
          updated_at?: string
          track_level?: 'child' | 'teen' | 'adult'
          total_points?: number
          current_streak?: number
          longest_streak?: number
          path_day?: number
          current_month_cycle?: number
          path_theme_id?: string
          last_activity_date?: string | null
          expo_push_token?: string | null
          daily_reminder_time?: string | null
          is_active_session?: boolean
          last_heartbeat?: string | null
          session_device_id?: string | null
          avatar_id?: string
        }
        Update: {
          id?: string
          family_id?: string
          name?: string
          linking_code?: string | null
          linking_code_expires_at?: string | null
          device_id?: string | null
          created_at?: string
          birth_date?: string | null
          gender?: string | null
          vision_condition?: string
          wears_glasses?: boolean
          current_prescription_left?: number | null
          current_prescription_right?: number | null
          data_consent_at?: string | null
          subscription_status?: string
          updated_at?: string
          track_level?: 'child' | 'teen' | 'adult'
          total_points?: number
          current_streak?: number
          longest_streak?: number
          path_day?: number
          current_month_cycle?: number
          path_theme_id?: string
          last_activity_date?: string | null
          expo_push_token?: string | null
          daily_reminder_time?: string | null
          is_active_session?: boolean
          last_heartbeat?: string | null
          session_device_id?: string | null
          avatar_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          family_id: string | null
          role: string
          email: string
          created_at: string
          first_name: string | null
          last_name: string | null
          expo_push_token: string | null
          daily_reminder_time: string | null
          is_active_session: boolean
          last_heartbeat: string | null
          session_device_id: string | null
        }
        Insert: {
          id: string
          family_id?: string | null
          role?: string
          email: string
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          expo_push_token?: string | null
          daily_reminder_time?: string | null
          is_active_session?: boolean
          last_heartbeat?: string | null
          session_device_id?: string | null
        }
        Update: {
          id?: string
          family_id?: string | null
          role?: string
          email?: string
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          expo_push_token?: string | null
          daily_reminder_time?: string | null
          is_active_session?: boolean
          last_heartbeat?: string | null
          session_device_id?: string | null
        }
        Relationships: []
      }
      families: {
        Row: {
          id: string
          created_at: string
          name: string
        }
        Insert: {
          id?: string
          created_at?: string
          name?: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          id: string
          created_at: string
          image_url: string
          category_he: string
          category_en: string
          title_he: string
          title_en: string
          subtitle_he: string
          subtitle_en: string
          content_he: string
          content_en: string
        }
        Insert: {
          id?: string
          created_at?: string
          image_url: string
          category_he: string
          category_en: string
          title_he: string
          title_en: string
          subtitle_he: string
          subtitle_en: string
          content_he: string
          content_en: string
        }
        Update: {
          id?: string
          created_at?: string
          image_url?: string
          category_he?: string
          category_en?: string
          title_he?: string
          title_en?: string
          subtitle_he?: string
          subtitle_en?: string
          content_he?: string
          content_en?: string
        }
        Relationships: []
      }
      vision_history: {
        Row: {
          id: string
          child_id: string
          recorded_at: string
          prescription_left: number | null
          prescription_right: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          child_id: string
          recorded_at?: string
          prescription_left?: number | null
          prescription_right?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          child_id?: string
          recorded_at?: string
          prescription_left?: number | null
          prescription_right?: number | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vision_history_child_id_fkey"
            columns: ["child_id"]
            referencedRelation: "children"
            referencedColumns: ["id"]
          }
        ]
      }
      exercises: {
        Row: {
          id: string
          animation_id: string
          icon_id: string | null
          audio_path_en: string | null
          audio_path_he: string | null
          title_en: string
          title_he: string
          description_en: string | null
          description_he: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          animation_id: string
          icon_id?: string | null
          audio_path_en?: string | null
          audio_path_he?: string | null
          title_en: string
          title_he: string
          description_en?: string | null
          description_he?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          animation_id?: string
          icon_id?: string | null
          audio_path_en?: string | null
          audio_path_he?: string | null
          title_en?: string
          title_he?: string
          description_en?: string | null
          description_he?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      library_items: {
        Row: {
          id: string
          exercise_id: string
          category_name: string
          category_color: string
          enable_audio: boolean
          enable_animation: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exercise_id: string
          category_name: string
          category_color?: string
          enable_audio?: boolean
          enable_animation?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exercise_id?: string
          category_name?: string
          category_color?: string
          enable_audio?: boolean
          enable_animation?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_items_exercise_id_fkey"
            columns: ["exercise_id"]
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_plans: {
        Row: {
          id: string
          track_level: 'child' | 'teen' | 'adult'
          day_number: number
          is_rest_day: boolean
          title: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          track_level: 'child' | 'teen' | 'adult'
          day_number: number
          is_rest_day?: boolean
          title: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          track_level?: 'child' | 'teen' | 'adult'
          day_number?: number
          is_rest_day?: boolean
          title?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      workout_items: {
        Row: {
          id: string
          plan_id: string
          exercise_id: string
          sequence_order: number
          duration_seconds: number | null
          target_reps: number | null
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          exercise_id: string
          sequence_order: number
          duration_seconds?: number | null
          target_reps?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          exercise_id?: string
          sequence_order?: number
          duration_seconds?: number | null
          target_reps?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_items_plan_id_fkey"
            columns: ["plan_id"]
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_items_exercise_id_fkey"
            columns: ["exercise_id"]
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_logs: {
        Row: {
          id: string
          child_id: string
          action_type: string
          points_earned: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          child_id: string
          action_type: string
          points_earned?: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          child_id?: string
          action_type?: string
          points_earned?: number
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_child_id_fkey"
            columns: ["child_id"]
            referencedRelation: "children"
            referencedColumns: ["id"]
          }
        ]
      }
      faq_items: {
        Row: {
          id: string
          question_he: string
          question_en: string
          answer_he: string
          answer_en: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          question_he: string
          question_en: string
          answer_he: string
          answer_en: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          question_he?: string
          question_en?: string
          answer_he?: string
          answer_en?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      register_activity_and_advance: {
        Args: {
          p_child_id: string
          p_points: number
          p_action_type: string
          p_metadata?: Json
        }
        Returns: Database['public']['Tables']['children']['Row']
      }
      generate_linking_code: {
        Args: {
          p_child_id: string
        }
        Returns: {
          success: boolean
          code: string | null
          expires_at: string | null
          error: string | null
        }
      }
      get_child_session: {
        Args: {
          p_device_id: string
        }
        Returns: {
          success: boolean
          child: Database['public']['Tables']['children']['Row'] | null
          error: string | null
        }
      }
      validate_and_link_child: {
        Args: {
          p_linking_code: string
          p_device_id: string
        }
        Returns: {
          success: boolean
          child: Database['public']['Tables']['children']['Row'] | null
          error: string | null
        }
      }
      create_child_profile: {
        Args: {
          p_family_id: string
          p_name: string
          p_birth_date: string | null
          p_gender: string | null
        }
        Returns: {
          success: boolean
          child: Database['public']['Tables']['children']['Row'] | null
          error: string | null
        }
      }
      claim_treasure_bonus: {
        Args: {
          p_child_id: string
        }
        Returns: {
          success: boolean
          error: string | null
          child: Database['public']['Tables']['children']['Row'] | null
          points_earned?: number
        }
      }
      register_independent_user: {
        Args: {
          p_name: string
          p_birth_date: string
          p_gender?: string | null
          p_vision_condition?: string
          p_wears_glasses?: boolean
          p_prescription_left?: number | null
          p_prescription_right?: number | null
        }
        Returns: {
          success: boolean
          child: Database['public']['Tables']['children']['Row'] | null
          error: string | null
        }
      }
      get_independent_child: {
        Args: Record<string, never>
        Returns: {
          success: boolean
          child: Database['public']['Tables']['children']['Row'] | null
          error: string | null
        }
      }
      update_child_push_token: {
        Args: {
          p_child_id: string
          p_token: string
        }
        Returns: {
          success: boolean
          error: string | null
        }
      }
      update_child_reminder_time: {
        Args: {
          p_child_id: string
          p_time: string
        }
        Returns: {
          success: boolean
          error: string | null
        }
      }
      check_session_lock_profile: {
        Args: {
          p_user_id: string
        }
        Returns: {
          locked: boolean
          device_id?: string | null
          reason?: string | null
        }
      }
      check_session_lock_child: {
        Args: {
          p_child_id: string
        }
        Returns: {
          locked: boolean
          device_id?: string | null
          reason?: string | null
        }
      }
      heartbeat_profile: {
        Args: {
          p_device_id: string
        }
        Returns: {
          success: boolean
          error?: string | null
        }
      }
      heartbeat_child: {
        Args: {
          p_child_id: string
          p_device_id: string
        }
        Returns: {
          success: boolean
          error?: string | null
        }
      }
      release_session_profile: {
        Args: Record<string, never>
        Returns: {
          success: boolean
          error?: string | null
        }
      }
      release_session_child: {
        Args: {
          p_child_id: string
        }
        Returns: {
          success: boolean
          error?: string | null
        }
      }
    }
    Enums: {}
  }
}
