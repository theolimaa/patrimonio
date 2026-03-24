import React, { useState, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'
import {
  fmtBRL, fmtBRLShort, fmtPct, parseCents, fromCents, centsToNum,
  calcIR, calcPGBL, projetarPGBL, fileToBase64, callClaude,
} from '../utils'

// ── Shared UI atoms ──────────────────────────────────────────────────────────
function SectionTitle() {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600, marginBottom: '8px' }}>
        📊 Módulo 03
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.15 }}>
        PGBL & Planejamento Tributário
      </h1>
      <div style={{ width: '48px', height: '2px', background: 'linear-gradient(90deg,var(--gold),transparent)', marginTop: '12px' }} />
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '16px', ...style }}>
      {children}
    </div>
  )
}

function CardTitle({ children }) {
  return <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold-light)', marginBottom: '18px', fontWeight: 500 }}>{children}</div>
}

function Label({ children }) {
  return <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '6px' }}>{children}</div>
}

function MoneyField({ label, value, onChange, hint }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', fontSize: '13px', fontWeight: 600, pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>R$</span>
        <input
          type="text"
          value={fromCents(value)}
          onChange={function(e) { onChange(parseCents(e.target.value)) }}
          placeholder="0,00"
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '10px', padding: '13px 14px 13px 48px', color: 'var(--text)', fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 500, outline: 'none' }}
          onFocus={function(e) { e.target.style.borderColor = 'rgba(201,168,76,0.4)' }}
          onBlur={function(e) { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>
      {hint && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '5px', fontStyle: 'italic' }}>{hint}</div>}
    </div>
  )
}

function Spinner({ msg, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid rgba(201,168,76,0.2)', borderTop: '3px solid var(--gold)', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 14px' }} />
      <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>{msg}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{sub}</div>}
    </div>
  )
}

// ── IR aliquota badge ────────────────────────────────────────────────────────
function AliquotaBadge({ pct }) {
  const colors = {
    0: ['#2ecc71', 'rgba(46,204,113,0.1)', 'rgba(46,204,113,0.25)'],
    7.5: ['#f39c12', 'rgba(243,156,18,0.1)', 'rgba(243,156,18,0.25)'],
    15: ['#e67e22', 'rgba(230,126,34,0.1)', 'rgba(230,126,34,0.25)'],
    22.5: ['#e74c3c', 'rgba(231,76,60,0.1)', 'rgba(231,76,60,0.25)'],
    27.5: ['#c0392b', 'rgba(192,57,43,0.1)', 'rgba(192,57,43,0.25)'],
  }
  const clr = colors[pct * 100] || colors[27.5]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: clr[1], border: '1px solid ' + clr[2], borderRadius: '20px', padding: '4px 12px' }}>
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: clr[0] }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: clr[0] }}>{(pct * 100).toFixed(1)}%</span>
    </div>
  )
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip(props) {
  if (!props.active || !props.payload || !props.payload.length) return null
  return (
    <div style={{ background: '#0d1f35', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', minWidth: '200px' }}>
      <div style={{ fontSize: '12px', color: 'var(--gold)', marginBottom: '8px', fontWeight: 600 }}>Ano {props.label}</div>
      {props.payload.map(function(entry) {
        return (
          <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: entry.color }}>{entry.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text)' }}>{fmtBRLShort(entry.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── File drop zone ────────────────────────────────────────────────────────────
function DropZone({ files, onAdd, onRemove, label, single }) {
  const inputRef = React.useRef()
  const [dragging, setDragging] = useState(false)

  function handleFiles(list) {
    const arr = Array.from(list)
    if (single) {
      onAdd([arr[0]])
    } else {
      const novos = arr.filter(function(f) {
        return !files.find(function(x) { return x.name === f.name && x.size === f.size })
      })
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
        style={{
          border: '2px dashed ' + (dragging ? 'var(--gold)' : files.length ? 'rgba(46,204,113,0.5)' : 'var(--border-strong)'),
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(201,168,76,0.05)' : files.length ? 'rgba(46,204,113,0.04)' : 'transparent',
          transition: 'all 0.2s',
        }}
      >
        <input ref={inputRef} type="file" accept="application/pdf,image/*" multiple={!single} style={{ display: 'none' }} onChange={function(e) { handleFiles(e.target.files) }} />
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{files.length ? '✅' : '📄'}</div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: files.length ? 'var(--green)' : 'var(--text)', marginBottom: '3px' }}>
          {files.length ? (single ? files[0].name : files.length + ' arquivo' + (files.length > 1 ? 's' : '') + ' selecionado' + (files.length > 1 ? 's' : '')) : label}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>PDF ou imagem{single ? '' : ' · múltiplos arquivos aceitos'}</div>
      </div>

      {files.length > 0 && !single && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {files.map(function(file, idx) {
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(46,204,113,0.05)', border: '1px solid rgba(46,204,113,0.15)', borderRadius: '8px', padding: '8px 12px' }}>
                <span style={{ fontSize: '16px' }}>📄</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{(file.size / 1024).toFixed(0)} KB</div>
                </div>
                <button onClick={function(e) { e.stopPropagation(); onRemove(idx) }} style={{ background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: '6px', color: '#e74c3c', fontSize: '11px', padding: '4px 10px', cursor: 'pointer' }}>✕</button>
              </div>
            )
          })}
          <button onClick={function() { inputRef.current.click() }} style={{ background: 'transparent', border: '1px dashed rgba(201,168,76,0.3)', borderRadius: '8px', color: 'var(--gold)', fontSize: '12px', padding: '8px', cursor: 'pointer', width: '100%' }}>
            ＋ Adicionar mais
          </button>
        </div>
      )}
    </div>
  )
}

// ── Income types explanation ─────────────────────────────────────────────────
const INCOME_TYPES = [
  { label: 'Salário / Pró-labore', tributavel: true, nota: 'Tributável integral' },
  { label: '13º salário', tributavel: true, nota: 'Tributável (tabela progressiva)' },
  { label: 'Férias', tributavel: true, nota: 'Tributável + 1/3 constitucional' },
  { label: 'PLR (Lucros e Resultados)', tributavel: false, nota: 'Tabela exclusiva, não soma à renda' },
  { label: 'Bônus', tributavel: true, nota: 'Tributável se pago pela empresa' },
  { label: 'Dividendos', tributavel: false, nota: 'Isentos para pessoa física (atual)' },
]

// ── Main component ────────────────────────────────────────────────────────────
export default function PGBL() {
  const [mode, setMode] = useState('manual') // 'manual' | 'upload'
  const [rendaMensal, setRendaMensal] = useState('')
  const [rendaAnual, setRendaAnual] = useState('')
  const [syncFrom, setSyncFrom] = useState('mensal') // which field was last changed
  const [holerites, setHolerites] = useState([])
  const [irFile, setIrFile] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [extracted, setExtracted] = useState(null) // from AI
  const [anos, setAnos] = useState(10)
  const [showTable, setShowTable] = useState(false)

  // Derived from manual inputs
  function getRendaMensalNum() {
    if (syncFrom === 'mensal') return centsToNum(rendaMensal)
    return centsToNum(rendaAnual) / 12
  }
  function getRendaAnualNum() {
    if (syncFrom === 'anual') return centsToNum(rendaAnual)
    return centsToNum(rendaMensal) * 12
  }

  function handleRendaMensalChange(cents) {
    setRendaMensal(cents)
    setSyncFrom('mensal')
    const num = (parseInt(cents) || 0) / 100
    setRendaAnual(String(Math.round(num * 12 * 100)))
  }

  function handleRendaAnualChange(cents) {
    setRendaAnual(cents)
    setSyncFrom('anual')
    const num = (parseInt(cents) || 0) / 100
    setRendaMensal(String(Math.round((num / 12) * 100)))
  }

  // Calculate from manual inputs
  const rendaMensalNum = mode === 'manual' ? getRendaMensalNum() : (extracted ? extracted.rendaMensal : 0)
  const rendaAnualNum = mode === 'manual' ? getRendaAnualNum() : (extracted ? extracted.rendaAnual : 0)

  const irInfo = calcIR(rendaMensalNum)
  const pgblInfo = calcPGBL(rendaAnualNum, irInfo.aliquotaMarginal)
  const projection = projetarPGBL(pgblInfo.pgblIdeal, irInfo.aliquotaMarginal, anos)

  const hasData = rendaAnualNum > 0

  // Upload processing
  async function processUpload() {
    const allFiles = [...holerites, ...irFile]
    if (allFiles.length === 0) { setError('Envie ao menos um arquivo.'); return }
    setError('')
    setLoading(true)
    try {
      const content = []

      for (var i = 0; i < irFile.length; i++) {
        setLoadingMsg('Carregando declaração IR...')
        const b64 = await fileToBase64(irFile[i])
        const mime = irFile[i].type || 'application/pdf'
        content.push(mime === 'application/pdf'
          ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }
          : { type: 'image', source: { type: 'base64', media_type: mime, data: b64 } })
      }

      for (var j = 0; j < holerites.length; j++) {
        setLoadingMsg('Carregando holerite ' + (j + 1) + ' de ' + holerites.length + '...')
        const b64h = await fileToBase64(holerites[j])
        const mimeh = holerites[j].type || 'application/pdf'
        content.push(mimeh === 'application/pdf'
          ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64h } }
          : { type: 'image', source: { type: 'base64', media_type: mimeh, data: b64h } })
      }

      setLoadingMsg('Analisando com IA...')

      const prompt = `Analise os documentos enviados (holerites e/ou declaração de IR).
Extraia e some TODOS os rendimentos tributáveis e não tributáveis separadamente.

Considere:
- Salário, ordenado, pró-labore: TRIBUTÁVEL
- 13º salário: TRIBUTÁVEL
- Férias (incluindo 1/3 constitucional): TRIBUTÁVEL
- PLR / Participação nos lucros: NÃO TRIBUTÁVEL (tabela exclusiva)
- Dividendos: NÃO TRIBUTÁVEL
- Bônus recebido via folha: TRIBUTÁVEL
- Outros rendimentos: classifique conforme legislação brasileira

Se houver múltiplos holerites, some todos para obter os totais anuais.

Responda APENAS com JSON puro, sem texto antes ou depois:
{
  "rendaMensalTributavel": número em reais (média mensal do que é tributável),
  "rendaAnualTributavel": número em reais (total anual tributável),
  "rendaAnualNaoTributavel": número em reais (total anual não tributável),
  "inss": número em reais (total INSS retido no ano),
  "irrf": número em reais (total IR retido na fonte no ano),
  "meses": número de meses com renda identificada,
  "itens": [{"descricao": "string", "valor": número, "tributavel": boolean}],
  "observacoes": "resumo em até 2 frases"
}`

      content.push({ type: 'text', text: prompt })

      const raw = await callClaude([{ role: 'user', content: content }], 1500)
      const clean = raw.replace(/```json|```/g, '').trim()
      const si = clean.indexOf('{')
      const ei = clean.lastIndexOf('}')
      const parsed = JSON.parse(si >= 0 ? clean.slice(si, ei + 1) : clean)

      setExtracted({
        rendaMensal: parsed.rendaMensalTributavel || 0,
        rendaAnual: parsed.rendaAnualTributavel || 0,
        rendaAnualNaoTributavel: parsed.rendaAnualNaoTributavel || 0,
        inss: parsed.inss || 0,
        irrf: parsed.irrf || 0,
        meses: parsed.meses || 12,
        itens: parsed.itens || [],
        observacoes: parsed.observacoes || '',
      })
    } catch (err) {
      setError('Erro ao processar: ' + err.message)
    }
    setLoading(false)
    setLoadingMsg('')
  }

  const ANOS_OPTIONS = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30]

  return (
    <div>
      <SectionTitle />

      {/* Mode selector */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '5px', marginBottom: '20px', maxWidth: '460px' }}>
        {[
          { key: 'manual', icon: '✏️', label: 'Preencher manualmente' },
          { key: 'upload', icon: '📎', label: 'Upload de documentos' },
        ].map(function(opt) {
          const active = mode === opt.key
          return (
            <button
              key={opt.key}
              onClick={function() { setMode(opt.key); setError('') }}
              style={{ flex: 1, padding: '10px 12px', border: 'none', borderRadius: '9px', background: active ? 'rgba(201,168,76,0.15)' : 'transparent', color: active ? 'var(--gold-light)' : 'var(--text-muted)', fontSize: '13px', fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {opt.icon} {opt.label}
            </button>
          )
        })}
      </div>

      {/* ── Manual mode ── */}
      {mode === 'manual' && (
        <Card>
          <CardTitle>Renda Bruta Tributável</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
            <MoneyField
              label="Renda mensal"
              value={rendaMensal}
              onChange={handleRendaMensalChange}
              hint="Salário, pró-labore e demais tributáveis"
            />
            <MoneyField
              label="Renda anual"
              value={rendaAnual}
              onChange={handleRendaAnualChange}
              hint="Calculado automaticamente ou edite aqui"
            />
          </div>

          {/* Income types reference */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Guia: o que entra na base tributável
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {INCOME_TYPES.map(function(item) {
                return (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '7px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.tributavel ? 'var(--gold)' : 'var(--text-dim)', marginTop: '4px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '12px', color: item.tributavel ? 'var(--text)' : 'var(--text-muted)', fontWeight: item.tributavel ? 500 : 400 }}>{item.label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '1px' }}>{item.nota}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {/* ── Upload mode ── */}
      {mode === 'upload' && (
        <div>
          <Card>
            <CardTitle>🧾 Holerites</CardTitle>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.7 }}>
              Envie quantos holerites quiser — a IA irá somar os rendimentos, identificar os tributáveis (salário, 13º, férias, bônus) e separar os não tributáveis (PLR, dividendos).
            </div>
            <DropZone
              files={holerites}
              onAdd={function(arr) { setHolerites(function(prev) { return prev.concat(arr) }) }}
              onRemove={function(idx) { setHolerites(function(prev) { return prev.filter(function(_, j) { return j !== idx }) }) }}
              label="Clique ou arraste os holerites aqui"
            />
          </Card>

          <Card>
            <CardTitle>📑 Última declaração de IR (opcional)</CardTitle>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              A declaração complementa os holerites com rendimentos de outras fontes.
            </div>
            <DropZone
              files={irFile}
              onAdd={function(arr) { setIrFile([arr[0]]) }}
              onRemove={function() { setIrFile([]) }}
              label="Clique ou arraste a declaração aqui"
              single={true}
            />
          </Card>

          {error && (
            <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '10px', padding: '12px 16px', color: '#ff8080', fontSize: '13px', marginBottom: '12px' }}>
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <Spinner msg={loadingMsg || 'Processando...'} sub="A IA está analisando seus documentos" />
          ) : (
            <button
              onClick={processUpload}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#8a6520,var(--gold))', border: 'none', borderRadius: '12px', color: '#000', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
            >
              🔍 Analisar com IA
            </button>
          )}

          {extracted && !loading && (
            <div className="animate-in">
              <Card style={{ marginTop: '16px', borderColor: 'rgba(46,204,113,0.25)' }}>
                <CardTitle>✅ Dados extraídos</CardTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
                  {[
                    { label: 'Renda tributável mensal', value: fmtBRL(extracted.rendaMensal) },
                    { label: 'Renda tributável anual', value: fmtBRL(extracted.rendaAnual) },
                    { label: 'Renda não tributável', value: fmtBRL(extracted.rendaAnualNaoTributavel) },
                    { label: 'INSS retido (ano)', value: fmtBRL(extracted.inss) },
                    { label: 'IRRF retido (ano)', value: fmtBRL(extracted.irrf) },
                    { label: 'Meses analisados', value: extracted.meses + ' meses' },
                  ].map(function(item) {
                    return (
                      <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '9px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '5px' }}>{item.label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text)', fontWeight: 600 }}>{item.value}</div>
                      </div>
                    )
                  })}
                </div>

                {extracted.itens && extracted.itens.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '10px' }}>Composição da renda</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {extracted.itens.map(function(item, idx) {
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '7px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.tributavel ? 'var(--gold)' : 'var(--text-dim)', flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: '13px', color: 'var(--text)' }}>{item.descricao}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: item.tributavel ? 'var(--text)' : 'var(--text-muted)' }}>{fmtBRL(item.valor)}</span>
                            <span style={{ fontSize: '10px', color: item.tributavel ? 'var(--gold)' : 'var(--text-dim)', background: item.tributavel ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '10px' }}>
                              {item.tributavel ? 'Tributável' : 'Não tributável'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {extracted.observacoes && (
                  <div style={{ marginTop: '14px', padding: '12px 14px', background: 'rgba(74,159,212,0.06)', border: '1px solid rgba(74,159,212,0.15)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    📌 {extracted.observacoes}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── Results ── */}
      {hasData && (
        <div className="animate-in">
          {/* IR Analysis */}
          <Card style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
            <CardTitle>🧮 Análise Tributária</CardTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px' }}>Renda bruta anual</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--text)', fontWeight: 600 }}>{fmtBRLShort(rendaAnualNum)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px' }}>Alíquota marginal</div>
                <AliquotaBadge pct={irInfo.aliquotaMarginal} />
              </div>
              <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '8px' }}>PGBL ideal (12%)</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--gold-light)', fontWeight: 600 }}>{fmtBRLShort(pgblInfo.pgblIdeal)}/ano</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>{fmtBRLShort(pgblInfo.pgblIdeal / 12)}/mês</div>
              </div>
              <div style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.25)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--green)', marginBottom: '8px' }}>Economia fiscal anual</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--green)', fontWeight: 600 }}>{fmtBRLShort(pgblInfo.economiaAnual)}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>{fmtBRLShort(pgblInfo.economiaMensal)}/mês</div>
              </div>
            </div>

            <div style={{ padding: '14px 16px', background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              💡 <strong style={{ color: 'var(--text)' }}>Como funciona:</strong> Ao contribuir com {fmtBRL(pgblInfo.pgblIdeal)} anuais no PGBL (12% da renda bruta), você deduz esse valor da base de cálculo do IR. Com alíquota marginal de {fmtPct(irInfo.aliquotaMarginal * 100)}, a economia fiscal é de <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{fmtBRL(pgblInfo.economiaAnual)}/ano</strong>.
            </div>
          </Card>

          {/* Projection */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <CardTitle>📈 Projeção Patrimonial</CardTitle>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ANOS_OPTIONS.map(function(n) {
                  const active = anos === n
                  return (
                    <button
                      key={n}
                      onClick={function() { setAnos(n) }}
                      style={{ padding: '5px 12px', border: active ? '1px solid var(--gold)' : '1px solid var(--border)', borderRadius: '20px', background: active ? 'rgba(201,168,76,0.15)' : 'transparent', color: active ? 'var(--gold)' : 'var(--text-muted)', fontSize: '12px', fontWeight: active ? 700 : 400, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                    >
                      {n}a
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.7 }}>
              Projeção com rentabilidade real de <strong style={{ color: 'var(--gold)' }}>4% a.a.</strong> (IPCA+4% sem projetar inflação) · Aportes e restituições reinvestidos anualmente.
            </div>

            {/* Summary metrics */}
            {projection.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '24px' }}>
                {[
                  { label: 'Patrimônio PGBL em ' + anos + ' anos', value: fmtBRLShort(projection[projection.length - 1].patrimonioPGBL), color: '#4a9fd4' },
                  { label: 'Restituições acumuladas', value: fmtBRLShort(projection[projection.length - 1].restituicoes), color: 'var(--gold)' },
                  { label: 'Total', value: fmtBRLShort(projection[projection.length - 1].total), color: 'var(--green)' },
                ].map(function(m) {
                  return (
                    <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: m.color, marginBottom: '6px', opacity: 0.8 }}>{m.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '17px', color: m.color, fontWeight: 700 }}>{m.value}</div>
                    </div>
                  )
                })}
              </div>
            )}

            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={projection} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="ano"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  tickFormatter={function(v) { return 'Ano ' + v }}
                  stroke="var(--border)"
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  tickFormatter={function(v) { return fmtBRLShort(v) }}
                  stroke="var(--border)"
                  width={80}
                />
                <Tooltip content={CustomTooltip} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)' }}
                  formatter={function(value) { return <span style={{ color: 'var(--text-muted)' }}>{value}</span> }}
                />
                <Line type="monotone" dataKey="patrimonioPGBL" name="Patrimônio PGBL" stroke="#4a9fd4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="restituicoes" name="Restituições reinvestidas" stroke="var(--gold)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="total" name="Total" stroke="var(--green)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>

            {/* Toggle table */}
            <button
              onClick={function() { setShowTable(function(t) { return !t }) }}
              style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px', padding: '8px 16px', cursor: 'pointer', width: '100%', marginTop: '16px' }}
            >
              {showTable ? '▴ Ocultar tabela' : '▾ Ver tabela ano a ano'}
            </button>

            {showTable && (
              <div style={{ overflowX: 'auto', marginTop: '14px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      {['Ano', 'Aportado', 'Patrimônio PGBL', 'Restituições', 'Total'].map(function(h) {
                        return (
                          <th key={h} style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', padding: '8px 12px', textAlign: h === 'Ano' ? 'center' : 'right', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {projection.map(function(row, idx) {
                      const isLast = idx === projection.length - 1
                      return (
                        <tr key={row.ano} style={{ background: isLast ? 'rgba(201,168,76,0.05)' : 'transparent' }}>
                          <td style={{ padding: '7px 12px', textAlign: 'center', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'var(--font-mono)' }}>{row.ano}</td>
                          {[row.aportado, row.patrimonioPGBL, row.restituicoes].map(function(val, vi) {
                            return <td key={vi} style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{fmtBRL(val)}</td>
                          })}
                          <td style={{ padding: '7px 12px', textAlign: 'right', color: isLast ? 'var(--gold)' : 'var(--text)', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'var(--font-mono)', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtBRL(row.total)}</td>
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {mode === 'manual' ? 'Informe a renda acima' : 'Envie seus documentos acima'}
          </div>
          <div style={{ fontSize: '14px', maxWidth: '360px', margin: '0 auto', lineHeight: 1.7 }}>
            {mode === 'manual'
              ? 'Insira a renda bruta tributável mensal ou anual para ver a análise do PGBL.'
              : 'Faça o upload dos seus holerites ou da declaração de IR para análise automática por IA.'}
          </div>
        </div>
      )}
    </div>
  )
}
