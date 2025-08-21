import React, { useEffect, useCallback } from 'react'
import { Toolbar } from './materials/Toolbar'
import { Grid } from './materials/Grid'
import { RightPanel } from './materials/RightPanel'
import { useRows } from '../store/useRows'
import { useMaterialsData } from '../hooks/useMaterialsData'
import { parseExcel, exportToExcel, getDemoData } from '../lib/excel'
import { validateRows } from '../lib/validation'
import type { Database } from '../types/supabase'

type MaterialsDataInsert = Database['public']['Tables']['materials_data']['Insert']

const MaterialsApp: React.FC = () => {
  const { 
    rows, 
    setRows, 
    markClean,
    undo,
    redo 
  } = useRows()
  
  const { 
    addMaterialsData,
    loading: dbLoading 
  } = useMaterialsData()

  // Загрузка демо-данных при первом запуске
  useEffect(() => {
    if (rows.length === 0) {
      const demoData = getDemoData()
      setRows(demoData)
    }
  }, [])

  // Автосохранение в localStorage каждые 15 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      if (rows.length > 0) {
        localStorage.setItem('materials_draft', JSON.stringify(rows))
        console.log('Автосохранение выполнено')
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [rows])

  // Восстановление из localStorage при загрузке
  useEffect(() => {
    const draft = localStorage.getItem('materials_draft')
    if (draft && rows.length === 0) {
      try {
        const parsedDraft = JSON.parse(draft)
        setRows(parsedDraft)
        console.log('Черновик восстановлен')
      } catch (e) {
        console.error('Ошибка при восстановлении черновика:', e)
      }
    }
  }, [])

  // Горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S - Сохранить
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      // Ctrl/Cmd + O - Открыть файл
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('input[type="file"]')?.click()
      }
      // Ctrl/Cmd + Z - Отменить
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      // Ctrl/Cmd + Y или Ctrl/Cmd + Shift + Z - Повторить
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [rows, undo, redo])

  // Импорт Excel
  const handleImport = useCallback(async (file: File) => {
    const result = await parseExcel(file)
    
    if (result.success && result.data) {
      setRows(result.data)
      console.log('Импортировано строк:', result.data.length)
      console.log('Маппинг колонок:', result.mapping)
    } else if (result.errors) {
      alert(`Ошибки при импорте:\n${result.errors.join('\n')}`)
    }
  }, [setRows])

  // Сохранение в базу
  const handleSave = useCallback(async () => {
    if (rows.length === 0) {
      alert('Нет данных для сохранения')
      return
    }

    // Валидация
    const errors = validateRows(rows)
    if (errors.length > 0) {
      const errorMessages = errors.map(e => `Строка ${e.rowId}: ${e.field} - ${e.message}`)
      if (!confirm(`Обнаружены ошибки валидации:\n${errorMessages.slice(0, 5).join('\n')}\n\nВсе равно сохранить?`)) {
        return
      }
    }

    try {
      // Преобразуем в формат Supabase
      const materialsToSave: MaterialsDataInsert[] = rows.map(row => ({
        position: row.index,
        name: row.name,
        type_mark_documents: row.typeBrand,
        equipment_code: row.code,
        manufacturer: row.manufacturer,
        unit: row.unit,
        quantity: row.qty,
        material_picker: row.specRef,
        price_unit: row.unit,
        price: row.price,
        source: row.priceSource,
        file_name: 'manual_input'
      }))

      const { error } = await addMaterialsData(materialsToSave)
      
      if (error) {
        throw error
      }
      
      markClean()
      localStorage.removeItem('materials_draft')
      alert(`Успешно сохранено ${rows.length} записей в базу данных!`)
    } catch (error) {
      console.error('Ошибка при сохранении:', error)
      alert('Ошибка при сохранении данных в базу')
    }
  }, [rows, addMaterialsData, markClean])

  // Экспорт в Excel
  const handleExport = useCallback(() => {
    if (rows.length === 0) {
      alert('Нет данных для экспорта')
      return
    }
    
    const filename = `materials_${new Date().toISOString().split('T')[0]}.xlsx`
    exportToExcel(rows, filename)
    console.log('Экспортировано строк:', rows.length)
  }, [rows])


  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Управление материалами
          </h1>
          <p className="text-gray-600">
            Загрузите Excel-файл, отредактируйте данные и сохраните в базу
          </p>
        </div>

        {/* Панель действий */}
        <Toolbar 
          onImport={handleImport}
          onSave={handleSave}
          onExport={handleExport}
        />

        {/* Таблица */}
        <Grid />

        {/* Боковая панель */}
        <RightPanel />

        {/* Индикатор загрузки */}
        {dbLoading && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
            <span className="text-sm text-gray-600">Сохранение данных...</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default MaterialsApp