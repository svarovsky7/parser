import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/supabase'

// Используем prise_list_etm как источник материалов для подбора
interface MaterialsDatabase {
  id: number
  code: string
  name: string
  manufacturer: string
  unit: string
  price: number
  source: string
}

type MaterialsData = Database['public']['Tables']['materials_data']['Row']
type MaterialsDataInsert = Database['public']['Tables']['materials_data']['Insert']

export function useMaterialsData() {
  const [materialsDatabase, setMaterialsDatabase] = useState<MaterialsDatabase[]>([])
  const [materialsData, setMaterialsData] = useState<MaterialsData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchMaterialsDatabase()
    fetchMaterialsData()
  }, [])

  async function fetchMaterialsDatabase() {
    try {
      setLoading(true)
      console.log('🔍 Загрузка материалов из prise_list_etm...')
      
      // Загружаем данные из таблицы prise_list_etm для подбора материалов
      const { data, error } = await supabase
        .from('prise_list_etm')
        .select('id, name, brand, article, brand_code')
        .limit(5000) // Ограничиваем количество для производительности
        .order('id', { ascending: true })

      if (error) {
        console.error('❌ Ошибка загрузки из prise_list_etm:', error)
        throw error
      }
      
      // Преобразуем данные в формат MaterialsDatabase
      const materials: MaterialsDatabase[] = (data || []).map(item => ({
        id: item.id,
        code: item.brand_code || item.article || `ID${item.id}`,
        name: item.name || 'Без названия',
        manufacturer: item.brand || 'Неизвестный',
        unit: 'шт.',
        price: 0,
        source: 'prise_list_etm'
      }))
      
      console.log(`✅ Загружено ${materials.length} материалов из prise_list_etm`)
      setMaterialsDatabase(materials)
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching materials from prise_list_etm:', err)
      setMaterialsDatabase([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchMaterialsData() {
    try {
      const { data, error } = await supabase
        .from('materials_data')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterialsData(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching materials data:', err)
    }
  }

  async function addMaterialsData(materials: MaterialsDataInsert[]) {
    try {
      const { data, error } = await supabase
        .from('materials_data')
        .insert(materials)
        .select()

      if (error) throw error
      
      if (data) {
        setMaterialsData([...data, ...materialsData])
      }
      
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  async function updateMaterialData(id: string, updates: Partial<MaterialsData>) {
    try {
      const { data, error } = await supabase
        .from('materials_data')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setMaterialsData(materialsData.map(item => item.id === id ? data : item))
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  async function deleteMaterialData(id: string) {
    try {
      const { error } = await supabase
        .from('materials_data')
        .delete()
        .eq('id', id)

      if (error) throw error
      setMaterialsData(materialsData.filter(item => item.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function clearAllMaterialsData() {
    try {
      const { error } = await supabase
        .from('materials_data')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (error) throw error
      setMaterialsData([])
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  return {
    materialsDatabase,
    materialsData,
    loading,
    error,
    addMaterialsData,
    updateMaterialData,
    deleteMaterialData,
    clearAllMaterialsData,
    refetch: () => {
      fetchMaterialsDatabase()
      fetchMaterialsData()
    }
  }
}