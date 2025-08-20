import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/supabase'

type User = Database['public']['Tables']['users']['Row']

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  async function addUser(email: string, name?: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ email, name }])
        .select()
        .single()

      if (error) throw error
      setUsers([data, ...users])
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  async function updateUser(id: string, updates: Partial<User>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setUsers(users.map(u => u.id === id ? data : u))
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  async function deleteUser(id: string) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (error) throw error
      setUsers(users.filter(u => u.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  return {
    users,
    loading,
    error,
    addUser,
    updateUser,
    deleteUser,
    refetch: fetchUsers
  }
}