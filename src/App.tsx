import { useState, useEffect } from 'react'
import './App.css'
import { supabase } from './lib/supabase'
import { useUsers } from './hooks/useSupabase'

function App() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const { users, loading, error, addUser, deleteUser } = useUsers()

  useEffect(() => {
    checkConnection()
  }, [])

  async function checkConnection() {
    try {
      const { error } = await supabase.from('users').select('count').limit(1)
      if (error && error.code === '42P01') {
        console.log('Таблица users не существует. Создайте её в Supabase Dashboard.')
        setConnectionStatus('error')
      } else if (error) {
        console.error('Ошибка подключения:', error)
        setConnectionStatus('error')
      } else {
        console.log('Успешно подключено к Supabase!')
        setConnectionStatus('connected')
      }
    } catch (err) {
      console.error('Ошибка:', err)
      setConnectionStatus('error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    
    const { error } = await addUser(email, name || undefined)
    if (error) {
      console.error('Ошибка добавления пользователя:', error)
    } else {
      setEmail('')
      setName('')
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>React + Supabase</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
        <strong>Статус подключения: </strong>
        {connectionStatus === 'checking' && 'Проверка...'}
        {connectionStatus === 'connected' && '✅ Подключено к Supabase'}
        {connectionStatus === 'error' && '❌ Ошибка подключения (проверьте настройки и таблицы)'}
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Добавить пользователя</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexDirection: 'column', maxWidth: '400px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '8px', fontSize: '16px' }}
          />
          <input
            type="text"
            placeholder="Имя (необязательно)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: '8px', fontSize: '16px' }}
          />
          <button type="submit" style={{ padding: '10px', fontSize: '16px', cursor: 'pointer' }}>
            Добавить
          </button>
        </form>
      </div>

      <div>
        <h2>Пользователи</h2>
        {loading && <p>Загрузка...</p>}
        {error && <p style={{ color: 'red' }}>Ошибка: {error.message}</p>}
        {!loading && !error && users.length === 0 && <p>Нет пользователей</p>}
        {!loading && !error && users.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {users.map((user) => (
              <li key={user.id} style={{ padding: '10px', border: '1px solid #ddd', marginBottom: '5px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{user.name || 'Без имени'}</strong> - {user.email}
                  <br />
                  <small style={{ color: '#666' }}>ID: {user.id}</small>
                </div>
                <button 
                  onClick={() => deleteUser(user.id)}
                  style={{ padding: '5px 10px', cursor: 'pointer', background: '#ff4444', color: 'white', border: 'none', borderRadius: '3px' }}
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default App
