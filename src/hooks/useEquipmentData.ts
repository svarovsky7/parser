import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/supabase'

type EquipmentData = Database['public']['Tables']['equipment_data']['Row']
type EquipmentInsert = Database['public']['Tables']['equipment_data']['Insert']

export function useEquipmentData() {
  const [equipmentData, setEquipmentData] = useState<EquipmentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchEquipmentData()
  }, [])

  async function fetchEquipmentData() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('equipment_data')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setEquipmentData(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  async function addEquipmentData(equipmentRows: EquipmentInsert[]) {
    try {
      const { data, error } = await supabase
        .from('equipment_data')
        .insert(equipmentRows)
        .select()

      if (error) throw error
      
      if (data) {
        setEquipmentData([...data, ...equipmentData])
      }
      
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  async function deleteEquipmentData(id: string) {
    try {
      const { error } = await supabase
        .from('equipment_data')
        .delete()
        .eq('id', id)

      if (error) throw error
      setEquipmentData(equipmentData.filter(item => item.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function deleteByFileName(fileName: string) {
    try {
      const { error } = await supabase
        .from('equipment_data')
        .delete()
        .eq('file_name', fileName)

      if (error) throw error
      setEquipmentData(equipmentData.filter(item => item.file_name !== fileName))
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function clearAllData() {
    try {
      const { error } = await supabase
        .from('equipment_data')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Удаляем все записи

      if (error) throw error
      setEquipmentData([])
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function updateEquipmentData(id: string, updates: Partial<EquipmentData>) {
    try {
      const { data, error } = await supabase
        .from('equipment_data')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setEquipmentData(equipmentData.map(item => item.id === id ? data : item))
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  return {
    equipmentData,
    loading,
    error,
    addEquipmentData,
    deleteEquipmentData,
    deleteByFileName,
    clearAllData,
    updateEquipmentData,
    refetch: fetchEquipmentData
  }
}