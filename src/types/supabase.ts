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
      // Пример таблицы users
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Таблица для хранения данных из Excel (старая структура)
      excel_data: {
        Row: {
          id: string
          file_name: string
          sheet_name: string | null
          row_number: number | null
          data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          file_name: string
          sheet_name?: string | null
          row_number?: number | null
          data: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          file_name?: string
          sheet_name?: string | null
          row_number?: number | null
          data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      // Таблица для хранения данных об оборудовании
      equipment_data: {
        Row: {
          id: string
          file_name: string
          position: number | null
          name_and_specs: string | null
          type_mark_docs: string | null
          equipment_code: string | null
          manufacturer: string | null
          unit_measure: string | null
          quantity: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          file_name: string
          position?: number | null
          name_and_specs?: string | null
          type_mark_docs?: string | null
          equipment_code?: string | null
          manufacturer?: string | null
          unit_measure?: string | null
          quantity?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          file_name?: string
          position?: number | null
          name_and_specs?: string | null
          type_mark_docs?: string | null
          equipment_code?: string | null
          manufacturer?: string | null
          unit_measure?: string | null
          quantity?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}