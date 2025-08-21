import { create } from 'zustand'
import { produce } from 'immer'
import type { MaterialRow } from '../types/material'

interface State {
  rows: MaterialRow[]
  selectedIds: string[]
  dirty: boolean
  history: MaterialRow[][]
  future: MaterialRow[][]
  filter: string
  hiddenColumns: string[]
  rightPanelOpen: boolean
}

interface Actions {
  setRows: (rows: MaterialRow[]) => void
  patchCell: (id: string, patch: Partial<MaterialRow>) => void
  patchMultiple: (ids: string[], patch: Partial<MaterialRow>) => void
  setSelected: (ids: string[]) => void
  toggleSelected: (id: string) => void
  selectAll: () => void
  deselectAll: () => void
  undo: () => void
  redo: () => void
  clear: (onlySelected?: boolean) => void
  setFilter: (filter: string) => void
  toggleColumn: (columnKey: string) => void
  setHiddenColumns: (columns: string[]) => void
  setRightPanelOpen: (open: boolean) => void
  markClean: () => void
  deleteRows: (ids: string[]) => void
  duplicateRows: (ids: string[]) => void
  reorderRows: (startIndex: number, endIndex: number) => void
}

export const useRows = create<State & Actions>((set) => ({
  // State
  rows: [],
  selectedIds: [],
  dirty: false,
  history: [],
  future: [],
  filter: '',
  hiddenColumns: localStorage.getItem('hiddenColumns')?.split(',') || [],
  rightPanelOpen: false,

  // Actions
  setRows: (rows) => 
    set((state) => ({
      rows,
      dirty: true,
      history: [...state.history.slice(-19), state.rows], // Keep last 20 states
      future: []
    })),

  patchCell: (id, patch) =>
    set(
      produce((state: State) => {
        const row = state.rows.find(r => r.id === id)
        if (row) {
          Object.assign(row, patch, { updatedAt: new Date().toISOString() })
          state.dirty = true
          state.history.push(JSON.parse(JSON.stringify(state.rows)))
          if (state.history.length > 20) state.history.shift()
          state.future = []
        }
      })
    ),

  patchMultiple: (ids, patch) =>
    set(
      produce((state: State) => {
        const now = new Date().toISOString()
        state.rows.forEach(row => {
          if (ids.includes(row.id)) {
            Object.assign(row, patch, { updatedAt: now })
          }
        })
        state.dirty = true
        state.history.push(JSON.parse(JSON.stringify(state.rows)))
        if (state.history.length > 20) state.history.shift()
        state.future = []
      })
    ),

  setSelected: (ids) => set({ selectedIds: ids }),

  toggleSelected: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter(sid => sid !== id)
        : [...state.selectedIds, id]
    })),

  selectAll: () =>
    set((state) => ({
      selectedIds: state.rows.map(r => r.id)
    })),

  deselectAll: () => set({ selectedIds: [] }),

  undo: () =>
    set((state) => {
      if (state.history.length === 0) return state
      const previousRows = state.history[state.history.length - 1]
      return {
        rows: previousRows,
        history: state.history.slice(0, -1),
        future: [state.rows, ...state.future],
        dirty: true
      }
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state
      const nextRows = state.future[0]
      return {
        rows: nextRows,
        future: state.future.slice(1),
        history: [...state.history, state.rows],
        dirty: true
      }
    }),

  clear: (onlySelected) =>
    set((state) => {
      const rows = onlySelected 
        ? state.rows.filter(r => !state.selectedIds.includes(r.id))
        : []
      return {
        rows,
        selectedIds: [],
        dirty: true,
        history: [...state.history, state.rows],
        future: []
      }
    }),

  setFilter: (filter) => set({ filter }),

  toggleColumn: (columnKey) =>
    set((state) => {
      const hiddenColumns = state.hiddenColumns.includes(columnKey)
        ? state.hiddenColumns.filter(c => c !== columnKey)
        : [...state.hiddenColumns, columnKey]
      localStorage.setItem('hiddenColumns', hiddenColumns.join(','))
      return { hiddenColumns }
    }),

  setHiddenColumns: (columns) => {
    localStorage.setItem('hiddenColumns', columns.join(','))
    set({ hiddenColumns: columns })
  },

  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

  markClean: () => set({ dirty: false }),

  deleteRows: (ids) =>
    set((state) => ({
      rows: state.rows.filter(r => !ids.includes(r.id)),
      selectedIds: state.selectedIds.filter(id => !ids.includes(id)),
      dirty: true,
      history: [...state.history, state.rows],
      future: []
    })),

  duplicateRows: (ids) =>
    set((state) => {
      const toDuplicate = state.rows.filter(r => ids.includes(r.id))
      const duplicated = toDuplicate.map(row => ({
        ...row,
        id: crypto.randomUUID(),
        index: state.rows.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
      return {
        rows: [...state.rows, ...duplicated],
        dirty: true,
        history: [...state.history, state.rows],
        future: []
      }
    }),

  reorderRows: (startIndex, endIndex) =>
    set(
      produce((state: State) => {
        const [removed] = state.rows.splice(startIndex, 1)
        state.rows.splice(endIndex, 0, removed)
        // Recalculate indexes
        state.rows.forEach((row, i) => {
          row.index = i + 1
        })
        state.dirty = true
        state.history.push(JSON.parse(JSON.stringify(state.rows)))
        state.future = []
      })
    )
}))