import React, { useRef } from 'react'
import { Upload, Eye, EyeOff, Search, Trash2, Save, Download, Undo, Redo } from 'lucide-react'
import { useRows } from '../../store/useRows'

interface ToolbarProps {
  onImport: (file: File) => void
  onSave: () => void
  onExport: () => void
}

export const Toolbar: React.FC<ToolbarProps> = ({ onImport, onSave, onExport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    rows,
    selectedIds,
    dirty,
    history,
    future,
    hiddenColumns,
    clear,
    undo,
    redo,
    setRightPanelOpen
  } = useRows()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImport(file)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClear = () => {
    if (selectedIds.length > 0) {
      if (confirm(`Очистить ${selectedIds.length} выбранных записей?`)) {
        clear(true)
      }
    } else if (rows.length > 0) {
      if (confirm('Очистить весь список материалов?')) {
        clear(false)
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        {/* Загрузить Excel */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          title="Загрузить Excel файл (Ctrl+O)"
        >
          <Upload size={18} />
          Загрузить Excel
        </button>

        {/* Показать/Скрыть колонки */}
        <button
          onClick={() => setRightPanelOpen(false)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          title="Настроить видимость колонок"
        >
          {hiddenColumns.length > 0 ? <Eye size={18} /> : <EyeOff size={18} />}
          {hiddenColumns.length > 0 ? 'Показать' : 'Скрыть'}
        </button>

        {/* Подбор материала */}
        <button
          onClick={() => setRightPanelOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md hover:shadow-lg"
          title="Открыть панель подбора материалов"
        >
          <Search size={18} />
          Подбор материала
        </button>

        {/* Разделитель */}
        <div className="h-8 w-px bg-gray-300 mx-1" />

        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Отменить (Ctrl+Z)"
        >
          <Undo size={18} />
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Повторить (Ctrl+Y)"
        >
          <Redo size={18} />
        </button>

        {/* Экспорт */}
        {rows.length > 0 && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title="Экспортировать в Excel"
          >
            <Download size={18} />
            Экспорт
          </button>
        )}

        {/* Правая часть */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Очистить список */}
          {rows.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              title={selectedIds.length > 0 ? 'Очистить выбранные' : 'Очистить все'}
            >
              <Trash2 size={18} />
              {selectedIds.length > 0 ? `Очистить (${selectedIds.length})` : 'Очистить список'}
            </button>
          )}

          {/* Записать в базу */}
          <button
            onClick={onSave}
            disabled={rows.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            title="Сохранить в базу данных (Ctrl+S)"
          >
            <Save size={18} />
            Записать в базу
          </button>
        </div>
      </div>

      {/* Статусная строка */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>Всего записей: <strong>{rows.length}</strong></span>
          {selectedIds.length > 0 && (
            <span>Выбрано: <strong>{selectedIds.length}</strong></span>
          )}
        </div>
        {dirty && (
          <div className="flex items-center gap-2 text-orange-600">
            <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
            <span>Есть несохранённые изменения</span>
          </div>
        )}
      </div>
    </div>
  )
}