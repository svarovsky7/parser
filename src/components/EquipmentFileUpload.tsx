import { useState } from 'react'
import * as XLSX from 'xlsx'
import type { Database } from '../types/supabase'

type EquipmentInsert = Database['public']['Tables']['equipment_data']['Insert']

interface EquipmentFileUploadProps {
  onDataParsed: (equipmentRows: EquipmentInsert[]) => void
}

// Маппинг заголовков Excel к полям базы данных
const COLUMN_MAPPING: Record<string, keyof EquipmentInsert> = {
  'Позиция': 'position',
  'позиция': 'position',
  'Наименования и технические характеристики': 'name_and_specs',
  'наименования и технические характеристики': 'name_and_specs',
  'Тип, марка, обозначение документов, опросного листа': 'type_mark_docs',
  'тип, марка, обозначение документов, опросного листа': 'type_mark_docs',
  'Код оборудования, изделия, материалов, № опросного листа': 'equipment_code',
  'код оборудования, изделия, материалов, № опросного листа': 'equipment_code',
  'Завод изготовитель': 'manufacturer',
  'завод изготовитель': 'manufacturer',
  'Единица измерения': 'unit_measure',
  'единица измерения': 'unit_measure',
  'Кол-во': 'quantity',
  'кол-во': 'quantity',
  'Количество': 'quantity',
  'количество': 'quantity'
}

export function EquipmentFileUpload({ onDataParsed }: EquipmentFileUploadProps) {
  const [parsedData, setParsedData] = useState<EquipmentInsert[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadStep, setUploadStep] = useState<'select' | 'preview' | 'saved'>('select')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFileName(selectedFile.name)
      parseExcel(selectedFile)
    }
  }

  const normalizeHeader = (header: string): string => {
    // Удаляем лишние пробелы, переносы строк и специальные символы
    return header
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const parseExcel = async (file: File) => {
    setIsProcessing(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      
      // Получаем первый лист
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // Конвертируем в JSON с сохранением заголовков
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        dateNF: 'yyyy-mm-dd'
      })
      
      if (jsonData.length === 0) {
        alert('❌ Файл не содержит данных')
        resetUpload()
        return
      }

      // Получаем заголовки из первой строки (для проверки структуры)
      Object.keys(jsonData[0] as object).map(normalizeHeader)
      
      // Преобразуем данные согласно маппингу
      const equipmentRows: EquipmentInsert[] = jsonData.map((row: unknown) => {
        const mappedRow: EquipmentInsert = {
          file_name: file.name
        }
        
        // Проходим по каждому заголовку и маппим на поля БД
        Object.entries(row as Record<string, unknown>).forEach(([key, value]) => {
          const normalizedKey = normalizeHeader(key)
          
          // Пробуем найти соответствие в маппинге
          let dbField: keyof EquipmentInsert | undefined
          
          // Сначала точное совпадение
          if (COLUMN_MAPPING[normalizedKey]) {
            dbField = COLUMN_MAPPING[normalizedKey]
          } else {
            // Если нет точного совпадения, ищем частичное
            for (const [mapKey, mapValue] of Object.entries(COLUMN_MAPPING)) {
              if (normalizedKey.toLowerCase().includes(mapKey.toLowerCase()) || 
                  mapKey.toLowerCase().includes(normalizedKey.toLowerCase())) {
                dbField = mapValue
                break
              }
            }
          }
          
          if (dbField && value !== null && value !== undefined) {
            if (dbField === 'position' || dbField === 'quantity') {
              // Преобразуем в число для числовых полей
              const numValue = Number(value)
              if (!isNaN(numValue)) {
                ;(mappedRow as Record<string, unknown>)[dbField] = numValue
              }
            } else {
              // Для текстовых полей
              ;(mappedRow as Record<string, unknown>)[dbField] = String(value).trim()
            }
          }
        })
        
        return mappedRow
      })
      
      setParsedData(equipmentRows)
      setUploadStep('preview')
    } catch (error) {
      console.error('Ошибка при парсинге файла:', error)
      alert('❌ Ошибка при чтении файла Excel. Проверьте формат файла.')
      resetUpload()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveToDatabase = async () => {
    if (parsedData.length > 0) {
      setIsProcessing(true)
      await onDataParsed(parsedData)
      setUploadStep('saved')
      setTimeout(() => {
        resetUpload()
      }, 3000)
    }
  }

  const resetUpload = () => {
    setParsedData([])
    setFileName('')
    setUploadStep('select')
    setIsProcessing(false)
    // Очищаем input
    const input = document.getElementById('equipment-file-input') as HTMLInputElement
    if (input) input.value = ''
  }

  return (
    <div style={{ 
      marginBottom: '30px', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '12px',
      padding: '2px'
    }}>
      <div style={{ 
        background: 'white',
        borderRadius: '10px',
        padding: '30px'
      }}>
        {/* Заголовок с шагами */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', color: '#333' }}>
            Загрузка спецификации оборудования
          </h2>
          
          {/* Индикатор шагов */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ 
              position: 'absolute', 
              top: '20px', 
              left: '10%', 
              right: '10%', 
              height: '2px',
              background: '#e0e0e0',
              zIndex: 0
            }}>
              <div style={{
                width: uploadStep === 'select' ? '0%' : uploadStep === 'preview' ? '50%' : '100%',
                height: '100%',
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                transition: 'width 0.3s ease'
              }} />
            </div>
            
            {[
              { step: 'select', label: 'Выбор файла', icon: '📁' },
              { step: 'preview', label: 'Проверка данных', icon: '👁️' },
              { step: 'saved', label: 'Сохранение', icon: '✅' }
            ].map((item, index) => (
              <div key={item.step} style={{ 
                flex: 1, 
                textAlign: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: uploadStep === item.step || (uploadStep === 'preview' && index < 1) || (uploadStep === 'saved' && index < 2) 
                    ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                    : '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                  fontSize: '20px',
                  color: 'white',
                  transition: 'all 0.3s ease'
                }}>
                  {item.icon}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: uploadStep === item.step ? '#667eea' : '#999',
                  fontWeight: uploadStep === item.step ? 'bold' : 'normal'
                }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Контент в зависимости от шага */}
        {uploadStep === 'select' && (
          <div style={{ textAlign: 'center' }}>
            <label htmlFor="equipment-file-input" style={{
              display: 'inline-block',
              padding: '60px 40px',
              border: '2px dashed #667eea',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: '#f8f9ff'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f0f2ff'}
            onMouseOut={e => e.currentTarget.style.background = '#f8f9ff'}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                Нажмите для выбора файла
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                или перетащите Excel файл сюда
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '16px' }}>
                Поддерживаются форматы: .xlsx, .xls
              </div>
            </label>
            <input
              id="equipment-file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {uploadStep === 'preview' && parsedData.length > 0 && (
          <div>
            <div style={{ 
              background: '#f8f9ff', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Выбранный файл:</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{fileName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
                  {parsedData.length}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>записей</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#333' }}>
                Предпросмотр данных (первые 5 записей)
              </h3>
              <div style={{ 
                overflowX: 'auto', 
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#666', fontWeight: '600', borderBottom: '2px solid #e0e0e0' }}>Поз.</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#666', fontWeight: '600', borderBottom: '2px solid #e0e0e0' }}>Наименование</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#666', fontWeight: '600', borderBottom: '2px solid #e0e0e0' }}>Тип/Марка</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#666', fontWeight: '600', borderBottom: '2px solid #e0e0e0' }}>Код</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#666', fontWeight: '600', borderBottom: '2px solid #e0e0e0' }}>Производитель</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', color: '#666', fontWeight: '600', borderBottom: '2px solid #e0e0e0' }}>Ед.</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', color: '#666', fontWeight: '600', borderBottom: '2px solid #e0e0e0' }}>Кол-во</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '10px 8px', color: '#333', fontWeight: 'bold' }}>
                          {row.position || '-'}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#333' }}>
                          {row.name_and_specs || '-'}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#666', fontSize: '12px' }}>
                          {row.type_mark_docs || '-'}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#666', fontSize: '12px' }}>
                          {row.equipment_code || '-'}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#333', fontWeight: '500' }}>
                          {row.manufacturer || '-'}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#666', textAlign: 'center' }}>
                          {row.unit_measure || '-'}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#333', textAlign: 'center', fontWeight: 'bold' }}>
                          {row.quantity || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 5 && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px', 
                  background: '#f8f9ff',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#666',
                  textAlign: 'center'
                }}>
                  Показаны первые 5 записей из {parsedData.length}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={resetUpload}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  background: 'white',
                  color: '#666',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = '#999'
                  e.currentTarget.style.color = '#333'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = '#e0e0e0'
                  e.currentTarget.style.color = '#666'
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleSaveToDatabase}
                disabled={isProcessing}
                style={{
                  flex: 2,
                  padding: '14px 24px',
                  fontSize: '16px',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  background: isProcessing ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                  opacity: isProcessing ? 0.6 : 1
                }}
                onMouseOver={e => {
                  if (!isProcessing) e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {isProcessing ? '⏳ Сохранение...' : '💾 Сохранить в базу данных'}
              </button>
            </div>
          </div>
        )}

        {uploadStep === 'saved' && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <h3 style={{ fontSize: '24px', color: '#4CAF50', marginBottom: '12px' }}>
              Данные успешно сохранены!
            </h3>
            <p style={{ color: '#666', fontSize: '16px' }}>
              {parsedData.length} записей добавлено в базу данных
            </p>
          </div>
        )}
      </div>
    </div>
  )
}