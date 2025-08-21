import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/supabase'

type MaterialsDatabase = Database['public']['Tables']['materials_database']['Row']
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
      const { data, error } = await supabase
        .from('materials_database')
        .select('*')
        .order('code', { ascending: true })

      if (error) throw error
      setMaterialsDatabase(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching materials database:', err)
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