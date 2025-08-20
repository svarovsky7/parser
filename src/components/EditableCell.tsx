import { useState, useEffect, useRef } from 'react'

interface EditableCellProps {
  value: string | number | null
  onSave: (value: string | number | null) => void
  type?: 'text' | 'number'
  isEditing: boolean
  onStartEdit: () => void
}

export function EditableCell({ value, onSave, type = 'text', isEditing, onStartEdit }: EditableCellProps) {
  const [editValue, setEditValue] = useState(value?.toString() || '')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(value?.toString() || '')
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    let finalValue: string | number | null = editValue
    
    if (type === 'number') {
      const numValue = parseFloat(editValue)
      finalValue = isNaN(numValue) ? null : numValue
    } else {
      finalValue = editValue.trim() || null
    }
    
    onSave(finalValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(value?.toString() || '')
      onSave(value)
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type === 'number' ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          padding: '8px',
          border: '2px solid #667eea',
          borderRadius: '4px',
          fontSize: '14px',
          background: 'white',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />
    )
  }

  return (
    <div
      onClick={onStartEdit}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      style={{
        padding: '8px',
        cursor: 'pointer',
        borderRadius: '4px',
        transition: 'all 0.2s ease',
        background: isFocused ? '#f0f2ff' : 'transparent',
        border: '2px solid transparent',
        position: 'relative',
        minHeight: '20px',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <span style={{ flex: 1 }}>{value || '-'}</span>
      {isFocused && (
        <span style={{
          fontSize: '12px',
          color: '#667eea',
          marginLeft: '8px'
        }}>
          ✏️
        </span>
      )}
    </div>
  )
}