import { fmtBRL, fmtBRLShort } from './utils.js'

function fmtDate() {
  return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const REGIMES = {
  comunhao_parcial: 'Comunhão Parcial de Bens',
  comunhao_universal: 'Comunhão Universal de Bens',
  separacao_total: 'Separação Total de Bens',
}

export function generatePDF(appData, sections, clientInfo) {
  const info = clientInfo || { clientName: '', advisorName: '' }
  const riscos = sections.includes('riscos') ? appData.riscos : null
  const sucessao = sections.includes('sucessao') ? appData.sucessao : null
  const pgbl = sections.includes('pgbl') ? appData.pgbl : null

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Planejamento Financeiro</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=DM+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:#fff;color:#1a2744;font-size:13px;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  @page{margin:16mm 15mm;size:A4;}

  /* ── Prevent orphan cuts ── */
  .section{
    display:block;
    padding:24px 0 8px;
    border-bottom:1.5px solid #e8edf5;
    margin-bottom:20px;
    page-break-inside:avoid;
    break-inside:avoid;
  }
  .section:last-of-type{border-bottom:none;}

  .no-break{
    page-break-inside:avoid;
    break-inside:avoid;
  }

  table{
    width:100%;
    border-collapse:collapse;
    margin:10px 0;
    font-size:11.5px;
    page-break-inside:avoid;
    break-inside:avoid;
  }

  /* Force page break BEFORE each section except the first */
  .section+.section{
    page-break-before:auto;
  }

  /* ── Cover ── */
  .cover{
    background:#1a2744;
    color:#fff;
    padding:36px 40px 32px;
    margin:-16mm -15mm 0;
    page-break-after:always;
    break-after:page;
  }
  .cover-tag{font-family:'Montserrat',sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c9a84c;font-weight:700;margin-bottom:8px;}
  .cover-title{font-family:'Montserrat',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.15;margin-bottom:6px;}
  .cover-date{font-size:12px;color:rgba(255,255,255,0.45);margin-top:10px;}
  .cover-bar{height:3px;background:linear-gradient(90deg,#c9a84c,transparent);margin-top:14px;margin-bottom:18px;}
  .cover-hello{font-family:'Montserrat',sans-serif;font-size:16px;color:#fff;font-weight:400;margin-top:8px;}
  .cover-hello strong{color:#e2c97e;font-weight:800;}
  .cover-advisor{font-size:12px;color:rgba(255,255,255,0.5);margin-top:6px;}

  /* ── Section headers ── */
  .section-tag{font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#c9a84c;font-weight:700;margin-bottom:5px;}
  .section-title{font-family:'Montserrat',sans-serif;font-size:17px;font-weight:800;color:#1a2744;margin-bottom:16px;}

  /* ── Cards grid ── */
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;}

  .card{background:#f5f7fb;border:1px solid #e0e8f0;border-radius:9px;padding:13px 15px;page-break-inside:avoid;break-inside:avoid;}
  .card-gold{background:#fffbf0;border:1px solid #e8d070;}
  .card-green{background:#f0fdf5;border:1px solid #a7f3d0;}
  .card-red{background:#fff5f5;border:1px solid #fca5a5;}
  .card-label{font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#6a8090;margin-bottom:5px;font-weight:700;font-family:'Montserrat',sans-serif;}
  .card-value{font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:600;color:#1a2744;}
  .card-gold .card-label{color:#a07020;}
  .card-gold .card-value{color:#8a5c10;}
  .card-green .card-label{color:#166534;}
  .card-green .card-value{color:#15803d;}
  .card-red .card-label{color:#991b1b;}
  .card-red .card-value{color:#b91c1c;}
  .card-sub{font-size:10px;color:#8aa0b8;margin-top:3px;}

  /* ── Progress bar ── */
  .progress-wrap{margin:14px 0;page-break-inside:avoid;break-inside:avoid;}
  .progress-label{display:flex;justify-content:space-between;font-size:11px;color:#6a8090;margin-bottom:5px;}
  .progress-bar{height:7px;background:#e0e8f0;border-radius:4px;overflow:hidden;}
  .progress-fill{height:100%;background:linear-gradient(90deg,#b5862a,#e2c97e);border-radius:4px;}

  /* ── Insight box ── */
  .insight{background:#fffbf0;border:1px solid #e8d070;border-radius:9px;padding:13px 15px;margin:13px 0;font-size:12px;color:#6a5020;line-height:1.7;page-break-inside:avoid;break-inside:avoid;}
  .insight strong{color:#1a2744;}

  /* ── Table ── */
  th{background:#f0f4f9;font-family:'Montserrat',sans-serif;font-weight:700;font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#6a8090;padding:8px 10px;text-align:left;border-bottom:1.5px solid #dde5f0;}
  th.right,td.right{text-align:right;}
  td{padding:8px 10px;border-bottom:1px solid #eef2f8;color:#1a2744;vertical-align:middle;}
  td.mono{font-family:'IBM Plex Mono',monospace;}
  td.bold{font-weight:700;}
  tr.total-row td{background:#f5f7fb;font-weight:700;border-top:1.5px solid #dde5f0;}
  tr.highlight td{background:#fffbf0;}

  /* ── Legend dots ── */
  .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:middle;}
  .dot-gold{background:#c9a84c;}
  .dot-blue{background:#4a9fd4;}
  .dot-green{background:#2ecc71;}

  /* ── Empty state ── */
  .empty-note{padding:18px;text-align:center;color:#8aa0b8;font-style:italic;background:#f9fafc;border:1px dashed #dde5f0;border-radius:9px;margin:6px 0;}

  /* ── Footer ── */
  .footer{margin-top:28px;padding-top:14px;border-top:1px solid #e0e8f0;font-size:10px;color:#8aa0b8;text-align:center;}
</style>
</head>
<body>

<!-- ── COVER ── -->
<div class="cover">
  <div class="cover-tag">Planejamento</div>
  <div class="cover-title">Relatório Financeiro<br/>Patrimonial</div>
  <div class="cover-bar"></div>
  ${info.clientName
    ? `<div class="cover-hello">Olá, <strong>${info.clientName}</strong></div>`
    : ''}
  ${info.advisorName
    ? `<div class="cover-advisor">Assessor responsável: ${info.advisorName}</div>`
    : ''}
  <div class="cover-date">Gerado em ${fmtDate()}</div>
</div>

<!-- ── RISCOS ── -->
<div class="section">
  <div class="section-tag">Módulo 01</div>
  <div class="section-title">🛡️ Gestão de Riscos</div>
  ${riscos ? `
  <div class="grid3 no-break">
    <div class="card">
      <div class="card-label">Patrimônio atual</div>
      <div class="card-value">${fmtBRLShort(riscos.patrimonioAtual || 0)}</div>
    </div>
    <div class="card">
      <div class="card-label">Meta para aposentadoria</div>
      <div class="card-value">${fmtBRLShort(riscos.patrimonioAposentadoria || 0)}</div>
    </div>
    <div class="${riscos.cobertura > 0 ? 'card card-gold' : 'card card-green'}">
      <div class="card-label">Cobertura necessária</div>
      <div class="card-value">${fmtBRLShort(riscos.cobertura || 0)}</div>
      <div class="card-sub">${riscos.cobertura > 0 ? 'Gap a cobrir com seguro' : 'Meta já atingida ✓'}</div>
    </div>
  </div>
  ${(riscos.patrimonioAposentadoria || 0) > 0 ? `
  <div class="progress-wrap">
    <div class="progress-label">
      <span>Progresso rumo à meta</span>
      <strong>${Math.min(100, ((riscos.patrimonioAtual || 0) / riscos.patrimonioAposentadoria) * 100).toFixed(1)}%</strong>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width:${Math.min(100, ((riscos.patrimonioAtual || 0) / riscos.patrimonioAposentadoria) * 100).toFixed(1)}%"></div>
    </div>
  </div>` : ''}
  ${(riscos.cobertura || 0) > 0 ? `
  <div class="insight">
    💡 Para garantir que sua família mantenha o padrão de vida em caso de invalidez ou falecimento antes de atingir a meta patrimonial, recomenda-se uma <strong>cobertura de seguro de ${fmtBRL(riscos.cobertura)}</strong>. Esse valor corresponde ao gap entre o patrimônio atual e a meta de aposentadoria.
  </div>` : ''}
  ` : '<div class="empty-note">Nenhum dado preenchido para este módulo.</div>'}
</div>

<!-- ── SUCESSÃO ── -->
<div class="section">
  <div class="section-tag">Módulo 02</div>
  <div class="section-title">🏛️ Planejamento Sucessório</div>
  ${sucessao ? `
  <div class="no-break">
    <table style="margin-bottom:14px;">
      <tr><th>Regime matrimonial</th><td>${REGIMES[sucessao.regimeCasamento] || '—'}</td></tr>
    </table>
  </div>

  ${sucessao.imoveis && sucessao.imoveis.some(function(im) { return im.valor }) ? `
  <div class="no-break">
    <table>
      <thead><tr>
        <th>Imóvel</th><th>Tipo</th>
        ${sucessao.regimeCasamento === 'comunhao_parcial' ? '<th>Aquisição</th>' : ''}
        <th class="right">Valor</th><th class="right">Inventariável</th>
      </tr></thead>
      <tbody>
      ${sucessao.imoveis.map(function(im, i) {
        const val = im.valor ? (parseInt(im.valor) / 100) : 0
        const frac = sucessao.regimeCasamento === 'separacao_total' ? 1 : (sucessao.regimeCasamento === 'comunhao_universal' ? 0.5 : (im.antesCasamento ? 1 : 0.5))
        return `<tr>
          <td>Imóvel ${i + 1}</td>
          <td style="text-transform:capitalize">${im.tipo || '—'}</td>
          ${sucessao.regimeCasamento === 'comunhao_parcial' ? `<td>${im.antesCasamento ? 'Antes' : 'Depois'} do casamento</td>` : ''}
          <td class="right mono">${fmtBRL(val)}</td>
          <td class="right mono">${fmtBRL(val * frac)}</td>
        </tr>`
      }).join('')}
      </tbody>
    </table>
  </div>` : ''}

  ${sucessao.veiculos && sucessao.veiculos.some(function(ve) { return ve.valor }) ? `
  <div class="no-break">
    <table>
      <thead><tr><th>Veículo</th><th>Tipo</th><th class="right">Valor</th></tr></thead>
      <tbody>
      ${sucessao.veiculos.map(function(ve, i) {
        const val = ve.valor ? (parseInt(ve.valor) / 100) : 0
        return `<tr><td>Veículo ${i + 1}</td><td style="text-transform:capitalize">${ve.tipo || '—'}</td><td class="right mono">${fmtBRL(val)}</td></tr>`
      }).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <div class="grid3 no-break" style="margin-top:16px;">
    <div class="card card-gold">
      <div class="card-label">Patrimônio bruto total</div>
      <div class="card-value">${fmtBRLShort(sucessao.totais.totalBruto || 0)}</div>
    </div>
    <div class="card card-red">
      <div class="card-label">Custos de inventário (15%)</div>
      <div class="card-value">- ${fmtBRLShort(sucessao.totais.totalCustos || 0)}</div>
    </div>
    <div class="card card-green">
      <div class="card-label">Patrimônio líquido transferido</div>
      <div class="card-value">${fmtBRLShort(sucessao.totais.patrimonioLiquido || 0)}</div>
    </div>
  </div>

  <div class="no-break">
    <table>
      <thead><tr><th>Custo de Inventário</th><th class="right">Alíquota</th><th class="right">Valor</th></tr></thead>
      <tbody>
        <tr><td><span class="dot dot-gold"></span>ITCMD</td><td class="right">8,0%</td><td class="right mono">${fmtBRL((sucessao.totais.totalInventariavel || 0) * 0.08)}</td></tr>
        <tr><td><span class="dot dot-blue"></span>Honorários Advocatícios</td><td class="right">4,0%</td><td class="right mono">${fmtBRL((sucessao.totais.totalInventariavel || 0) * 0.04)}</td></tr>
        <tr><td><span class="dot dot-green"></span>Custas Cartorárias</td><td class="right">3,0%</td><td class="right mono">${fmtBRL((sucessao.totais.totalInventariavel || 0) * 0.03)}</td></tr>
        <tr class="total-row"><td class="bold">Total</td><td class="right bold">15,0%</td><td class="right mono bold">${fmtBRL(sucessao.totais.totalCustos || 0)}</td></tr>
      </tbody>
    </table>
  </div>
  ` : '<div class="empty-note">Nenhum dado preenchido para este módulo.</div>'}
</div>

<!-- ── PGBL ── -->
<div class="section">
  <div class="section-tag">Módulo 03</div>
  <div class="section-title">📊 PGBL & Planejamento Tributário</div>
  ${pgbl ? `
  <div class="grid2 no-break">
    <div class="card">
      <div class="card-label">Renda bruta anual</div>
      <div class="card-value">${fmtBRL(pgbl.rendaAnual || 0)}</div>
    </div>
    <div class="card">
      <div class="card-label">Alíquota marginal IR</div>
      <div class="card-value">${((pgbl.aliquotaMarginal || 0) * 100).toFixed(1)}%</div>
    </div>
    <div class="card card-gold">
      <div class="card-label">PGBL ideal (12% da renda)</div>
      <div class="card-value">${fmtBRL(pgbl.pgblIdeal || 0)}/ano</div>
      <div class="card-sub">${fmtBRL((pgbl.pgblIdeal || 0) / 12)}/mês</div>
    </div>
    <div class="card card-green">
      <div class="card-label">Economia fiscal anual</div>
      <div class="card-value">${fmtBRL(pgbl.economiaAnual || 0)}</div>
      <div class="card-sub">${fmtBRL((pgbl.economiaAnual || 0) / 12)}/mês</div>
    </div>
  </div>

  <div class="insight">
    💡 Ao contribuir com <strong>${fmtBRL(pgbl.pgblIdeal || 0)}</strong>/ano no PGBL (12% da renda bruta), você deduz da base de cálculo do IR. Com alíquota marginal de <strong>${((pgbl.aliquotaMarginal || 0) * 100).toFixed(1)}%</strong>, economia fiscal de <strong>${fmtBRL(pgbl.economiaAnual || 0)}/ano</strong>. Projeção com rentabilidade real de 4% a.a.
  </div>

  ${pgbl.projecao && pgbl.projecao.length > 0 ? `
  <div class="no-break">
    <table>
      <thead>
        <tr>
          <th>Ano</th>
          <th class="right">Aportado</th>
          <th class="right">Patrimônio PGBL</th>
          <th class="right">Restituições</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
      ${pgbl.projecao.filter(function(row) {
        const len = pgbl.projecao.length
        if (len <= 15) return true
        const checkpoints = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30]
        return checkpoints.includes(row.ano)
      }).map(function(row, idx, arr) {
        const isLast = idx === arr.length - 1
        return `<tr class="${isLast ? 'highlight' : ''}">
          <td class="bold">${row.ano}</td>
          <td class="right mono">${fmtBRL(row.aportado)}</td>
          <td class="right mono">${fmtBRL(row.patrimonioPGBL)}</td>
          <td class="right mono">${fmtBRL(row.restituicoes)}</td>
          <td class="right mono bold">${fmtBRL(row.total)}</td>
        </tr>`
      }).join('')}
      </tbody>
    </table>
  </div>` : ''}
  ` : '<div class="empty-note">Nenhum dado preenchido para este módulo.</div>'}
</div>

<div class="footer">
  Relatório gerado em ${fmtDate()} · Projeções com caráter ilustrativo · 4% a.a. real (sem projeção de inflação)
</div>

<script>window.onload = function() { window.print() }</script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
