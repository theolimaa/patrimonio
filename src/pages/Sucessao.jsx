import React, { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  fmtBRL, fmtBRLShort, parseCents, fromCents, centsToNum,
  calcInventario, calcPatrimonioInventariavel, CUSTOS_INVENTARIO, genId,
} from '../utils'

function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600, marginBottom: '8px' }}>
        {icon} {sub}
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.15 }}>
        {title}
      </h1>
      <div style={{ width: '48px', height: '2px', background: 'linear-gradient(90deg,var(--gold),transparent)', marginTop: '12px' }} />
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '24px',
      marginBottom: '16px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function CardTitle({ children }) {
  return (
    <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold-light)', marginBottom: '18px', fontWeight: 500 }}>
      {children}
    </div>
  )
}

function Label({ children }) {
  return (
    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '6px' }}>
      {children}
    </div>
  )
}

function MoneyField({ label, value, onChange, placeholder }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', fontSize: '12px', fontWeight: 600, pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>R$</span>
        <input
          type="text"
          value={fromCents(value)}
          onChange={function(e) { onChange(parseCents(e.target.value)) }}
          placeholder={placeholder || '0,00'}
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '9px', padding: '11px 12px 11px 42px', color: 'var(--text)', fontSize: '14px', fontFamily: 'var(--font-mono)', outline: 'none' }}
          onFocus={function(e) { e.target.style.borderColor = 'rgba(201,168,76,0.4)' }}
          onBlur={function(e) { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <select
        value={value}
        onChange={function(e) { onChange(e.target.value) }}
        style={{ width: '100%', background: '#0a1828', border: '1px solid var(--border)', borderRadius: '9px', padding: '11px 12px', color: 'var(--text)', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
      >
        {options.map(function(opt) { return <option key={opt.v} value={opt.v}>{opt.l}</option> })}
      </select>
    </div>
  )
}

function AddButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'transparent', border: '1px dashed rgba(201,168,76,0.35)', borderRadius: '9px', color: 'var(--gold)', fontSize: '13px', fontWeight: 500, padding: '10px 16px', cursor: 'pointer', width: '100%', marginTop: '12px', transition: 'all 0.2s' }}
      onMouseEnter={function(e) { e.target.style.background = 'rgba(201,168,76,0.08)' }}
      onMouseLeave={function(e) { e.target.style.background = 'transparent' }}
    >
      ＋ {children}
    </button>
  )
}

function RemoveButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '7px', color: '#e74c3c', fontSize: '12px', padding: '5px 12px', cursor: 'pointer' }}
    >
      ✕
    </button>
  )
}

const CustomTooltip = function(props) {
  if (!props.active || !props.payload || !props.payload.length) return null
  const item = props.payload[0]
  return (
    <div style={{ background: '#0d1f35', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.name}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--text)' }}>{fmtBRL(item.value)}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px' }}>{(item.payload.pct * 100).toFixed(0)}% do patrimônio</div>
    </div>
  )
}

export default function Sucessao({ shared }) {
  const [regimeCasamento, setRegimeCasamento] = useState('comunhao_parcial')
  const [imoveis, setImoveis] = useState([{ id: genId(), tipo: 'residencial', valor: '', antesCasamento: false }])
  const [veiculos, setVeiculos] = useState([{ id: genId(), tipo: 'carro', valor: '' }])
  const [pfManual, setPfManual] = useState('')

  const patrimonioFinanceiro = shared.patrimonioFinanceiro > 0 ? shared.patrimonioFinanceiro : centsToNum(pfManual)

  function addImovel() {
    setImoveis(function(prev) { return [...prev, { id: genId(), tipo: 'residencial', valor: '', antesCasamento: false }] })
  }
  function removeImovel(id) {
    setImoveis(function(prev) { return prev.filter(function(im) { return im.id !== id }) })
  }
  function updateImovel(id, field, val) {
    setImoveis(function(prev) { return prev.map(function(im) { return im.id === id ? { ...im, [field]: val } : im }) })
  }

  function addVeiculo() {
    setVeiculos(function(prev) { return [...prev, { id: genId(), tipo: 'carro', valor: '' }] })
  }
  function removeVeiculo(id) {
    setVeiculos(function(prev) { return prev.filter(function(ve) { return ve.id !== id }) })
  }
  function updateVeiculo(id, field, val) {
    setVeiculos(function(prev) { return prev.map(function(ve) { return ve.id === id ? { ...ve, [field]: val } : ve }) })
  }

  const calcs = calcPatrimonioInventariavel(imoveis, patrimonioFinanceiro, veiculos, regimeCasamento)
  const custos = calcInventario(calcs.totalInventariavel)
  const totalCustos = custos.reduce(function(acc, c) { return acc + c.valor }, 0)
  const patrimonioLiquido = calcs.totalInventariavel - totalCustos

  const pieData = custos.map(function(c) {
    return { name: c.nome, value: Math.round(c.valor), pct: c.pct, fill: c.cor }
  })

  const hasData = calcs.totalBruto > 0

  return (
    <div>
      <SectionTitle icon="🏛️" sub="Módulo 02" title="Planejamento Sucessório" />

      {/* Regime matrimonial */}
      <Card>
        <CardTitle>Regime Matrimonial</CardTitle>
        <div style={{ maxWidth: '320px' }}>
          <SelectField
            label="Regime de bens"
            value={regimeCasamento}
            onChange={setRegimeCasamento}
            options={[
              { v: 'comunhao_parcial', l: 'Comunhão Parcial de Bens' },
              { v: 'comunhao_universal', l: 'Comunhão Universal de Bens' },
              { v: 'separacao_total', l: 'Separação Total de Bens' },
            ]}
          />
        </div>
        <div style={{ marginTop: '12px', padding: '12px 14px', background: 'rgba(74,159,212,0.06)', border: '1px solid rgba(74,159,212,0.15)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          {regimeCasamento === 'comunhao_parcial' && '📌 Comunhão parcial: bens adquiridos antes do casamento são 100% individuais. Bens adquiridos após são 50% de cada cônjuge (meação). Apenas a parte do falecido entra no inventário.'}
          {regimeCasamento === 'comunhao_universal' && '📌 Comunhão universal: todo o patrimônio é compartilhado 50/50, independente da data de aquisição. Apenas 50% do total entra no inventário.'}
          {regimeCasamento === 'separacao_total' && '📌 Separação total: todo o patrimônio é individual. 100% dos bens do falecido entram no inventário.'}
        </div>
      </Card>

      {/* Imóveis */}
      <Card>
        <CardTitle>🏠 Imóveis</CardTitle>
        {imoveis.map(function(im, idx) {
          return (
            <div key={im.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Imóvel {idx + 1}</span>
                {imoveis.length > 1 && <RemoveButton onClick={function() { removeImovel(im.id) }} />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
                <SelectField
                  label="Tipo"
                  value={im.tipo}
                  onChange={function(v) { updateImovel(im.id, 'tipo', v) }}
                  options={[
                    { v: 'residencial', l: 'Residencial' },
                    { v: 'comercial', l: 'Comercial' },
                    { v: 'rural', l: 'Rural' },
                    { v: 'terreno', l: 'Terreno' },
                  ]}
                />
                <MoneyField
                  label="Valor de mercado"
                  value={im.valor}
                  onChange={function(v) { updateImovel(im.id, 'valor', v) }}
                />
                {regimeCasamento === 'comunhao_parcial' && (
                  <div>
                    <Label>Aquisição</Label>
                    <select
                      value={im.antesCasamento ? 'antes' : 'depois'}
                      onChange={function(e) { updateImovel(im.id, 'antesCasamento', e.target.value === 'antes') }}
                      style={{ width: '100%', background: '#0a1828', border: '1px solid var(--border)', borderRadius: '9px', padding: '11px 12px', color: 'var(--text)', fontSize: '14px', outline: 'none' }}
                    >
                      <option value="antes">Antes do casamento</option>
                      <option value="depois">Depois do casamento</option>
                    </select>
                  </div>
                )}
              </div>
              {regimeCasamento === 'comunhao_parcial' && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  {im.antesCasamento ? '→ 100% do valor entra no inventário (bem individual)' : '→ 50% do valor entra no inventário (meação do cônjuge)'}
                </div>
              )}
            </div>
          )
        })}
        <AddButton onClick={addImovel}>Adicionar imóvel</AddButton>
      </Card>

      {/* Patrimônio Financeiro */}
      <Card>
        <CardTitle>💰 Patrimônio Financeiro</CardTitle>
        {shared.patrimonioFinanceiro > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'rgba(46,204,113,0.06)', border: '1px solid rgba(46,204,113,0.2)', borderRadius: '10px' }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <div>
              <div style={{ fontSize: '13px', color: '#5ac48a', fontWeight: 500 }}>Importado do módulo Gestão de Riscos</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: 'var(--text)', marginTop: '2px' }}>{fmtBRL(shared.patrimonioFinanceiro)}</div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Informe o total de investimentos, poupança, FGTS, previdência privada, etc.
            </div>
            <MoneyField
              label="Total de patrimônio financeiro"
              value={pfManual}
              onChange={setPfManual}
            />
          </div>
        )}
      </Card>

      {/* Veículos */}
      <Card>
        <CardTitle>🚗 Veículos</CardTitle>
        {veiculos.map(function(ve, idx) {
          return (
            <div key={ve.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Veículo {idx + 1}</span>
                {veiculos.length > 1 && <RemoveButton onClick={function() { removeVeiculo(ve.id) }} />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <SelectField
                  label="Tipo"
                  value={ve.tipo}
                  onChange={function(v) { updateVeiculo(ve.id, 'tipo', v) }}
                  options={[
                    { v: 'carro', l: '🚗 Carro' },
                    { v: 'moto', l: '🏍️ Moto' },
                    { v: 'caminhao', l: '🚛 Caminhão' },
                    { v: 'barco', l: '⛵ Barco' },
                  ]}
                />
                <MoneyField label="Valor de mercado" value={ve.valor} onChange={function(v) { updateVeiculo(ve.id, 'valor', v) }} />
              </div>
            </div>
          )
        })}
        <AddButton onClick={addVeiculo}>Adicionar veículo</AddButton>
      </Card>

      {/* Resultados */}
      {hasData && (
        <div className="animate-in">
          <Card style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
            <CardTitle>📊 Consolidação Patrimonial</CardTitle>

            {/* Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Imóveis', value: imoveis.reduce(function(acc, im) { return acc + centsToNum(im.valor) }, 0) },
                { label: 'Patrimônio Financeiro', value: patrimonioFinanceiro },
                { label: 'Veículos', value: veiculos.reduce(function(acc, ve) { return acc + centsToNum(ve.valor) }, 0) },
              ].map(function(item) {
                return (
                  <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '6px' }}>{item.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--text)' }}>{fmtBRLShort(item.value)}</div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '28px' }}>
              <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '6px' }}>Patrimônio bruto total</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 600, color: 'var(--gold-light)' }}>{fmtBRLShort(calcs.totalBruto)}</div>
              </div>
              <div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e74c3c', marginBottom: '6px' }}>Custos de inventário (15%)</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 600, color: '#ff8080' }}>- {fmtBRLShort(totalCustos)}</div>
              </div>
              <div style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--green)', marginBottom: '6px' }}>Patrimônio líquido transferido</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 600, color: 'var(--green)' }}>{fmtBRLShort(patrimonioLiquido)}</div>
              </div>
            </div>

            {/* Pie chart */}
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Composição dos custos de inventário
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map(function(entry, idx) {
                      return <Cell key={idx} fill={entry.fill} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
                    })}
                  </Pie>
                  <Tooltip content={CustomTooltip} />
                </PieChart>
              </ResponsiveContainer>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {custos.map(function(c) {
                  return (
                    <div key={c.nome} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: c.cor, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>{c.nome}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(c.pct * 100).toFixed(0)}% · {fmtBRLShort(c.valor)}</div>
                      </div>
                    </div>
                  )
                })}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 600 }}>Total custos</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: '#ff8080', marginTop: '2px' }}>{fmtBRL(totalCustos)}</div>
                </div>
              </div>
            </div>

            {regimeCasamento !== 'separacao_total' && (
              <div style={{ marginTop: '16px', padding: '12px 14px', background: 'rgba(74,159,212,0.06)', border: '1px solid rgba(74,159,212,0.15)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                ⚖️ <strong style={{ color: 'var(--text)' }}>Meação:</strong> Com o regime de {regimeCasamento === 'comunhao_parcial' ? 'comunhão parcial' : 'comunhão universal'}, os custos de inventário foram calculados sobre o patrimônio inventariável de <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{fmtBRL(calcs.totalInventariavel)}</strong>, excluída a meação do cônjuge.
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
