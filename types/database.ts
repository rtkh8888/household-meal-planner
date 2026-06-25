export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          default_people_per_meal: number;
          default_leftover_enabled: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          default_people_per_meal?: number;
          default_leftover_enabled?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          default_people_per_meal?: number;
          default_leftover_enabled?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          household_id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          household_id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      dishes: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          category: string | null;
          instructions: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          category?: string | null;
          instructions?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          category?: string | null;
          instructions?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      dish_ingredients: {
        Row: {
          id: string;
          dish_id: string;
          name: string;
          ingredient_type: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dish_id: string;
          name: string;
          ingredient_type?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dish_id?: string;
          name?: string;
          ingredient_type?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      meal_combos: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      meal_combo_dishes: {
        Row: {
          id: string;
          meal_combo_id: string;
          dish_id: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_combo_id: string;
          dish_id: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          meal_combo_id?: string;
          dish_id?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      plan_weeks: {
        Row: {
          id: string;
          household_id: string;
          week_start_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          week_start_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          week_start_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      cook_batches: {
        Row: {
          id: string;
          household_id: string;
          meal_combo_id: string | null;
          cooked_date: string;
          cooked_meal_type: string;
          portions_cooked: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          meal_combo_id?: string | null;
          cooked_date: string;
          cooked_meal_type: string;
          portions_cooked: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          meal_combo_id?: string | null;
          cooked_date?: string;
          cooked_meal_type?: string;
          portions_cooked?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      meal_slots: {
        Row: {
          id: string;
          household_id: string;
          plan_week_id: string;
          date: string;
          meal_type: string;
          entry_type: string;
          meal_combo_id: string | null;
          cook_batch_id: string | null;
          portions_eaten: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          plan_week_id: string;
          date: string;
          meal_type: string;
          entry_type: string;
          meal_combo_id?: string | null;
          cook_batch_id?: string | null;
          portions_eaten?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          plan_week_id?: string;
          date?: string;
          meal_type?: string;
          entry_type?: string;
          meal_combo_id?: string | null;
          cook_batch_id?: string | null;
          portions_eaten?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      grocery_lists: {
        Row: {
          id: string;
          household_id: string;
          plan_week_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          plan_week_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          plan_week_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      grocery_items: {
        Row: {
          id: string;
          grocery_list_id: string;
          name: string;
          source_type: string;
          is_checked: boolean;
          is_manual: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          grocery_list_id: string;
          name: string;
          source_type?: string;
          is_checked?: boolean;
          is_manual?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          grocery_list_id?: string;
          name?: string;
          source_type?: string;
          is_checked?: boolean;
          is_manual?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

