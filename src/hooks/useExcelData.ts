import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database, Json } from '../types/supabase'

type ExcelData = Database['public']['Tables']['excel_data']['Row']

export function useExcelData() {
  const [excelData, setExcelData] = useState<ExcelData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchExcelData()
  }, [])

  async function fetchExcelData() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('excel_data')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setExcelData(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  async function addExcelData(
    fileName: string,
    sheetName: string | null,
    rowsData: Array<{ rowNumber: number; data: Json }>
  ) {
    try {
      const insertData = rowsData.map(({ rowNumber, data }) => ({
        file_name: fileName,
        sheet_name: sheetName,
        row_number: rowNumber,
        data: data
      }))

      const { data, error } = await supabase
        .from('excel_data')
        .insert(insertData)
        .select()

      if (error) throw error
      
      if (data) {
        setExcelData([...data, ...excelData])
      }
      
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  async function deleteExcelData(id: string) {
    try {
      const { error } = await supabase
        .from('excel_data')
        .delete()
        .eq('id', id)

      if (error) throw error
      setExcelData(excelData.filter(item => item.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function deleteByFileName(fileName: string) {
    try {
      const { error } = await supabase
        .from('excel_data')
        .delete()
        .eq('file_name', fileName)

      if (error) throw error
      setExcelData(excelData.filter(item => item.file_name !== fileName))
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  return {
    excelData,
    loading,
    error,
    addExcelData,
    deleteExcelData,
    deleteByFileName,
    refetch: fetchExcelData
  }
}