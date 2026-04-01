import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Riscos from './pages/Riscos'
import Sucessao from './pages/Sucessao'
import PGBL from './pages/PGBL'

export default function App() {
  const [theme, setTheme] = useState('light')

  const [shared, setShared] = useState({
    patrimonioFinanceiro: 0,
    patrimonioAposentadoria: 0,
  })

  // Centralized data for PDF generation
  const [appData, setAppData] = useState({
    riscos: null,
    sucessao: null,
    pgbl: null,
  })

  const [pgblFormState, setPgblFormState] = useState({
    mode: 'manual',
    rendaMensal: '',
    rendaAnual: '',
    syncFrom: 'mensal',
    contribuiINSS: false,
    inssManual: '',
    inssOverride: false,
    holerites: [],
    irFile: [],
    extracted: null,
    anos: 10,
    showTable: false,
  })

  function updateAppData(module, data) {
    setAppData(function(prev) { return { ...prev, [module]: data } })
  }

  function toggleTheme() {
    setTheme(function(t) { return t === 'light' ? 'dark' : 'light' })
  }

  useEffect(function() {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout theme={theme} onToggleTheme={toggleTheme} appData={appData} />}>
          <Route path="/" element={<Navigate to="/riscos" replace />} />
          <Route
            path="/riscos"
            element={
              <Riscos
                shared={shared}
                setShared={setShared}
                onDataChange={function(d) { updateAppData('riscos', d) }}
              />
            }
          />
          <Route
            path="/sucessao"
            element={
              <Sucessao
                shared={shared}
                onDataChange={function(d) { updateAppData('sucessao', d) }}
              />
            }
          />
          <Route
            path="/pgbl"
            element={
              <PGBL
                formState={pgblFormState}
                setFormState={setPgblFormState}
                onDataChange={function(d) { updateAppData('pgbl', d) }}
              />
            }
          />
          <Route path="*" element={<Navigate to="/riscos" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
