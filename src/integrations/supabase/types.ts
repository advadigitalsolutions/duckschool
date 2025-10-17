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
      activity_events: {
        Row: {
          assignment_id: string | null
          course_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          page_context: string | null
          session_id: string | null
          student_id: string
          timestamp: string
        }
        Insert: {
          assignment_id?: string | null
          course_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          page_context?: string | null
          session_id?: string | null
          student_id: string
          timestamp?: string
        }
        Update: {
          assignment_id?: string | null
          course_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          page_context?: string | null
          session_id?: string | null
          student_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_student_id_fkey"
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
      assignment_learning_progress: {
        Row: {
          ai_coaching_history: Json | null
          assignment_id: string
          current_step: string | null
          discussion_completed: boolean | null
          id: string
          notes_completed: boolean | null
          practice_completed: boolean | null
          research_completed: boolean | null
          started_at: string | null
          steps_completed: Json | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          ai_coaching_history?: Json | null
          assignment_id: string
          current_step?: string | null
          discussion_completed?: boolean | null
          id?: string
          notes_completed?: boolean | null
          practice_completed?: boolean | null
          research_completed?: boolean | null
          started_at?: string | null
          steps_completed?: Json | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          ai_coaching_history?: Json | null
          assignment_id?: string
          current_step?: string | null
          discussion_completed?: boolean | null
          id?: string
          notes_completed?: boolean | null
          practice_completed?: boolean | null
          research_completed?: boolean | null
          started_at?: string | null
          steps_completed?: Json | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_learning_progress_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_learning_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_notes: {
        Row: {
          assignment_id: string
          content: Json
          created_at: string
          id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          content?: Json
          created_at?: string
          id?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          content?: Json
          created_at?: string
          id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignment_research: {
        Row: {
          assignment_id: string
          created_at: string | null
          id: string
          notes: string | null
          resource_title: string | null
          resource_type: string | null
          resource_url: string
          student_id: string
          updated_at: string | null
          validated_at: string | null
          validation_status: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          resource_title?: string | null
          resource_type?: string | null
          resource_url: string
          student_id: string
          updated_at?: string | null
          validated_at?: string | null
          validation_status?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          resource_title?: string | null
          resource_type?: string | null
          resource_url?: string
          student_id?: string
          updated_at?: string | null
          validated_at?: string | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_research_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_research_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_study_guides: {
        Row: {
          assignment_id: string
          generated_at: string
          id: string
          study_guide: Json
          version: number
        }
        Insert: {
          assignment_id: string
          generated_at?: string
          id?: string
          study_guide: Json
          version?: number
        }
        Update: {
          assignment_id?: string
          generated_at?: string
          id?: string
          study_guide?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "assignment_study_guides_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_time_actuals: {
        Row: {
          accuracy_ratio: number | null
          actual_minutes: number
          assignment_id: string
          completed_at: string | null
          estimated_minutes: number
          id: string
          student_id: string
          subject: string | null
        }
        Insert: {
          accuracy_ratio?: number | null
          actual_minutes: number
          assignment_id: string
          completed_at?: string | null
          estimated_minutes: number
          id?: string
          student_id: string
          subject?: string | null
        }
        Update: {
          accuracy_ratio?: number | null
          actual_minutes?: number
          assignment_id?: string
          completed_at?: string | null
          estimated_minutes?: number
          id?: string
          student_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_time_actuals_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_time_actuals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assigned_date: string | null
          auto_scheduled_time: string | null
          created_at: string | null
          curriculum_item_id: string | null
          day_of_week: string | null
          due_at: string | null
          id: string
          locked_schedule: boolean | null
          max_attempts: number | null
          optimal_time_of_day: string[] | null
          prerequisite_assignments: string[] | null
          rubric: Json | null
          scheduling_flexibility: number | null
          sequence_order: number | null
          status: Database["public"]["Enums"]["status_t"]
          validation_metadata: Json | null
          week_id: string | null
          weight: number | null
        }
        Insert: {
          assigned_date?: string | null
          auto_scheduled_time?: string | null
          created_at?: string | null
          curriculum_item_id?: string | null
          day_of_week?: string | null
          due_at?: string | null
          id?: string
          locked_schedule?: boolean | null
          max_attempts?: number | null
          optimal_time_of_day?: string[] | null
          prerequisite_assignments?: string[] | null
          rubric?: Json | null
          scheduling_flexibility?: number | null
          sequence_order?: number | null
          status?: Database["public"]["Enums"]["status_t"]
          validation_metadata?: Json | null
          week_id?: string | null
          weight?: number | null
        }
        Update: {
          assigned_date?: string | null
          auto_scheduled_time?: string | null
          created_at?: string | null
          curriculum_item_id?: string | null
          day_of_week?: string | null
          due_at?: string | null
          id?: string
          locked_schedule?: boolean | null
          max_attempts?: number | null
          optimal_time_of_day?: string[] | null
          prerequisite_assignments?: string[] | null
          rubric?: Json | null
          scheduling_flexibility?: number | null
          sequence_order?: number | null
          status?: Database["public"]["Enums"]["status_t"]
          validation_metadata?: Json | null
          week_id?: string | null
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
          {
            foreignKeyName: "assignments_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "curriculum_weeks"
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
      course_mastery_summary: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          last_calculated_at: string | null
          overall_mastery_percentage: number | null
          standards_in_progress: number | null
          standards_mastered: number | null
          standards_not_started: number | null
          student_id: string
          total_standards: number | null
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          last_calculated_at?: string | null
          overall_mastery_percentage?: number | null
          standards_in_progress?: number | null
          standards_mastered?: number | null
          standards_not_started?: number | null
          student_id: string
          total_standards?: number | null
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          last_calculated_at?: string | null
          overall_mastery_percentage?: number | null
          standards_in_progress?: number | null
          standards_mastered?: number | null
          standards_not_started?: number | null
          student_id?: string
          total_standards?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_mastery_summary_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_mastery_summary_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reference_notes: {
        Row: {
          content: Json
          course_id: string
          created_at: string
          id: string
          source_assignment_id: string | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          course_id: string
          created_at?: string
          id?: string
          source_assignment_id?: string | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          course_id?: string
          created_at?: string
          id?: string
          source_assignment_id?: string | null
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          archived: boolean | null
          auto_generate_weekly: boolean | null
          course_type: string | null
          created_at: string | null
          credits: number | null
          description: string | null
          goals: string | null
          grade_level: string | null
          id: string
          initiated_at: string | null
          initiated_by: string | null
          initiated_by_role: Database["public"]["Enums"]["app_role"] | null
          next_generation_date: string | null
          pacing_config: Json | null
          skeleton: Json | null
          standards_scope: Json | null
          student_id: string | null
          subject: string
          template_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          auto_generate_weekly?: boolean | null
          course_type?: string | null
          created_at?: string | null
          credits?: number | null
          description?: string | null
          goals?: string | null
          grade_level?: string | null
          id?: string
          initiated_at?: string | null
          initiated_by?: string | null
          initiated_by_role?: Database["public"]["Enums"]["app_role"] | null
          next_generation_date?: string | null
          pacing_config?: Json | null
          skeleton?: Json | null
          standards_scope?: Json | null
          student_id?: string | null
          subject: string
          template_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          auto_generate_weekly?: boolean | null
          course_type?: string | null
          created_at?: string | null
          credits?: number | null
          description?: string | null
          goals?: string | null
          grade_level?: string | null
          id?: string
          initiated_at?: string | null
          initiated_by?: string | null
          initiated_by_role?: Database["public"]["Enums"]["app_role"] | null
          next_generation_date?: string | null
          pacing_config?: Json | null
          skeleton?: Json | null
          standards_scope?: Json | null
          student_id?: string | null
          subject?: string
          template_id?: string | null
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
          {
            foreignKeyName: "courses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "curriculum_templates"
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
          unit_id: string | null
          validation_metadata: Json | null
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
          unit_id?: string | null
          validation_metadata?: Json | null
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
          unit_id?: string | null
          validation_metadata?: Json | null
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
      curriculum_planning_sessions: {
        Row: {
          collected_data: Json | null
          conversation_history: Json | null
          created_at: string | null
          id: string
          parent_id: string
          status: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          collected_data?: Json | null
          conversation_history?: Json | null
          created_at?: string | null
          id?: string
          parent_id: string
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          collected_data?: Json | null
          conversation_history?: Json | null
          created_at?: string | null
          id?: string
          parent_id?: string
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_planning_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          framework: string | null
          grade_level: string | null
          id: string
          is_public: boolean | null
          name: string
          region: string | null
          structure: Json | null
          subjects: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          framework?: string | null
          grade_level?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          region?: string | null
          structure?: Json | null
          subjects?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          framework?: string | null
          grade_level?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          region?: string | null
          structure?: Json | null
          subjects?: Json | null
        }
        Relationships: []
      }
      curriculum_validation_log: {
        Row: {
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          validation_result: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          validation_result: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          validation_result?: Json
        }
        Relationships: []
      }
      curriculum_weeks: {
        Row: {
          course_id: string
          created_at: string | null
          end_date: string
          focus_areas: Json | null
          id: string
          last_validated_at: string | null
          start_date: string
          status: string | null
          student_id: string
          theme: string | null
          validation_summary: Json | null
          week_number: number
        }
        Insert: {
          course_id: string
          created_at?: string | null
          end_date: string
          focus_areas?: Json | null
          id?: string
          last_validated_at?: string | null
          start_date: string
          status?: string | null
          student_id: string
          theme?: string | null
          validation_summary?: Json | null
          week_number: number
        }
        Update: {
          course_id?: string
          created_at?: string | null
          end_date?: string
          focus_areas?: Json | null
          id?: string
          last_validated_at?: string | null
          start_date?: string
          status?: string | null
          student_id?: string
          theme?: string | null
          validation_summary?: Json | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_weeks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_weeks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_frameworks: {
        Row: {
          approved_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          grade_levels: string[]
          id: string
          is_approved: boolean | null
          legal_requirements: Json | null
          metadata: Json | null
          name: string
          region: string
          standards: Json
          subjects: string[]
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          grade_levels: string[]
          id?: string
          is_approved?: boolean | null
          legal_requirements?: Json | null
          metadata?: Json | null
          name: string
          region: string
          standards?: Json
          subjects: string[]
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          grade_levels?: string[]
          id?: string
          is_approved?: boolean | null
          legal_requirements?: Json | null
          metadata?: Json | null
          name?: string
          region?: string
          standards?: Json
          subjects?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_goals: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          goal_text: string
          id: string
          student_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date?: string
          goal_text: string
          id?: string
          student_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          goal_text?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
        }
        Relationships: []
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
      learning_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          ended_by: string | null
          id: string
          is_block_complete: boolean | null
          pomodoro_block_start: string | null
          session_end: string | null
          session_start: string
          student_id: string
          total_active_seconds: number
          total_away_seconds: number
          total_idle_seconds: number
          updated_at: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          ended_by?: string | null
          id?: string
          is_block_complete?: boolean | null
          pomodoro_block_start?: string | null
          session_end?: string | null
          session_start?: string
          student_id: string
          total_active_seconds?: number
          total_away_seconds?: number
          total_idle_seconds?: number
          updated_at?: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          ended_by?: string | null
          id?: string
          is_block_complete?: boolean | null
          pomodoro_block_start?: string | null
          session_end?: string | null
          session_start?: string
          student_id?: string
          total_active_seconds?: number
          total_away_seconds?: number
          total_idle_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_todo_items: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          parent_id: string
          priority: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_id: string
          priority?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_id?: string
          priority?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          id: string
          is_break: boolean
          is_running: boolean
          sessions_completed: number
          settings: Json
          student_id: string
          time_left: number
          updated_at: string
        }
        Insert: {
          id?: string
          is_break?: boolean
          is_running?: boolean
          sessions_completed?: number
          settings?: Json
          student_id: string
          time_left?: number
          updated_at?: string
        }
        Update: {
          id?: string
          is_break?: boolean
          is_running?: boolean
          sessions_completed?: number
          settings?: Json
          student_id?: string
          time_left?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bionic_reading_enabled: boolean | null
          color_overlay: string | null
          created_at: string | null
          dyslexia_font_enabled: boolean | null
          email: string | null
          focus_mode_enabled: boolean | null
          focus_mode_glow_color: string | null
          focus_mode_glow_intensity: number | null
          focus_mode_overlay_opacity: number | null
          header_settings: Json | null
          high_contrast_enabled: boolean | null
          hotkey_settings: Json | null
          id: string
          letter_spacing: string | null
          line_spacing: string | null
          locale: string | null
          name: string | null
          pronouns: string | null
          reading_ruler_enabled: boolean | null
          text_to_speech_enabled: boolean | null
          text_to_speech_voice: string | null
          timezone: string | null
        }
        Insert: {
          avatar_url?: string | null
          bionic_reading_enabled?: boolean | null
          color_overlay?: string | null
          created_at?: string | null
          dyslexia_font_enabled?: boolean | null
          email?: string | null
          focus_mode_enabled?: boolean | null
          focus_mode_glow_color?: string | null
          focus_mode_glow_intensity?: number | null
          focus_mode_overlay_opacity?: number | null
          header_settings?: Json | null
          high_contrast_enabled?: boolean | null
          hotkey_settings?: Json | null
          id: string
          letter_spacing?: string | null
          line_spacing?: string | null
          locale?: string | null
          name?: string | null
          pronouns?: string | null
          reading_ruler_enabled?: boolean | null
          text_to_speech_enabled?: boolean | null
          text_to_speech_voice?: string | null
          timezone?: string | null
        }
        Update: {
          avatar_url?: string | null
          bionic_reading_enabled?: boolean | null
          color_overlay?: string | null
          created_at?: string | null
          dyslexia_font_enabled?: boolean | null
          email?: string | null
          focus_mode_enabled?: boolean | null
          focus_mode_glow_color?: string | null
          focus_mode_glow_intensity?: number | null
          focus_mode_overlay_opacity?: number | null
          header_settings?: Json | null
          high_contrast_enabled?: boolean | null
          hotkey_settings?: Json | null
          id?: string
          letter_spacing?: string | null
          line_spacing?: string | null
          locale?: string | null
          name?: string | null
          pronouns?: string | null
          reading_ruler_enabled?: boolean | null
          text_to_speech_enabled?: boolean | null
          text_to_speech_voice?: string | null
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
      progress_gaps: {
        Row: {
          addressed_at: string | null
          confidence_score: number | null
          course_id: string
          gap_type: string
          id: string
          identified_at: string | null
          metadata: Json | null
          standard_code: string
          student_id: string
        }
        Insert: {
          addressed_at?: string | null
          confidence_score?: number | null
          course_id: string
          gap_type: string
          id?: string
          identified_at?: string | null
          metadata?: Json | null
          standard_code: string
          student_id: string
        }
        Update: {
          addressed_at?: string | null
          confidence_score?: number | null
          course_id?: string
          gap_type?: string
          id?: string
          identified_at?: string | null
          metadata?: Json | null
          standard_code?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_gaps_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_gaps_student_id_fkey"
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
      reward_redemptions: {
        Row: {
          id: string
          notes: string | null
          requested_at: string | null
          resolved_at: string | null
          resolved_by: string | null
          reward_id: string
          status: string | null
          student_id: string
          xp_cost: number
        }
        Insert: {
          id?: string
          notes?: string | null
          requested_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          reward_id: string
          status?: string | null
          student_id: string
          xp_cost: number
        }
        Update: {
          id?: string
          notes?: string | null
          requested_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          reward_id?: string
          status?: string | null
          student_id?: string
          xp_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          metadata: Json | null
          parent_id: string
          requires_approval: boolean | null
          title: string
          xp_cost: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          metadata?: Json | null
          parent_id: string
          requires_approval?: boolean | null
          title: string
          xp_cost: number
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          metadata?: Json | null
          parent_id?: string
          requires_approval?: boolean | null
          title?: string
          xp_cost?: number
        }
        Relationships: []
      }
      scheduling_blocks: {
        Row: {
          active: boolean | null
          block_type: string
          created_at: string | null
          created_by: string | null
          day_of_week: number | null
          end_time: string
          id: string
          reason: string | null
          specific_date: string | null
          start_time: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          block_type: string
          created_at?: string | null
          created_by?: string | null
          day_of_week?: number | null
          end_time: string
          id?: string
          reason?: string | null
          specific_date?: string | null
          start_time: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          block_type?: string
          created_at?: string | null
          created_by?: string | null
          day_of_week?: number | null
          end_time?: string
          id?: string
          reason?: string | null
          specific_date?: string | null
          start_time?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduling_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduling_blocks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_mastery: {
        Row: {
          confidence_score: number | null
          course_id: string
          created_at: string | null
          id: string
          last_assessed_at: string | null
          mastery_level: number
          standard_code: string
          student_id: string
          successful_attempts: number | null
          total_attempts: number | null
          updated_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          course_id: string
          created_at?: string | null
          id?: string
          last_assessed_at?: string | null
          mastery_level?: number
          standard_code: string
          student_id: string
          successful_attempts?: number | null
          total_attempts?: number | null
          updated_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          course_id?: string
          created_at?: string | null
          id?: string
          last_assessed_at?: string | null
          mastery_level?: number
          standard_code?: string
          student_id?: string
          successful_attempts?: number | null
          total_attempts?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "standard_mastery_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standard_mastery_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
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
          metadata: Json | null
          parent_code: string | null
          region: string | null
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
          metadata?: Json | null
          parent_code?: string | null
          region?: string | null
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
          metadata?: Json | null
          parent_code?: string | null
          region?: string | null
          subject?: string | null
          tags?: string[] | null
          text?: string
        }
        Relationships: []
      }
      standards_library: {
        Row: {
          created_at: string | null
          framework: string
          grade_level: string
          id: string
          legal_requirements: Json | null
          scraped_at: string | null
          source_urls: Json | null
          standards: Json
          state: string
          subject: string
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          framework?: string
          grade_level: string
          id?: string
          legal_requirements?: Json | null
          scraped_at?: string | null
          source_urls?: Json | null
          standards?: Json
          state: string
          subject: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          framework?: string
          grade_level?: string
          id?: string
          legal_requirements?: Json | null
          scraped_at?: string | null
          source_urls?: Json | null
          standards?: Json
          state?: string
          subject?: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      standards_planning_sessions: {
        Row: {
          compiled_standards: Json | null
          conversation_history: Json | null
          created_at: string | null
          id: string
          legal_requirements: Json | null
          parent_id: string
          parent_notes: string | null
          requirements: Json | null
          research_results: Json | null
          status: string
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          compiled_standards?: Json | null
          conversation_history?: Json | null
          created_at?: string | null
          id?: string
          legal_requirements?: Json | null
          parent_id: string
          parent_notes?: string | null
          requirements?: Json | null
          research_results?: Json | null
          status?: string
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          compiled_standards?: Json | null
          conversation_history?: Json | null
          created_at?: string | null
          id?: string
          legal_requirements?: Json | null
          parent_id?: string
          parent_notes?: string | null
          requirements?: Json | null
          research_results?: Json | null
          status?: string
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "standards_planning_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      standards_priority_queue: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          last_addressed_at: string | null
          priority_score: number | null
          reason: string | null
          standard_code: string
          student_id: string
          times_neglected: number | null
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          last_addressed_at?: string | null
          priority_score?: number | null
          reason?: string | null
          standard_code: string
          student_id: string
          times_neglected?: number | null
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          last_addressed_at?: string | null
          priority_score?: number | null
          reason?: string | null
          standard_code?: string
          student_id?: string
          times_neglected?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "standards_priority_queue_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standards_priority_queue_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_focus_patterns: {
        Row: {
          analysis_date: string
          confidence_level: number | null
          data_quality_score: number | null
          day_patterns: Json | null
          hourly_focus_scores: Json | null
          id: string
          last_calculated_at: string | null
          peak_focus_windows: Json | null
          sessions_analyzed: number | null
          student_id: string
          subject_performance: Json | null
        }
        Insert: {
          analysis_date?: string
          confidence_level?: number | null
          data_quality_score?: number | null
          day_patterns?: Json | null
          hourly_focus_scores?: Json | null
          id?: string
          last_calculated_at?: string | null
          peak_focus_windows?: Json | null
          sessions_analyzed?: number | null
          student_id: string
          subject_performance?: Json | null
        }
        Update: {
          analysis_date?: string
          confidence_level?: number | null
          data_quality_score?: number | null
          day_patterns?: Json | null
          hourly_focus_scores?: Json | null
          id?: string
          last_calculated_at?: string | null
          peak_focus_windows?: Json | null
          sessions_analyzed?: number | null
          student_id?: string
          subject_performance?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "student_focus_patterns_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          accommodations: Json | null
          administrator_assessment: Json | null
          avatar_url: string | null
          bionic_reading_enabled: boolean | null
          color_overlay: string | null
          created_at: string | null
          discussion_tips_shown: number | null
          display_name: string | null
          dob: string | null
          dyslexia_font_enabled: boolean | null
          focus_duck_cosmetics: Json | null
          focus_mode_enabled: boolean | null
          focus_mode_glow_color: string | null
          focus_mode_glow_intensity: number | null
          focus_mode_overlay_opacity: number | null
          goals: Json | null
          grade_level: string | null
          header_settings: Json | null
          high_contrast_enabled: boolean | null
          hotkey_settings: Json | null
          id: string
          learning_profile: Json | null
          letter_spacing: string | null
          line_spacing: string | null
          name: string
          parent_id: string | null
          personality_type: string | null
          profile_assessment_completed: boolean | null
          pronouns: string | null
          reading_ruler_enabled: boolean | null
          special_interests: Json | null
          text_to_speech_enabled: boolean | null
          text_to_speech_voice: string | null
          user_id: string | null
        }
        Insert: {
          accommodations?: Json | null
          administrator_assessment?: Json | null
          avatar_url?: string | null
          bionic_reading_enabled?: boolean | null
          color_overlay?: string | null
          created_at?: string | null
          discussion_tips_shown?: number | null
          display_name?: string | null
          dob?: string | null
          dyslexia_font_enabled?: boolean | null
          focus_duck_cosmetics?: Json | null
          focus_mode_enabled?: boolean | null
          focus_mode_glow_color?: string | null
          focus_mode_glow_intensity?: number | null
          focus_mode_overlay_opacity?: number | null
          goals?: Json | null
          grade_level?: string | null
          header_settings?: Json | null
          high_contrast_enabled?: boolean | null
          hotkey_settings?: Json | null
          id?: string
          learning_profile?: Json | null
          letter_spacing?: string | null
          line_spacing?: string | null
          name: string
          parent_id?: string | null
          personality_type?: string | null
          profile_assessment_completed?: boolean | null
          pronouns?: string | null
          reading_ruler_enabled?: boolean | null
          special_interests?: Json | null
          text_to_speech_enabled?: boolean | null
          text_to_speech_voice?: string | null
          user_id?: string | null
        }
        Update: {
          accommodations?: Json | null
          administrator_assessment?: Json | null
          avatar_url?: string | null
          bionic_reading_enabled?: boolean | null
          color_overlay?: string | null
          created_at?: string | null
          discussion_tips_shown?: number | null
          display_name?: string | null
          dob?: string | null
          dyslexia_font_enabled?: boolean | null
          focus_duck_cosmetics?: Json | null
          focus_mode_enabled?: boolean | null
          focus_mode_glow_color?: string | null
          focus_mode_glow_intensity?: number | null
          focus_mode_overlay_opacity?: number | null
          goals?: Json | null
          grade_level?: string | null
          header_settings?: Json | null
          high_contrast_enabled?: boolean | null
          hotkey_settings?: Json | null
          id?: string
          learning_profile?: Json | null
          letter_spacing?: string | null
          line_spacing?: string | null
          name?: string
          parent_id?: string | null
          personality_type?: string | null
          profile_assessment_completed?: boolean | null
          pronouns?: string | null
          reading_ruler_enabled?: boolean | null
          special_interests?: Json | null
          text_to_speech_enabled?: boolean | null
          text_to_speech_voice?: string | null
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
      study_guide_interactions: {
        Row: {
          assignment_id: string
          hint_level: number
          id: string
          question_id: string
          student_id: string
          viewed_at: string
        }
        Insert: {
          assignment_id: string
          hint_level: number
          id?: string
          question_id: string
          student_id: string
          viewed_at?: string
        }
        Update: {
          assignment_id?: string
          hint_level?: number
          id?: string
          question_id?: string
          student_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_guide_interactions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_guide_interactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
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
      teacher_notes: {
        Row: {
          assignment_id: string
          created_at: string | null
          educator_id: string
          id: string
          offline_activities: string | null
          offline_grade: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          educator_id: string
          id?: string
          offline_activities?: string | null
          offline_grade?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          educator_id?: string
          id?: string
          offline_activities?: string | null
          offline_grade?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_notes_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
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
      xp_config: {
        Row: {
          assignment_completion_xp: number | null
          attendance_per_minute_xp: number | null
          created_at: string | null
          custom_rules: Json | null
          daily_goal_completion_xp: number | null
          id: string
          parent_id: string
          question_correct_xp: number | null
          updated_at: string | null
        }
        Insert: {
          assignment_completion_xp?: number | null
          attendance_per_minute_xp?: number | null
          created_at?: string | null
          custom_rules?: Json | null
          daily_goal_completion_xp?: number | null
          id?: string
          parent_id: string
          question_correct_xp?: number | null
          updated_at?: string | null
        }
        Update: {
          assignment_completion_xp?: number | null
          attendance_per_minute_xp?: number | null
          created_at?: string | null
          custom_rules?: Json | null
          daily_goal_completion_xp?: number | null
          id?: string
          parent_id?: string
          question_correct_xp?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          reference_id: string | null
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          reference_id?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          reference_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
      can_manage_assignment_for_curriculum_item: {
        Args: { _curriculum_item_id: string; _user_id: string }
        Returns: boolean
      }
      get_student_available_xp: {
        Args: { student_uuid: string }
        Returns: number
      }
      get_student_total_xp: {
        Args: { student_uuid: string }
        Returns: number
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
        Returns: unknown
      }
      recalculate_all_mastery: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      update_course_mastery_for_student: {
        Args: { p_course_id: string; p_student_id: string }
        Returns: undefined
      }
      update_standard_mastery_for_grade: {
        Args: { p_grade: Database["public"]["Tables"]["grades"]["Row"] }
        Returns: undefined
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
      app_role:
        | "parent"
        | "student"
        | "self_directed_learner"
        | "admin"
        | "self_directed"
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
      app_role: [
        "parent",
        "student",
        "self_directed_learner",
        "admin",
        "self_directed",
      ],
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
