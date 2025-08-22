import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Product, ProductImport } from '../types/product'

export function useProductsData() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const importProducts = async (products: ProductImport[], onProgress?: (progress: number, imported: number) => void) => {
    setLoading(true)
    setError(null)
    
    try {
      const BATCH_SIZE = 1000 // Process 1000 records at a time
      let totalImported = 0
      let totalUpdated = 0
      const errors: string[] = []
      
      // Process in batches
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE)
        const progress = Math.round((i / products.length) * 100)
        
        // Report progress
        if (onProgress) {
          onProgress(progress, totalImported)
        }
        
        try {
          // Check existing products for this batch
          const batchIds = batch.map(p => p.id)
          const { data: existingProducts } = await supabase
            .from('prise_list_etm')
            .select('id')
            .in('id', batchIds)
          
          const existingIds = new Set(existingProducts?.map(p => p.id) || [])
          const batchUpdatedCount = batch.filter(p => existingIds.has(p.id)).length
          
          // Convert batch to database format (для таблицы prise_list_etm)
          const batchData = batch.map(product => ({
            id: Number(product.id),
            name: product.name || 'Не указано',
            brand: product.brand || 'Не указан', 
            article: product.article || null,
            brand_code: product.brand_code || 'НК',
            cli_code: product.cli_code || null,
            class: product.class || 'Без категории',
            class_code: Number(product.class_code) || 1
          }))

          // Upsert batch
          const { error } = await supabase
            .from('prise_list_etm')
            .upsert(batchData, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })
            .select()

          if (error) {
            throw error
          }

          // Only count records that were actually processed
          const batchNewCount = batch.length - batchUpdatedCount
          totalImported += batchNewCount
          totalUpdated += batchUpdatedCount
          
          // Small delay to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } catch (batchError) {
          const errorMsg = batchError instanceof Error ? batchError.message : 'Unknown batch error'
          errors.push(`Ошибка в пакете ${Math.floor(i / BATCH_SIZE) + 1}: ${errorMsg}`)
          console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, batchError)
        }
      }
      
      // Final progress update
      if (onProgress) {
        onProgress(100, totalImported + totalUpdated)
      }

      return {
        success: errors.length === 0,
        imported: totalImported,
        updated: totalUpdated,
        errors
      }
    } catch (err) {
      console.error('Import error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(err as Error)
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: [errorMessage]
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async (): Promise<Product[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('prise_list_etm')
        .select('*')
        .order('id', { ascending: true })
        .limit(1000) // Ограничиваем для отображения в таблице

      if (error) {
        throw error
      }

      return data || []
    } catch (err) {
      setError(err as Error)
      return []
    } finally {
      setLoading(false)
    }
  }

  const fetchProductsCount = async (): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('prise_list_etm')
        .select('*', { count: 'exact', head: true }) // Получаем только количество, не загружая данные

      if (error) {
        throw error
      }

      return count || 0
    } catch (err) {
      console.error('Ошибка получения количества товаров:', err)
      return 0
    }
  }

  const deleteAllProducts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('prise_list_etm')
        .delete()
        .neq('id', -1) // Delete all records

      if (error) {
        throw error
      }

      return { success: true }
    } catch (err) {
      setError(err as Error)
      return { success: false, error: err as Error }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    importProducts,
    fetchProducts,
    fetchProductsCount,
    deleteAllProducts
  }
}