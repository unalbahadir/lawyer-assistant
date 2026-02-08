import { Link, useLocation } from 'react-router-dom'
import { FileText, CheckSquare } from 'lucide-react'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  
  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">⚖️ Avukat AI Assistant</h1>
          <nav className="nav">
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
            >
              <FileText size={18} />
              Davalar
            </Link>
            <Link 
              to="/tasks" 
              className={location.pathname === '/tasks' ? 'nav-link active' : 'nav-link'}
            >
              <CheckSquare size={18} />
              Görevler
            </Link>
          </nav>
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
