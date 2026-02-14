import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Inbox, Calendar, FileText, Package, Users, Settings, LogOut } from 'lucide-react'

/** True if user is owner of current workspace. Staff cannot access Setup or Staff management. */
function useIsOwner() {
  const { user } = useAuth()
  const { workspace } = useWorkspace()
  const role = workspace?.role ?? user?.role
  return role === 'owner'
}

function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const isKn = i18n.language === 'kn'
  return (
    <button
      type="button"
      className="lang-switcher sidebar-lang"
      onClick={() => {
        const next = isKn ? 'en' : 'kn'
        i18n.changeLanguage(next)
        localStorage.setItem('lang', next)
      }}
      aria-label={isKn ? 'Switch to English' : 'ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ'}
    >
      {isKn ? 'EN' : 'ಕನ್ನಡ'}
    </button>
  )
}

export default function Layout() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { workspace, workspaces, selectWorkspace } = useWorkspace()
  const isOwner = useIsOwner()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>CareOps</h2>
        {workspaces?.length > 1 ? (
          <select
            value={workspace?.id || ''}
            onChange={e => { const w = workspaces.find(ws => ws.id === Number(e.target.value)); if (w) selectWorkspace(w) }}
            className="workspace-select"
          >
            {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {workspace?.name || 'Loading...'}
          </p>
        )}
        <nav>
          <NavLink to="/app" end><LayoutDashboard size={18} /> {t('layout.dashboard')}</NavLink>
          {isOwner && <NavLink to="/app/onboarding"><Settings size={18} /> {t('layout.setup')}</NavLink>}
          <NavLink to="/app/inbox"><Inbox size={18} /> {t('layout.inbox')}</NavLink>
          <NavLink to="/app/bookings"><Calendar size={18} /> {t('layout.bookings')}</NavLink>
          <NavLink to="/app/forms"><FileText size={18} /> {t('layout.forms')}</NavLink>
          <NavLink to="/app/inventory"><Package size={18} /> {t('layout.inventory')}</NavLink>
          {isOwner && <NavLink to="/app/staff"><Users size={18} /> {t('layout.staff')}</NavLink>}
        </nav>
        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <LanguageSwitcher />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>{user?.email} {(workspace?.role || user?.role) && <span className="badge" style={{ marginLeft: '0.25rem', fontSize: '0.7rem' }}>{workspace?.role || user?.role}</span>}</p>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ marginTop: '0.5rem', width: '100%' }}>
            <LogOut size={16} /> {t('layout.logout')}
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
