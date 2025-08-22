import React, { useState, useRef, useEffect } from 'react'
import { Upload, Save, Trash2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useMaterialsData } from '../hooks/useMaterialsData'
import { supabase } from '../lib/supabase'

interface MaterialData {
  id: number
  position: string
  name: string
  typeMarkDocuments: string
  equipmentCode: string
  manufacturer: string
  unit: string
  quantity: string
  materialPicker: string
  priceUnit?: string
  price?: string
  source?: string
  productCode?: string
}

interface ColumnDef {
  headerName: string
  field: string
  width: number
  maxLength?: number
}

// Демо-данные для отображения (удалено, так как не используется)

const MaterialsTable: React.FC = () => {
  const [data, setData] = useState<MaterialData[]>([])
  const [loading, setLoading] = useState(false)
  const [editingCell, setEditingCell] = useState<{ rowId: number; column: string } | null>(null)
  const [showMaterialSuggestions, setShowMaterialSuggestions] = useState(false)
  const [materialSuggestions, setMaterialSuggestions] = useState<any>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({})
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const resizeStartX = useRef<number>(0)
  const resizeStartWidth = useRef<number>(0)

  const { materialsDatabase } = useMaterialsData()

  // Определение колонок в стиле AG-Grid
  const columnDefs: ColumnDef[] = [
    { headerName: "№", field: "position", width: 40, maxLength: 4 },
    { headerName: "Наименования", field: "name", width: 240, maxLength: 30 },
    { headerName: "Тип, марка", field: "typeMarkDocuments", width: 96, maxLength: 12 },
    { headerName: "Код обор.", field: "equipmentCode", width: 80, maxLength: 10 },
    { headerName: "Завод изг.", field: "manufacturer", width: 80, maxLength: 10 },
    { headerName: "Ед. изм.", field: "unit", width: 48, maxLength: 6 },
    { headerName: "Кол-во", field: "quantity", width: 48, maxLength: 6 },
    { headerName: "Подбор материала", field: "materialPicker", width: 200, maxLength: 50 },
    { headerName: "Ед. изм.", field: "priceUnit", width: 60, maxLength: 10 },
    { headerName: "Стоимость", field: "price", width: 80, maxLength: 10 },
    { headerName: "Основание", field: "source", width: 100, maxLength: 15 },
    { headerName: "Код товара", field: "productCode", width: 100, maxLength: 15 }
  ]

  // Функция для получения текущей ширины колонки
  const getColumnWidth = (field: string) => {
    if (columnWidths[field]) {
      return columnWidths[field]
    }
    const column = columnDefs.find(col => col.field === field)
    return column ? column.width : 100
  }


  // Загрузка и парсинг Excel файла
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const fileBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(fileBuffer)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      const processedData = (jsonData as any[]).slice(1).map((row, index) => ({
        id: index + 1,
        position: row[0] || '',
        name: row[1] || '',
        typeMarkDocuments: row[2] || '',
        equipmentCode: row[3] || '',
        manufacturer: row[4] || '',
        unit: row[5] || '',
        quantity: row[6] || '',
        materialPicker: row[7] || ''
      })).filter(row => row.position || row.name)

      setData(processedData)
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error)
      alert('Ошибка при загрузке файла. Проверьте формат.')
    } finally {
      setLoading(false)
    }
  }

  // Обновление данных в ячейке
  const updateCellData = (rowId: number, column: string, value: string) => {
    setData(prevData => 
      prevData.map(row => 
        row.id === rowId ? { ...row, [column]: value } : row
      )
    )
  }

  // Очистка списка материалов
  const clearList = () => {
    if (!window.confirm('Вы уверены, что хотите очистить список материалов?')) {
      return
    }

    setData([])
    setEditingCell(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Обработка двойного клика для редактирования ячейки
  const handleCellDoubleClick = (rowId: number, column: string) => {
    setEditingCell({ rowId, column })
  }

  // Завершение редактирования ячейки
  const handleCellBlur = () => {
    setEditingCell(null)
  }

  // Обработка нажатия Enter для завершения редактирования
  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setEditingCell(null)
      e.preventDefault()
    }
  }

  // Функция маппинга данных материалов в структуру таблицы main
  const mapMaterialToMain = (item: MaterialData): any => {
    return {
      // id - уникальный идентификатор (используем timestamp + позиция для уникальности)
      id: parseInt(item.position) || Date.now(),
      // row_no - номер строки из position
      row_no: parseInt(item.position) || null,
      // name - название материала
      name: item.name || 'Без названия',
      // type_brand - тип/марка из typeMarkDocuments
      type_brand: item.typeMarkDocuments || null,
      // drawing_code - код чертежа из equipmentCode
      drawing_code: item.equipmentCode || null,
      // manufacturer - производитель
      manufacturer: item.manufacturer || null,
      // unit - единица измерения
      unit: item.unit || null,
      // qty - количество
      qty: parseFloat(item.quantity) || null,
      // unit_out - единица измерения для цены
      unit_out: item.priceUnit || null,
      // cost - стоимость
      cost: item.price ? parseFloat(item.price.replace(' ₽', '').replace(',', '.')) : null,
      // basis - основание (источник цены)
      basis: item.source || null,
      // product_code - код товара
      product_code: item.productCode || null
    }
  }

  // Сохранение в Supabase (в таблицу main)
  const saveToSupabase = async () => {
    if (data.length === 0) {
      alert('Нет данных для сохранения')
      return
    }

    setLoading(true)
    try {
      // Сначала попробуем получить структуру таблицы
      const { data: testData, error: testError } = await supabase
        .from('main')
        .select('*')
        .limit(1)
      
      console.log('🔍 Проверка структуры таблицы main:', testData, testError)
      
      // Мапим данные материалов в структуру таблицы main
      const mainData = data.map(item => mapMaterialToMain(item))

      console.log('🔄 Сохранение в таблицу main:', mainData)

      // Попробуем сохранить данные используя insert вместо upsert
      const { data: savedData, error } = await supabase
        .from('main')
        .insert(mainData)
        .select()

      if (error) {
        // Если ошибка из-за дубликатов, попробуем обновить
        if (error.code === '23505') {
          console.log('⚠️ Обнаружены дубликаты, пробуем обновить...')
          
          for (const item of mainData) {
            const { error: updateError } = await supabase
              .from('main')
              .update(item)
              .eq('id', item.id)
            
            if (updateError && updateError.code !== '23505') {
              // Если запись не существует, создаем её
              await supabase
                .from('main')
                .insert(item)
            }
          }
          
          alert(`Данные успешно обновлены в таблице main! Обработано записей: ${mainData.length}`)
        } else {
          throw error
        }
      } else {
        console.log('✅ Данные сохранены в main:', savedData)
        alert(`Данные успешно сохранены в таблицу main! Сохранено записей: ${mainData.length}`)
      }
      
    } catch (error) {
      console.error('❌ Ошибка при сохранении в main:', error)
      
      // Выводим более подробную информацию об ошибке
      if ((error as any).details) {
        console.error('📋 Детали ошибки:', (error as any).details)
      }
      if ((error as any).hint) {
        console.error('💡 Подсказка:', (error as any).hint)
      }
      
      alert('Ошибка при сохранении данных в таблицу main: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Функция для расчета процента соответствия материала с учетом производителя
  const calculateMatchPercentage = (
    materialName: string, 
    materialManufacturer: string,
    dbMaterialName: string,
    dbMaterialManufacturer: string
  ): number => {
    const name1 = materialName.toLowerCase().trim()
    const name2 = dbMaterialName.toLowerCase().trim()
    const manufacturer1 = materialManufacturer.toLowerCase().trim()
    const manufacturer2 = dbMaterialManufacturer.toLowerCase().trim()
    
    // Разбиваем на ключевые слова
    const keywords1 = name1.split(' ').filter(word => word.length > 2)
    const keywords2 = name2.split(' ').filter(word => word.length > 2)
    
    let nameMatches = 0
    keywords1.forEach(word1 => {
      keywords2.forEach(word2 => {
        if (word1.includes(word2) || word2.includes(word1)) {
          nameMatches++
        }
      })
    })
    
    // Базовый процент совпадения по названию
    const maxKeywords = Math.max(keywords1.length, keywords2.length)
    let basePercentage = maxKeywords > 0 ? Math.round((nameMatches / maxKeywords) * 100) : 0
    
    // Добавляем бонус за совпадение производителя
    if (manufacturer1 && manufacturer2) {
      if (manufacturer1 === manufacturer2) {
        basePercentage += 30 // Полное совпадение производителя
      } else if (manufacturer1.includes(manufacturer2) || manufacturer2.includes(manufacturer1)) {
        basePercentage += 15 // Частичное совпадение производителя
      }
    }
    
    // Если производители точно не совпадают, но заданы оба - снижаем процент
    if (manufacturer1 && manufacturer2 && 
        !manufacturer1.includes(manufacturer2) && 
        !manufacturer2.includes(manufacturer1)) {
      basePercentage = Math.max(0, basePercentage - 20)
    }
    
    return Math.min(100, basePercentage)
  }

  // Подбор материалов для всех строк с учетом производителя
  const suggestMaterials = () => {
    console.log('🔍 Запуск подбора материалов...')
    console.log('📊 Количество данных:', data.length)
    console.log('🗃️ Количество материалов в базе:', materialsDatabase.length)
    
    if (materialsDatabase.length === 0) {
      alert('База материалов пуста. Проверьте подключение к базе данных.')
      return
    }
    
    const suggestions: any = {}
    
    data.forEach(row => {
      if (row.name) {
        console.log(`🎯 Подбор для "${row.name}", производитель: "${row.manufacturer}" (ID: ${row.id})`)
        
        const matches = materialsDatabase
          .map(material => ({
            ...material,
            matchPercentage: calculateMatchPercentage(
              row.name, 
              row.manufacturer || '', 
              material.name, 
              material.manufacturer
            )
          }))
          .sort((a, b) => b.matchPercentage - a.matchPercentage)

        // Более гибкие критерии для подбора
        let maxSuggestions = 3
        let minPercentage = 20
        
        // Если есть совпадение по производителю, показываем больше вариантов
        const hasManufacturerMatch = matches.some(m => 
          row.manufacturer && 
          m.manufacturer.toLowerCase().includes(row.manufacturer.toLowerCase())
        )
        
        if (hasManufacturerMatch) {
          maxSuggestions = 5
          minPercentage = 15
        }
        
        const selectedMatches = matches
          .filter(material => material.matchPercentage >= minPercentage)
          .slice(0, maxSuggestions)
        
        console.log(`✨ Найдено ${selectedMatches.length} совпадений для "${row.name}"`)
        console.log(`🏭 Лучшие совпадения:`, selectedMatches.map(m => 
          `${m.name} (${m.manufacturer}) - ${m.matchPercentage}%`
        ))
        
        if (selectedMatches.length > 0) {
          suggestions[row.id] = selectedMatches
        }
      }
    })
    
    console.log('📝 Итого предложений:', Object.keys(suggestions).length)
    
    setMaterialSuggestions(suggestions)
    setShowMaterialSuggestions(true)
  }

  // Выбор материала и скрытие предложений
  const selectSuggestedMaterial = (material: any, rowId: number) => {
    console.log(`✅ Выбран материал:`, material)
    console.log(`📋 ID материала: ${material.id}, Код: ${material.code}`)
    
    // Обновляем данные в строке
    setData(prevData => 
      prevData.map(row => 
        row.id === rowId ? { 
          ...row, 
          // Подбор материала: показываем код и название
          materialPicker: `${material.code} - ${material.name}`,
          // Обновляем производителя из базы данных
          manufacturer: material.manufacturer,
          // Единица измерения
          priceUnit: material.unit || 'шт.',
          // Цена (если есть)
          price: material.price > 0 ? `${material.price} ₽` : '',
          // Источник
          source: material.source || 'prise_list_etm',
          // ВАЖНО: Код товара = ID из таблицы prise_list_etm
          productCode: String(material.id)
        } : row
      )
    )
    
    // Убираем предложения для этой строки
    const newSuggestions = { ...materialSuggestions }
    delete newSuggestions[rowId]
    setMaterialSuggestions(newSuggestions)
    
    if (Object.keys(newSuggestions).length === 0) {
      setShowMaterialSuggestions(false)
    }
    
    console.log(`✅ Материал применен к строке ${rowId}. Код товара: ${material.id}`)
  }

  // Скрытие всех предложений
  const hideMaterialSuggestions = () => {
    setShowMaterialSuggestions(false)
    setMaterialSuggestions({})
  }

  // Начало изменения размера колонки
  const handleResizeStart = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(columnKey)
    resizeStartX.current = e.clientX
    // Получаем текущую ширину колонки
    resizeStartWidth.current = getColumnWidth(columnKey)
  }

  // Изменение размера колонки
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const diff = e.clientX - resizeStartX.current
      const newWidth = Math.max(20, resizeStartWidth.current + diff) // Уменьшили минимум до 20px
      
      // Обновляем ширину колонки
      setColumnWidths(prev => ({
        ...prev,
        [isResizing]: newWidth
      }))
    }

    const handleMouseUp = () => {
      setIsResizing(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // Используем все колонки
  const visibleColumns = columnDefs

  // Добавляем стили прямо в компонент
  const styles = `
    ${isResizing ? 'body { cursor: col-resize !important; }' : ''}
    
    .materials-table-container {
      min-height: 100vh;
      background-color: #f9fafb;
      padding: 16px;
      width: 100%;
      box-sizing: border-box;
    }
    
    .materials-table-wrapper {
      width: 100%;
      max-width: 100%;
      margin: 0;
    }
    
    .materials-header {
      margin-bottom: 24px;
    }
    
    .materials-title {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }
    
    .materials-subtitle {
      color: #6b7280;
    }
    
    .toolbar {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      padding: 16px;
      margin-bottom: 24px;
    }
    
    .toolbar-content {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
    }
    
    .btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
      font-size: 14px;
    }
    
    .btn-blue {
      background-color: #2563eb;
      color: white;
    }
    
    .btn-blue:hover {
      background-color: #1d4ed8;
    }
    
    .btn-gray {
      background-color: #f3f4f6;
      color: #374151;
    }
    
    .btn-gray:hover {
      background-color: #e5e7eb;
    }
    
    .btn-red {
      background-color: #dc2626;
      color: white;
    }
    
    .btn-red:hover {
      background-color: #b91c1c;
    }
    
    .btn-green {
      background-color: #16a34a;
      color: white;
    }
    
    .btn-green:hover {
      background-color: #15803d;
    }
    
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .table-container {
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      width: 100%;
    }
    
    .table-scroll {
      overflow-x: auto;
      width: 100%;
    }
    
    .materials-table {
      width: auto;
      min-width: fit-content;
      table-layout: fixed;
      border-collapse: separate;
      border-spacing: 0;
    }
    
    .table-header {
      background: linear-gradient(to right, #f9fafb, #f3f4f6);
    }
    
    .table-header th {
      padding: 6px 8px;
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      color: #374151;
      border-right: 1px solid #e5e7eb;
      border-bottom: 2px solid #d1d5db;
      position: relative;
      user-select: none;
      overflow: hidden;
    }
    
    .resize-handle {
      position: absolute;
      right: -2px;
      top: 0;
      bottom: 0;
      width: 6px;
      cursor: col-resize;
      background: transparent;
      z-index: 10;
    }
    
    .resize-handle:hover {
      background-color: #3b82f6;
    }
    
    .resize-handle.resizing {
      background-color: #2563eb;
    }
    
    .resize-handle::before {
      content: '';
      position: absolute;
      left: 2px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: transparent;
    }
    
    .resize-handle:hover::before {
      background: #3b82f6;
    }
    
    .table-header th:last-child {
      border-right: none;
    }
    
    .btn-purple {
      background-color: #7c3aed;
      color: white;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      width: 100%;
      text-align: left;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }
    
    .btn-purple:hover {
      background-color: #6d28d9;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    
    .btn-red-small {
      background-color: #ef4444;
      color: white;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      width: 100%;
      text-align: left;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .btn-red-small:hover {
      background-color: #dc2626;
    }
    
    .table-body tr {
      position: relative;
      transition: all 0.15s;
    }
    
    .table-body tr::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 1px solid #d1d5db;
      pointer-events: none;
    }
    
    .table-body tr:hover {
      background-color: rgba(59, 130, 246, 0.08);
    }
    
    .table-body tr:hover::after {
      border-color: #3b82f6;
      border-width: 2px;
    }
    
    .table-body td {
      border-right: 1px solid #d1d5db;
      vertical-align: middle;
      position: relative;
      padding: 0;
      overflow: hidden;
    }
    
    .table-body td:last-child {
      border-right: none;
    }
    
    .cell-content {
      font-size: 11px;
      color: #111827;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 14px;
      min-height: 24px;
      padding: 3px 4px;
      transition: background-color 0.15s;
      position: relative;
      width: 100%;
      overflow: hidden;
    }
    
    .cell-content.text-left {
      justify-content: flex-start;
    }
    
    .cell-content-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      position: relative;
      z-index: 1;
      max-width: 100%;
      display: block;
    }
    
    .cell-content-text.allow-overflow {
      overflow: visible;
      text-overflow: clip;
    }
    
    .cell-content:hover {
      background-color: #f3f4f6;
    }
    
    .cell-input {
      font-size: 11px;
      color: #111827;
      background-color: white;
      border: 2px solid #3b82f6;
      outline: none;
      border-radius: 2px;
      line-height: 14px;
      min-height: 24px;
      padding: 3px 4px;
      position: absolute;
      left: 0;
      top: 0;
      width: auto !important;
      min-width: 100%;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      text-align: left;
    }
    
    .cell-input.center {
      text-align: center;
    }
    
    .cell-input:focus {
      border-color: #2563eb;
    }
    
    .suggestion-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(to right, #eff6ff, #e0e7ff);
      border: 1px solid #c7d2fe;
      border-radius: 8px;
      font-size: 11px;
      cursor: pointer;
      height: 15px;
      padding: 1px 4px;
      transition: all 0.2s;
      margin-bottom: 2px;
    }
    
    .suggestion-item:hover {
      background: linear-gradient(to right, #dbeafe, #c7d2fe);
      border-color: #a5b4fc;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .suggestion-text {
      flex: 1;
      color: #374151;
      font-weight: 500;
      font-size: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .suggestion-percentage {
      font-size: 11px;
      font-weight: 700;
      color: #4f46e5;
      background-color: white;
      padding: 0 4px;
      border-radius: 9999px;
      border: 1px solid #e0e7ff;
      margin-left: 4px;
    }
    
    .selected-material {
      font-size: 11px;
      color: #111827;
      padding: 4px 6px;
      background-color: #f0fdf4;
      border-left: 3px solid #22c55e;
      border-radius: 0 4px 4px 0;
      margin-bottom: 2px;
      min-height: 20px;
      display: flex;
      align-items: center;
    }
    
    .price-cell {
      background-color: #fefce8;
    }
    
    .price-suggestion {
      font-size: 10px;
      color: #374151;
      background-color: white;
      border: 1px solid #fde047;
      border-radius: 4px;
      padding: 4px;
      text-align: center;
      height: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2px;
    }
    
    .table-footer {
      padding: 12px 16px;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      color: #6b7280;
    }
    
    .ml-auto {
      margin-left: auto;
    }
  `

  return (
    <>
      <style>{styles}</style>
      <div className="materials-table-container">
        <div className="materials-table-wrapper">
          <div className="materials-header">
            <h1 className="materials-title">Управление материалами</h1>
            <p className="materials-subtitle">
              Редактируйте данные и сохраните в базу
            </p>
          </div>

          <div className="toolbar">
            <div className="toolbar-content">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="btn btn-blue"
                title="Загрузить Excel файл"
                style={{ padding: '10px' }}
              >
                <Upload size={20} />
              </button>

              {data.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                  <button
                    onClick={clearList}
                    className="btn btn-red"
                  >
                    <Trash2 size={16} />
                    Очистить список
                  </button>
                  <button
                    onClick={saveToSupabase}
                    disabled={loading}
                    className="btn btn-green"
                    title="Сохранить данные в таблицу main"
                  >
                    <Save size={16} />
                    {loading ? 'Сохранение...' : 'Сохранить в БД'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="table-container">
            <div className="table-scroll">
              <table className="materials-table">
                <thead>
                  <tr className="table-header">
                    {visibleColumns.map(column => (
                      <th key={column.field} style={{ 
                        width: `${getColumnWidth(column.field)}px`,
                        minWidth: `${getColumnWidth(column.field)}px`,
                        maxWidth: `${getColumnWidth(column.field)}px`,
                        textAlign: 'center',
                        position: 'relative'
                      }}>
                        {column.field === 'materialPicker' ? (
                          <button
                            onClick={showMaterialSuggestions ? hideMaterialSuggestions : suggestMaterials}
                            className={showMaterialSuggestions ? 'btn-red-small' : 'btn-purple'}
                            title={showMaterialSuggestions ? 'Скрыть подбор материалов' : 'Подобрать материалы'}
                            disabled={data.length === 0}
                          >
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {showMaterialSuggestions ? '❌ Скрыть подбор' : '🔍 Подбор материала'}
                            </div>
                          </button>
                        ) : (
                          <div style={{ 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            textAlign: 'center'
                          }}>
                            {column.headerName}
                          </div>
                        )}
                        {/* Ручка для изменения размера */}
                        <div 
                          className={`resize-handle ${isResizing === column.field ? 'resizing' : ''}`}
                          onMouseDown={(e) => handleResizeStart(e, column.field)}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="table-body">
                  {data.length > 0 ? (
                    data.map((row, index) => {
                      const hasSuggestions = materialSuggestions[row.id]
                      const rowHeight = hasSuggestions ? `${20 + (materialSuggestions[row.id].length * 17)}px` : '20px'
                      
                      return (
                        <tr key={row.id} style={{ 
                          height: rowHeight,
                          backgroundColor: index % 2 === 0 ? 'white' : 'rgba(249, 250, 251, 0.5)'
                        }}>
                          {visibleColumns.map((column) => {
                            const isEditing = editingCell?.rowId === row.id && editingCell?.column === column.field
                            const cellValue = (row as any)[column.field]
                            
                            if (column.field === 'materialPicker') {
                              return (
                                <td key={column.field} style={{ 
                                  width: `${getColumnWidth(column.field)}px`,
                                  minWidth: `${getColumnWidth(column.field)}px`,
                                  maxWidth: `${getColumnWidth(column.field)}px`,
                                  padding: '2px',
                                  textAlign: column.field === 'materialPicker' ? 'left' : 'center'
                                }}>
                                  {hasSuggestions ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      {cellValue && (
                                        <div className="selected-material">
                                          {cellValue}
                                        </div>
                                      )}
                                      
                                      {materialSuggestions[row.id].map((suggestion: any, index: number) => (
                                        <div 
                                          key={index} 
                                          className="suggestion-item"
                                          onClick={() => selectSuggestedMaterial(suggestion, row.id)}
                                          title="Кликните для выбора этого материала"
                                        >
                                          <span className="suggestion-text" title={`${suggestion.code} - ${suggestion.name}`}>
                                            {suggestion.code} - {suggestion.name}
                                          </span>
                                          <span className="suggestion-percentage">
                                            {suggestion.matchPercentage}%
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    isEditing ? (
                                      <input
                                        type="text"
                                        value={cellValue}
                                        onChange={(e) => updateCellData(row.id, column.field, e.target.value)}
                                        onBlur={handleCellBlur}
                                        onKeyDown={handleCellKeyDown}
                                        className="cell-input"
                                        style={{ 
                                          width: `${Math.max(getColumnWidth(column.field) + 20, (cellValue?.length || 0) * 8 + 20)}px`
                                        }}
                                        autoFocus
                                      />
                                    ) : (
                                      <div
                                        className="cell-content text-left"
                                        onDoubleClick={() => handleCellDoubleClick(row.id, column.field)}
                                        title={cellValue}
                                      >
                                        <span className="cell-content-text">
                                          {cellValue}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </td>
                              )
                            }
                            
                            if (['priceUnit', 'price', 'source', 'productCode'].includes(column.field)) {
                              return (
                                <td key={column.field} className="price-cell" style={{ 
                                  width: `${getColumnWidth(column.field)}px`,
                                  minWidth: `${getColumnWidth(column.field)}px`,
                                  maxWidth: `${getColumnWidth(column.field)}px`,
                                  padding: '2px',
                                  textAlign: 'center'
                                }}>
                                  {hasSuggestions ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      {(row as any)[column.field] && (
                                        <div style={{ 
                                          fontSize: '11px', 
                                          color: '#111827', 
                                          padding: '4px', 
                                          backgroundColor: '#dcfce7', 
                                          borderRadius: '4px', 
                                          fontWeight: '500', 
                                          textAlign: 'center' 
                                        }}>
                                          {(row as any)[column.field]}
                                        </div>
                                      )}
                                      
                                      {materialSuggestions[row.id].map((suggestion: any, index: number) => (
                                        <div key={index} className="price-suggestion">
                                          {column.field === 'priceUnit' && (suggestion.unit || 'шт.')}
                                          {column.field === 'price' && (suggestion.price > 0 ? `${suggestion.price} ₽` : '-')}
                                          {column.field === 'source' && (suggestion.source || 'prise_list_etm')}
                                          {column.field === 'productCode' && suggestion.id}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: '11px', color: '#374151', fontWeight: '500', textAlign: 'center' }}>
                                      {(row as any)[column.field] || '-'}
                                    </div>
                                  )}
                                </td>
                              )
                            }
                            
                            return (
                              <td key={column.field} style={{ 
                                width: `${getColumnWidth(column.field)}px`,
                                minWidth: `${getColumnWidth(column.field)}px`,
                                maxWidth: `${getColumnWidth(column.field)}px`,
                                padding: '0',
                                textAlign: column.field === 'name' ? 'left' : 'center'
                              }}>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={cellValue}
                                    onChange={(e) => updateCellData(row.id, column.field, e.target.value)}
                                    onBlur={handleCellBlur}
                                    onKeyDown={handleCellKeyDown}
                                    className={`cell-input ${['unit', 'quantity', 'position'].includes(column.field) ? 'center' : ''}`}
                                    style={{ 
                                      width: `${Math.max(getColumnWidth(column.field) + 20, (cellValue?.length || 0) * 8 + 20)}px`
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <div
                                    className={`cell-content ${column.field === 'name' ? 'text-left' : ''}`}
                                    onDoubleClick={() => handleCellDoubleClick(row.id, column.field)}
                                    title={cellValue}
                                  >
                                    <span className="cell-content-text"
                                      style={{
                                        textAlign: column.field === 'name' ? 'left' : 'center'
                                      }}>
                                      {cellValue || ''}
                                    </span>
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td 
                        colSpan={visibleColumns.length} 
                        style={{ 
                          textAlign: 'center', 
                          padding: '40px 20px', 
                          color: '#6b7280',
                          fontSize: '14px',
                          fontStyle: 'italic'
                        }}
                      >
                        Загрузите Excel файл для отображения данных
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="table-footer">
              <span>Всего записей: {data.length}</span>
              <span>
                Показано колонок: {visibleColumns.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MaterialsTable