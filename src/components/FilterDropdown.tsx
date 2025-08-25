import { useState, useRef, useEffect } from 'react'
import { Filter, Search, X } from 'lucide-react'

interface FilterDropdownProps {
  columnKey: string
  values: string[]
  selectedValues: Set<string>
  onFilterChange: (columnKey: string, values: Set<string>) => void
  columnName: string
}

export default function FilterDropdown({ 
  columnKey, 
  values, 
  selectedValues, 
  onFilterChange,
  columnName 
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const uniqueValues = Array.from(new Set(values)).sort()
  const filteredValues = uniqueValues.filter(value => 
    value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectAll = () => {
    if (selectedValues.size === uniqueValues.length) {
      onFilterChange(columnKey, new Set())
    } else {
      onFilterChange(columnKey, new Set(uniqueValues))
    }
  }

  const handleValueToggle = (value: string) => {
    const newSelectedValues = new Set(selectedValues)
    if (newSelectedValues.has(value)) {
      newSelectedValues.delete(value)
    } else {
      newSelectedValues.add(value)
    }
    onFilterChange(columnKey, newSelectedValues)
  }

  const handleClearFilter = () => {
    onFilterChange(columnKey, new Set(uniqueValues))
    setSearchTerm('')
  }

  const hasActiveFilter = selectedValues.size > 0 && selectedValues.size < uniqueValues.length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-full h-full px-1 py-0.5 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 border border-gray-300 transition-all"
        style={{
          borderRadius: '2px',
          minHeight: '24px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        }}
      >
        <Filter className={`w-3 h-3 mr-1 flex-shrink-0 ${
          hasActiveFilter ? 'text-blue-600' : 'text-gray-500'
        }`} />
        <span className="truncate text-xs font-medium text-gray-700 flex-1 text-left">
          {columnName}
        </span>
        <div className="w-4 h-4 ml-0.5 flex-shrink-0 border-l border-gray-300 flex items-center justify-center">
          <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
            <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" 
              className={hasActiveFilter ? 'text-blue-600' : 'text-gray-500'}/>
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-[9999] mt-1 w-64 bg-white border border-gray-400 rounded shadow-2xl"
          style={{
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
            top: '100%',
            left: '0'
          }}
        >
          <div className="p-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск..."
                className="w-full pl-8 pr-8 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          <div className="px-2 py-1.5 border-b border-gray-200 flex gap-3 bg-gray-50 flex-shrink-0">
            <button
              onClick={handleSelectAll}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              {selectedValues.size === uniqueValues.length ? 'Снять все' : 'Выбрать все'}
            </button>
            {hasActiveFilter && (
              <button
                onClick={handleClearFilter}
                className="text-xs text-gray-600 hover:text-gray-800 hover:underline"
              >
                Сбросить
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto" 
            style={{ 
              maxHeight: '200px', 
              minHeight: '50px',
              overscrollBehavior: 'contain'
            }}
          >
            {filteredValues.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                Нет результатов
              </div>
            ) : (
              <>
                {filteredValues.map((value, index) => (
                  <label
                    key={value}
                    className={`flex items-center px-2 py-1 hover:bg-blue-50 cursor-pointer transition-colors ${
                      index < 10 ? '' : 'border-t border-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.has(value)}
                      onChange={() => handleValueToggle(value)}
                      className="mr-2 w-3.5 h-3.5 rounded-sm border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-700 truncate" title={value || '(Пусто)'}>
                      {value || '(Пусто)'}
                    </span>
                  </label>
                ))}
                {filteredValues.length > 100 && (
                  <div className="px-2 py-2 text-xs text-gray-500 italic border-t border-gray-200 bg-gray-50">
                    Показаны первые 100 значений из {filteredValues.length}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}