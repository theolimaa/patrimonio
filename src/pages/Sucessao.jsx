import React, { useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { fmtBRL, fmtBRLShort, parseCents, fromCents, centsToNum, calcInventario, calcPatrimonioInventariavel, genId } from '../utils'

function SectionTitle() {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '8px' }}>🏛️ Módulo 02</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.15 }}>Planejamento Sucessório</h1>
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
  return <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{children}</div>
}

function MoneyField({ label, value, onChange }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', fontSize: '12px', fontWeight: 700, pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>R$</span>
        <input type="text" value={fromCents(value)} onChange={function(e) { onChange(parseCents(e.target.value)) }} placeholder="0,00"
          style={{ width: '100%', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: '9px', padding: '11px 12px 11px 40px', color: 'var(--text)', fontSize: '14px', fontFamily: 'var(--font-mono)', outline: 'none' }}
          onFocus={function(e) { e.target.style.borderColor = 'var(--gold)' }}
          onBlur={function(e) { e.target.style.borderColor = 'var(--border)' }} />
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <select value={value} onChange={function(e) { onChange(e.target.value) }}
        style={{ width: '100%', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: '9px', padding: '11px 12px', color: 'var(--text)', fontSize: '14px', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
        {options.map(function(opt) { return <option key={opt.v} value={opt.v}>{opt.l}</option> })}
      </select>
    </div>
  )
}

function AddButton({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ background: 'transparent', border: '1.5px dashed var(--gold)', borderRadius: '9px', color: 'var(--gold)', fontSize: '13px', fontWeight: 700, padding: '10px 16px', cursor: 'pointer', width: '100%', marginTop: '12px', fontFamily: 'var(--font-display)' }}>
      ＋ {children}
    </button>
  )
}

function RemoveBtn({ onClick }) {
  return <button onClick={onClick} style={{ background: 'rgba(204,44,31,0.1)', border: '1px solid rgba(204,44,31,0.25)', borderRadius: '7px', color: 'var(--red)', fontSize: '12px', padding: '5px 12px', cursor: 'pointer' }}>✕</button>
}

function CustomTooltip(props) {
  if (!props.active || !props.payload || !props.payload.length) return null
  const item = props.payload[0]
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.name}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--text)', fontWeight: 600 }}>{fmtBRL(item.value)}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px' }}>{(item.payload.pct * 100).toFixed(0)}% do patrimônio</div>
    </div>
  )
}

function upd(setFormState, key) {
  return function(val) { setFormState(function(prev) { return { ...prev, [key]: val } }) }
}

export default function Sucessao({ formState, setFormState, patrimonioFinanceiroShared, onDataChange }) {
  const { regimeCasamento, imoveis, veiculos, pfManual, coberturaJaContratada, valorPrevidencia, observacaoSucessao } = formState

  const pfShared = centsToNum(patrimonioFinanceiroShared || '')
  const patrimonioFinanceiro = pfShared > 0 ? pfShared : centsToNum(pfManual)
  const previdenciaNum = centsToNum(valorPrevidencia)
  const coberturaNum = centsToNum(coberturaJaContratada)
  const patrimonioFinanceiroInventariavel = Math.max(0, patrimonioFinanceiro - previdenciaNum)
  const calcs = calcPatrimonioInventariavel(imoveis, patrimonioFinanceiroInventariavel, veiculos, regimeCasamento)
  const custos = calcInventario(calcs.totalInventariavel)
  const totalCustos = custos.reduce(function(acc, c) { return acc + c.valor }, 0)
  const patrimonioLiquido = calcs.totalInventariavel - totalCustos
  const gapCoberturaMorte = Math.max(0, totalCustos - coberturaNum - previdenciaNum)
  const hasData = (calcs.totalBruto + previdenciaNum) > 0

  useEffect(function() {
    if (hasData) {
      onDataChange({
        imoveis, veiculos,
        patrimonioFinanceiro,
        previdenciaNum,
        coberturaNum,
        regimeCasamento,
        observacaoSucessao: observacaoSucessao || '',
        totais: {
          totalBruto: calcs.totalBruto + previdenciaNum,
          totalInventariavel: calcs.totalInventariavel,
          totalCustos,
          patrimonioLiquido,
          gapCoberturaMorte,
        },
      })
    }
  }, [imoveis, veiculos, patrimonioFinanceiro, regimeCasamento, previdenciaNum, coberturaNum, observacaoSucessao])

  const pieData = custos.map(function(c) { return { name: c.nome, value: Math.round(c.valor), pct: c.pct, fill: c.cor } })

  function addImovel() { setFormState(function(p) { return { ...p, imoveis: [...p.imoveis, { id: genId(), tipo: 'residencial', valor: '', antesCasamento: false }] } }) }
  function removeImovel(id) { setFormState(function(p) { return { ...p, imoveis: p.imoveis.filter(function(x) { return x.id !== id }) } }) }
  function updateImovel(id, f, v) { setFormState(function(p) { return { ...p, imoveis: p.imoveis.map(function(x) { return x.id === id ? { ...x, [f]: v } : x }) } }) }
  function addVeiculo() { setFormState(function(p) { return { ...p, veiculos: [...p.veiculos, { id: genId(), tipo: 'carro', valor: '', antesCasamento: false }] } }) }
  function removeVeiculo(id) { setFormState(function(p) { return { ...p, veiculos: p.veiculos.filter(function(x) { return x.id !== id }) } }) }
  function updateVeiculo(id, f, v) { setFormState(function(p) { return { ...p, veiculos: p.veiculos.map(function(x) { return x.id === id ? { ...x, [f]: v } : x }) } }) }

  return (
    <div>
      <SectionTitle />

      <Card>
        <CardTitle>Regime Matrimonial</CardTitle>
        <div style={{ maxWidth: '340px' }}>
          <SelectField label="Regime de bens" value={regimeCasamento} onChange={upd(setFormState, 'regimeCasamento')}
            options={[{ v: 'comunhao_parcial', l: 'Comunhão Parcial de Bens' }, { v: 'comunhao_universal', l: 'Comunhão Universal de Bens' }, { v: 'separacao_total', l: 'Separação Total de Bens' }]} />
        </div>
        <div style={{ marginTop: '12px', padding: '12px 14px', background: 'rgba(74,159,212,0.08)', border: '1px solid rgba(74,159,212,0.2)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          {regimeCasamento === 'comunhao_parcial' && '📌 Comunhão parcial: bens adquiridos antes do casamento são 100% individuais. Bens após: 50% de cada cônjuge — apenas a parte do falecido entra no inventário.'}
          {regimeCasamento === 'comunhao_universal' && '📌 Comunhão universal: todo patrimônio é compartilhado 50/50. Apenas 50% do total entra no inventário.'}
          {regimeCasamento === 'separacao_total' && '📌 Separação total: patrimônio totalmente individual. 100% dos bens do falecido entram no inventário.'}
        </div>
      </Card>

      <Card>
        <CardTitle>🏠 Imóveis</CardTitle>
        {imoveis.map(function(im, idx) {
          return (
            <div key={im.id} style={{ padding: '16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Imóvel {idx + 1}</span>
                {imoveis.length > 1 && <RemoveBtn onClick={function() { removeImovel(im.id) }} />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: regimeCasamento === 'comunhao_parcial' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '12px', alignItems: 'end' }}>
                <SelectField label="Tipo" value={im.tipo} onChange={function(v) { updateImovel(im.id, 'tipo', v) }}
                  options={[{ v: 'residencial', l: 'Residencial' }, { v: 'comercial', l: 'Comercial' }, { v: 'rural', l: 'Rural' }, { v: 'terreno', l: 'Terreno' }]} />
                <MoneyField label="Valor de mercado" value={im.valor} onChange={function(v) { updateImovel(im.id, 'valor', v) }} />
                {regimeCasamento === 'comunhao_parcial' && (
                  <div>
                    <Label>Aquisição</Label>
                    <select value={im.antesCasamento ? 'antes' : 'depois'} onChange={function(e) { updateImovel(im.id, 'antesCasamento', e.target.value === 'antes') }}
                      style={{ width: '100%', background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '9px', padding: '11px 12px', color: 'var(--text)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-body)' }}>
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

      <Card>
        <CardTitle>💰 Patrimônio Financeiro</CardTitle>
        {pfShared > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'rgba(26,153,85,0.07)', border: '1px solid rgba(26,153,85,0.25)', borderRadius: '10px' }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Importado do módulo Gestão de Riscos</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: 'var(--text)', marginTop: '2px', fontWeight: 600 }}>{fmtBRL(pfShared)}</div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Informe o total de investimentos, poupança, FGTS, previdência, etc.</div>
            <MoneyField label="Total de patrimônio financeiro" value={pfManual} onChange={upd(setFormState, 'pfManual')} />
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>🚗 Veículos</CardTitle>
        {veiculos.map(function(ve, idx) {
          const val = centsToNum(ve.valor)
          const frac = regimeCasamento === 'separacao_total' ? 1 : regimeCasamento === 'comunhao_universal' ? 0.5 : (ve.antesCasamento ? 1.0 : 0.5)
          const inventariavel = val * frac
          return (
            <div key={ve.id} style={{ padding: '16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Veículo {idx + 1}</span>
                {veiculos.length > 1 && <RemoveBtn onClick={function() { removeVeiculo(ve.id) }} />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: regimeCasamento === 'comunhao_parcial' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '12px', alignItems: 'end' }}>
                <SelectField label="Tipo" value={ve.tipo} onChange={function(v) { updateVeiculo(ve.id, 'tipo', v) }}
                  options={[{ v: 'carro', l: '🚗 Carro' }, { v: 'moto', l: '🏍️ Moto' }, { v: 'caminhao', l: '🚛 Caminhão' }, { v: 'barco', l: '⛵ Barco' }]} />
                <MoneyField label="Valor de mercado" value={ve.valor} onChange={function(v) { updateVeiculo(ve.id, 'valor', v) }} />
                {regimeCasamento === 'comunhao_parcial' && (
                  <div>
                    <Label>Aquisição</Label>
                    <select value={ve.antesCasamento ? 'antes' : 'depois'} onChange={function(e) { updateVeiculo(ve.id, 'antesCasamento', e.target.value === 'antes') }}
                      style={{ width: '100%', background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '9px', padding: '11px 12px', color: 'var(--text)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-body)' }}>
                      <option value="antes">Antes do casamento</option>
                      <option value="depois">Depois do casamento</option>
                    </select>
                  </div>
                )}
              </div>
              {val > 0 && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{regimeCasamento === 'comunhao_parcial' ? (ve.antesCasamento ? '→ 100% entra no inventário (bem individual)' : '→ 50% entra no inventário (meação do cônjuge)') : regimeCasamento === 'comunhao_universal' ? '→ 50% entra no inventário' : '→ 100% entra no inventário'}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)' }}>Inventariável: {fmtBRL(inventariavel)}</span>
                </div>
              )}
            </div>
          )
        })}
        <AddButton onClick={addVeiculo}>Adicionar veículo</AddButton>
      </Card>

      <Card>
        <CardTitle>🛡️ Proteções Já Existentes</CardTitle>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.7 }}>
          A previdência privada <strong style={{ color: 'var(--text)' }}>não entra em inventário</strong> — é excluída do patrimônio inventariável e pode cobrir os custos para os herdeiros.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <MoneyField label="Seguro de vida / cobertura de morte já contratada" value={coberturaJaContratada} onChange={upd(setFormState, 'coberturaJaContratada')} />
          <MoneyField label="Previdência privada (PGBL/VGBL)" value={valorPrevidencia} onChange={upd(setFormState, 'valorPrevidencia')} />
        </div>
      </Card>

      {hasData && (
        <div className="animate-in">
          <Card style={{ borderColor: 'var(--gold)' }}>
            <CardTitle>📊 Consolidação Patrimonial</CardTitle>

            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '14px' }}>Composição do Patrimônio</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Imóveis', value: imoveis.reduce(function(a, im) { return a + centsToNum(im.valor) }, 0) },
                  { label: 'Patrimônio financeiro', value: patrimonioFinanceiro },
                  { label: 'Veículos', value: veiculos.reduce(function(a, ve) { return a + centsToNum(ve.valor) }, 0) },
                ].map(function(item) {
                  return (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text)' }}>{item.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text)', fontWeight: 600 }}>{fmtBRL(item.value)}</span>
                    </div>
                  )
                })}
                {previdenciaNum > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'rgba(26,153,85,0.06)', borderRadius: '8px', border: '1px solid rgba(26,153,85,0.2)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--green)' }}>(-) Previdência privada <span style={{ fontSize: '11px', fontStyle: 'italic' }}>(não inventariável)</span></span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--green)', fontWeight: 600 }}>- {fmtBRL(previdenciaNum)}</span>
                  </div>
                )}
                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--gold-dim)', borderRadius: '8px', border: '1px solid var(--gold)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--gold-light)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Patrimônio inventariável</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--gold-light)', fontWeight: 800 }}>{fmtBRL(calcs.totalInventariavel)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(204,44,31,0.07)', border: '1px solid rgba(204,44,31,0.25)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--red)', marginBottom: '6px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Custos de inventário (15%)</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--red)' }}>- {fmtBRLShort(totalCustos)}</div>
              </div>
              <div style={{ background: 'rgba(26,153,85,0.07)', border: '1px solid rgba(26,153,85,0.25)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--green)', marginBottom: '6px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Patrimônio líquido transferido</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--green)' }}>{fmtBRLShort(patrimonioLiquido)}</div>
              </div>
            </div>

            {(coberturaNum > 0 || previdenciaNum > 0) && (
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '14px' }}>Cobertura dos Custos de Inventário</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text)' }}>Custos totais de inventário</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text)', fontWeight: 600 }}>{fmtBRL(totalCustos)}</span>
                  </div>
                  {coberturaNum > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(26,153,85,0.06)', borderRadius: '8px', border: '1px solid rgba(26,153,85,0.2)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--green)' }}>(-) Seguro de vida contratado</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--green)', fontWeight: 600 }}>- {fmtBRL(coberturaNum)}</span>
                    </div>
                  )}
                  {previdenciaNum > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(26,153,85,0.06)', borderRadius: '8px', border: '1px solid rgba(26,153,85,0.2)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--green)' }}>(-) Previdência disponível para herdeiros</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--green)', fontWeight: 600 }}>- {fmtBRL(previdenciaNum)}</span>
                    </div>
                  )}
                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: gapCoberturaMorte > 0 ? 'var(--gold-dim)' : 'rgba(26,153,85,0.07)', borderRadius: '8px', border: gapCoberturaMorte > 0 ? '1.5px solid var(--gold)' : '1.5px solid rgba(26,153,85,0.35)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-display)', color: gapCoberturaMorte > 0 ? 'var(--gold-light)' : 'var(--green)' }}>
                      {gapCoberturaMorte > 0 ? 'Gap descoberto' : '✓ Custos totalmente cobertos'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800, color: gapCoberturaMorte > 0 ? 'var(--gold-light)' : 'var(--green)' }}>{fmtBRL(gapCoberturaMorte)}</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '16px' }}>Composição dos custos de inventário</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map(function(entry, idx) { return <Cell key={idx} fill={entry.fill} stroke="var(--bg-card)" strokeWidth={2} /> })}
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
                        <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{c.nome}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(c.pct * 100).toFixed(0)}% · {fmtBRLShort(c.valor)}</div>
                      </div>
                    </div>
                  )
                })}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Total custos</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--red)', marginTop: '2px', fontWeight: 700 }}>{fmtBRL(totalCustos)}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Observações do planejamento sucessório */}
      <Card>
        <CardTitle>📝 Observações — Planejamento Sucessório</CardTitle>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.7 }}>
          Adicione estratégias, recomendações ou comentários sobre o planejamento sucessório do cliente. Este texto será incluído no relatório PDF.
        </div>
        <textarea
          value={observacaoSucessao || ''}
          onChange={function(e) { setFormState(function(prev) { return { ...prev, observacaoSucessao: e.target.value } }) }}
          placeholder="Ex: Recomenda-se avaliar a constituição de uma holding familiar para otimizar a transferência de patrimônio imobiliário, reduzindo custos de inventário e facilitando a gestão dos bens entre herdeiros..."
          rows={5}
          style={{
            width: '100%', background: 'var(--bg-input)', border: '1.5px solid var(--border)',
            borderRadius: '10px', padding: '14px 16px', color: 'var(--text)', fontSize: '14px',
            fontFamily: 'var(--font-body)', lineHeight: 1.7, outline: 'none', resize: 'vertical',
            transition: 'border-color 0.2s', boxSizing: 'border-box',
          }}
          onFocus={function(e) { e.target.style.borderColor = 'var(--gold)' }}
          onBlur={function(e) { e.target.style.borderColor = 'var(--border)' }}
        />
        {observacaoSucessao && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-dim)', textAlign: 'right' }}>
            {observacaoSucessao.length} caracteres · aparecerá no PDF
          </div>
        )}
      </Card>
    </div>
  )
}
