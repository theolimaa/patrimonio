import React, { useEffect } from 'react'
import { fmtBRL, fmtBRLShort, parseCents, fromCents, centsToNum } from '../utils'

function SectionTitle() {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
        🛡️ Módulo 01
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.15 }}>
        Gestão de Riscos
      </h1>
      <div style={{ width: '44px', height: '3px', background: 'linear-gradient(90deg,var(--gold),transparent)', marginTop: '10px' }} />
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '16px', boxShadow: 'var(--shadow-card)', ...style }}>
      {children}
    </div>
  )
}

function CardTitle({ children }) {
  return <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text)', marginBottom: '18px', fontWeight: 700 }}>{children}</div>
}

function Label({ children }) {
  return <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '7px', marginTop: '18px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{children}</div>
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input
        type="text"
        value={value}
        onChange={function(e) { onChange(e.target.value) }}
        placeholder={placeholder || ''}
        style={{ width: '100%', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '13px 16px', color: 'var(--text)', fontSize: '15px', fontFamily: 'var(--font-body)', fontWeight: 500, outline: 'none', transition: 'border-color 0.2s' }}
        onFocus={function(e) { e.target.style.borderColor = 'var(--gold)' }}
        onBlur={function(e) { e.target.style.borderColor = 'var(--border)' }}
      />
    </div>
  )
}

function MoneyField({ label, value, onChange, hint }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', fontSize: '13px', fontWeight: 700, pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>R$</span>
        <input
          type="text"
          value={fromCents(value)}
          onChange={function(e) { onChange(parseCents(e.target.value)) }}
          placeholder="0,00"
          style={{ width: '100%', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '13px 14px 13px 46px', color: 'var(--text)', fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 500, outline: 'none', transition: 'border-color 0.2s' }}
          onFocus={function(e) { e.target.style.borderColor = 'var(--gold)' }}
          onBlur={function(e) { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>
      {hint && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '5px', fontStyle: 'italic' }}>{hint}</div>}
    </div>
  )
}

function set(setFormState, key) {
  return function(val) {
    setFormState(function(prev) { return { ...prev, [key]: val } })
  }
}

export default function Riscos({ formState, setFormState, clientInfo, onClientInfoChange, onDataChange }) {
  const { patrimonioAtual, patrimonioAposentadoria, coberturaContratada, observacaoRiscos } = formState

  const atual = centsToNum(patrimonioAtual)
  const aposentadoria = centsToNum(patrimonioAposentadoria)
  const coberturaContratadaNum = centsToNum(coberturaContratada)
  const coberturaNecessaria = Math.max(0, aposentadoria - atual)
  const gapDescoberto = Math.max(0, coberturaNecessaria - coberturaContratadaNum)
  const pctCoberto = aposentadoria > 0 ? Math.min(100, (atual / aposentadoria) * 100) : 0

  useEffect(function() {
    if (atual > 0 || aposentadoria > 0) {
      onDataChange({
        patrimonioAtual: atual,
        patrimonioAposentadoria: aposentadoria,
        coberturaNecessaria: coberturaNecessaria,
        coberturaContratada: coberturaContratadaNum,
        gapDescoberto: gapDescoberto,
        observacaoRiscos: observacaoRiscos || '',
      })
    }
  }, [atual, aposentadoria, coberturaContratadaNum, observacaoRiscos])

  return (
    <div>
      <SectionTitle />

      {/* Dados do planejamento */}
      <Card>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text)', marginBottom: '6px', fontWeight: 700 }}>
          Dados do Planejamento
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Estas informações aparecerão no relatório PDF.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <TextField
            label="Nome do cliente"
            value={clientInfo ? clientInfo.clientName : ''}
            onChange={function(v) { onClientInfoChange(function(prev) { return { ...prev, clientName: v } }) }}
            placeholder="Ex: João Silva"
          />
          <TextField
            label="Nome do assessor"
            value={clientInfo ? clientInfo.advisorName : ''}
            onChange={function(v) { onClientInfoChange(function(prev) { return { ...prev, advisorName: v } }) }}
            placeholder="Ex: Maria Oliveira"
          />
        </div>
      </Card>

      {/* Patrimônio */}
      <Card>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text)', marginBottom: '20px', fontWeight: 700 }}>
          Patrimônio Financeiro
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <MoneyField
            label="Patrimônio financeiro atual"
            value={patrimonioAtual}
            onChange={set(setFormState, 'patrimonioAtual')}
            hint="Investimentos, poupança, previdência atual"
          />
          <MoneyField
            label="Patrimônio necessário para aposentadoria"
            value={patrimonioAposentadoria}
            onChange={set(setFormState, 'patrimonioAposentadoria')}
            hint="Meta de patrimônio para se aposentar"
          />
        </div>
      </Card>

      {/* Cobertura contratada */}
      <Card>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text)', marginBottom: '6px', fontWeight: 700 }}>
          Cobertura de Invalidez
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Informe o valor total já contratado em seguros de invalidez/vida para calcular o gap descoberto.
        </div>
        <div style={{ maxWidth: '340px' }}>
          <MoneyField
            label="Cobertura já contratada"
            value={coberturaContratada}
            onChange={set(setFormState, 'coberturaContratada')}
            hint="Soma das coberturas de seguro de invalidez/vida já existentes"
          />
        </div>
      </Card>

      {(atual > 0 || aposentadoria > 0) && (
        <div className="animate-in">
          <Card>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text)', marginBottom: '20px', fontWeight: 700 }}>
              Análise de Cobertura
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Patrimônio atual</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>{fmtBRLShort(atual)}</div>
              </div>
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Meta para aposentadoria</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>{fmtBRLShort(aposentadoria)}</div>
              </div>
            </div>

            {/* Waterfall */}
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '14px' }}>
                Composição da Cobertura Necessária
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>Cobertura necessária (gap patrimonial)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text)', fontWeight: 700 }}>{fmtBRL(coberturaNecessaria)}</span>
                </div>
                {coberturaContratadaNum > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(26,153,85,0.06)', borderRadius: '8px', border: '1px solid rgba(26,153,85,0.2)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 500 }}>(-) Cobertura já contratada</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--green)', fontWeight: 700 }}>- {fmtBRL(coberturaContratadaNum)}</span>
                  </div>
                )}
                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: gapDescoberto > 0 ? 'var(--gold-dim)' : 'rgba(26,153,85,0.07)', borderRadius: '8px', border: gapDescoberto > 0 ? '1.5px solid var(--gold)' : '1.5px solid rgba(26,153,85,0.35)' }}>
                  <span style={{ fontSize: '13px', color: gapDescoberto > 0 ? 'var(--gold-light)' : 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                    {gapDescoberto > 0 ? 'Gap descoberto' : '✓ Cobertura suficiente'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: gapDescoberto > 0 ? 'var(--gold-light)' : 'var(--green)', fontWeight: 800 }}>{fmtBRL(gapDescoberto)}</span>
                </div>
              </div>
            </div>

            {aposentadoria > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Progresso rumo à meta</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gold)', fontWeight: 700 }}>{pctCoberto.toFixed(1)}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pctCoberto + '%', background: 'linear-gradient(90deg,var(--gold),#e2c97e)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>R$ 0</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{fmtBRLShort(aposentadoria)}</span>
                </div>
              </div>
            )}
          </Card>

          {gapDescoberto > 0 && (
            <Card style={{ borderColor: 'var(--gold)', background: 'var(--gold-dim)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '28px', flexShrink: 0 }}>💡</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--gold-light)', marginBottom: '8px', fontWeight: 700 }}>
                    Recomendação de Cobertura Adicional
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    Considerando a cobertura já contratada de <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{fmtBRL(coberturaContratadaNum)}</strong>,
                    ainda há um gap de <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{fmtBRL(gapDescoberto)}</strong> a ser coberto
                    com seguro adicional de invalidez ou vida.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div style={{ padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '12px', color: 'var(--text-muted)', boxShadow: 'var(--shadow-card)' }}>
            ℹ️ O patrimônio financeiro é compartilhado automaticamente com o módulo de <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Sucessão</strong>.
          </div>
        </div>
      )}

      {atual === 0 && aposentadoria === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>🛡️</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>
            Informe os valores acima
          </div>
          <div style={{ fontSize: '14px', maxWidth: '320px', margin: '0 auto', lineHeight: 1.7 }}>
            Preencha o patrimônio atual e a meta de aposentadoria para ver a análise de cobertura.
          </div>
        </div>
      )}

      {/* Observações do planejamento de riscos */}
      <Card>
        <CardTitle>📝 Observações — Gestão de Riscos</CardTitle>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.7 }}>
          Adicione estratégias, recomendações ou comentários sobre a gestão de riscos do cliente. Este texto será incluído no relatório PDF.
        </div>
        <textarea
          value={observacaoRiscos || ''}
          onChange={function(e) { setFormState(function(prev) { return { ...prev, observacaoRiscos: e.target.value } }) }}
          placeholder="Ex: Cliente possui gap descoberto de invalidez. Recomenda-se contratação de seguro de vida com cobertura por invalidez permanente no valor de R$ X. Avaliar produtos da XP Seguros..."
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
        {observacaoRiscos && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-dim)', textAlign: 'right' }}>
            {observacaoRiscos.length} caracteres · aparecerá no PDF
          </div>
        )}
      </Card>
    </div>
  )
}
