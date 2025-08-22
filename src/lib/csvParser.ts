import type { ProductImport } from '../types/product'

export interface ParseResult {
  success: boolean
  data: ProductImport[]
  errors: string[]
  total: number
}

export function parseCSV(csvContent: string): ParseResult {
  const errors: string[] = []
  const products: ProductImport[] = []
  
  try {
    // Split into lines and remove empty lines
    const lines = csvContent
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
    
    if (lines.length === 0) {
      return {
        success: false,
        data: [],
        errors: ['CSV файл пустой'],
        total: 0
      }
    }
    
    // Parse header
    const header = parseCSVLine(lines[0])
    
    // Validate required headers - только ID обязателен
    const requiredHeaders = ['id']
    const missingHeaders = requiredHeaders.filter(h => !header.includes(h))
    
    if (missingHeaders.length > 0) {
      errors.push(`Отсутствуют обязательные колонки: ${missingHeaders.join(', ')}`)
    }
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const rowNumber = i + 1
      
      try {
        const values = parseCSVLine(line)
        
        if (values.length !== header.length) {
          errors.push(`Строка ${rowNumber}: неверное количество колонок (ожидается ${header.length}, получено ${values.length})`)
          continue
        }
        
        // Create object from header and values
        const rowData: any = {}
        header.forEach((col, index) => {
          rowData[col] = values[index]
        })
        
        // Validate and convert data types
        const product = validateAndConvertProduct(rowData, rowNumber, errors)
        
        if (product) {
          products.push(product)
        }
      } catch (err) {
        errors.push(`Строка ${rowNumber}: ошибка парсинга - ${err instanceof Error ? err.message : 'неизвестная ошибка'}`)
      }
    }
    
    return {
      success: errors.length === 0,
      data: products,
      errors,
      total: lines.length - 1 // excluding header
    }
  } catch (err) {
    return {
      success: false,
      data: [],
      errors: [`Ошибка парсинга CSV: ${err instanceof Error ? err.message : 'неизвестная ошибка'}`],
      total: 0
    }
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current.trim())
  
  return result
}

function validateAndConvertProduct(rowData: any, rowNumber: number, errors: string[]): ProductImport | null {
  try {
    // Validate and convert ID - только ID обязателен
    const id = parseInt(rowData.id)
    if (isNaN(id) || id <= 0) {
      errors.push(`Строка ${rowNumber}: неверный ID "${rowData.id}" (должно быть положительное число)`)
      return null
    }
    
    // Поля с дефолтными значениями для обязательных полей в БД
    const name = rowData.name?.trim() || 'Не указано'
    const brand = rowData.brand?.trim() || 'Не указан'
    const brand_code = rowData.brand_code?.trim() || 'НК'
    const class_field = rowData.class?.trim() || 'Без категории'
    
    // class_code обязательное поле в БД - предоставляем дефолтное значение
    let class_code = 1  // Дефолтное значение вместо 0
    const classCodeStr = String(rowData.class_code || '').trim()
    
    if (classCodeStr) {
      // Попробуем преобразовать в число, если не получится - используем хэш-код строки
      const parsedCode = parseInt(classCodeStr)
      if (!isNaN(parsedCode)) {
        class_code = parsedCode
      } else {
        // Генерируем числовой код из строки (простой хэш)
        class_code = 1  // Начинаем с 1
        for (let i = 0; i < classCodeStr.length; i++) {
          class_code = ((class_code << 5) - class_code) + classCodeStr.charCodeAt(i)
          class_code = class_code & class_code // Преобразуем в 32-битное целое
        }
        // Делаем число положительным и не равным нулю
        class_code = Math.abs(class_code) || 1
        
        // Логируем для отладки только если действительно преобразовывали строку
        console.log(`Строка ${rowNumber}: преобразован class_code "${classCodeStr}" в число ${class_code}`)
      }
    }
    
    // Build product object - все поля, кроме ID, могут быть пустыми
    const product: ProductImport = {
      id,
      name,
      brand,
      brand_code,
      class: class_field,
      class_code
    }
    
    // Optional fields - добавляем только если не пустые
    if (rowData.article && rowData.article.trim() !== '') {
      product.article = rowData.article.trim()
    }
    
    if (rowData.cli_code && rowData.cli_code.trim() !== '') {
      product.cli_code = rowData.cli_code.trim()
    }
    
    return product
  } catch (err) {
    errors.push(`Строка ${rowNumber}: ошибка валидации - ${err instanceof Error ? err.message : 'неизвестная ошибка'}`)
    return null
  }
}