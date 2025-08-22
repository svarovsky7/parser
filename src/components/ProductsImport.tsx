import React, { useState, useRef } from 'react'
import { Upload, Database, Trash2, CheckCircle, AlertCircle, Download, FileSpreadsheet, Package, RefreshCw } from 'lucide-react'
import { useProductsData } from '../hooks/useProductsData'
import { parseCSV } from '../lib/csvParser'
import type { Product, ProductImport } from '../types/product'

export const ProductsImport: React.FC = () => {
  const [parsedData, setParsedData] = useState<ProductImport[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; details?: string } | null>(null)
  const [newlyImportedIds, setNewlyImportedIds] = useState<Set<number>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { loading, error, importProducts, fetchProducts, deleteAllProducts } = useProductsData()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Пожалуйста, выберите CSV файл')
      return
    }

    try {
      const text = await file.text()
      const result = parseCSV(text)
      
      setParsedData(result.data)
      setParseErrors(result.errors)
      setImportResult(null)
      
      if (result.success) {
        console.log(`Парсинг успешен: ${result.data.length} записей из ${result.total}`)
      } else {
        console.error('Ошибки парсинга:', result.errors)
      }
    } catch (err) {
      console.error('Ошибка чтения файла:', err)
      alert('Ошибка при чтении файла')
    }
  }

  const handleImport = async () => {
    if (parsedData.length === 0) {
      alert('Нет данных для импорта')
      return
    }

    setImporting(true)
    setImportResult(null)
    setImportProgress(0)
    setImportedCount(0)

    try {
      const result = await importProducts(parsedData, (progress, imported) => {
        setImportProgress(progress)
        setImportedCount(imported)
      })
      
      if (result.success) {
        // Сохраняем ID импортированных товаров для подсветки
        const importedIds = new Set(parsedData.map(p => p.id))
        setNewlyImportedIds(importedIds)
        
        const updatedCount = result.updated || 0
        const insertedCount = result.imported
        
        setImportResult({
          success: true,
          message: `✅ Операция завершена успешно!`,
          details: `Добавлено новых: ${insertedCount} | Обновлено существующих: ${updatedCount} | Всего обработано: ${insertedCount + updatedCount}`
        })
        
        // Очищаем данные предпросмотра
        setParsedData([])
        setParseErrors([])
        
        // Обновляем таблицу с товарами
        await loadProducts()
        
        // Очищаем input файла
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        // Прокручиваем к таблице с товарами
        setTimeout(() => {
          document.querySelector('#products-table')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          })
        }, 100)
        
        // Убираем подсветку через 5 секунд
        setTimeout(() => {
          setNewlyImportedIds(new Set())
        }, 5000)
      } else {
        setImportResult({
          success: false,
          message: `❌ Ошибка импорта: ${result.errors.join(', ')}`
        })
      }
    } catch (err) {
      setImportResult({
        success: false,
        message: `❌ Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
      })
    } finally {
      setImporting(false)
    }
  }

  const loadProducts = async () => {
    const data = await fetchProducts()
    setProducts(data)
  }

  const handleClearAll = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить ВСЕ товары из базы данных?')) {
      return
    }

    const result = await deleteAllProducts()
    if (result.success) {
      setProducts([])
      alert('Все товары удалены')
    } else {
      alert('Ошибка при удалении товаров')
    }
  }

  const downloadSampleCSV = () => {
    const sampleData = [
      'id,name,brand,article,brand_code,cli_code,class,class_code',
      '1,"Товар 1","Бренд А","ART001","BR001","CLI001","Категория 1",100',
      '2,"Товар 2","Бренд Б","ART002","BR002","","Категория 2",200',
      '3,"Товар 3","Бренд В","","BR003","CLI003","Категория 1",100',
      '4,"","","","","","",""'
    ].join('\n')
    
    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'sample_products.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Load products on component mount
  React.useEffect(() => {
    loadProducts()
  }, [])

  // Стили в стиле MaterialsTable
  const styles = `
    .products-container {
      min-height: 100vh;
      background-color: #f9fafb;
      padding: 16px;
      width: 100%;
      box-sizing: border-box;
    }
    
    .products-wrapper {
      width: 100%;
      max-width: 100%;
      margin: 0;
    }
    
    .products-header {
      margin-bottom: 24px;
    }
    
    .products-title {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }
    
    .products-subtitle {
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
      margin-bottom: 24px;
    }
    
    .table-scroll {
      overflow-x: auto;
      width: 100%;
    }
    
    .products-table {
      width: 100%;
      min-width: fit-content;
      table-layout: auto;
      border-collapse: separate;
      border-spacing: 0;
    }
    
    .table-header {
      background: linear-gradient(to right, #f9fafb, #f3f4f6);
    }
    
    .table-header th {
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      border-right: 1px solid #e5e7eb;
      border-bottom: 2px solid #d1d5db;
      position: relative;
      user-select: none;
    }
    
    .table-row {
      transition: all 0.2s;
    }
    
    .table-row:hover {
      background-color: #f8fafc;
    }
    
    .table-row.newly-imported {
      background-color: #f0fdf4;
      animation: highlight 0.5s ease-out;
    }
    
    @keyframes highlight {
      from { background-color: #bbf7d0; }
      to { background-color: #f0fdf4; }
    }
    
    .table-cell {
      padding: 12px 16px;
      border-right: 1px solid #f3f4f6;
      border-bottom: 1px solid #f3f4f6;
      font-size: 14px;
      color: #374151;
    }
    
    .alert {
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .alert-success {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }
    
    .alert-warning {
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }
    
    .alert-error {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    
    .upload-area {
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      padding: 32px;
      text-align: center;
      background-color: #fafafa;
      transition: all 0.2s;
    }
    
    .upload-area:hover {
      border-color: #2563eb;
      background-color: #f8fafc;
    }
    
    .upload-icon {
      width: 48px;
      height: 48px;
      color: #9ca3af;
      margin: 0 auto 16px;
    }
    
    .new-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      margin-left: 8px;
      background-color: #16a34a;
      color: white;
      font-size: 10px;
      font-weight: bold;
      border-radius: 4px;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      padding: 16px;
    }
    
    .stat-title {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
    }
  `

  return (
    <div className="products-container">
      <style>{styles}</style>
      
      <div className="products-wrapper">
        {/* Header */}
        <div className="products-header">
          <h1 className="products-title">Импорт товаров</h1>
          <p className="products-subtitle">Загрузите CSV файл с данными о товарах для импорта в базу данных</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-title">Всего товаров в БД</div>
            <div className="stat-value">{products.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Последний импорт</div>
            <div className="stat-value">{newlyImportedIds.size > 0 ? newlyImportedIds.size : '-'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Статус системы</div>
            <div className="stat-value" style={{ color: '#16a34a', fontSize: '18px' }}>Активна</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-content">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-blue"
            >
              <Upload size={16} />
              Выбрать CSV файл
            </button>
            
            <button
              onClick={downloadSampleCSV}
              className="btn btn-gray"
            >
              <Download size={16} />
              Скачать пример
            </button>

            {parsedData.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="btn btn-green"
                >
                  {importing ? (
                    <>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Импорт... {importProgress}% ({importedCount} из {parsedData.length})
                    </>
                  ) : (
                    <>
                      <Database size={16} />
                      Импортировать в БД ({parsedData.length})
                    </>
                  )}
                </button>
                {importing && (
                  <div style={{ 
                    width: '200px', 
                    height: '4px', 
                    backgroundColor: '#e5e7eb', 
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${importProgress}%`,
                      height: '100%',
                      backgroundColor: '#16a34a',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                )}
              </div>
            )}

            {products.length > 0 && (
              <button
                onClick={handleClearAll}
                className="btn btn-red"
              >
                <Trash2 size={16} />
                Очистить всё
              </button>
            )}
          </div>
        </div>

        {/* Parse Errors */}
        {parseErrors.length > 0 && (
          <div className="alert alert-warning">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertCircle size={20} style={{ color: '#92400e', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '8px' }}>Предупреждения при парсинге:</div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {parseErrors.slice(0, 5).map((error, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{error}</li>
                  ))}
                  {parseErrors.length > 5 && (
                    <li style={{ fontWeight: '600' }}>... и еще {parseErrors.length - 5} предупреждений</li>
                  )}
                </ul>
                <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '500' }}>
                  💡 Данные с предупреждениями можно импортировать
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className={`alert ${importResult.success ? 'alert-success' : 'alert-error'}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                {importResult.success ? (
                  <CheckCircle size={24} style={{ color: '#166534' }} />
                ) : (
                  <AlertCircle size={24} style={{ color: '#991b1b' }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>
                  {importResult.message}
                </div>
                {importResult.details && (
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {importResult.details}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview Table */}
        {parsedData.length > 0 && (
          <div className="table-container">
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                Предварительный просмотр ({parsedData.length} записей)
              </h3>
            </div>
            <div className="table-scroll">
              <table className="products-table">
                <thead className="table-header">
                  <tr>
                    <th>ID</th>
                    <th>Наименование</th>
                    <th>Бренд</th>
                    <th>Артикул</th>
                    <th>Код бренда</th>
                    <th>Код клиента</th>
                    <th>Класс</th>
                    <th>Код класса</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 10).map((product) => (
                    <tr key={product.id} className="table-row">
                      <td className="table-cell" style={{ fontWeight: '600' }}>{product.id}</td>
                      <td className="table-cell">{product.name}</td>
                      <td className="table-cell">{product.brand}</td>
                      <td className="table-cell">{product.article || '-'}</td>
                      <td className="table-cell">{product.brand_code}</td>
                      <td className="table-cell">{product.cli_code || '-'}</td>
                      <td className="table-cell">{product.class}</td>
                      <td className="table-cell">{product.class_code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 10 && (
                <div style={{ textAlign: 'center', padding: '16px', color: '#6b7280', fontWeight: '500' }}>
                  Показаны первые 10 записей из {parsedData.length}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products Database Table */}
        <div id="products-table" className="table-container">
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              База данных товаров ({products.length} записей)
            </h3>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px' }}>
              <RefreshCw size={32} style={{ color: '#2563eb', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
              <div style={{ color: '#6b7280', fontWeight: '500' }}>Загрузка данных...</div>
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px' }}>
              <Package size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
              <div style={{ color: '#6b7280', fontWeight: '500', marginBottom: '8px' }}>База данных пуста</div>
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>Импортируйте CSV файл для добавления товаров</div>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="products-table">
                <thead className="table-header">
                  <tr>
                    <th>ID</th>
                    <th>Наименование</th>
                    <th>Бренд</th>
                    <th>Артикул</th>
                    <th>Код бренда</th>
                    <th>Код клиента</th>
                    <th>Класс</th>
                    <th>Код класса</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const isNewlyImported = newlyImportedIds.has(product.id)
                    return (
                      <tr 
                        key={product.id} 
                        className={`table-row ${isNewlyImported ? 'newly-imported' : ''}`}
                      >
                        <td className="table-cell" style={{ fontWeight: '600' }}>
                          {product.id}
                          {isNewlyImported && (
                            <span className="new-badge">NEW</span>
                          )}
                        </td>
                        <td className="table-cell">{product.name || '-'}</td>
                        <td className="table-cell">{product.brand || '-'}</td>
                        <td className="table-cell">{product.article || '-'}</td>
                        <td className="table-cell">{product.brand_code || '-'}</td>
                        <td className="table-cell">{product.cli_code || '-'}</td>
                        <td className="table-cell">{product.class || '-'}</td>
                        <td className="table-cell">{product.class_code}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={20} style={{ color: '#991b1b' }} />
              <div style={{ fontWeight: '500' }}>Ошибка: {error.message}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}