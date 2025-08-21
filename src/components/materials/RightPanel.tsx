import React, { useState } from 'react'
import { X, Search, Plus } from 'lucide-react'
import { useRows } from '../../store/useRows'
import { useMaterialsData } from '../../hooks/useMaterialsData'

export const RightPanel: React.FC = () => {
  const { rightPanelOpen, setRightPanelOpen, selectedIds, patchCell } = useRows()
  const { materialsDatabase } = useMaterialsData()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all')

  if (!rightPanelOpen) return null

  const filteredMaterials = materialsDatabase.filter(material => {
    const matchesSearch = searchTerm === '' ||
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSource = selectedSource === 'all' || material.source === selectedSource
    const matchesManufacturer = selectedManufacturer === 'all' || material.manufacturer === selectedManufacturer
    
    return matchesSearch && matchesSource && matchesManufacturer
  })

  const manufacturers = Array.from(new Set(materialsDatabase.map(m => m.manufacturer).filter(Boolean)))
  const sources = Array.from(new Set(materialsDatabase.map(m => m.source).filter(Boolean)))

  const applyMaterial = (material: any) => {
    if (selectedIds.length === 0) {
      alert('Выберите строки для применения материала')
      return
    }

    selectedIds.forEach(id => {
      patchCell(id, {
        specRef: material.code,
        price: material.price,
        priceSource: material.source,
        unit: material.unit,
        manufacturer: material.manufacturer
      })
    })

    alert(`Материал применен к ${selectedIds.length} строкам`)
  }

  return (
    <>
      {/* Оверлей */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={() => setRightPanelOpen(false)}
      />
      
      {/* Панель */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Подбор материала</h2>
          <button
            onClick={() => setRightPanelOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Фильтры */}
        <div className="p-4 space-y-3 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Поиск по названию или коду..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Все источники</option>
            {sources.map(source => (
              <option key={source} value={source || ''}>{source}</option>
            ))}
          </select>

          <select
            value={selectedManufacturer}
            onChange={(e) => setSelectedManufacturer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Все производители</option>
            {manufacturers.map(manufacturer => (
              <option key={manufacturer} value={manufacturer || ''}>{manufacturer}</option>
            ))}
          </select>
        </div>

        {/* Информация о выборе */}
        {selectedIds.length > 0 && (
          <div className="px-4 py-2 bg-purple-50 border-b border-purple-200">
            <p className="text-sm text-purple-700">
              Выбрано строк для применения: <strong>{selectedIds.length}</strong>
            </p>
          </div>
        )}

        {/* Список материалов */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Материалы не найдены</p>
              <p className="text-sm mt-2">Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMaterials.map(material => (
                <div
                  key={material.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer group"
                  onClick={() => applyMaterial(material)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {material.code} - {material.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {material.manufacturer} • {material.unit}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm font-semibold text-purple-600">
                          {material.price} ₽
                        </span>
                        <span className="text-xs text-gray-500">
                          {material.source}
                        </span>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1 bg-purple-600 text-white rounded transition-opacity">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Нижняя панель */}
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-3">
            Найдено материалов: {filteredMaterials.length}
          </p>
          <button
            onClick={() => setRightPanelOpen(false)}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Закрыть
          </button>
        </div>
      </div>
    </>
  )
}