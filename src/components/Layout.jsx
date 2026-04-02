import React, { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { generatePDF } from '../pdfGenerator'

const NAV_ITEMS = [
  { path: '/riscos', icon: '🛡️', label: 'Gestão de Riscos', sub: 'Cobertura & proteção' },
  { path: '/sucessao', icon: '🏛️', label: 'Sucessão', sub: 'Inventário & custos' },
  { path: '/pgbl', icon: '📊', label: 'Planejamento Tributário', sub: 'Benefício fiscal PGBL' },
]

function PDFModal({ appData, onClose }) {
  const [selected, setSelected] = useState(['riscos', 'sucessao', 'pgbl'])
  const [loading, setLoading] = useState(false)

  function toggle(key) {
    setSelected(function(prev) {
      return prev.includes(key) ? prev.filter(function(k) { return k !== key }) : [...prev, key]
    })
  }

  function handleGenerate() {
    if (selected.length === 0) return
    setLoading(true)
    setTimeout(function() {
      generatePDF(appData, selected, clientInfo)
      setLoading(false)
    }, 150)
  }

  const modules = [
    { key: 'riscos', icon: '🛡️', label: 'Gestão de Riscos' },
    { key: 'sucessao', icon: '🏛️', label: 'Sucessão' },
    { key: 'pgbl', icon: '📊', label: 'Planejamento Tributário' },
  ]

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div
        onClick={function(e) { e.stopPropagation() }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '18px', padding: '32px', maxWidth: '420px', width: '100%', boxShadow: 'var(--shadow)' }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '6px' }}>
          Gerar Relatório PDF
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
          Selecione os módulos a incluir no PDF. Módulos não preenchidos aparecerão em branco no relatório.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
          {modules.map(function(mod) {
            const checked = selected.includes(mod.key)
            const hasData = !!appData[mod.key]
            return (
              <div
                key={mod.key}
                onClick={function() { toggle(mod.key) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                  background: checked ? 'var(--gold-dim)' : 'rgba(0,0,0,0.03)',
                  border: checked ? '1.5px solid var(--gold)' : '1.5px solid var(--border)',
                  transition: 'all 0.18s',
                }}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0,
                  background: checked ? 'var(--gold)' : 'transparent',
                  border: checked ? '2px solid var(--gold)' : '2px solid var(--border-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.18s',
                }}>
                  {checked && <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: '18px' }}>{mod.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{mod.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {hasData ? '✅ Dados preenchidos' : '⚪ Sem dados — aparecerá em branco'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '12px', background: 'transparent', border: '1.5px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={selected.length === 0 || loading}
            style={{
              flex: 2, padding: '12px',
              background: selected.length > 0 ? 'linear-gradient(135deg,#8a6010,var(--gold))' : 'var(--border)',
              border: 'none', borderRadius: '10px', color: selected.length > 0 ? '#fff' : 'var(--text-muted)',
              fontSize: '14px', fontWeight: 700, cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-display)',
            }}
          >
            {loading ? '⏳ Gerando...' : '📄 Gerar PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Layout({ theme, onToggleTheme, appData, clientInfo }) {
  const location = useLocation()
  const [showPDF, setShowPDF] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* ── Sidebar ── */}
      <aside className="sidebar" style={{
        width: '255px', flexShrink: 0,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold-sidebar)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '5px' }}>
            Planejamento
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: '#fff', fontWeight: 800, lineHeight: 1.15 }}>
            Financeiro
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '14px 10px', flex: 1 }}>
          {NAV_ITEMS.map(function(item) {
            const active = location.pathname === item.path
            return (
              <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '10px', marginBottom: '3px',
                  background: active ? 'rgba(201,168,76,0.15)' : 'transparent',
                  border: active ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
                  transition: 'all 0.18s',
                }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-display)', color: active ? 'var(--gold-sidebar-light)' : '#c8d8f0', lineHeight: 1.3 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '11px', color: active ? 'rgba(226,201,126,0.6)' : 'rgba(200,216,240,0.35)', marginTop: '1px' }}>
                      {item.sub}
                    </div>
                  </div>
                  {active && <div style={{ marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--gold-sidebar)', flexShrink: 0 }} />}
                </div>
              </NavLink>
            )
          })}
        </nav>

        {/* PDF & Theme buttons */}
        <div style={{ padding: '14px 10px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={function() { setShowPDF(true) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '12px 14px', borderRadius: '10px',
              background: 'linear-gradient(135deg,rgba(181,134,42,0.25),rgba(201,168,76,0.15))',
              border: '1px solid rgba(201,168,76,0.35)',
              color: 'var(--gold-sidebar-light)', fontSize: '13px', fontWeight: 700,
              fontFamily: 'var(--font-display)', cursor: 'pointer',
              transition: 'all 0.18s',
            }}
            onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(201,168,76,0.25)' }}
            onMouseLeave={function(e) { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(181,134,42,0.25),rgba(201,168,76,0.15))' }}
          >
            <span style={{ fontSize: '16px' }}>📄</span>
            Gerar PDF
          </button>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '11px 14px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(200,216,240,0.7)', fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.18s',
            }}
            onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
            onMouseLeave={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          >
            <span style={{ fontSize: '15px' }}>{theme === 'light' ? '🌙' : '☀️'}</span>
            {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-content" style={{
        flex: 1, marginLeft: '255px', minHeight: '100vh',
        padding: '40px 40px 60px', maxWidth: '1020px',
      }}>
        <div className="animate-in">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav" style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg-sidebar)', borderTop: '1px solid rgba(255,255,255,0.1)',
        zIndex: 100, padding: '8px 0', justifyContent: 'space-around',
      }}>
        {NAV_ITEMS.map(function(item) {
          const active = location.pathname === item.path
          return (
            <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 16px' }}>
                <span style={{ fontSize: '22px' }}>{item.icon}</span>
                <span style={{ fontSize: '10px', color: active ? 'var(--gold-sidebar)' : 'rgba(200,216,240,0.5)', fontWeight: active ? 700 : 400, fontFamily: 'var(--font-display)' }}>
                  {item.label.split(' ')[0]}
                </span>
              </div>
            </NavLink>
          )
        })}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 16px' }} onClick={function() { setShowPDF(true) }}>
          <span style={{ fontSize: '22px' }}>📄</span>
          <span style={{ fontSize: '10px', color: 'rgba(200,216,240,0.5)', fontWeight: 400, fontFamily: 'var(--font-display)' }}>PDF</span>
        </div>
      </nav>

      {/* ── PDF Modal ── */}
      {showPDF && <PDFModal appData={appData} onClose={function() { setShowPDF(false) }} />}
    </div>
  )
}
