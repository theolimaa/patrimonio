import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Riscos from './pages/Riscos'
import Sucessao from './pages/Sucessao'
import PGBL from './pages/PGBL'

export default function App() {
  const [shared, setShared] = useState({
    patrimonioFinanceiro: 0,
    patrimonioAposentadoria: 0,
  })

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/riscos" replace />} />
          <Route path="/riscos" element={<Riscos shared={shared} setShared={setShared} />} />
          <Route path="/sucessao" element={<Sucessao shared={shared} />} />
          <Route path="/pgbl" element={<PGBL />} />
          <Route path="*" element={<Navigate to="/riscos" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
