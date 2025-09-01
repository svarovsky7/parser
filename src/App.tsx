import { useState } from 'react'
import MaterialsTable from './components/MaterialsTable'
import { ProductsImport } from './components/ProductsImport'
import { Package, Layers } from 'lucide-react'

type Page = 'materials' | 'products'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('products')

  // Стили в стиле MaterialsTable
  const styles = `
    .app-container {
      min-height: 100vh;
      background-color: #f9fafb;
    }
    
    .nav-container {
      background-color: white;
      border-bottom: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .nav-content {
      max-width: 1280px;
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo-title {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }
    
    .logo-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
      margin-top: 2px;
    }
    
    .nav-buttons {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .nav-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
      font-size: 14px;
    }
    
    .nav-btn-active {
      background-color: #2563eb;
      color: white;
    }
    
    .nav-btn-active:hover {
      background-color: #1d4ed8;
    }
    
    .nav-btn-inactive {
      background-color: #f3f4f6;
      color: #374151;
    }
    
    .nav-btn-inactive:hover {
      background-color: #e5e7eb;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      background-color: #16a34a;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    .status-text {
      font-size: 12px;
      font-weight: 500;
      color: #166534;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `

  return (
    <div className="app-container">
      <style>{styles}</style>
      
      {/* Navigation */}
      <nav className="nav-container">
        <div className="nav-content">
          {/* Logo and Brand */}
          <div className="logo-section">
            <div>
              <h1 className="logo-title">Parser System</h1>
              <p className="logo-subtitle">Система управления данными</p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="nav-buttons">
            <button
              onClick={() => setCurrentPage('materials')}
              className={`nav-btn ${currentPage === 'materials' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
            >
              <Layers size={16} />
              Материалы
            </button>
            
            <button
              onClick={() => setCurrentPage('products')}
              className={`nav-btn ${currentPage === 'products' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
            >
              <Package size={16} />
              Товары
            </button>

            {/* Status Indicator */}
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span className="status-text">Система активна</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div>
        {currentPage === 'materials' && <MaterialsTable />}
        {currentPage === 'products' && <ProductsImport />}
      </div>
    </div>
  )
}

export default App// компонент кнопки с текстом "Купить"

// компонент кнопки с текстом "Купить"

// React button component with text "Buy"

// React button component with text "Buy"
