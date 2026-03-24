import React, { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fmtBRL, fmtBRLShort, parseCents, fromCents, centsToNum, calcIR, calcPGBL, projetarPGBL, fileToBase64, callClaude } from '../utils'

function SectionTitle() {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '8px' }}>📊 Módulo 03</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.15 }}>PGBL & Planejamento Tributário</h1>
      <div style={{ width: '44px', height: '3px', background: 'linear-gradient(90deg,var(--gold),transparent)', marginTop: '10px' }} />
    </div>
  )
}

function Card({ children, style }) {
  return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '16px', boxShadow: 'var(--shadow-card)', ...style }}>{children}</div>
}

function CardTitle({ children }) {
  return <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text)', marginBottom: '18px', fontWeight: 700 }}>{children}</div>
}

function Label({ children }) {
  return <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '7px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{children}</div>
}

function MoneyField({ label, value, onChange, hint }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', fontSize: '13px', fontWeight: 700, pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>R$</span>
        <input type="text" value={fromCents(value)} onChange={function(e) { onChange(parseCents(e.target.value)) }} placeholder="0,00"
          style={{ width: '100%', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '13px 14px 13px 46px', color: 'var(--text)', fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 500, outline: 'none' }}
          onFocus={function(e) { e.target.style.borderColor = 'var(--gold)' }}
          onBlur={function(e) { e.target.style.borderColor = 'var(--border)' }} />
      </div>
      {hint && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '5px', fontStyle: 'italic' }}>{hint}</div>}
    </div>
  )
}

function Spinner({ msg, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid var(--gold-dim)', borderTop: '3px solid var(--gold)', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 14px' }} />
      <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{msg}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{sub}</div>}
    </div>
  )
}

function AliquotaBadge({ pct }) {
  const pctInt = Math.round(pct * 1000) / 10
  const green = pctInt === 0
  const bg = green ? 'rgba(26,153,85,0.1)' : pctInt <= 15 ? 'rgba(243,156,18,0.1)' : 'rgba(204,44,31,0.1)'
  const clr = green ? 'var(--green)' : pctInt <= 15 ? '#c87010' : 'var(--red)'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: bg, border: '1px solid ' + clr, borderRadius: '20px', padding: '4px 12px', opacity: 0.9 }}>
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: clr }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: clr }}>{pctInt.toFixed(1)}%</span>
    </div>
  )
}

function ChartTooltip(props) {
  if (!props.active || !props.payload || !props.payload.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', minWidth: '200px', boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize: '12px', color: 'var(--gold)', marginBottom: '8px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Ano {props.label}</div>
      {props.payload.map(function(entry) {
        return (
          <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: entry.color }}>{entry.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text)', fontWeight: 600 }}>{fmtBRLShort(entry.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

function DropZone({ files, onAdd, onRemove, label, single }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)
  function handleFiles(list) {
    const arr = Array.from(list)
    if (single) { onAdd([arr[0]]) }
    else {
      const novos = arr.filter(function(f) { return !files.find(function(x) { return x.name === f.name && x.size === f.size }) })
      if (novos.length) onAdd(novos)
    }
  }
  return (
    <div>
      <div
        onDragOver={function(e) { e.preventDefault(); setDragging(true) }}
        onDragLeave={function() { setDragging(false) }}
        onDrop={function(e) { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={function() { inputRef.current.click() }}
        style={{ border: '2px dashed ' + (dragging ? 'var(--gold)' : files.length ? 'rgba(26,153,85,0.5)' : 'var(--border-strong)'), borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'var(--gold-dim)' : files.length ? 'rgba(26,153,85,0.05)' : 'var(--bg-input)', transition: 'all 0.2s' }}
      >
        <input ref={inputRef} type="file" accept="application/pdf,image/*" multiple={!single} style={{ display: 'none' }} onChange={function(e) { handleFiles(e.target.files) }} />
        <div style={{ fontSize: '30px', marginBottom: '8px' }}>{files.length ? '✅' : '📄'}</div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: files.length ? 'var(--green)' : 'var(--text)', marginBottom: '3px', fontFamily: 'var(--font-display)' }}>
          {files.length ? (single ? files[0].name : files.length + ' arquivo' + (files.length > 1 ? 's' : '') + ' selecionado' + (files.length > 1 ? 's' : '')) : label}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>PDF ou imagem{single ? '' : ' · múltiplos arquivos aceitos'}</div>
      </div>
      {files.length > 0 && !single && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {files.map(function(file, idx) {
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(26,153,85,0.05)', border: '1px solid rgba(26,153,85,0.2)', borderRadius: '8px', padding: '8px 12px' }}>
                <span>📄</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{file.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{(file.size / 1024).toFixed(0)} KB</div>
                </div>
                <button onClick={function(e) { e.stopPropagation(); onRemove(idx) }} style={{ background: 'rgba(204,44,31,0.1)', border: '1px solid rgba(204,44,31,0.25)', borderRadius: '6px', color: 'var(--red)', fontSize: '11px', padding: '4px 10px', cursor: 'pointer' }}>✕</button>
              </div>
            )
          })}
          <button onClick={function() { inputRef.current.click() }} style={{ background: 'transparent', border: '1.5px dashed var(--gold)', borderRadius: '8px', color: 'var(--gold)', fontSize: '12px', fontWeight: 700, padding: '8px', cursor: 'pointer', width: '100%', fontFamily: 'var(--font-display)' }}>＋ Adicionar mais</button>
        </div>
      )}
    </div>
  )
}

const INCOME_TYPES = [
  { label: 'Salário / Pró-labore', tributavel: true, nota: 'Tributável integral' },
  { label: '13º salário', tributavel: true, nota: 'Tributável (tabela progressiva)' },
  { label: 'Férias', tributavel: true, nota: 'Tributável + 1/3 constitucional' },
  { label: 'PLR', tributavel: false, nota: 'Tabela exclusiva, não soma à renda' },
  { label: 'Bônus via folha', tributavel: true, nota: 'Tributável se pago pela empresa' },
  { label: 'Dividendos', tributavel: false, nota: 'Isentos para pessoa física' },
]

const ANOS_OPTIONS = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30]

export default function PGBL({ onDataChange }) {
  const [mode, setMode] = useState('manual')
  const [rendaMensal, setRendaMensal] = useState('')
  const [rendaAnual, setRendaAnual] = useState('')
  const [syncFrom, setSyncFrom] = useState('mensal')
  const [holerites, setHolerites] = useState([])
  const [irFile, setIrFile] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [extracted, setExtracted] = useState(null)
  const [anos, setAnos] = useState(10)
  const [showTable, setShowTable] = useState(false)

  function handleRendaMensalChange(cents) {
    setRendaMensal(cents); setSyncFrom('mensal')
    setRendaAnual(String(Math.round(((parseInt(cents) || 0) / 100) * 12 * 100)))
  }
  function handleRendaAnualChange(cents) {
    setRendaAnual(cents); setSyncFrom('anual')
    setRendaMensal(String(Math.round(((parseInt(cents) || 0) / 100 / 12) * 100)))
  }

  const rendaMensalNum = mode === 'manual'
    ? (syncFrom === 'mensal' ? centsToNum(rendaMensal) : centsToNum(rendaAnual) / 12)
    : (extracted ? extracted.rendaMensal : 0)
  const rendaAnualNum = mode === 'manual'
    ? (syncFrom === 'anual' ? centsToNum(rendaAnual) : centsToNum(rendaMensal) * 12)
    : (extracted ? extracted.rendaAnual : 0)

  const irInfo = calcIR(rendaMensalNum)
  const pgblInfo = calcPGBL(rendaAnualNum, irInfo.aliquotaMarginal)
  const projection = projetarPGBL(pgblInfo.pgblIdeal, irInfo.aliquotaMarginal, anos)
  const hasData = rendaAnualNum > 0

  useEffect(function() {
    if (hasData) {
      onDataChange({ rendaAnual: rendaAnualNum, rendaMensal: rendaMensalNum, aliquotaMarginal: irInfo.aliquotaMarginal, pgblIdeal: pgblInfo.pgblIdeal, economiaAnual: pgblInfo.economiaAnual, projecao: projection, anos: anos })
    }
  }, [rendaAnualNum, anos])

  async function processUpload() {
    const allFiles = [...holerites, ...irFile]
    if (allFiles.length === 0) { setError('Envie ao menos um arquivo.'); return }
    setError(''); setLoading(true)
    try {
      var content = []
      for (var i = 0; i < irFile.length; i++) {
        setLoadingMsg('Carregando declaração IR...')
        const b64 = await fileToBase64(irFile[i])
        const mime = irFile[i].type || 'application/pdf'
        content.push(mime === 'application/pdf' ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } } : { type: 'image', source: { type: 'base64', media_type: mime, data: b64 } })
      }
      for (var j = 0; j < holerites.length; j++) {
        setLoadingMsg('Carregando holerite ' + (j + 1) + ' de ' + holerites.length + '...')
        const b64h = await fileToBase64(holerites[j])
        const mimeh = holerites[j].type || 'application/pdf'
        content.push(mimeh === 'application/pdf' ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64h } } : { type: 'image', source: { type: 'base64', media_type: mimeh, data: b64h } })
      }
      setLoadingMsg('Analisando com IA...')
      content.push({ type: 'text', text: 'Analise os documentos (holerites e/ou declaração de IR). Some todos os rendimentos e separe tributáveis de não tributáveis.\n\nCritérios:\n- Salário, pró-labore: TRIBUTÁVEL\n- 13º: TRIBUTÁVEL\n- Férias + 1/3: TRIBUTÁVEL\n- PLR/Lucros: NÃO TRIBUTÁVEL\n- Dividendos: NÃO TRIBUTÁVEL\n- Bônus via folha: TRIBUTÁVEL\n\nSe houver múltiplos holerites, some para totais anuais.\n\nResponda SOMENTE JSON puro:\n{"rendaMensalTributavel":número,"rendaAnualTributavel":número,"rendaAnualNaoTributavel":número,"inss":número,"irrf":número,"meses":número,"itens":[{"descricao":"string","valor":número,"tributavel":boolean}],"observacoes":"string"}' })
      const raw = await callClaude([{ role: 'user', content: content }], 1500)
      const clean = raw.replace(/```json|```/g, '').trim()
      const si = clean.indexOf('{'), ei = clean.lastIndexOf('}')
      const parsed = JSON.parse(si >= 0 ? clean.slice(si, ei + 1) : clean)
      setExtracted({ rendaMensal: parsed.rendaMensalTributavel || 0, rendaAnual: parsed.rendaAnualTributavel || 0, rendaAnualNaoTributavel: parsed.rendaAnualNaoTributavel || 0, inss: parsed.inss || 0, irrf: parsed.irrf || 0, meses: parsed.meses || 12, itens: parsed.itens || [], observacoes: parsed.observacoes || '' })
    } catch (err) { setError('Erro: ' + err.message) }
    setLoading(false); setLoadingMsg('')
  }

  return (
    <div>
      <SectionTitle />

      {/* Mode toggle */}
      <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '5px', marginBottom: '20px', maxWidth: '460px', boxShadow: 'var(--shadow-card)' }}>
        {[{ key: 'manual', icon: '✏️', label: 'Preencher manualmente' }, { key: 'upload', icon: '📎', label: 'Upload de documentos' }].map(function(opt) {
          const active = mode === opt.key
          return (
            <button key={opt.key} onClick={function() { setMode(opt.key); setError('') }}
              style={{ flex: 1, padding: '10px 12px', border: 'none', borderRadius: '9px', background: active ? 'var(--gold-dim)' : 'transparent', color: active ? 'var(--gold)' : 'var(--text-muted)', fontSize: '13px', fontWeight: active ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-display)' }}>
              {opt.icon} {opt.label}
            </button>
          )
        })}
      </div>

      {/* Manual mode */}
      {mode === 'manual' && (
        <Card>
          <CardTitle>Renda Bruta Tributável</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
            <MoneyField label="Renda mensal" value={rendaMensal} onChange={handleRendaMensalChange} hint="Salário, pró-labore e demais tributáveis" />
            <MoneyField label="Renda anual" value={rendaAnual} onChange={handleRendaAnualChange} hint="Calculado automaticamente ou edite aqui" />
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>O que entra na base tributável</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {INCOME_TYPES.map(function(item) {
                return (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '7px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.tributavel ? 'var(--gold)' : 'var(--text-dim)', marginTop: '4px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '12px', color: item.tributavel ? 'var(--text)' : 'var(--text-muted)', fontWeight: item.tributavel ? 600 : 400, fontFamily: 'var(--font-display)' }}>{item.label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '1px' }}>{item.nota}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Upload mode */}
      {mode === 'upload' && (
        <div>
          <Card>
            <CardTitle>🧾 Holerites</CardTitle>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.7 }}>
              Envie quantos holerites quiser — a IA soma os rendimentos e separa tributáveis de não tributáveis automaticamente.
            </div>
            <DropZone files={holerites} onAdd={function(arr) { setHolerites(function(p) { return p.concat(arr) }) }} onRemove={function(idx) { setHolerites(function(p) { return p.filter(function(_, j) { return j !== idx }) }) }} label="Clique ou arraste os holerites aqui" />
          </Card>
          <Card>
            <CardTitle>📑 Declaração de IR (opcional)</CardTitle>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>A declaração complementa com rendimentos de outras fontes.</div>
            <DropZone files={irFile} onAdd={function(arr) { setIrFile([arr[0]]) }} onRemove={function() { setIrFile([]) }} label="Clique ou arraste a declaração aqui" single={true} />
          </Card>
          {error && <div style={{ background: 'rgba(204,44,31,0.08)', border: '1px solid rgba(204,44,31,0.25)', borderRadius: '10px', padding: '12px 16px', color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>⚠️ {error}</div>}
          {loading ? <Spinner msg={loadingMsg || 'Processando...'} sub="A IA está analisando seus documentos" /> : (
            <button onClick={processUpload} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#8a6010,var(--gold))', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
              🔍 Analisar com IA
            </button>
          )}
          {extracted && !loading && (
            <div className="animate-in">
              <Card style={{ marginTop: '16px', borderColor: 'rgba(26,153,85,0.4)' }}>
                <CardTitle>✅ Dados extraídos</CardTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
                  {[['Renda tributável mensal', fmtBRL(extracted.rendaMensal)], ['Renda tributável anual', fmtBRL(extracted.rendaAnual)], ['Renda não tributável', fmtBRL(extracted.rendaAnualNaoTributavel)], ['INSS retido (ano)', fmtBRL(extracted.inss)], ['IRRF retido (ano)', fmtBRL(extracted.irrf)], ['Meses analisados', extracted.meses + ' meses']].map(function(item) {
                    return (
                      <div key={item[0]} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '9px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{item[0]}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text)', fontWeight: 600 }}>{item[1]}</div>
                      </div>
                    )
                  })}
                </div>
                {extracted.itens && extracted.itens.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Composição da renda</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {extracted.itens.map(function(item, idx) {
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: '7px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.tributavel ? 'var(--gold)' : 'var(--text-dim)', flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: '13px', color: 'var(--text)' }}>{item.descricao}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: item.tributavel ? 'var(--text)' : 'var(--text-muted)', fontWeight: 600 }}>{fmtBRL(item.valor)}</span>
                            <span style={{ fontSize: '10px', color: item.tributavel ? 'var(--gold)' : 'var(--text-dim)', background: item.tributavel ? 'var(--gold-dim)' : 'var(--bg-card)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                              {item.tributavel ? 'Tributável' : 'Não tributável'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {extracted.observacoes && <div style={{ marginTop: '14px', padding: '12px 14px', background: 'rgba(74,159,212,0.07)', border: '1px solid rgba(74,159,212,0.2)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>📌 {extracted.observacoes}</div>}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {hasData && (
        <div className="animate-in">
          <Card style={{ borderColor: 'var(--gold)' }}>
            <CardTitle>🧮 Análise Tributária</CardTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Renda bruta anual', value: <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700 }}>{fmtBRLShort(rendaAnualNum)}</span> },
                { label: 'Alíquota marginal', value: <AliquotaBadge pct={irInfo.aliquotaMarginal} /> },
                { label: 'PGBL ideal (12%)', value: <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--gold-light)' }}>{fmtBRLShort(pgblInfo.pgblIdeal)}/ano</span>, accent: true },
                { label: 'Economia fiscal anual', value: <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--green)' }}>{fmtBRLShort(pgblInfo.economiaAnual)}</span>, green: true },
              ].map(function(item) {
                return (
                  <div key={item.label} style={{ background: item.accent ? 'var(--gold-dim)' : item.green ? 'rgba(26,153,85,0.08)' : 'var(--bg-input)', border: item.accent ? '1px solid var(--gold)' : item.green ? '1px solid rgba(26,153,85,0.3)' : '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: item.accent ? 'var(--gold)' : item.green ? 'var(--green)' : 'var(--text-muted)', marginBottom: '10px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{item.label}</div>
                    {item.value}
                    {item.accent && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{fmtBRLShort(pgblInfo.pgblIdeal / 12)}/mês</div>}
                    {item.green && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{fmtBRLShort(pgblInfo.economiaMensal)}/mês</div>}
                  </div>
                )
              })}
            </div>
            <div style={{ padding: '14px 16px', background: 'var(--gold-dim)', border: '1px solid var(--gold)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              💡 <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Como funciona:</strong> Contribuindo com {fmtBRL(pgblInfo.pgblIdeal)}/ano no PGBL (12% da renda bruta), você deduz da base de cálculo do IR. Com alíquota marginal de {(irInfo.aliquotaMarginal * 100).toFixed(1)}%, economia fiscal de <strong style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-mono)' }}>{fmtBRL(pgblInfo.economiaAnual)}/ano</strong>.
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <CardTitle>📈 Projeção Patrimonial</CardTitle>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {ANOS_OPTIONS.map(function(n) {
                  const active = anos === n
                  return (
                    <button key={n} onClick={function() { setAnos(n) }}
                      style={{ padding: '5px 11px', border: active ? '1.5px solid var(--gold)' : '1px solid var(--border)', borderRadius: '20px', background: active ? 'var(--gold-dim)' : 'transparent', color: active ? 'var(--gold)' : 'var(--text-muted)', fontSize: '12px', fontWeight: active ? 800 : 400, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                      {n}a
                    </button>
                  )
                })}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.7 }}>
              Rentabilidade real de <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>4% a.a.</strong> (IPCA+4% sem projetar inflação) · Aportes e restituições reinvestidos anualmente.
            </div>
            {projection.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '24px' }}>
                {[
                  { label: 'Patrimônio PGBL em ' + anos + ' anos', value: fmtBRLShort(projection[projection.length - 1].patrimonioPGBL), color: 'var(--blue-light)' },
                  { label: 'Restituições acumuladas', value: fmtBRLShort(projection[projection.length - 1].restituicoes), color: 'var(--gold)' },
                  { label: 'Total', value: fmtBRLShort(projection[projection.length - 1].total), color: 'var(--green)' },
                ].map(function(m) {
                  return (
                    <div key={m.label} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: m.color, marginBottom: '6px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{m.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '17px', color: m.color, fontWeight: 800 }}>{m.value}</div>
                    </div>
                  )
                })}
              </div>
            )}
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={projection} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="ano" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} tickFormatter={function(v) { return 'Ano ' + v }} stroke="var(--border)" />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} tickFormatter={function(v) { return fmtBRLShort(v) }} stroke="var(--border)" width={78} />
                <Tooltip content={ChartTooltip} />
                <Legend wrapperStyle={{ fontSize: '12px' }} formatter={function(value) { return <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{value}</span> }} />
                <Line type="monotone" dataKey="patrimonioPGBL" name="Patrimônio PGBL" stroke="var(--blue-light)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="restituicoes" name="Restituições reinvestidas" stroke="var(--gold)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="total" name="Total" stroke="var(--green)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <button onClick={function() { setShowTable(function(t) { return !t }) }}
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, padding: '8px 16px', cursor: 'pointer', width: '100%', marginTop: '16px', fontFamily: 'var(--font-display)' }}>
              {showTable ? '▴ Ocultar tabela' : '▾ Ver tabela ano a ano'}
            </button>
            {showTable && (
              <div style={{ overflowX: 'auto', marginTop: '14px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input)' }}>
                      {['Ano', 'Aportado', 'Patrimônio PGBL', 'Restituições', 'Total'].map(function(h) {
                        return <th key={h} style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', padding: '9px 12px', textAlign: h === 'Ano' ? 'center' : 'right', borderBottom: '1.5px solid var(--border)', fontFamily: 'var(--font-display)', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {projection.map(function(row, idx) {
                      const isLast = idx === projection.length - 1
                      return (
                        <tr key={row.ano} style={{ background: isLast ? 'var(--gold-dim)' : 'transparent' }}>
                          <td style={{ padding: '7px 12px', textAlign: 'center', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{row.ano}</td>
                          {[row.aportado, row.patrimonioPGBL, row.restituicoes].map(function(val, vi) {
                            return <td key={vi} style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{fmtBRL(val)}</td>
                          })}
                          <td style={{ padding: '7px 12px', textAlign: 'right', color: isLast ? 'var(--gold-light)' : 'var(--text)', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontWeight: 800, whiteSpace: 'nowrap' }}>{fmtBRL(row.total)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {!hasData && !(mode === 'upload' && loading) && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>
            {mode === 'manual' ? 'Informe a renda acima' : 'Envie seus documentos acima'}
          </div>
          <div style={{ fontSize: '14px', maxWidth: '360px', margin: '0 auto', lineHeight: 1.7, color: 'var(--text-dim)' }}>
            {mode === 'manual' ? 'Insira a renda bruta tributável para ver a análise do PGBL.' : 'Faça upload dos holerites ou da declaração de IR para análise automática.'}
          </div>
        </div>
      )}
    </div>
  )
}
