import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Messages from './pages/Messages.jsx'
import MessageDetail from './pages/MessageDetail.jsx'
import SetupGuide from './pages/SetupGuide.jsx'
import Policy from './pages/Policy.jsx'
import { useTheme } from './ThemeContext.jsx'
import './App.css'

function NavLink({ to, icon, children }) {
  const location = useLocation()
  const isActive = to === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(to)
  return (
    <Link to={to} className={`nav-link${isActive ? ' active' : ''}`}>
      <span className="nav-icon">{icon}</span>
      {children}
    </Link>
  )
}

function Sidebar() {
  const { theme, toggleTheme } = useTheme()
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">⚡</div>
        <div>
          <div className="brand-name">Job Intel</div>
          <div className="brand-sub">AI Command Center</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" icon="◈">Dashboard</NavLink>
        <NavLink to="/messages" icon="◉">Inbox</NavLink>
        <NavLink to="/setup" icon="◎">Setup Guide</NavLink>
        <NavLink to="/policy" icon="◷">Policy</NavLink>
      </nav>
      <div className="sidebar-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          aria-label={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          <span className="theme-icon theme-sun" aria-hidden>☀</span>
          <span className="theme-icon theme-moon" aria-hidden>☽</span>
        </button>
      </div>
      <div className="sidebar-footer">
        <div className="distill-badge">
          <div className="distill-dot" />
          <span>alert@distill.io</span>
        </div>
      </div>
    </aside>
  )
}

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<MessageDetail />} />
          <Route path="/setup" element={<SetupGuide />} />
          <Route path="/policy" element={<Policy />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
