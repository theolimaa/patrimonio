import React from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/riscos', icon: '🛡️', label: 'Gestão de Riscos', sub: 'Cobertura & proteção' },
  { path: '/sucessao', icon: '🏛️', label: 'Sucessão', sub: 'Inventário & custos' },
  { path: '/pgbl', icon: '📊', label: 'PGBL Tributário', sub: 'Planejamento fiscal' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* ── Sidebar ── */}
      <aside className="sidebar" style={{
        width: '260px',
        flexShrink: 0,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600, marginBottom: '6px' }}>
            Planejamento
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--text)', fontWeight: 600, lineHeight: 1.2 }}>
            Financeiro
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
            Assessment Patrimonial
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {NAV_ITEMS.map(function(item) {
            const active = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  marginBottom: '4px',
                  background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                  border: active ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: active ? 'var(--gold-light)' : 'var(--text)', lineHeight: 1.3 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '11px', color: active ? 'rgba(201,168,76,0.6)' : 'var(--text-dim)', marginTop: '2px' }}>
                      {item.sub}
                    </div>
                  </div>
                  {active && (
                    <div style={{ marginLeft: 'auto', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--gold)' }} />
                  )}
                </div>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-dim)' }}>
          Dados confidenciais · Uso interno
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-content" style={{
        flex: 1,
        marginLeft: '260px',
        minHeight: '100vh',
        padding: '40px 40px 60px',
        maxWidth: '1000px',
      }}>
        <div className="animate-in">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav" style={{
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-sidebar)',
        borderTop: '1px solid var(--border)',
        zIndex: 100,
        padding: '8px 0',
        justifyContent: 'space-around',
      }}>
        {NAV_ITEMS.map(function(item) {
          const active = location.pathname === item.path
          return (
            <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 16px' }}>
                <span style={{ fontSize: '22px' }}>{item.icon}</span>
                <span style={{ fontSize: '10px', color: active ? 'var(--gold)' : 'var(--text-dim)', fontWeight: active ? 600 : 400 }}>
                  {item.label.split(' ')[0]}
                </span>
              </div>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
