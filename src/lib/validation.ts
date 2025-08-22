import { z } from 'zod'
import type { MaterialRow } from '../types/material'

// Схема валидации для единиц измерения
export const UnitSchema = z.enum(['шт.', 'комплект', 'м', 'кг', 'м2', 'м3', 'л'])

// Схема валидации для источников цен
export const PriceSourceSchema = z.enum(['База 1С', 'ETM.ru', 'Tinko.ru', 'Яндекс.Маркет', 'Прайс поставщика', 'Другое'])

// Схема валидации для строки материала
export const MaterialRowSchema = z.object({
  id: z.string().uuid(),
  index: z.number().int().positive(),
  name: z.string().min(1, 'Наименование обязательно'),
  typeBrand: z.string().optional().default(''),
  code: z.string().optional().default(''),
  manufacturer: z.string().optional().default(''),
  unit: UnitSchema.default('шт.'),
  qty: z.number().nonnegative('Количество не может быть отрицательным'),
  specRef: z.string().optional().default(''),
  price: z.number().nonnegative('Цена не может быть отрицательной'),
  priceSource: z.string().optional().default(''),
  productCode: z.string().optional().default(''),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

// Частичная схема для обновления
export const MaterialRowUpdateSchema = MaterialRowSchema.partial()

// Схема для импорта (менее строгая)
export const MaterialRowImportSchema = z.object({
  name: z.string().min(1),
  typeBrand: z.string().optional().default(''),
  code: z.string().optional().default(''),
  manufacturer: z.string().optional().default(''),
  unit: z.string().default('шт.'),
  qty: z.coerce.number().default(0),
  specRef: z.string().optional().default(''),
  price: z.coerce.number().default(0),
  priceSource: z.string().optional().default(''),
  productCode: z.string().optional().default(''),
  notes: z.string().optional()
})

export interface ValidationError {
  rowId: string
  field: string
  message: string
}

export function validateRows(rows: MaterialRow[]): ValidationError[] {
  const errors: ValidationError[] = []
  
  rows.forEach(row => {
    const result = MaterialRowSchema.safeParse(row)
    if (!result.success) {
      result.error.issues.forEach(issue => {
        errors.push({
          rowId: row.id,
          field: issue.path.join('.'),
          message: issue.message
        })
      })
    }
  })
  
  return errors
}

export function validateRow(row: MaterialRow): { success: boolean; errors?: ValidationError[] } {
  const result = MaterialRowSchema.safeParse(row)
  
  if (result.success) {
    return { success: true }
  }
  
  const errors: ValidationError[] = result.error.issues.map(issue => ({
    rowId: row.id,
    field: issue.path.join('.'),
    message: issue.message
  }))
  
  return { success: false, errors }
}

export function sanitizeImportData(data: any): Partial<MaterialRow> {
  const result = MaterialRowImportSchema.safeParse(data)
  
  if (result.success) {
    return result.data
  }
  
  // Return partial data even if validation fails
  return {
    name: data.name || '',
    typeBrand: data.typeBrand || '',
    code: String(data.code || ''),
    manufacturer: data.manufacturer || '',
    unit: data.unit || 'шт.',
    qty: Number(data.qty) || 0,
    specRef: data.specRef || '',
    price: Number(data.price) || 0,
    priceSource: data.priceSource || '',
    productCode: String(data.productCode || ''),
    notes: data.notes || ''
  }
}