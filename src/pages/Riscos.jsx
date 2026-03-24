import React, { useState, useEffect } from 'react'
import { fmtBRL, fmtBRLShort, parseCents, fromCents, centsToNum, numToCents } from '../utils'

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
      ...style
    }}>
      {children}
    </div>
  )
}

function Label({ children }) {
  return (
    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px', marginTop: '18px' }}>
      {children}
    </div>
  )
}

function MoneyField({ label, value, onChange, hint }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', fontSize: '13px', fontWeight: 600, pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>
          R$
        </span>
        <input
          type="text"
          value={fromCents(value)}
          onChange={function(e) { onChange(parseCents(e.target.value)) }}
          placeholder="0,00"
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '13px 14px 13px 48px',
            color: 'var(--text)',
            fontSize: '16px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={function(e) { e.target.style.borderColor = 'rgba(201,168,76,0.4)' }}
          onBlur={function(e) { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>
      {hint && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '5px', fontStyle: 'italic' }}>{hint}</div>}
    </div>
  )
}

function MetricBox({ label, value, accent, sub }) {
  return (
    <div style={{
      background: accent ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
      border: accent ? '1px solid rgba(201,168,76,0.25)' : '1px solid var(--border)',
      borderRadius: '12px',
      padding: '18px 20px',
    }}>
      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: accent ? 'var(--gold)' : 'var(--text-muted)', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 600, color: accent ? 'var(--gold-light)' : 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>{sub}</div>}
    </div>
  )
}

export default function Riscos({ shared, setShared }) {
  const [patrimonioAtual, setPatrimonioAtual] = useState(numToCents(shared.patrimonioFinanceiro) || '')
  const [patrimonioAposentadoria, setPatrimonioAposentadoria] = useState(numToCents(shared.patrimonioAposentadoria) || '')

  const atual = centsToNum(patrimonioAtual)
  const aposentadoria = centsToNum(patrimonioAposentadoria)
  const cobertura = Math.max(0, aposentadoria - atual)
  const pctCoberto = aposentadoria > 0 ? Math.min(100, (atual / aposentadoria) * 100) : 0

  useEffect(function() {
    setShared(function(prev) {
      return { ...prev, patrimonioFinanceiro: atual, patrimonioAposentadoria: aposentadoria }
    })
  }, [atual, aposentadoria])

  return (
    <div>
      <SectionTitle
        icon="🛡️"
        sub="Módulo 01"
        title="Gestão de Riscos"
      />

      <Card>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold-light)', marginBottom: '20px', fontWeight: 500 }}>
          Patrimônio Financeiro
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <MoneyField
            label="Patrimônio financeiro atual"
            value={patrimonioAtual}
            onChange={setPatrimonioAtual}
            hint="Investimentos, poupança, previdência atual"
          />
          <MoneyField
            label="Patrimônio necessário para aposentadoria"
            value={patrimonioAposentadoria}
            onChange={setPatrimonioAposentadoria}
            hint="Meta de patrimônio para se aposentar"
          />
        </div>
      </Card>

      {(atual > 0 || aposentadoria > 0) && (
        <div className="animate-in">
          <Card>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold-light)', marginBottom: '20px', fontWeight: 500 }}>
              Análise de Cobertura
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <MetricBox label="Patrimônio atual" value={fmtBRLShort(atual)} />
              <MetricBox label="Meta para aposentadoria" value={fmtBRLShort(aposentadoria)} />
              <MetricBox
                label="Cobertura necessária de invalidez"
                value={fmtBRLShort(cobertura)}
                accent={cobertura > 0}
                sub={cobertura > 0 ? 'Gap a ser coberto por seguro' : 'Meta já atingida ✓'}
              />
            </div>

            {/* Progress bar */}
            {aposentadoria > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Progresso rumo à meta</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gold)' }}>{pctCoberto.toFixed(1)}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: pctCoberto + '%',
                    background: 'linear-gradient(90deg, var(--gold), var(--gold-light))',
                    borderRadius: '4px',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>R$ 0</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{fmtBRLShort(aposentadoria)}</span>
                </div>
              </div>
            )}
          </Card>

          {cobertura > 0 && (
            <Card style={{ borderColor: 'rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.05)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '28px', flexShrink: 0 }}>💡</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--gold-light)', marginBottom: '8px', fontWeight: 500 }}>
                    Recomendação de Cobertura
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    Para garantir que sua família mantenha o padrão de vida em caso de invalidez ou falecimento antes de atingir sua meta patrimonial,
                    recomenda-se uma cobertura de seguro de <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{fmtBRL(cobertura)}</strong>.
                    Esse valor corresponde ao gap entre seu patrimônio atual e a meta de aposentadoria.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div style={{ marginTop: '8px', padding: '14px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '12px', color: 'var(--text-dim)' }}>
            ℹ️ Esses dados são compartilhados automaticamente com o módulo de <strong style={{ color: 'var(--text-muted)' }}>Sucessão</strong>.
          </div>
        </div>
      )}

      {atual === 0 && aposentadoria === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Informe os valores acima
          </div>
          <div style={{ fontSize: '14px' }}>
            Preencha o patrimônio atual e a meta de aposentadoria para ver a análise de cobertura.
          </div>
        </div>
      )}
    </div>
  )
}
