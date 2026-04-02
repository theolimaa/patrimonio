import React, { useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  fmtBRL, fmtBRLShort, parseCents, fromCents, centsToNum,
  calcIR, calcINSSMensal, calcINSSAnual, calcPGBL, calcComparativoIR,
  projetarPGBL, extractPdfText, callClaude
} from '../utils'

// ── Sub-components ────────────────────────────────────────────────────────────
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

function MoneyField({ label, value, onChange, hint, disabled }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: disabled ? 'var(--text-dim)' : 'var(--gold)', fontSize: '13px', fontWeight: 700, pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>R$</span>
        <input
          type="text"
          value={fromCents(value)}
          onChange={function(e) { if (!disabled) onChange(parseCents(e.target.value)) }}
          placeholder="0,00"
          disabled={disabled}
          style={{ width: '100%', background: disabled ? 'var(--bg-input)' : 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '13px 14px 13px 46px', color: disabled ? 'var(--text-dim)' : 'var(--text)', fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 500, outline: 'none', opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
          onFocus={function(e) { if (!disabled) e.target.style.borderColor = 'var(--gold)' }}
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
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: bg, border: '1px solid ' + clr, borderRadius: '20px', padding: '4px 12px' }}>
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
  const [dragging, setDragging] = React.useState(false)
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
        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
          {single ? 'PDF · texto extraído automaticamente' : 'PDF · múltiplos arquivos aceitos'}
        </div>
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

const ANOS_OPTIONS = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30]

const CATEGORIAS_RENDA = {
  trabalho:      { label: 'Rendimentos do Trabalho',    cor: '#4a9fd4' },
  alugueis:      { label: 'Aluguéis e Arrendamentos',   cor: '#c9a84c' },
  investimentos: { label: 'Investimentos & Aplicações', cor: '#2ecc71' },
  empresa:       { label: 'Rendimentos Empresariais',   cor: '#9b59b6' },
  outros:        { label: 'Outros Rendimentos',         cor: '#e67e22' },
  nao_tributavel:{ label: 'Não Tributáveis / Isentos',  cor: '#7f8c8d' },
}

function truncarTexto(texto, maxChars) {
  if (!texto || texto.length <= maxChars) return texto
  const parte = Math.floor(maxChars / 2)
  return texto.slice(0, parte) + '\n[...]\n' + texto.slice(texto.length - parte)
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PGBL({ formState, setFormState, onDataChange }) {
  const [loading, setLoading] = React.useState(false)
  const [loadingMsg, setLoadingMsg] = React.useState('')
  const [error, setError] = React.useState('')

  const {
    mode, rendaMensal, rendaAnual, syncFrom,
    contribuiINSS, inssManual, inssOverride,
    rendExclusivos,
    holerites, irFile, extracted, anos, showTable
  } = formState

  function upd(key) {
    return function(val) { setFormState(function(prev) { return { ...prev, [key]: val } }) }
  }

  function handleRendaMensalChange(cents) {
    setFormState(function(prev) {
      return { ...prev, rendaMensal: cents, syncFrom: 'mensal', rendaAnual: String(Math.round(((parseInt(cents) || 0) / 100) * 12 * 100)) }
    })
  }
  function handleRendaAnualChange(cents) {
    setFormState(function(prev) {
      return { ...prev, rendaAnual: cents, syncFrom: 'anual', rendaMensal: String(Math.round(((parseInt(cents) || 0) / 100 / 12) * 100)) }
    })
  }

  // Renda bruta mensal e anual
  const rendaMensalNum = mode === 'manual'
    ? (syncFrom === 'mensal' ? centsToNum(rendaMensal) : centsToNum(rendaAnual) / 12)
    : (extracted ? extracted.rendaMensal : 0)
  const rendaAnualNum = mode === 'manual'
    ? (syncFrom === 'anual' ? centsToNum(rendaAnual) : centsToNum(rendaMensal) * 12)
    : (extracted ? extracted.rendaAnual : 0)

  // Rendimentos com tributação exclusiva (13º automático + PLR manual)
  const decimo13Auto = formState.desconta13 ? rendaMensalNum : 0
  const rendExclusivosNum = decimo13Auto + centsToNum(rendExclusivos || '')

  // INSS: automático (tabela 2024) ou manual
  const inssAutoMensal = contribuiINSS ? calcINSSMensal(rendaMensalNum) : 0
  const inssAutoAnual  = contribuiINSS ? calcINSSAnual(rendaMensalNum, 12) : 0
  const inssAnualFinal = contribuiINSS
    ? (inssOverride && inssManual ? centsToNum(inssManual) : inssAutoAnual)
    : 0

  // Base compensável = Bruta − Rendimentos exclusivos (13º, PLR)
  const baseLiquidaAnual  = Math.max(0, rendaAnualNum - inssAnualFinal)
  const baseCompensavelAnual = Math.max(0, rendaAnualNum - rendExclusivosNum)

  // IR sobre base sem rendimentos exclusivos e sem INSS
  const irInfo = calcIR((baseCompensavelAnual - inssAnualFinal) / 12)

  // PGBL: limite 12% da base compensável
  const pgblInfo = calcPGBL(rendaAnualNum, irInfo.aliquotaMarginal, inssAnualFinal, rendExclusivosNum)
  const previdenciaCorpAnual = extracted ? (extracted.previdenciaCorpAnual || 0) : 0
  const pgblRestante = Math.max(0, pgblInfo.pgblIdeal - previdenciaCorpAnual)
  const economiaRestante = pgblRestante * irInfo.aliquotaMarginal

  // Comparativo IR
  const comparativo = calcComparativoIR(rendaAnualNum, inssAnualFinal, pgblInfo.pgblIdeal, rendExclusivosNum)

  const projection = projetarPGBL(pgblRestante, irInfo.aliquotaMarginal, anos)
  const hasData = rendaAnualNum > 0

  useEffect(function() {
    if (hasData) {
      onDataChange({
        rendaAnual: rendaAnualNum,
        rendaMensal: rendaMensalNum,
        inssAnual: inssAnualFinal,
        baseLiquida: baseLiquidaAnual,
        aliquotaMarginal: irInfo.aliquotaMarginal,
        pgblIdeal: pgblInfo.pgblIdeal,
        pgblRestante,
        previdenciaCorpAnual,
        economiaAnual: pgblInfo.economiaAnual,
        economiaRestante,
        comparativo,
        projecao: projection,
        anos,
      })
    }
  }, [rendaAnualNum, anos, inssAnualFinal, previdenciaCorpAnual])

  // ── Upload ──────────────────────────────────────────────────────────────────
  async function processUpload() {
    const allFiles = [...holerites, ...irFile]
    if (allFiles.length === 0) { setError('Envie ao menos um arquivo.'); return }
    setError(''); setLoading(true)
    try {
      let textoCompleto = ''
      for (var i = 0; i < irFile.length; i++) {
        setLoadingMsg('Lendo declaração IR...')
        textoCompleto += '\n\n=== DECLARAÇÃO DE IR ===\n' + truncarTexto(await extractPdfText(irFile[i]), 3500)
      }
      for (var j = 0; j < holerites.length; j++) {
        setLoadingMsg('Lendo holerite ' + (j + 1) + ' de ' + holerites.length + '...')
        textoCompleto += '\n\n=== HOLERITE ' + (j + 1) + ' ===\n' + truncarTexto(await extractPdfText(holerites[j]), 2000)
      }
      if (textoCompleto.length > 5500) textoCompleto = truncarTexto(textoCompleto, 5500)
      setLoadingMsg('Analisando com IA...')

      const prompt = `Especialista tributário BR. Analise os documentos e extraia JSON puro.

Tributáveis: salário, 13º, férias+1/3, pró-labore, bônus folha, aluguéis PF, JCP, pensão alimentícia.
Não tributáveis: dividendos, PLR, FGTS, indenização trabalhista, seguro-desemprego.
Descontos: INSS, IRRF, previdência corporativa (Prev, PGBL corp, Fundo Pensão).
Se múltiplos holerites, some os valores anuais.

Responda SOMENTE JSON:
{"rendaMensalTributavel":número,"rendaAnualTributavel":número,"rendaAnualNaoTributavel":número,"inss":número,"irrf":número,"meses":número,"previdenciaCorpMensal":número,"previdenciaCorpAnual":número,"nomePrevidenciaCorp":"string ou null","fontes":[{"descricao":"string","valor":número,"tributavel":boolean,"categoria":"trabalho|alugueis|investimentos|empresa|outros|nao_tributavel","observacao":"string ou null"}],"descontos":[{"descricao":"string","valor":número,"tipo":"inss|irrf|previdencia_corp|outros"}],"observacoes":"string"}

DOCUMENTOS:
${textoCompleto}`

      const raw = await callClaude([{ role: 'user', content: prompt }], 1000)
      const clean = raw.replace(/```json|```/g, '').trim()
      const si = clean.indexOf('{'), ei = clean.lastIndexOf('}')
      const parsed = JSON.parse(si >= 0 ? clean.slice(si, ei + 1) : clean)

      upd('extracted')({
        rendaMensal: parsed.rendaMensalTributavel || 0,
        rendaAnual: parsed.rendaAnualTributavel || 0,
        rendaAnualNaoTributavel: parsed.rendaAnualNaoTributavel || 0,
        inss: parsed.inss || 0,
        irrf: parsed.irrf || 0,
        meses: parsed.meses || 12,
        previdenciaCorpMensal: parsed.previdenciaCorpMensal || 0,
        previdenciaCorpAnual: parsed.previdenciaCorpAnual || 0,
        nomePrevidenciaCorp: parsed.nomePrevidenciaCorp || null,
        fontes: parsed.fontes || [],
        descontos: parsed.descontos || [],
        observacoes: parsed.observacoes || '',
        itens: (parsed.fontes || []).map(function(f) { return { descricao: f.descricao, valor: f.valor, tributavel: f.tributavel } }),
      })
    } catch (err) { setError('Erro: ' + err.message) }
    setLoading(false); setLoadingMsg('')
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <SectionTitle />

      {/* Modo toggle */}
      <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '5px', marginBottom: '20px', maxWidth: '460px', boxShadow: 'var(--shadow-card)' }}>
        {[{ key: 'manual', icon: '✏️', label: 'Preencher manualmente' }, { key: 'upload', icon: '📎', label: 'Upload de documentos' }].map(function(opt) {
          const active = mode === opt.key
          return (
            <button key={opt.key} onClick={function() { upd('mode')(opt.key); setError('') }}
              style={{ flex: 1, padding: '10px 12px', border: 'none', borderRadius: '9px', background: active ? 'var(--gold-dim)' : 'transparent', color: active ? 'var(--gold)' : 'var(--text-muted)', fontSize: '13px', fontWeight: active ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-display)' }}>
              {opt.icon} {opt.label}
            </button>
          )
        })}
      </div>

      {/* ── MODO MANUAL ── */}
      {mode === 'manual' && (
        <Card>
          <CardTitle>Renda Bruta Tributável</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <MoneyField label="Renda mensal" value={rendaMensal} onChange={handleRendaMensalChange} hint="Salário, pró-labore e demais tributáveis" />
            <MoneyField label="Renda anual" value={rendaAnual} onChange={handleRendaAnualChange} hint="Calculado automaticamente ou edite aqui" />
          </div>

          {/* Rendimentos com tributação exclusiva */}
          <div style={{ background: 'rgba(74,159,212,0.05)', border: '1px solid rgba(74,159,212,0.2)', borderRadius: '12px', padding: '16px 18px', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#4a9fd4', fontFamily: 'var(--font-display)', marginBottom: '10px' }}>
              Rendimentos com tributação exclusiva
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '14px', lineHeight: 1.6 }}>
              13º salário e PLR têm tributação exclusiva na fonte e <strong style={{ color: 'var(--text-muted)' }}>não entram na base compensável do PGBL</strong> — igual à "Receita Bruta Tributável Compensável" usada pela XP.
            </div>

            {/* Checkbox 13º automático */}
            <button
              onClick={function() { upd('desconta13')(!formState.desconta13) }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', background: formState.desconta13 ? 'rgba(74,159,212,0.1)' : 'var(--bg-input)', border: formState.desconta13 ? '1.5px solid #4a9fd4' : '1.5px solid var(--border)', borderRadius: '9px', padding: '11px 14px', cursor: 'pointer', width: '100%', textAlign: 'left', marginBottom: '8px' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: formState.desconta13 ? '#4a9fd4' : 'transparent', border: formState.desconta13 ? '2px solid #4a9fd4' : '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {formState.desconta13 && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 900 }}>✓</span>}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: formState.desconta13 ? '#4a9fd4' : 'var(--text)', fontFamily: 'var(--font-display)' }}>
                  Deduzir 13º salário automaticamente
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '1px' }}>
                  {formState.desconta13 ? `− ${fmtBRL(rendaMensalNum)} (1 mês de salário excluído da base)` : 'Subtrai 1 mês de salário da base compensável'}
                </div>
              </div>
            </button>

            {/* Campo PLR/outros */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <MoneyField
                label="PLR / outros rendimentos exclusivos (anual)"
                value={rendExclusivos}
                onChange={upd('rendExclusivos')}
                hint="Participação nos lucros ou outros rendimentos com tributação exclusiva"
              />
            </div>

            {/* Resumo da base compensável */}
            {(formState.desconta13 || rendExclusivosNum > 0) && (
              <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Renda bruta total</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>{fmtBRL(rendaAnualNum)}</div>
                </div>
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4a9fd4', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>(-) Exclusivos</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#4a9fd4' }}>− {fmtBRL(rendExclusivosNum)}</div>
                </div>
                <div style={{ background: 'rgba(26,153,85,0.07)', border: '1px solid rgba(26,153,85,0.25)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--green)', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Base compensável</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--green)' }}>{fmtBRL(baseCompensavelAnual)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Checkbox INSS */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <button
              onClick={function() { upd('contribuiINSS')(!contribuiINSS) }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', background: contribuiINSS ? 'rgba(201,168,76,0.08)' : 'var(--bg-input)', border: contribuiINSS ? '1.5px solid var(--gold)' : '1.5px solid var(--border)', borderRadius: '12px', padding: '14px 18px', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.2s' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: contribuiINSS ? 'var(--gold)' : 'transparent', border: contribuiINSS ? '2px solid var(--gold)' : '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                {contribuiINSS && <span style={{ color: '#fff', fontSize: '13px', fontWeight: 900 }}>✓</span>}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: contribuiINSS ? 'var(--gold-light)' : 'var(--text)' }}>Contribui com INSS / RPPS</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {contribuiINSS
                    ? 'O INSS reduz a base tributável antes do cálculo dos 12% do PGBL (lógica XP)'
                    : 'Marque se o cliente é CLT, servidor público ou MEI com desconto previdenciário'}
                </div>
              </div>
            </button>

            {contribuiINSS && (
              <div className="animate-in" style={{ marginTop: '16px' }}>
                {/* INSS automático */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '9px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>INSS mensal (auto)</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--gold-light)', fontWeight: 700 }}>{fmtBRL(inssAutoMensal)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Tabela progressiva 2024</div>
                  </div>
                  <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '9px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>INSS anual (auto)</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--gold-light)', fontWeight: 700 }}>{fmtBRL(inssAutoAnual)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Teto: {fmtBRL(908.86 * 12)}/ano</div>
                  </div>
                  <div style={{ background: 'rgba(26,153,85,0.07)', border: '1px solid rgba(26,153,85,0.25)', borderRadius: '9px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--green)', marginBottom: '4px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Base PGBL (bruta − INSS)</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--green)', fontWeight: 700 }}>{fmtBRL(baseLiquidaAnual)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Igual à lógica XP</div>
                  </div>
                </div>

                {/* Override manual */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <button
                    onClick={function() { upd('inssOverride')(!inssOverride) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px', padding: 0 }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid var(--border)', background: inssOverride ? 'var(--text-muted)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {inssOverride && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 900 }}>✓</span>}
                    </div>
                    Informar valor de INSS manualmente
                  </button>
                </div>
                {inssOverride && (
                  <MoneyField
                    label="INSS anual manual"
                    value={inssManual}
                    onChange={upd('inssManual')}
                    hint="Substitui o cálculo automático"
                  />
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── MODO UPLOAD ── */}
      {mode === 'upload' && (
        <div>
          <Card>
            <CardTitle>Holerites</CardTitle>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.7 }}>
              A IA identifica rendimentos, descontos, INSS e previdência corporativa automaticamente.
            </div>
            <DropZone files={holerites} onAdd={function(arr) { upd('holerites')(holerites.concat(arr)) }} onRemove={function(idx) { upd('holerites')(holerites.filter(function(_, j) { return j !== idx })) }} label="Clique ou arraste os holerites aqui" />
          </Card>
          <Card>
            <CardTitle>Declaração de IR (opcional)</CardTitle>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.7 }}>
              Complementa com aluguéis, investimentos, dividendos e demais rendimentos declarados.
            </div>
            <DropZone files={irFile} onAdd={function(arr) { upd('irFile')([arr[0]]) }} onRemove={function() { upd('irFile')([]) }} label="Clique ou arraste a declaração aqui" single={true} />
          </Card>

          {error && <div style={{ background: 'rgba(204,44,31,0.08)', border: '1px solid rgba(204,44,31,0.25)', borderRadius: '10px', padding: '12px 16px', color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>⚠️ {error}</div>}
          {loading ? <Spinner msg={loadingMsg || 'Processando...'} sub="Extraindo texto e analisando com IA" /> : (
            <button onClick={processUpload} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#8a6010,var(--gold))', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
              Analisar com IA
            </button>
          )}

          {extracted && !loading && (
            <div className="animate-in">
              <Card style={{ marginTop: '16px', borderColor: 'rgba(26,153,85,0.4)' }}>
                <CardTitle>Dados extraídos</CardTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
                  {[
                    ['Renda tributável mensal', fmtBRL(extracted.rendaMensal)],
                    ['Renda tributável anual', fmtBRL(extracted.rendaAnual)],
                    ['Renda não tributável', fmtBRL(extracted.rendaAnualNaoTributavel)],
                    ['INSS retido (ano)', fmtBRL(extracted.inss)],
                    ['IRRF retido (ano)', fmtBRL(extracted.irrf)],
                    ['Meses analisados', extracted.meses + ' meses'],
                  ].map(function(item) {
                    return (
                      <div key={item[0]} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '9px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{item[0]}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text)', fontWeight: 600 }}>{item[1]}</div>
                      </div>
                    )
                  })}
                </div>

                {extracted.previdenciaCorpAnual > 0 && (
                  <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '10px' }}>Previdência Corporativa Identificada</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      {[
                        ['Plano', extracted.nomePrevidenciaCorp || 'Prev. Corporativa'],
                        ['Desconto mensal', fmtBRL(extracted.previdenciaCorpMensal)],
                        ['Total anual', fmtBRL(extracted.previdenciaCorpAnual)],
                      ].map(function(item) {
                        return (
                          <div key={item[0]}>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item[0]}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--gold-light)', fontWeight: 700 }}>{item[1]}</div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>Este valor já conta para o limite de 12% do PGBL.</div>
                  </div>
                )}

                {/* Fontes por categoria */}
                {extracted.fontes && extracted.fontes.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Fontes de Renda Identificadas</div>
                    {Object.keys(CATEGORIAS_RENDA).map(function(catKey) {
                      const cat = CATEGORIAS_RENDA[catKey]
                      const itens = extracted.fontes.filter(function(f) { return f.categoria === catKey })
                      if (itens.length === 0) return null
                      const total = itens.reduce(function(acc, f) { return acc + (f.valor || 0) }, 0)
                      return (
                        <div key={catKey} style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: cat.cor, flexShrink: 0 }} />
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cat.label}</span>
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{fmtBRL(total)}/ano</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '18px' }}>
                            {itens.map(function(fonte, idx) {
                              return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '9px 12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: fonte.tributavel ? cat.cor : 'var(--text-dim)', marginTop: '5px', flexShrink: 0 }} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{fonte.descricao}</div>
                                    {fonte.observacao && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', fontStyle: 'italic' }}>{fonte.observacao}</div>}
                                  </div>
                                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>{fmtBRL(fonte.valor)}</div>
                                    <div style={{ fontSize: '10px', marginTop: '2px', color: fonte.tributavel ? cat.cor : 'var(--text-dim)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{fonte.tributavel ? 'Tributável' : 'Isento'}</div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                      <div style={{ padding: '10px 14px', background: 'var(--gold-dim)', border: '1px solid var(--gold)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Total tributável</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--gold-light)', fontWeight: 700 }}>{fmtBRL(extracted.rendaAnual)}/ano</div>
                      </div>
                      <div style={{ padding: '10px 14px', background: 'rgba(127,140,141,0.08)', border: '1px solid rgba(127,140,141,0.25)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Total isento</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--text)', fontWeight: 700 }}>{fmtBRL(extracted.rendaAnualNaoTributavel)}/ano</div>
                      </div>
                    </div>
                  </div>
                )}

                {extracted.descontos && extracted.descontos.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Descontos Identificados</div>
                    {extracted.descontos.map(function(desc, idx) {
                      const corTipo = { inss: '#4a9fd4', irrf: '#e74c3c', previdencia_corp: '#c9a84c', outros: '#7f8c8d' }
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: '7px', border: '1px solid var(--border)', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: corTipo[desc.tipo] || '#7f8c8d', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: 'var(--text)' }}>{desc.descricao}</span>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--red)', fontWeight: 600 }}>- {fmtBRL(desc.valor)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                {extracted.observacoes && (
                  <div style={{ padding: '12px 14px', background: 'rgba(74,159,212,0.07)', border: '1px solid rgba(74,159,212,0.2)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    📌 {extracted.observacoes}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── ANÁLISE TRIBUTÁRIA ── */}
      {hasData && (
        <div className="animate-in">
          <Card style={{ borderColor: 'var(--gold)' }}>
            <CardTitle>Análise Tributária</CardTitle>

            {/* Cards superiores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Renda bruta anual</div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700 }}>{fmtBRLShort(rendaAnualNum)}</span>
              </div>
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Alíquota marginal</div>
                <AliquotaBadge pct={irInfo.aliquotaMarginal} />
                {contribuiINSS && <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '6px' }}>Calculada sobre base líquida (− INSS)</div>}
              </div>
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                  Limite PGBL (12% da renda bruta)
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700 }}>{fmtBRLShort(pgblInfo.pgblIdeal)}/ano</span>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{fmtBRLShort(pgblInfo.pgblIdeal / 12)}/mês</div>
              </div>
            </div>

            {/* Waterfall base de cálculo */}
            {(contribuiINSS || rendExclusivosNum > 0) && (
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 18px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '12px' }}>Base de Cálculo do IR</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 13px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                    <span>Renda bruta anual</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmtBRL(rendaAnualNum)}</span>
                  </div>
                  {rendExclusivosNum > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 13px', background: 'rgba(127,140,141,0.06)', borderRadius: '8px', border: '1px solid rgba(127,140,141,0.2)', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <div>
                        <span>(−) Rendimentos com tributação exclusiva</span>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>13º salário, PLR e similares — não entram nos 12% do PGBL</div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0, marginLeft: '12px' }}>− {fmtBRL(rendExclusivosNum)}</span>
                    </div>
                  )}
                  {contribuiINSS && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 13px', background: 'rgba(74,159,212,0.06)', borderRadius: '8px', border: '1px solid rgba(74,159,212,0.2)', fontSize: '13px', color: '#4a9fd4' }}>
                      <span>(−) INSS {inssOverride ? 'manual' : '(tabela progressiva 2024)'}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>− {fmtBRL(inssAnualFinal)}</span>
                    </div>
                  )}
                  {rendExclusivosNum > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 13px', background: 'var(--gold-dim)', borderRadius: '8px', border: '1px solid var(--gold)', fontSize: '13px' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--gold-light)', fontFamily: 'var(--font-display)' }}>Base compensável (= 12% PGBL)</span>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Igual à "Receita Bruta Tributável Compensável" da XP</div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--gold-light)', flexShrink: 0, marginLeft: '12px' }}>{fmtBRL(baseCompensavelAnual)}</span>
                    </div>
                  )}
                  {contribuiINSS && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 13px', background: 'rgba(201,168,76,0.06)', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.2)', fontSize: '13px', color: 'var(--gold)' }}>
                        <span>(−) PGBL — 12% da base compensável</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>− {fmtBRL(pgblInfo.pgblIdeal)}</span>
                      </div>
                      <div style={{ height: '1px', background: 'var(--border)', margin: '2px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 13px', background: 'rgba(26,153,85,0.07)', borderRadius: '8px', border: '1.5px solid rgba(26,153,85,0.3)', fontSize: '13px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>Base tributável com PGBL</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--green)' }}>{fmtBRL(comparativo.baseComPGBL)}</span>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic', lineHeight: 1.6 }}>
                  ✓ INSS e PGBL são deduções independentes do IR (Receita Federal). Rendimentos com tributação exclusiva não compõem a base compensável.
                </div>
              </div>
            )}

            {/* Waterfall limite PGBL */}
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 18px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '12px' }}>Composição do Limite PGBL</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 13px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  <span>Limite dedutível anual (12% da base)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmtBRL(pgblInfo.pgblIdeal)}</span>
                </div>
                {previdenciaCorpAnual > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 13px', background: 'rgba(26,153,85,0.06)', borderRadius: '8px', border: '1px solid rgba(26,153,85,0.2)', fontSize: '13px', color: 'var(--green)' }}>
                    <div>
                      <span>(−) Previdência corporativa já descontada</span>
                      {extracted && extracted.nomePrevidenciaCorp && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{extracted.nomePrevidenciaCorp}</div>}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>− {fmtBRL(previdenciaCorpAnual)}</span>
                  </div>
                )}
                <div style={{ height: '1px', background: 'var(--border)', margin: '2px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 13px', background: pgblRestante > 0 ? 'var(--gold-dim)' : 'rgba(26,153,85,0.07)', borderRadius: '8px', border: pgblRestante > 0 ? '1.5px solid var(--gold)' : '1.5px solid rgba(26,153,85,0.35)' }}>
                  <div>
                    <span style={{ fontSize: '13px', color: pgblRestante > 0 ? 'var(--gold-light)' : 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                      {pgblRestante > 0 ? 'Ainda pode aportar' : '✓ Limite 12% utilizado'}
                    </span>
                    {pgblRestante > 0 && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{fmtBRL(pgblRestante / 12)}/mês · economia adicional de {fmtBRL(economiaRestante)}/ano</div>}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: pgblRestante > 0 ? 'var(--gold-light)' : 'var(--green)', fontWeight: 800 }}>{fmtBRL(pgblRestante)}</span>
                </div>
              </div>
            </div>

            {/* Comparativo IR — estilo XP */}
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 18px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '14px' }}>Impacto no Imposto de Renda</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(204,44,31,0.06)', border: '1px solid rgba(204,44,31,0.2)', borderRadius: '10px', padding: '13px 15px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--red)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '6px' }}>IR sem PGBL</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--red)', fontWeight: 700 }}>{fmtBRL(comparativo.irAnualSemPGBL)}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '3px' }}>estimativa anual</div>
                </div>
                <div style={{ background: 'rgba(26,153,85,0.06)', border: '1px solid rgba(26,153,85,0.2)', borderRadius: '10px', padding: '13px 15px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '6px' }}>IR com PGBL</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--green)', fontWeight: 700 }}>{fmtBRL(comparativo.irAnualComPGBL)}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '3px' }}>estimativa anual</div>
                </div>
                <div style={{ background: 'var(--gold-dim)', border: '1.5px solid var(--gold)', borderRadius: '10px', padding: '13px 15px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '6px' }}>Economia no IR</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--gold-light)', fontWeight: 800 }}>{fmtBRL(comparativo.economia)}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '3px' }}>{fmtBRL(comparativo.economia / 12)}/mês</div>
                </div>
              </div>
            </div>

            {/* Economias */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(26,153,85,0.08)', border: '1px solid rgba(26,153,85,0.3)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--green)', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Economia fiscal total (100% do limite)</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--green)' }}>{fmtBRL(pgblInfo.economiaAnual)}/ano</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{fmtBRL(pgblInfo.economiaAnual / 12)}/mês</div>
              </div>
              <div style={{ background: previdenciaCorpAnual > 0 ? 'var(--gold-dim)' : 'rgba(26,153,85,0.08)', border: previdenciaCorpAnual > 0 ? '1px solid var(--gold)' : '1px solid rgba(26,153,85,0.3)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: previdenciaCorpAnual > 0 ? 'var(--gold)' : 'var(--green)', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                  {previdenciaCorpAnual > 0 ? 'Economia adicional disponível' : 'Economia fiscal disponível'}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: previdenciaCorpAnual > 0 ? 'var(--gold-light)' : 'var(--green)' }}>{fmtBRL(economiaRestante)}/ano</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{fmtBRL(economiaRestante / 12)}/mês</div>
              </div>
            </div>

            <div style={{ padding: '14px 16px', background: 'var(--gold-dim)', border: '1px solid var(--gold)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              💡 <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Como funciona:</strong>{' '}
              {previdenciaCorpAnual > 0
                ? `Você já contribui com ${fmtBRL(previdenciaCorpAnual)}/ano via previdência corporativa. Ainda pode aportar mais ${fmtBRL(pgblRestante)}/ano (${fmtBRL(pgblRestante / 12)}/mês) para usar 100% do limite, gerando economia adicional de ${fmtBRL(economiaRestante)}/ano no IR.`
                : contribuiINSS
                  ? `O limite do PGBL é 12% da renda bruta (${fmtBRL(pgblInfo.pgblIdeal)}/ano). O INSS (${fmtBRL(inssAnualFinal)}/ano) e o PGBL são deduções independentes — a base do IR com PGBL é ${fmtBRL(comparativo.baseComPGBL)}/ano, gerando economia de ${fmtBRL(comparativo.economia)}/ano.`
                  : `Contribuindo com ${fmtBRL(pgblInfo.pgblIdeal)}/ano no PGBL (12% da renda bruta), você deduz da base do IR. Com alíquota de ${(irInfo.aliquotaMarginal * 100).toFixed(1)}%, economia de ${fmtBRL(pgblInfo.economiaAnual)}/ano.`
              }
            </div>
          </Card>

          {/* Projeção */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <CardTitle>Projeção Patrimonial</CardTitle>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {ANOS_OPTIONS.map(function(n) {
                  const active = anos === n
                  return (
                    <button key={n} onClick={function() { upd('anos')(n) }}
                      style={{ padding: '5px 11px', border: active ? '1.5px solid var(--gold)' : '1px solid var(--border)', borderRadius: '20px', background: active ? 'var(--gold-dim)' : 'transparent', color: active ? 'var(--gold)' : 'var(--text-muted)', fontSize: '12px', fontWeight: active ? 800 : 400, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                      {n}a
                    </button>
                  )
                })}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.7 }}>
              Projeção sobre o <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>aporte restante de {fmtBRL(pgblRestante / 12)}/mês</strong> · rentabilidade real de 4% a.a. · restituições reinvestidas.
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
            <button onClick={function() { upd('showTable')(!showTable) }}
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

      {!hasData && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>
            {mode === 'manual' ? 'Informe a renda acima' : 'Envie seus documentos acima'}
          </div>
          <div style={{ fontSize: '14px', maxWidth: '360px', margin: '0 auto', lineHeight: 1.7, color: 'var(--text-dim)' }}>
            {mode === 'manual' ? 'Insira a renda bruta tributável para ver a análise do PGBL.' : 'Faça upload dos holerites ou declaração de IR para análise automática.'}
          </div>
        </div>
      )}
    </div>
  )
}
