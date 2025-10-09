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
      accommodations: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          params: Json | null
          student_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          params?: Json | null
          student_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          params?: Json | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accommodations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_runs: {
        Row: {
          agent: string | null
          created_at: string | null
          id: string
          input_ref: string | null
          latency_ms: number | null
          notes: string | null
          output_ref: string | null
          success: boolean | null
        }
        Insert: {
          agent?: string | null
          created_at?: string | null
          id?: string
          input_ref?: string | null
          latency_ms?: number | null
          notes?: string | null
          output_ref?: string | null
          success?: boolean | null
        }
        Update: {
          agent?: string | null
          created_at?: string | null
          id?: string
          input_ref?: string | null
          latency_ms?: number | null
          notes?: string | null
          output_ref?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
      artifacts: {
        Row: {
          created_at: string | null
          id: string
          meta: Json | null
          ocr_text: string | null
          storage_path: string | null
          student_id: string | null
          type: Database["public"]["Enums"]["artifact_t"]
          uploader_id: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          meta?: Json | null
          ocr_text?: string | null
          storage_path?: string | null
          student_id?: string | null
          type: Database["public"]["Enums"]["artifact_t"]
          uploader_id?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          meta?: Json | null
          ocr_text?: string | null
          storage_path?: string | null
          student_id?: string | null
          type?: Database["public"]["Enums"]["artifact_t"]
          uploader_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          created_at: string | null
          curriculum_item_id: string | null
          due_at: string | null
          id: string
          max_attempts: number | null
          rubric: Json | null
          status: Database["public"]["Enums"]["status_t"]
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          curriculum_item_id?: string | null
          due_at?: string | null
          id?: string
          max_attempts?: number | null
          rubric?: Json | null
          status?: Database["public"]["Enums"]["status_t"]
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          curriculum_item_id?: string | null
          due_at?: string | null
          id?: string
          max_attempts?: number | null
          rubric?: Json | null
          status?: Database["public"]["Enums"]["status_t"]
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_curriculum_item_id_fkey"
            columns: ["curriculum_item_id"]
            isOneToOne: false
            referencedRelation: "curriculum_items"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_logs: {
        Row: {
          date: string
          id: string
          minutes: number | null
          notes: string | null
          student_id: string | null
        }
        Insert: {
          date: string
          id?: string
          minutes?: number | null
          notes?: string | null
          student_id?: string | null
        }
        Update: {
          date?: string
          id?: string
          minutes?: number | null
          notes?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          actor: string | null
          entity: string | null
          entity_id: string | null
          id: string
          meta: Json | null
          ts: string | null
        }
        Insert: {
          action?: string | null
          actor?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
          ts?: string | null
        }
        Update: {
          action?: string | null
          actor?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
          ts?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_fkey"
            columns: ["actor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          archived: boolean | null
          created_at: string | null
          credits: number | null
          description: string | null
          grade_level: string | null
          id: string
          standards_scope: Json | null
          student_id: string | null
          subject: string
          title: string
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          created_at?: string | null
          credits?: number | null
          description?: string | null
          grade_level?: string | null
          id?: string
          standards_scope?: Json | null
          student_id?: string | null
          subject: string
          title: string
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          created_at?: string | null
          credits?: number | null
          description?: string | null
          grade_level?: string | null
          id?: string
          standards_scope?: Json | null
          student_id?: string | null
          subject?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_items: {
        Row: {
          body: Json
          course_id: string | null
          created_at: string | null
          est_minutes: number | null
          id: string
          source_artifact_id: string | null
          standards: Json | null
          title: string
          type: Database["public"]["Enums"]["item_t"]
        }
        Insert: {
          body: Json
          course_id?: string | null
          created_at?: string | null
          est_minutes?: number | null
          id?: string
          source_artifact_id?: string | null
          standards?: Json | null
          title: string
          type: Database["public"]["Enums"]["item_t"]
        }
        Update: {
          body?: Json
          course_id?: string | null
          created_at?: string | null
          est_minutes?: number | null
          id?: string
          source_artifact_id?: string | null
          standards?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["item_t"]
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_items_source_artifact_id_fkey"
            columns: ["source_artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          assignment_id: string | null
          graded_at: string | null
          grader: Database["public"]["Enums"]["grader_t"]
          id: string
          max_score: number | null
          needs_human: boolean | null
          notes: string | null
          rubric_scores: Json | null
          score: number | null
          student_id: string | null
        }
        Insert: {
          assignment_id?: string | null
          graded_at?: string | null
          grader?: Database["public"]["Enums"]["grader_t"]
          id?: string
          max_score?: number | null
          needs_human?: boolean | null
          notes?: string | null
          rubric_scores?: Json | null
          score?: number | null
          student_id?: string | null
        }
        Update: {
          assignment_id?: string | null
          graded_at?: string | null
          grader?: Database["public"]["Enums"]["grader_t"]
          id?: string
          max_score?: number | null
          needs_human?: boolean | null
          notes?: string | null
          rubric_scores?: Json | null
          score?: number | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          locale: string | null
          name: string | null
          timezone: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          locale?: string | null
          name?: string | null
          timezone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          locale?: string | null
          name?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
      progress_events: {
        Row: {
          assignment_id: string | null
          event: Database["public"]["Enums"]["prog_event_t"]
          id: string
          meta: Json | null
          student_id: string | null
          ts: string
        }
        Insert: {
          assignment_id?: string | null
          event: Database["public"]["Enums"]["prog_event_t"]
          id?: string
          meta?: Json | null
          student_id?: string | null
          ts?: string
        }
        Update: {
          assignment_id?: string | null
          event?: Database["public"]["Enums"]["prog_event_t"]
          id?: string
          meta?: Json | null
          student_id?: string | null
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_events_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      question_responses: {
        Row: {
          answer: Json
          attempt_number: number
          created_at: string | null
          id: string
          is_correct: boolean | null
          question_id: string
          submission_id: string | null
          time_spent_seconds: number | null
        }
        Insert: {
          answer: Json
          attempt_number: number
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id: string
          submission_id?: string | null
          time_spent_seconds?: number | null
        }
        Update: {
          answer?: Json
          attempt_number?: number
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string
          submission_id?: string | null
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "question_responses_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      standards: {
        Row: {
          code: string
          embedding: string | null
          framework: string
          grade_band: string | null
          id: string
          parent_code: string | null
          subject: string | null
          tags: string[] | null
          text: string
        }
        Insert: {
          code: string
          embedding?: string | null
          framework: string
          grade_band?: string | null
          id?: string
          parent_code?: string | null
          subject?: string | null
          tags?: string[] | null
          text: string
        }
        Update: {
          code?: string
          embedding?: string | null
          framework?: string
          grade_band?: string | null
          id?: string
          parent_code?: string | null
          subject?: string | null
          tags?: string[] | null
          text?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          accommodations: Json | null
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          dob: string | null
          goals: Json | null
          grade_level: string | null
          id: string
          learning_profile: Json | null
          name: string
          parent_id: string | null
          personality_type: string | null
          profile_assessment_completed: boolean | null
          user_id: string | null
        }
        Insert: {
          accommodations?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          dob?: string | null
          goals?: Json | null
          grade_level?: string | null
          id?: string
          learning_profile?: Json | null
          name: string
          parent_id?: string | null
          personality_type?: string | null
          profile_assessment_completed?: boolean | null
          user_id?: string | null
        }
        Update: {
          accommodations?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          dob?: string | null
          goals?: Json | null
          grade_level?: string | null
          id?: string
          learning_profile?: Json | null
          name?: string
          parent_id?: string | null
          personality_type?: string | null
          profile_assessment_completed?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: string | null
          attempt_no: number | null
          content: Json | null
          files: Json | null
          id: string
          student_id: string | null
          submitted_at: string | null
          time_spent_seconds: number | null
        }
        Insert: {
          assignment_id?: string | null
          attempt_no?: number | null
          content?: Json | null
          files?: Json | null
          id?: string
          student_id?: string | null
          submitted_at?: string | null
          time_spent_seconds?: number | null
        }
        Update: {
          assignment_id?: string | null
          attempt_no?: number | null
          content?: Json | null
          files?: Json | null
          id?: string
          student_id?: string | null
          submitted_at?: string | null
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          gpa: number | null
          id: string
          issued_at: string | null
          meta: Json | null
          pdf_path: string | null
          student_id: string | null
          term: string | null
        }
        Insert: {
          gpa?: number | null
          id?: string
          issued_at?: string | null
          meta?: Json | null
          pdf_path?: string | null
          student_id?: string | null
          term?: string | null
        }
        Update: {
          gpa?: number | null
          id?: string
          issued_at?: string | null
          meta?: Json | null
          pdf_path?: string | null
          student_id?: string | null
          term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
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
          role: Database["public"]["Enums"]["app_role"]
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
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "parent" | "student" | "self_directed_learner" | "admin"
      artifact_t: "file" | "link" | "text"
      grader_t: "ai" | "human" | "both"
      item_t: "lesson" | "quiz" | "project" | "video" | "reading" | "assignment"
      prog_event_t:
        | "start"
        | "stop"
        | "focus"
        | "blur"
        | "heartbeat"
        | "click"
        | "question"
      role_t: "student" | "parent" | "admin"
      status_t: "draft" | "assigned" | "submitted" | "graded"
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
      app_role: ["parent", "student", "self_directed_learner", "admin"],
      artifact_t: ["file", "link", "text"],
      grader_t: ["ai", "human", "both"],
      item_t: ["lesson", "quiz", "project", "video", "reading", "assignment"],
      prog_event_t: [
        "start",
        "stop",
        "focus",
        "blur",
        "heartbeat",
        "click",
        "question",
      ],
      role_t: ["student", "parent", "admin"],
      status_t: ["draft", "assigned", "submitted", "graded"],
    },
  },
} as const
