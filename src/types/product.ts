export interface Product {
  id: number
  name: string
  brand: string
  article?: string | null
  brand_code: string
  cli_code?: string | null
  class: string
  class_code: number
  created_at?: string
  updated_at?: string
}

export interface ProductImport {
  id: number
  name: string
  brand: string
  article?: string
  brand_code: string
  cli_code?: string
  class: string
  class_code: number
}

export interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
}