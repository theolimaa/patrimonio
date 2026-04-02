import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Riscos from './pages/Riscos'
import Sucessao from './pages/Sucessao'
import PGBL from './pages/PGBL'
import { genId } from './utils'

export default function App() {
  const [theme, setTheme] = useState('light')
  const [clientInfo, setClientInfo] = useState({ clientName: '', advisorName: '' })

  // ── Riscos state ────────────────────────────────────────────────────────────
  const [riscosState, setRiscosState] = useState({
    patrimonioAtual: '',
    patrimonioAposentadoria: '',
    coberturaContratada: '',
  })

  // ── Sucessao state ──────────────────────────────────────────────────────────
  const [sucessaoState, setSucessaoState] = useState({
    regimeCasamento: 'comunhao_parcial',
    imoveis: [{ id: genId(), tipo: 'residencial', valor: '', antesCasamento: false }],
    veiculos: [{ id: genId(), tipo: 'carro', valor: '' }],
    pfManual: '',
    coberturaJaContratada: '',
    valorPrevidencia: '',
  })

  // ── PGBL state ──────────────────────────────────────────────────────────────
  const [pgblState, setPgblState] = useState({
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

  // ── PDF data ────────────────────────────────────────────────────────────────
  const [appData, setAppData] = useState({ riscos: null, sucessao: null, pgbl: null })

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
        <Route element={<Layout theme={theme} onToggleTheme={toggleTheme} appData={appData} clientInfo={clientInfo} />}>
          <Route path="/" element={<Navigate to="/riscos" replace />} />
          <Route
            path="/riscos"
            element={
              <Riscos
                formState={riscosState}
                setFormState={setRiscosState}
                clientInfo={clientInfo}
                onClientInfoChange={setClientInfo}
                onDataChange={function(d) { updateAppData('riscos', d) }}
              />
            }
          />
          <Route
            path="/sucessao"
            element={
              <Sucessao
                formState={sucessaoState}
                setFormState={setSucessaoState}
                patrimonioFinanceiroShared={riscosState.patrimonioAtual}
                onDataChange={function(d) { updateAppData('sucessao', d) }}
              />
            }
          />
          <Route
            path="/pgbl"
            element={
              <PGBL
                formState={pgblState}
                setFormState={setPgblState}
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
