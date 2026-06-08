export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          grade: string | null;
          major: string | null;
          learning_goals: string | null;
          schedule_preferences: Json | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          grade?: string | null;
          major?: string | null;
          learning_goals?: string | null;
          schedule_preferences?: Json | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          grade?: string | null;
          major?: string | null;
          learning_goals?: string | null;
          schedule_preferences?: Json | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          code: string | null;
          instructor: string | null;
          location: string | null;
          day_of_week: number;
          start_time: string;
          end_time: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          code?: string | null;
          instructor?: string | null;
          location?: string | null;
          day_of_week: number;
          start_time: string;
          end_time: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          code?: string | null;
          instructor?: string | null;
          location?: string | null;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      assignments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string | null;
          title: string;
          description: string | null;
          due_date: string;
          priority: "low" | "medium" | "high";
          status: "pending" | "in_progress" | "completed" | "overdue";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          title: string;
          description?: string | null;
          due_date: string;
          priority?: "low" | "medium" | "high";
          status?: "pending" | "in_progress" | "completed" | "overdue";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string | null;
          title?: string;
          description?: string | null;
          due_date?: string;
          priority?: "low" | "medium" | "high";
          status?: "pending" | "in_progress" | "completed" | "overdue";
          created_at?: string;
          updated_at?: string;
        };
      };
      todos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          completed: boolean;
          source_type: "manual" | "assignment" | "course";
          source_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          completed?: boolean;
          source_type?: "manual" | "assignment" | "course";
          source_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          completed?: boolean;
          source_type?: "manual" | "assignment" | "course";
          source_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      grades: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          assignment_name: string | null;
          score: number;
          max_score: number;
          weight: number;
          type: "midterm" | "final" | "assignment" | "quiz" | "other";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          assignment_name?: string | null;
          score: number;
          max_score: number;
          weight?: number;
          type?: "midterm" | "final" | "assignment" | "quiz" | "other";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          assignment_name?: string | null;
          score?: number;
          max_score?: number;
          weight?: number;
          type?: "midterm" | "final" | "assignment" | "quiz" | "other";
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type Assignment = Database["public"]["Tables"]["assignments"]["Row"];
export type Todo = Database["public"]["Tables"]["todos"]["Row"];
export type Grade = Database["public"]["Tables"]["grades"]["Row"];
