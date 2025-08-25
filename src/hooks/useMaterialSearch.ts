import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface MaterialSearchResult {
  id: number
  name: string
  brand: string
  article: string | null
  brand_code: string
  cli_code: string | null
  class: string
  class_code: string
  similarity_score?: number
  match_score?: number
}

export const useMaterialSearch = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Поиск по сходству названий (используя pg_trgm)
  const searchBySimilarity = useCallback(async (
    searchName: string,
    similarityThreshold: number = 0.3,
    limitResults: number = 10
  ): Promise<MaterialSearchResult[]> => {
    if (!searchName.trim()) {
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: dbError } = await supabase
        .rpc('search_materials_by_name', {
          search_name: searchName,
          similarity_threshold: similarityThreshold,
          limit_results: limitResults
        })

      if (dbError) {
        console.error('❌ Ошибка поиска по сходству:', dbError)
        setError(dbError.message)
        return []
      }

      console.log(`🔍 Найдено ${data?.length || 0} материалов по сходству для "${searchName}"`)
      return data || []

    } catch (err) {
      console.error('❌ Ошибка при поиске материалов:', err)
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Поиск точных совпадений
  const findExactMatches = useCallback(async (
    searchName: string
  ): Promise<MaterialSearchResult[]> => {
    if (!searchName.trim()) {
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: dbError } = await supabase
        .rpc('find_exact_material_matches', {
          search_name: searchName
        })

      if (dbError) {
        console.error('❌ Ошибка точного поиска:', dbError)
        setError(dbError.message)
        return []
      }

      console.log(`🎯 Найдено ${data?.length || 0} точных совпадений для "${searchName}"`)
      return data || []

    } catch (err) {
      console.error('❌ Ошибка при точном поиске:', err)
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Поиск по ключевым словам
  const searchByKeywords = useCallback(async (
    searchName: string,
    minWordLength: number = 3,
    limitResults: number = 10
  ): Promise<MaterialSearchResult[]> => {
    if (!searchName.trim()) {
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: dbError } = await supabase
        .rpc('search_materials_by_keywords', {
          search_name: searchName,
          min_word_length: minWordLength,
          limit_results: limitResults
        })

      if (dbError) {
        console.error('❌ Ошибка поиска по ключевым словам:', dbError)
        setError(dbError.message)
        return []
      }

      console.log(`🔑 Найдено ${data?.length || 0} материалов по ключевым словам для "${searchName}"`)
      return data || []

    } catch (err) {
      console.error('❌ Ошибка при поиске по ключевым словам:', err)
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Комбинированный поиск (сначала точные совпадения, потом по сходству, затем по ключевым словам)
  const searchMaterials = useCallback(async (
    searchName: string,
    options?: {
      similarityThreshold?: number
      minWordLength?: number
      limitResults?: number
    }
  ): Promise<MaterialSearchResult[]> => {
    const {
      similarityThreshold = 0.3,
      minWordLength = 3,
      limitResults = 10
    } = options || {}

    if (!searchName.trim()) {
      return []
    }

    console.log(`🔍 Комбинированный поиск для: "${searchName}"`)

    try {
      // 1. Сначала ищем точные совпадения
      const exactMatches = await findExactMatches(searchName)
      if (exactMatches.length > 0) {
        console.log(`✅ Найдены точные совпадения: ${exactMatches.length}`)
        return exactMatches.slice(0, limitResults)
      }

      // 2. Потом поиск по ключевым словам
      const keywordMatches = await searchByKeywords(searchName, minWordLength, limitResults)
      if (keywordMatches.length > 0) {
        console.log(`✅ Найдены совпадения по ключевым словам: ${keywordMatches.length}`)
        return keywordMatches
      }

      // 3. И в конце поиск по сходству
      const similarityMatches = await searchBySimilarity(searchName, similarityThreshold, limitResults)
      console.log(`✅ Найдены совпадения по сходству: ${similarityMatches.length}`)
      return similarityMatches

    } catch (err) {
      console.error('❌ Ошибка комбинированного поиска:', err)
      return []
    }
  }, [findExactMatches, searchByKeywords, searchBySimilarity])

  return {
    loading,
    error,
    searchBySimilarity,
    findExactMatches, 
    searchByKeywords,
    searchMaterials
  }
}