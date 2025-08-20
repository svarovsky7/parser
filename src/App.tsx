import { useState, useEffect } from 'react'
import './App.css'
import { supabase } from './lib/supabase'
import { useEquipmentData } from './hooks/useEquipmentData'
import { EquipmentFileUpload } from './components/EquipmentFileUpload'
import { EditableCell } from './components/EditableCell'
import type { Database } from './types/supabase'

type EquipmentInsert = Database['public']['Tables']['equipment_data']['Insert']
type EquipmentData = Database['public']['Tables']['equipment_data']['Row']

function App() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all')
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const { equipmentData, loading, error, addEquipmentData, deleteEquipmentData, clearAllData, updateEquipmentData, refetch } = useEquipmentData()

  useEffect(() => {
    checkConnection()
  }, [])

  async function checkConnection() {
    try {
      const { error } = await supabase.from('equipment_data').select('count').limit(1)
      if (error && error.code === '42P01') {
        console.log('Таблица equipment_data не существует. Создайте её в Supabase Dashboard используя файл supabase/schemes/equipment_data.sql')
        setConnectionStatus('error')
      } else if (error) {
        console.error('Ошибка подключения:', error)
        setConnectionStatus('error')
      } else {
        console.log('Успешно подключено к Supabase!')
        setConnectionStatus('connected')
      }
    } catch (err) {
      console.error('Ошибка:', err)
      setConnectionStatus('error')
    }
  }

  const handleDataParsed = async (equipmentRows: EquipmentInsert[]) => {
    setIsSaving(true)
    try {
      const { error } = await addEquipmentData(equipmentRows)
      if (error) {
        console.error('Ошибка при сохранении данных:', error)
        alert('❌ Ошибка при сохранении данных в базу')
      } else {
        refetch()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Удалить эту запись?')) {
      const { error } = await deleteEquipmentData(id)
      if (error) {
        console.error('Ошибка при удалении:', error)
        alert('❌ Ошибка при удалении записи')
      }
    }
  }

  const handleClearAll = async () => {
    const totalRecords = equipmentData.length
    if (totalRecords === 0) {
      alert('База данных уже пуста')
      return
    }
    
    if (confirm(`⚠️ Вы уверены, что хотите удалить все записи (${totalRecords} шт.)?\n\nЭто действие нельзя отменить!`)) {
      const { error } = await clearAllData()
      if (error) {
        console.error('Ошибка при очистке базы данных:', error)
        alert('❌ Ошибка при очистке базы данных')
      } else {
        alert('✅ База данных успешно очищена')
        refetch()
      }
    }
  }

  const handleUpdateField = async (itemId: string, field: keyof EquipmentData, value: string | number | null) => {
    const { error } = await updateEquipmentData(itemId, { [field]: value })
    if (error) {
      console.error('Ошибка при обновлении:', error)
      alert('❌ Ошибка при сохранении изменений')
    }
    setEditingCell(null)
  }

  // Фильтрация данных
  const filteredData = equipmentData.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name_and_specs?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type_mark_docs?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipment_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesManufacturer = selectedManufacturer === 'all' || item.manufacturer === selectedManufacturer
    
    return matchesSearch && matchesManufacturer
  })

  // Группируем данные по файлам
  const groupedData = filteredData.reduce((acc, item) => {
    if (!acc[item.file_name]) {
      acc[item.file_name] = []
    }
    acc[item.file_name].push(item)
    return acc
  }, {} as Record<string, typeof equipmentData>)

  // Подсчет общего количества по производителям
  const manufacturerStats = equipmentData.reduce((acc, item) => {
    if (item.manufacturer) {
      if (!acc[item.manufacturer]) {
        acc[item.manufacturer] = {
          count: 0,
          totalQuantity: 0
        }
      }
      acc[item.manufacturer].count++
      acc[item.manufacturer].totalQuantity += item.quantity || 0
    }
    return acc
  }, {} as Record<string, { count: number; totalQuantity: number }>)

  // Получаем уникальных производителей для фильтра
  const manufacturers = Array.from(new Set(equipmentData.map(item => item.manufacturer).filter(Boolean))) as string[]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Хедер */}
      <header style={{ 
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ margin: 0, fontSize: '28px', color: '#2c3e50' }}>
              🏭 Система учета оборудования
            </h1>
            
            {/* Статус подключения */}
            <div style={{
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500',
              background: connectionStatus === 'connected' ? '#d4edda' : connectionStatus === 'error' ? '#f8d7da' : '#fff3cd',
              color: connectionStatus === 'connected' ? '#155724' : connectionStatus === 'error' ? '#721c24' : '#856404',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: connectionStatus === 'connected' ? '#28a745' : connectionStatus === 'error' ? '#dc3545' : '#ffc107',
                animation: connectionStatus === 'checking' ? 'pulse 1.5s infinite' : 'none'
              }} />
              {connectionStatus === 'checking' && 'Подключение...'}
              {connectionStatus === 'connected' && 'Подключено'}
              {connectionStatus === 'error' && 'Ошибка подключения'}
            </div>
          </div>
        </div>
      </header>

      {connectionStatus === 'error' && (
        <div style={{ 
          background: '#f8d7da',
          color: '#721c24',
          padding: '16px',
          borderBottom: '1px solid #f5c6cb'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <strong>⚠️ Внимание:</strong> Выполните SQL из файла <code style={{ 
              background: '#fff',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '13px'
            }}>supabase/schemes/equipment_data.sql</code> в Supabase Dashboard
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
        {connectionStatus === 'connected' && (
          <>
            {/* Секция загрузки */}
            <EquipmentFileUpload onDataParsed={handleDataParsed} />
            
            {isSaving && (
              <div style={{ 
                padding: '20px',
                textAlign: 'center',
                background: 'white',
                borderRadius: '12px',
                marginBottom: '30px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <strong>⏳ Сохранение данных...</strong>
              </div>
            )}

            {/* Статистика */}
            {Object.keys(manufacturerStats).length > 0 && (
              <div style={{ 
                marginBottom: '30px',
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#2c3e50' }}>
                  📊 Статистика по производителям
                </h3>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  {Object.entries(manufacturerStats).map(([manufacturer, stats]) => (
                    <div key={manufacturer} style={{ 
                      padding: '16px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '8px',
                      color: 'white'
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                        {manufacturer}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', opacity: 0.9 }}>
                        <span>Позиций: {stats.count}</span>
                        <span>Всего: {stats.totalQuantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Секция данных */}
            <div style={{ 
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              {/* Заголовок и управление */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '20px', color: '#2c3e50' }}>
                    📋 База данных оборудования
                  </h2>
                  {equipmentData.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      style={{
                        padding: '10px 20px',
                        cursor: 'pointer',
                        background: 'white',
                        color: '#dc3545',
                        border: '2px solid #dc3545',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = '#dc3545'
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = 'white'
                        e.currentTarget.style.color = '#dc3545'
                      }}
                    >
                      🗑️ Очистить базу
                    </button>
                  )}
                </div>

                {/* Фильтры */}
                {equipmentData.length > 0 && (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="🔍 Поиск по всем полям..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{
                        flex: '1 1 300px',
                        padding: '10px 16px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = '#667eea'}
                      onBlur={e => e.currentTarget.style.borderColor = '#e0e0e0'}
                    />
                    
                    <select
                      value={selectedManufacturer}
                      onChange={e => setSelectedManufacturer(e.target.value)}
                      style={{
                        padding: '10px 16px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: 'white',
                        cursor: 'pointer',
                        minWidth: '200px'
                      }}
                    >
                      <option value="all">Все производители</option>
                      {manufacturers.map(manufacturer => (
                        <option key={manufacturer} value={manufacturer}>
                          {manufacturer} ({manufacturerStats[manufacturer]?.count || 0})
                        </option>
                      ))}
                    </select>

                    {(searchTerm || selectedManufacturer !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchTerm('')
                          setSelectedManufacturer('all')
                        }}
                        style={{
                          padding: '10px 16px',
                          background: '#f0f0f0',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        ✖️ Сбросить
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Данные */}
              {loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
                  Загрузка данных...
                </div>
              )}
              
              {error && (
                <div style={{ 
                  padding: '20px',
                  background: '#f8d7da',
                  color: '#721c24',
                  borderRadius: '8px'
                }}>
                  ❌ Ошибка: {error.message}
                </div>
              )}
              
              {!loading && !error && equipmentData.length === 0 && (
                <div style={{ 
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                  <h3 style={{ fontSize: '20px', color: '#495057', marginBottom: '8px' }}>
                    База данных пуста
                  </h3>
                  <p style={{ color: '#6c757d', fontSize: '14px' }}>
                    Загрузите Excel файл со спецификацией оборудования
                  </p>
                </div>
              )}
              
              {!loading && !error && filteredData.length === 0 && equipmentData.length > 0 && (
                <div style={{ 
                  textAlign: 'center',
                  padding: '40px',
                  background: '#fff3cd',
                  borderRadius: '8px',
                  color: '#856404'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                  Ничего не найдено по вашему запросу
                </div>
              )}
              
              {!loading && !error && Object.keys(groupedData).length > 0 && (
                <div>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>
                      Найдено записей: <strong>{filteredData.length}</strong> из <strong>{equipmentData.length}</strong>
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#667eea',
                      background: '#f0f2ff',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>💡</span>
                      <span>Нажмите на любое поле для редактирования</span>
                    </div>
                  </div>
                  
                  {Object.entries(groupedData).map(([fileName, items]) => (
                    <div key={fileName} style={{ marginBottom: '24px' }}>
                      <div style={{ 
                        background: '#f8f9fa',
                        padding: '12px 16px',
                        borderRadius: '8px 8px 0 0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '20px' }}>📄</span>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{fileName}</div>
                            <div style={{ fontSize: '12px', color: '#6c757d' }}>
                              Загружено: {new Date(items[0].created_at).toLocaleString('ru-RU')}
                            </div>
                          </div>
                        </div>
                        <div style={{ 
                          background: '#667eea',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          {items.length}
                        </div>
                      </div>
                      
                      <div style={{ 
                        border: '1px solid #dee2e6',
                        borderTop: 'none',
                        borderRadius: '0 0 8px 8px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f8f9fa' }}>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Поз.</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Наименование</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Тип/Марка</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Код</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Производитель</th>
                                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Ед.</th>
                                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Кол-во</th>
                                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Действия</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, index) => (
                                <tr key={item.id} style={{ 
                                  borderBottom: index < items.length - 1 ? '1px solid #f0f0f0' : 'none',
                                  transition: 'background 0.2s ease'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#fafafa'}
                                onMouseOut={e => e.currentTarget.style.background = 'white'}>
                                  <td style={{ padding: '4px', fontWeight: 'bold', color: '#667eea' }}>
                                    <EditableCell
                                      value={item.position}
                                      onSave={(value) => handleUpdateField(item.id, 'position', value)}
                                      type="number"
                                      isEditing={editingCell === `${item.id}-position`}
                                      onStartEdit={() => setEditingCell(`${item.id}-position`)}
                                    />
                                  </td>
                                  <td style={{ padding: '4px', color: '#212529', fontSize: '14px' }}>
                                    <EditableCell
                                      value={item.name_and_specs}
                                      onSave={(value) => handleUpdateField(item.id, 'name_and_specs', value)}
                                      type="text"
                                      isEditing={editingCell === `${item.id}-name_and_specs`}
                                      onStartEdit={() => setEditingCell(`${item.id}-name_and_specs`)}
                                    />
                                  </td>
                                  <td style={{ padding: '4px', color: '#6c757d', fontSize: '13px' }}>
                                    <EditableCell
                                      value={item.type_mark_docs}
                                      onSave={(value) => handleUpdateField(item.id, 'type_mark_docs', value)}
                                      type="text"
                                      isEditing={editingCell === `${item.id}-type_mark_docs`}
                                      onStartEdit={() => setEditingCell(`${item.id}-type_mark_docs`)}
                                    />
                                  </td>
                                  <td style={{ padding: '4px', color: '#6c757d', fontSize: '13px' }}>
                                    <EditableCell
                                      value={item.equipment_code}
                                      onSave={(value) => handleUpdateField(item.id, 'equipment_code', value)}
                                      type="text"
                                      isEditing={editingCell === `${item.id}-equipment_code`}
                                      onStartEdit={() => setEditingCell(`${item.id}-equipment_code`)}
                                    />
                                  </td>
                                  <td style={{ padding: '4px', color: '#28a745', fontWeight: '500' }}>
                                    <EditableCell
                                      value={item.manufacturer}
                                      onSave={(value) => handleUpdateField(item.id, 'manufacturer', value)}
                                      type="text"
                                      isEditing={editingCell === `${item.id}-manufacturer`}
                                      onStartEdit={() => setEditingCell(`${item.id}-manufacturer`)}
                                    />
                                  </td>
                                  <td style={{ padding: '4px', textAlign: 'center', color: '#6c757d', fontSize: '13px' }}>
                                    <EditableCell
                                      value={item.unit_measure}
                                      onSave={(value) => handleUpdateField(item.id, 'unit_measure', value)}
                                      type="text"
                                      isEditing={editingCell === `${item.id}-unit_measure`}
                                      onStartEdit={() => setEditingCell(`${item.id}-unit_measure`)}
                                    />
                                  </td>
                                  <td style={{ padding: '4px', textAlign: 'center', fontWeight: 'bold', color: '#212529' }}>
                                    <EditableCell
                                      value={item.quantity}
                                      onSave={(value) => handleUpdateField(item.id, 'quantity', value)}
                                      type="number"
                                      isEditing={editingCell === `${item.id}-quantity`}
                                      onStartEdit={() => setEditingCell(`${item.id}-quantity`)}
                                    />
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'center' }}>
                                    <button
                                      onClick={() => handleDelete(item.id)}
                                      style={{
                                        padding: '6px 12px',
                                        background: 'white',
                                        color: '#dc3545',
                                        border: '1px solid #dc3545',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseOver={e => {
                                        e.currentTarget.style.background = '#dc3545'
                                        e.currentTarget.style.color = 'white'
                                      }}
                                      onMouseOut={e => {
                                        e.currentTarget.style.background = 'white'
                                        e.currentTarget.style.color = '#dc3545'
                                      }}
                                    >
                                      Удалить
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default App