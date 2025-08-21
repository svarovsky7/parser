import * as XLSX from 'xlsx'
import { v4 as uuid } from 'uuid'
import type { MaterialRow } from '../types/material'
import { sanitizeImportData } from './validation'

// Маппинг русских заголовков к полям модели
const COLUMN_MAPPING: Record<string, keyof MaterialRow> = {
  '№': 'index',
  'Позиция': 'index',
  'Наименования': 'name',
  'Наименование': 'name',
  'Тип, марка': 'typeBrand',
  'Тип/марка': 'typeBrand',
  'Код оборудования': 'code',
  'Код': 'code',
  'Артикул': 'code',
  'Завод изготовитель': 'manufacturer',
  'Производитель': 'manufacturer',
  'Завод': 'manufacturer',
  'Единица измерения': 'unit',
  'Ед. изм.': 'unit',
  'Ед.': 'unit',
  'Количество': 'qty',
  'Кол-во': 'qty',
  'Спецификация': 'specRef',
  'Узел': 'specRef',
  'Стоимость': 'price',
  'Цена': 'price',
  'Основание': 'priceSource',
  'Источник': 'priceSource',
  'Примечания': 'notes',
  'Примечание': 'notes'
}

export interface ImportResult {
  success: boolean
  data?: MaterialRow[]
  errors?: string[]
  mapping?: Record<string, string>
}

export async function parseExcel(file: File): Promise<ImportResult> {
  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    
    // Получаем первый лист
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Преобразуем в JSON с заголовками
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { 
      defval: '',
      raw: false // Не использовать сырые значения
    })
    
    if (jsonData.length === 0) {
      return {
        success: false,
        errors: ['Файл не содержит данных']
      }
    }
    
    // Определяем маппинг колонок
    const headers = Object.keys(jsonData[0])
    const mapping: Record<string, string> = {}
    
    headers.forEach(header => {
      const normalized = header.trim()
      const field = COLUMN_MAPPING[normalized]
      if (field) {
        mapping[header] = field
      }
    })
    
    // Преобразуем данные
    const rows: MaterialRow[] = jsonData.map((row, index) => {
      const mappedData: any = {}
      
      // Применяем маппинг
      Object.entries(row).forEach(([key, value]) => {
        const field = mapping[key] || COLUMN_MAPPING[key.trim()]
        if (field) {
          mappedData[field] = value
        }
      })
      
      // Санитизируем и дополняем данные
      const sanitized = sanitizeImportData(mappedData)
      
      return {
        id: uuid(),
        index: mappedData.index || index + 1,
        name: sanitized.name || '',
        typeBrand: sanitized.typeBrand || '',
        code: sanitized.code || '',
        manufacturer: sanitized.manufacturer || '',
        unit: sanitized.unit || 'шт.',
        qty: sanitized.qty || 0,
        specRef: sanitized.specRef || '',
        price: parsePrice(mappedData.price) || 0,
        priceSource: sanitized.priceSource || '',
        notes: sanitized.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }).filter(row => row.name) // Фильтруем пустые строки
    
    return {
      success: true,
      data: rows,
      mapping
    }
  } catch (error) {
    return {
      success: false,
      errors: [`Ошибка при чтении файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`]
    }
  }
}

// Парсинг цены (убираем пробелы, валюту и т.д.)
function parsePrice(value: any): number {
  if (typeof value === 'number') return value
  if (!value) return 0
  
  const str = String(value)
    .replace(/[^\d.,\-]/g, '') // Оставляем только цифры, точки, запятые и минус
    .replace(',', '.') // Заменяем запятую на точку
  
  const num = parseFloat(str)
  return isNaN(num) ? 0 : Math.abs(num)
}

// Экспорт в Excel
export function exportToExcel(rows: MaterialRow[], filename = 'materials.xlsx') {
  const exportData = rows.map(row => ({
    '№': row.index,
    'Наименование': row.name,
    'Тип, марка': row.typeBrand,
    'Код': row.code,
    'Производитель': row.manufacturer,
    'Ед. изм.': row.unit,
    'Кол-во': row.qty,
    'Спецификация': row.specRef,
    'Цена': row.price,
    'Основание': row.priceSource,
    'Примечания': row.notes || ''
  }))
  
  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Материалы')
  
  // Настройка ширины колонок
  const colWidths = [
    { wch: 5 },  // №
    { wch: 40 }, // Наименование
    { wch: 15 }, // Тип, марка
    { wch: 15 }, // Код
    { wch: 20 }, // Производитель
    { wch: 10 }, // Ед. изм.
    { wch: 10 }, // Кол-во
    { wch: 15 }, // Спецификация
    { wch: 12 }, // Цена
    { wch: 15 }, // Основание
    { wch: 30 }  // Примечания
  ]
  worksheet['!cols'] = colWidths
  
  XLSX.writeFile(workbook, filename)
}

// Получение демо-данных
export function getDemoData(): MaterialRow[] {
  return [
    {
      id: uuid(),
      index: 1,
      name: 'Светодиодная система уличного освещения ТВЕРЬ ГАЛА',
      typeBrand: 'TVGAL 60/1',
      code: '',
      manufacturer: 'CAPOC',
      unit: 'шт.',
      qty: 13,
      specRef: 'LED-003',
      price: 3500,
      priceSource: 'Tinko.ru',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuid(),
      index: 2,
      name: 'Уличный прожектор ЭЛЬФ',
      typeBrand: 'ELF IG S20',
      code: '',
      manufacturer: 'CAPOC',
      unit: 'шт.',
      qty: 42,
      specRef: 'LIGHT-002',
      price: 1800,
      priceSource: 'База 1С',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuid(),
      index: 3,
      name: 'Опора круглая коническая ОКК БУЛЬВАР',
      typeBrand: 'BLV60',
      code: '',
      manufacturer: 'CAPOC',
      unit: 'шт.',
      qty: 14,
      specRef: 'POLE-001',
      price: 15000,
      priceSource: 'База 1С',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuid(),
      index: 4,
      name: 'Монтажный комплект',
      typeBrand: 'MPE',
      code: '',
      manufacturer: 'CAPOC',
      unit: 'комплект',
      qty: 68,
      specRef: 'MOUNT-001',
      price: 850,
      priceSource: 'ETM.ru',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuid(),
      index: 5,
      name: 'Дифференциальный автомат',
      typeBrand: 'АВДТ-63М',
      code: 'DA63M-10-30',
      manufacturer: 'EKF',
      unit: 'шт.',
      qty: 55,
      specRef: 'AUTO-001',
      price: 1200,
      priceSource: 'Tinko.ru',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
}