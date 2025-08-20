import { useState } from 'react'
import * as XLSX from 'xlsx'
import type { Json } from '../types/supabase'

interface FileUploadProps {
  onDataParsed: (fileName: string, sheetName: string | null, data: Array<{ rowNumber: number; data: Json }>) => void
}

export function FileUpload({ onDataParsed }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<Array<{ rowNumber: number; data: Json }>>([])
  const [fileName, setFileName] = useState<string>('')
  const [sheetName, setSheetName] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFileName(selectedFile.name)
      parseExcel(selectedFile)
    }
  }

  const parseExcel = async (file: File) => {
    setIsProcessing(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      
      // Получаем первый лист
      const firstSheetName = workbook.SheetNames[0]
      setSheetName(firstSheetName)
      
      const worksheet = workbook.Sheets[firstSheetName]
      
      // Конвертируем в JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        dateNF: 'yyyy-mm-dd'
      })
      
      // Преобразуем данные с номерами строк
      const dataWithRowNumbers = jsonData.map((row, index) => ({
        rowNumber: index + 2, // +2 потому что индекс с 0, а в Excel первая строка - заголовки
        data: row as Json
      }))
      
      setParsedData(dataWithRowNumbers)
    } catch (error) {
      console.error('Ошибка при парсинге файла:', error)
      alert('Ошибка при чтении файла Excel')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveToDatabase = () => {
    if (parsedData.length > 0) {
      onDataParsed(fileName, sheetName || null, parsedData)
      // Очищаем после сохранения
      setFile(null)
      setParsedData([])
      setFileName('')
      setSheetName('')
      // Очищаем input
      const input = document.getElementById('file-input') as HTMLInputElement
      if (input) input.value = ''
    }
  }

  return (
    <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>Загрузка Excel файла</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={{ marginBottom: '10px' }}
        />
        
        {file && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
            <strong>Выбранный файл:</strong> {fileName}
            <br />
            <strong>Лист:</strong> {sheetName}
            <br />
            <strong>Количество строк:</strong> {parsedData.length}
          </div>
        )}
      </div>
      
      {parsedData.length > 0 && (
        <>
          <button
            onClick={handleSaveToDatabase}
            disabled={isProcessing}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              marginBottom: '20px'
            }}
          >
            {isProcessing ? 'Обработка...' : 'Записать в базу данных'}
          </button>
          
          <div style={{ marginTop: '20px' }}>
            <h3>Предпросмотр данных (первые 5 строк):</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>№</th>
                    {parsedData.length > 0 && Object.keys(parsedData[0].data as object).map(key => (
                      <th key={key} style={{ border: '1px solid #ddd', padding: '8px' }}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.rowNumber}</td>
                      {Object.values(row.data as object).map((value, i) => (
                        <td key={i} style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 5 && (
                <p style={{ marginTop: '10px', color: '#666' }}>
                  ...и еще {parsedData.length - 5} строк
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}