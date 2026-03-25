// ── Formatting ──────────────────────────────────────────────────────────────
export function fmtBRL(n) {
  if (isNaN(n) || n === null || n === undefined) return 'R$ 0,00'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function fmtBRLShort(n) {
  if (!n) return 'R$ 0'
  if (n >= 1e9) return 'R$ ' + (n / 1e9).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bi'
  if (n >= 1e6) return 'R$ ' + (n / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' M'
  if (n >= 1e3) return 'R$ ' + (n / 1e3).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' mil'
  return fmtBRL(n)
}

export function fmtPct(n) {
  return (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + '%'
}

// ── Cents helpers ────────────────────────────────────────────────────────────
export function parseCents(val) {
  return val.replace(/\D/g, '')
}

export function fromCents(val) {
  if (!val) return ''
  return (parseInt(val) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function centsToNum(val) {
  if (!val) return 0
  return parseInt(val) / 100
}

export function numToCents(n) {
  return String(Math.round((n || 0) * 100))
}

// ── IR 2024 Table ────────────────────────────────────────────────────────────
const IR_TABLE = [
  { limite: 2259.20, aliquota: 0,     deducao: 0 },
  { limite: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { limite: 3751.05, aliquota: 0.15,  deducao: 381.44 },
  { limite: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { limite: Infinity, aliquota: 0.275, deducao: 896.00 },
]

export function calcIR(rendaBrutaMensal) {
  const renda = rendaBrutaMensal || 0
  const faixa = IR_TABLE.find(function(f) { return renda <= f.limite }) || IR_TABLE[IR_TABLE.length - 1]
  return {
    aliquotaMarginal: faixa.aliquota,
    aliquotaEfetiva: renda > 0 ? Math.max(0, (renda * faixa.aliquota - faixa.deducao) / renda) : 0,
    irMensal: Math.max(0, renda * faixa.aliquota - faixa.deducao),
    faixa: faixa.aliquota,
  }
}

// ── PGBL Calculations ────────────────────────────────────────────────────────
export function calcPGBL(rendaBrutaAnual, aliquotaMarginal) {
  const pgblIdeal = rendaBrutaAnual * 0.12
  const economiaAnual = pgblIdeal * aliquotaMarginal
  const economiaMensal = economiaAnual / 12
  return { pgblIdeal, economiaAnual, economiaMensal }
}

export function projetarPGBL(aporteAnual, aliquotaMarginal, anos) {
  const taxa = 0.04
  const restAnual = aporteAnual * aliquotaMarginal
  let patrimonio = 0
  let restituicoes = 0
  const dados = []
  for (let year = 1; year <= anos; year++) {
    patrimonio = (patrimonio + aporteAnual) * (1 + taxa)
    restituicoes = (restituicoes + restAnual) * (1 + taxa)
    dados.push({
      ano: year,
      patrimonioPGBL: Math.round(patrimonio),
      restituicoes: Math.round(restituicoes),
      total: Math.round(patrimonio + restituicoes),
      aportado: Math.round(aporteAnual * year),
    })
  }
  return dados
}

// ── Inventário ───────────────────────────────────────────────────────────────
export const CUSTOS_INVENTARIO = [
  { nome: 'ITCMD', pct: 0.08, cor: '#c9a84c' },
  { nome: 'Honorários Advocatícios', pct: 0.04, cor: '#4a9fd4' },
  { nome: 'Custas Cartorárias', pct: 0.03, cor: '#2ecc71' },
]

export function calcInventario(patrimonioInventariavel) {
  return CUSTOS_INVENTARIO.map(function(c) {
    return { ...c, valor: patrimonioInventariavel * c.pct }
  })
}

export function calcPatrimonioInventariavel(imoveis, patrimonioFinanceiro, veiculos, regimeCasamento) {
  function fracaoInventariavel(item) {
    if (regimeCasamento === 'separacao_total') return 1.0
    if (regimeCasamento === 'comunhao_universal') return 0.5
    return item.antesCasamento ? 1.0 : 0.5
  }
  const totalImoveis = imoveis.reduce(function(ac
