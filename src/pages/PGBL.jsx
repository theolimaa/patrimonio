import React, { useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  fmtBRL, fmtBRLShort, parseCents, fromCents, centsToNum,
  calcIR, calcINSSMensal, calcINSSAnual, calcPGBL, calcComparativoIR,
  projetarPGBL, callGeminiPDF, callClaude
} from '../utils'

// ── Helpers ───────────────────────────────────────────────────────────────────
function truncar(texto, max) {
  if (!texto || texto.length <= max) return texto
  const p = Math.floor(max / 2)
  return texto.slice(0, p) + '\n...\n' + texto.slice(texto.length - p)
}

// ── UI Components ─────────────────────────────────────────────────────────────
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
        <input type="text" value={fromCents(value)} onChange={function(e) { if (!disabled) onChange(parseCents(e.target.value)) }} placeholder="0,00" disabled={disabled}
          style={{ width: '100%', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '13px 14px 13px 46px', color: disabled ? 'var(--text-dim)' : 'var(--text)', fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 500, outline: 'none', opacity: disabled ? 0.6 : 1 }}
          onFocus={function(e) { if (!disabled) e.target.style.borderColor = 'var(--gold)' }}
          onBlur={function(e) { e.target.style.borderColor = 'var(--border)' }} />
      </div>
      {hint && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '5px', fontStyle: 'italic' }}>{hint}</div>}
    </div>
  )
}

function Spinner({ msg }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid var(--gold-dim)', borderTop: '3px solid var(--gold)', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 14px' }} />
      <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{msg}</div>
    </div>
  )
}

function AliquotaBadge({ pct }) {
  const v = Math.round(pct * 1000) / 10
  const green = v === 0
  const bg = green ? 'rgba(26,153,85,0.1)' : v <= 15 ? 'rgba(243,156,18,0.1)' : 'rgba(204,44,31,0.1)'
  const clr = green ? 'var(--green)' : v <= 15 ? '#c87010' : 'var(--red)'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: bg, border: '1px solid ' + clr, borderRadius: '20px', padding: '4px 12px' }}>
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: clr }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: clr }}>{v.toFixed(1)}%</span>
    </div>
  )
}

function ChartTooltip(props) {
  if (!props.active || !props.payload || !props.payload.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', minWidth: '200px', boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize: '12px', color: 'var(--gold)', marginBottom: '8px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Ano {props.label}</div>
      {props.payload.map(function(e) {
        return (
          <div key={e.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: e.color }}>{e.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>{fmtBRLShort(e.value)}</span>
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
    if (single) { onAdd([arr[0]]) } else {
      const novos = arr.filter(function(f) { return !files.find(function(x) { return x.name === f.name && x.size === f.size }) })
      if (novos.length) onAdd(novos)
    }
  }
  return (
    <div>
      <div onDragOver={function(e) { e.preventDefault(); setDragging(true) }} onDragLeave={function() { setDragging(false) }}
        onDrop={function(e) { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={function() { inputRef.current.click() }}
        style={{ border: '2px dashed ' + (dragging ? 'var(--gold)' : files.length ? 'rgba(26,153,85,0.5)' : 'var(--border-strong)'), borderRadius: '12px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'var(--gold-dim)' : files.length ? 'rgba(26,153,85,0.05)' : 'var(--bg-input)', transition: 'all 0.2s' }}>
        <input ref={inputRef} type="file" accept="application/pdf,image/*" multiple={!single} style={{ display: 'none' }} onChange={function(e) { handleFiles(e.target.files) }} />
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>{files.length ? '✅' : '📄'}</div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: files.length ? 'var(--green)' : 'var(--text)', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>
          {files.length ? (single ? files[0].name : files.length + ' arquivo' + (files.length > 1 ? 's' : '') + ' selecionado' + (files.length > 1 ? 's' : '')) : label}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>PDF · texto extraído automaticamente</div>
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function PGBL({ formState, setFormState, onDataChange }) {
  const [loading, setLoading] = React.useState(false)
  const [loadingMsg, setLoadingMsg] = React.useState('')
  const [error, setError] = React.useState('')

  const { mode, rendaMensal, rendaAnual, syncFrom, contribuiINSS, inssManual, inssOverride,
    rendExclusivos, holerites, irFile, extracted, irAnalise, anos, showTable, observacaoTributaria } = formState

  function upd(key) { return function(val) { setFormState(function(prev) { return { ...prev, [key]: val } }) } }

  function handleRendaMensalChange(cents) {
    setFormState(function(prev) { return { ...prev, rendaMensal: cents, syncFrom: 'mensal', rendaAnual: String(Math.round(((parseInt(cents) || 0) / 100) * 12 * 100)) } })
  }
  function handleRendaAnualChange(cents) {
    setFormState(function(prev) { return { ...prev, rendaAnual: cents, syncFrom: 'anual', rendaMensal: String(Math.round(((parseInt(cents) || 0) / 100 / 12) * 100)) } })
  }

  // Renda numérica
  const rendaMensalNum = mode === 'manual'
    ? (syncFrom === 'mensal' ? centsToNum(rendaMensal) : centsToNum(rendaAnual) / 12)
    : (irAnalise ? irAnalise.rendaCompensavelAnual / 12 : 0)
  const rendaAnualNum = mode === 'manual'
    ? (syncFrom === 'anual' ? centsToNum(rendaAnual) : centsToNum(rendaMensal) * 12)
    : (irAnalise ? irAnalise.rendaCompensavelAnual : 0)

  // INSS
  const inssAutoMensal = contribuiINSS ? calcINSSMensal(rendaMensalNum) : 0
  const inssAutoAnual = contribuiINSS ? calcINSSAnual(rendaMensalNum, 12) : 0
  const inssAnualFinal = mode === 'upload' && irAnalise
    ? (irAnalise.inss || 0)
    : (contribuiINSS ? (inssOverride && inssManual ? centsToNum(inssManual) : inssAutoAnual) : 0)

  // Exclusivos (PLR)
  const rendExclusivosNum = centsToNum(rendExclusivos || '')
  const baseCompensavelAnual = Math.max(0, rendaAnualNum - rendExclusivosNum)

  // Cálculos PGBL
  const irInfo = calcIR((baseCompensavelAnual - inssAnualFinal) / 12)
  const pgblInfo = calcPGBL(rendaAnualNum, irInfo.aliquotaMarginal, inssAnualFinal, rendExclusivosNum)

  // Previdência corporativa
  const previdenciaCorpAnual = mode === 'upload' && irAnalise
    ? (irAnalise.pgblCorporativoAnual || 0)
    : 0
  const pgblRestante = Math.max(0, pgblInfo.pgblIdeal - previdenciaCorpAnual)
  const economiaRestante = pgblRestante * irInfo.aliquotaMarginal
  const comparativo = calcComparativoIR(rendaAnualNum, inssAnualFinal, pgblInfo.pgblIdeal, rendExclusivosNum)
  const projection = projetarPGBL(pgblRestante, irInfo.aliquotaMarginal, anos)
  const hasData = rendaAnualNum > 0

  useEffect(function() {
    if (hasData) {
      onDataChange({ rendaAnual: rendaAnualNum, rendaMensal: rendaMensalNum, inssAnual: inssAnualFinal,
        aliquotaMarginal: irInfo.aliquotaMarginal, pgblIdeal: pgblInfo.pgblIdeal, pgblRestante,
        previdenciaCorpAnual, economiaAnual: pgblInfo.economiaAnual, economiaRestante, comparativo, projecao: projection, anos,
        observacaoTributaria: observacaoTributaria || '' })
    }
  }, [rendaAnualNum, anos, inssAnualFinal, previdenciaCorpAnual])

  // ── UPLOAD DE IR ────────────────────────────────────────────────────────────
  async function analisarIR() {
    const allFiles = [...irFile, ...holerites]
    if (allFiles.length === 0) { setError('Envie ao menos um arquivo.'); return }
    setError(''); setLoading(true)

    try {
      const prompt = `Você é especialista em planejamento tributário brasileiro. Analise este documento (declaração IRPF ou holerite) e retorne APENAS JSON, sem texto antes ou depois.

Preciso saber:
1. rendaCompensavelAnual: soma de todos os rendimentos tributáveis compensáveis pelo PGBL (salário, pró-labore, aluguéis, etc). EXCLUIR: 13º salário, PLR, dividendos, rendimentos com tributação exclusiva
2. inss: total de INSS/contribuição previdenciária descontado no ano
3. pgblCorporativoAnual: se houver desconto de previdência complementar/PGBL via empresa em folha, o valor anual total
4. nomePrevidenciaCorp: nome do plano de previdência corporativa se encontrado, ou null
5. outrasRendas: lista de rendimentos além do salário principal (aluguéis, pró-labore, pensão, etc)

RETORNE SOMENTE ESTE JSON:
{"rendaCompensavelAnual":0,"inss":0,"pgblCorporativoAnual":0,"nomePrevidenciaCorp":null,"outrasRendas":[{"descricao":"string","valor":0,"tributavel":true}],"observacoes":"string explicando o que encontrou"}`

      setLoadingMsg('Analisando documento com IA...')

      // Usa o primeiro arquivo (IR tem prioridade)
      const arquivo = irFile.length > 0 ? irFile[0] : holerites[0]
      const raw = await callGeminiPDF(arquivo, prompt, 1000)

      const clean = raw.replace(/```json|```/g, '').trim()
      const si = clean.indexOf('{')
      const ei = clean.lastIndexOf('}')
      if (si === -1) throw new Error('Resposta inválida da IA. Tente novamente.')

      const parsed = JSON.parse(clean.slice(si, ei + 1))

      upd('irAnalise')({
        rendaCompensavelAnual: parsed.rendaCompensavelAnual || 0,
        inss: parsed.inss || 0,
        pgblCorporativoAnual: parsed.pgblCorporativoAnual || 0,
        nomePrevidenciaCorp: parsed.nomePrevidenciaCorp || null,
        outrasRendas: parsed.outrasRendas || [],
        observacoes: parsed.observacoes || '',
      })

    } catch (err) {
      setError('Erro: ' + err.message)
    }

    setLoading(false)
    setLoadingMsg('')
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <SectionTitle />

      {/* Toggle modo */}
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
          <CardTitle>Renda Bruta Tributável Compensável</CardTitle>
          <div style={{ padding: '10px 14px', background: 'rgba(74,159,212,0.06)', border: '1px solid rgba(74,159,212,0.2)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.7 }}>
            ℹ️ Informe o <strong style={{ color: 'var(--text)' }}>salário mensal</strong>. O 13º é excluído automaticamente (tributação exclusiva). Se houver PLR, informe abaixo.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <MoneyField label="Salário mensal bruto" value={rendaMensal} onChange={handleRendaMensalChange} hint="Valor do holerite — 13º excluído automaticamente" />
            <MoneyField label="Renda anual (× 12)" value={rendaAnual} onChange={handleRendaAnualChange} hint="Calculado automaticamente ou edite aqui" />
          </div>

          {/* PLR */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '18px', marginBottom: '20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>PLR / rendimentos com tributação exclusiva</div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px' }}>Participação nos lucros e similares — não entram na base do PGBL</div>
            <div style={{ maxWidth: '340px' }}>
              <MoneyField label="PLR anual (opcional)" value={rendExclusivos} onChange={upd('rendExclusivos')} hint="Deixe em branco se não houver" />
            </div>
          </div>

          {/* INSS */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
            <button onClick={function() { upd('contribuiINSS')(!contribuiINSS) }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', background: contribuiINSS ? 'rgba(201,168,76,0.08)' : 'var(--bg-input)', border: contribuiINSS ? '1.5px solid var(--gold)' : '1.5px solid var(--border)', borderRadius: '12px', padding: '14px 18px', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.2s' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: contribuiINSS ? 'var(--gold)' : 'transparent', border: contribuiINSS ? '2px solid var(--gold)' : '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {contribuiINSS && <span style={{ color: '#fff', fontSize: '13px', fontWeight: 900 }}>✓</span>}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: contribuiINSS ? 'var(--gold-light)' : 'var(--text)' }}>Contribui com INSS / RPPS</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>CLT, servidor público ou MEI — reduz a base do IR</div>
              </div>
            </button>
            {contribuiINSS && (
              <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '9px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>INSS anual automático</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--gold-light)', fontWeight: 700 }}>{fmtBRL(inssAutoAnual)}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Tabela progressiva 2024 · teto {fmtBRL(908.86 * 12)}</div>
                </div>
                <div style={{ maxWidth: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }} onClick={function() { upd('inssOverride')(!inssOverride) }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid var(--border)', background: inssOverride ? 'var(--text-muted)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {inssOverride && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Informar INSS manualmente</span>
                  </div>
                  {inssOverride && <MoneyField label="INSS anual" value={inssManual} onChange={upd('inssManual')} hint="Substitui o cálculo automático" />}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── MODO UPLOAD ── */}
      {mode === 'upload' && (
        <div>
          <Card>
            <CardTitle>Declaração de IR</CardTitle>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.7 }}>
              A IA vai identificar automaticamente a renda compensável, INSS, previdência corporativa e outras fontes de renda.
            </div>
            <DropZone files={irFile} onAdd={function(arr) { upd('irFile')([arr[0]]) }} onRemove={function() { upd('irFile')([]) }} label="Clique ou arraste a declaração de IR aqui" single={true} />
          </Card>

          <Card>
            <CardTitle>Holerites (opcional)</CardTitle>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.7 }}>
              Complementa com dados de salário, INSS e previdência corporativa descontados em folha.
            </div>
            <DropZone files={holerites} onAdd={function(arr) { upd('holerites')(holerites.concat(arr)) }} onRemove={function(idx) { upd('holerites')(holerites.filter(function(_, j) { return j !== idx })) }} label="Clique ou arraste os holerites aqui" />
          </Card>

          {error && (
            <div style={{ background: 'rgba(204,44,31,0.08)', border: '1px solid rgba(204,44,31,0.25)', borderRadius: '10px', padding: '14px 16px', color: 'var(--red)', fontSize: '13px', marginBottom: '12px', lineHeight: 1.6 }}>
              ⚠️ {error}
            </div>
          )}

          {loading ? <Spinner msg={loadingMsg || 'Processando...'} /> : (
            <button onClick={analisarIR} style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg,#8a6010,var(--gold))', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
              Analisar com IA
            </button>
          )}

          {/* Resultado da análise do IR */}
          {irAnalise && !loading && (
            <div className="animate-in">
              <Card style={{ marginTop: '16px', borderColor: 'rgba(26,153,85,0.4)' }}>
                <CardTitle>Análise do Documento</CardTitle>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
                  {[
                    { label: 'Renda compensável anual', value: fmtBRL(irAnalise.rendaCompensavelAnual), hint: 'Base para cálculo dos 12%', destaque: true },
                    { label: 'INSS anual', value: fmtBRL(irAnalise.inss), hint: 'Deduzido da base do IR' },
                    { label: 'Prev. corporativa', value: fmtBRL(irAnalise.pgblCorporativoAnual), hint: irAnalise.nomePrevidenciaCorp || 'PGBL via empresa' },
                  ].map(function(item) {
                    return (
                      <div key={item.label} style={{ background: item.destaque ? 'var(--gold-dim)' : 'var(--bg-input)', border: item.destaque ? '1px solid var(--gold)' : '1px solid var(--border)', borderRadius: '9px', padding: '13px 15px' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: item.destaque ? 'var(--gold)' : 'var(--text-muted)', marginBottom: '5px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{item.label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: item.destaque ? 'var(--gold-light)' : 'var(--text)', fontWeight: 700 }}>{item.value}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '3px' }}>{item.hint}</div>
                      </div>
                    )
                  })}
                </div>

                {irAnalise.pgblCorporativoAnual > 0 && (
                  <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    ✅ <strong style={{ color: 'var(--gold-light)' }}>Previdência corporativa identificada</strong> — {irAnalise.nomePrevidenciaCorp || 'PGBL fechado'}: {fmtBRL(irAnalise.pgblCorporativoAnual)}/ano ({fmtBRL(irAnalise.pgblCorporativoAnual / 12)}/mês). Esse valor já conta para o limite de 12%.
                  </div>
                )}

                {irAnalise.outrasRendas && irAnalise.outrasRendas.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Outras fontes de renda</div>
                    {irAnalise.outrasRendas.map(function(r, idx) {
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: '7px', border: '1px solid var(--border)', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: r.tributavel ? 'var(--gold)' : 'var(--text-dim)', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: 'var(--text)' }}>{r.descricao}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>{fmtBRL(r.valor)}</div>
                            <div style={{ fontSize: '10px', color: r.tributavel ? 'var(--gold)' : 'var(--text-dim)' }}>{r.tributavel ? 'Tributável' : 'Isento'}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {irAnalise.observacoes && (
                  <div style={{ padding: '12px 14px', background: 'rgba(74,159,212,0.07)', border: '1px solid rgba(74,159,212,0.2)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    📌 {irAnalise.observacoes}
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
            <CardTitle>Quanto investir em PGBL</CardTitle>

            {/* Cards principais */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Renda compensável anual</div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700 }}>{fmtBRLShort(rendaAnualNum)}</span>
              </div>
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Alíquota marginal IR</div>
                <AliquotaBadge pct={irInfo.aliquotaMarginal} />
              </div>
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Limite PGBL (12%)</div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700 }}>{fmtBRLShort(pgblInfo.pgblIdeal)}/ano</span>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>{fmtBRLShort(pgblInfo.pgblIdeal / 12)}/mês</div>
              </div>
            </div>

            {/* Waterfall quanto deve aportar */}
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '14px' }}>Composição do Aporte Ideal</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text)' }}>Limite máximo dedutível (12% da renda)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700 }}>{fmtBRL(pgblInfo.pgblIdeal)}</span>
                </div>
                {previdenciaCorpAnual > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(26,153,85,0.06)', borderRadius: '8px', border: '1px solid rgba(26,153,85,0.2)' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--green)' }}>(-) Previdência corporativa já descontada</span>
                      {irAnalise && irAnalise.nomePrevidenciaCorp && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{irAnalise.nomePrevidenciaCorp}</div>}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--green)', fontWeight: 700 }}>- {fmtBRL(previdenciaCorpAnual)}</span>
                  </div>
                )}
                <div style={{ height: '1px', background: 'var(--border)', margin: '2px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: pgblRestante > 0 ? 'var(--gold-dim)' : 'rgba(26,153,85,0.07)', borderRadius: '8px', border: pgblRestante > 0 ? '2px solid var(--gold)' : '2px solid rgba(26,153,85,0.35)' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: pgblRestante > 0 ? 'var(--gold-light)' : 'var(--green)', fontFamily: 'var(--font-display)' }}>
                      {pgblRestante > 0 ? '📌 Deve aportar em PGBL' : '✓ Limite 12% já utilizado'}
                    </div>
                    {pgblRestante > 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <strong style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-mono)' }}>{fmtBRL(pgblRestante / 12)}/mês</strong> · economia de {fmtBRL(economiaRestante)}/ano no IR
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: pgblRestante > 0 ? 'var(--gold-light)' : 'var(--green)', fontWeight: 900 }}>{fmtBRL(pgblRestante)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>por ano</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparativo IR */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
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

            <div style={{ padding: '14px 16px', background: 'var(--gold-dim)', border: '1px solid var(--gold)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              💡 <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Recomendação:</strong>{' '}
              {pgblRestante > 0
                ? `Aportar ${fmtBRL(pgblRestante)}/ano (${fmtBRL(pgblRestante / 12)}/mês) em PGBL para aproveitar 100% do limite de 12%${previdenciaCorpAnual > 0 ? ', considerando o que já desconta via empresa.' : '.'} Economia de ${fmtBRL(economiaRestante)}/ano no IR com alíquota de ${(irInfo.aliquotaMarginal * 100).toFixed(1)}%.`
                : `O limite de 12% já está sendo utilizado via previdência corporativa. Não há benefício adicional de PGBL.`
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
              Projeção sobre o <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>aporte de {fmtBRL(pgblRestante / 12)}/mês</strong> · rentabilidade real de 4% a.a. · restituições reinvestidas.
            </div>
            {projection.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '24px' }}>
                {[
                  { label: 'Patrimônio PGBL em ' + anos + 'a', value: fmtBRLShort(projection[projection.length - 1].patrimonioPGBL), color: 'var(--blue-light)' },
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

      {/* Observação do planejamento tributário */}
      <Card>
        <CardTitle>📝 Planejamento Tributário — Observações</CardTitle>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.7 }}>
          Adicione estratégias, recomendações ou observações sobre o planejamento tributário do cliente. Este texto será incluído no relatório PDF.
        </div>
        <textarea
          value={observacaoTributaria || ''}
          onChange={function(e) { upd('observacaoTributaria')(e.target.value) }}
          placeholder="Ex: O cliente possui rendimentos de aluguéis que podem ser otimizados via holding familiar. Recomenda-se avaliar migração para tributação via CNPJ para redução da carga tributária. Além disso, o investimento em PGBL representa uma economia imediata de R$ X no IR com potencial de crescimento patrimonial de longo prazo..."
          rows={6}
          style={{
            width: '100%', background: 'var(--bg-input)', border: '1.5px solid var(--border)',
            borderRadius: '10px', padding: '14px 16px', color: 'var(--text)', fontSize: '14px',
            fontFamily: 'var(--font-body)', lineHeight: 1.7, outline: 'none', resize: 'vertical',
            transition: 'border-color 0.2s', boxSizing: 'border-box',
          }}
          onFocus={function(e) { e.target.style.borderColor = 'var(--gold)' }}
          onBlur={function(e) { e.target.style.borderColor = 'var(--border)' }}
        />
        {observacaoTributaria && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-dim)', textAlign: 'right' }}>
            {observacaoTributaria.length} caracteres · aparecerá no PDF
          </div>
        )}
      </Card>

      {!hasData && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>
            {mode === 'manual' ? 'Informe a renda acima' : 'Envie a declaração de IR acima'}
          </div>
          <div style={{ fontSize: '14px', maxWidth: '360px', margin: '0 auto', lineHeight: 1.7, color: 'var(--text-dim)' }}>
            {mode === 'manual' ? 'Preencha a renda para ver a recomendação de aporte em PGBL.' : 'Faça upload da declaração de IR para análise automática.'}
          </div>
        </div>
      )}
    </div>
  )
}
