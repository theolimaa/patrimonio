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
  body{
    font-family:'DM Sans',sans-serif;
    background:#fff;
    color:#1a2744;
    font-size:13px;
    line-height:1.6;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }

  /* Zero page margins — cover bleeds full width, content uses inner padding */
  @page { margin:0; size:A4; }

  /* ── Cover ── full bleed, occupies first "page" via min-height */
  .cover{
    background:#1a2744;
    color:#fff;
    padding:28mm 16mm 20mm;
    min-height:100vh;
    display:flex;
    flex-direction:column;
    justify-content:flex-start;
    page-break-after:always;
    break-after:page;
  }
  .cover-tag{font-family:'Montserrat',sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c9a84c;font-weight:700;margin-bottom:10px;}
  .cover-title{font-family:'Montserrat',sans-serif;font-size:32px;font-weight:800;color:#fff;line-height:1.15;margin-bottom:0;}
  .cover-bar{height:3px;width:100%;background:linear-gradient(90deg,#c9a84c,transparent);margin:20px 0 24px;}
  .cover-hello{font-family:'Montserrat',sans-serif;font-size:18px;color:#fff;font-weight:400;margin-bottom:8px;}
  .cover-hello strong{color:#e2c97e;font-weight:800;}
  .cover-advisor{font-size:13px;color:rgba(255,255,255,0.55);margin-bottom:10px;}
  .cover-date{font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;}

  /* ── Content wrapper — all non-cover content gets page margins via padding ── */
  .content{padding:14mm 16mm 14mm;}

  /* ── Sections ── */
  .section{
    margin-bottom:22px;
    padding-bottom:8px;
    border-bottom:1.5px solid #e8edf5;
    page-break-inside:avoid;
    break-inside:avoid;
  }
  .section:last-of-type{border-bottom:none;}
  .section-tag{font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#c9a84c;font-weight:700;margin-bottom:5px;}
  .section-title{font-family:'Montserrat',sans-serif;font-size:17px;font-weight:800;color:#1a2744;margin-bottom:14px;}

  /* ── No-break blocks ── */
  .nb{page-break-inside:avoid;break-inside:avoid;}

  /* ── Grids ── */
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;}

  /* ── Cards ── */
  .card{background:#f5f7fb;border:1px solid #e0e8f0;border-radius:9px;padding:13px 15px;page-break-inside:avoid;break-inside:avoid;}
  .card-gold{background:#fffbf0;border-color:#e8d070;}
  .card-green{background:#f0fdf5;border-color:#a7f3d0;}
  .card-red{background:#fff5f5;border-color:#fca5a5;}
  .card-label{font-family:'Montserrat',sans-serif;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;color:#6a8090;margin-bottom:5px;}
  .card-gold .card-label{color:#a07020;}
  .card-green .card-label{color:#166534;}
  .card-red .card-label{color:#991b1b;}
  .card-value{font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:600;color:#1a2744;}
  .card-gold .card-value{color:#8a5c10;}
  .card-green .card-value{color:#15803d;}
  .card-red .card-value{color:#b91c1c;}
  .card-sub{font-size:10px;color:#8aa0b8;margin-top:3px;}

  /* ── Waterfall rows ── */
  .wf-row{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:7px;margin-bottom:5px;font-size:12px;}
  .wf-normal{background:#f5f7fb;border:1px solid #e0e8f0;}
  .wf-green{background:#f0fdf5;border:1px solid #a7f3d0;color:#166534;}
  .wf-gold{background:#fffbf0;border:1.5px solid #c9a84c;}
  .wf-total-label{font-family:'Montserrat',sans-serif;font-weight:700;font-size:13px;}
  .wf-gold .wf-total-label{color:#8a5c10;}
  .wf-value{font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:14px;}
  .wf-divider{height:1px;background:#e0e8f0;margin:6px 0;}

  /* ── Progress bar ── */
  .progress-wrap{margin:12px 0;page-break-inside:avoid;break-inside:avoid;}
  .progress-label{display:flex;justify-content:space-between;font-size:11px;color:#6a8090;margin-bottom:5px;}
  .progress-bar{height:7px;background:#e0e8f0;border-radius:4px;overflow:hidden;}
  .progress-fill{height:100%;background:linear-gradient(90deg,#b5862a,#e2c97e);border-radius:4px;}

  /* ── Insight ── */
  .insight{background:#fffbf0;border:1px solid #e8d070;border-radius:9px;padding:12px 15px;margin:12px 0;font-size:12px;color:#6a5020;line-height:1.7;page-break-inside:avoid;break-inside:avoid;}
  .insight strong{color:#1a2744;}

  /* ── Tables ── */
  table{width:100%;border-collapse:collapse;margin:10px 0;font-size:11.5px;page-break-inside:avoid;break-inside:avoid;}
  th{background:#f0f4f9;font-family:'Montserrat',sans-serif;font-weight:700;font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#6a8090;padding:8px 10px;text-align:left;border-bottom:1.5px solid #dde5f0;}
  th.right,td.right{text-align:right;}
  td{padding:7px 10px;border-bottom:1px solid #eef2f8;color:#1a2744;vertical-align:middle;}
  td.mono{font-family:'IBM Plex Mono',monospace;}
  td.bold{font-weight:700;}
  tr.total-row td{background:#f5f7fb;font-weight:700;border-top:1.5px solid #dde5f0;}
  tr.highlight td{background:#fffbf0;}

  /* ── Legend dots ── */
  .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:middle;}
  .dot-gold{background:#c9a84c;}
  .dot-blue{background:#4a9fd4;}
  .dot-green{background:#2ecc71;}

  /* ── Empty note ── */
  .empty-note{padding:18px;text-align:center;color:#8aa0b8;font-style:italic;background:#f9fafc;border:1px dashed #dde5f0;border-radius:9px;margin:6px 0;}

  /* ── Footer ── */
  .footer{margin-top:24px;padding-top:12px;border-top:1px solid #e0e8f0;font-size:10px;color:#8aa0b8;text-align:center;}
</style>
</head>
<body>

<!-- ═══ COVER — full bleed, no margins ═══ -->
<div class="cover">
  <div class="cover-tag">Planejamento</div>
  <div class="cover-title">Relatório Financeiro<br/>Patrimonial</div>
  <div class="cover-bar"></div>
  ${info.clientName ? `<div class="cover-hello">Olá, <strong>${info.clientName}</strong></div>` : ''}
  ${info.advisorName ? `<div class="cover-advisor">Assessor responsável: ${info.advisorName}</div>` : ''}
  <div class="cover-date">Gerado em ${fmtDate()}</div>
</div>

<!-- ═══ ALL CONTENT — padded wrapper ═══ -->
<div class="content">

<!-- ── RISCOS ── -->
<div class="section">
  <div class="section-tag">Módulo 01</div>
  <div class="section-title">🛡️ Gestão de Riscos</div>
  ${riscos ? `
  <div class="grid3 nb">
    <div class="card">
      <div class="card-label">Patrimônio atual</div>
      <div class="card-value">${fmtBRLShort(riscos.patrimonioAtual || 0)}</div>
    </div>
    <div class="card">
      <div class="card-label">Meta para aposentadoria</div>
      <div class="card-value">${fmtBRLShort(riscos.patrimonioAposentadoria || 0)}</div>
    </div>
    <div class="card ${(riscos.gapDescoberto || riscos.coberturaNecessaria) > 0 ? 'card-gold' : 'card-green'}">
      <div class="card-label">Gap descoberto</div>
      <div class="card-value">${fmtBRLShort(riscos.gapDescoberto !== undefined ? riscos.gapDescoberto : (riscos.cobertura || 0))}</div>
      <div class="card-sub">${(riscos.gapDescoberto || 0) > 0 ? 'Cobertura adicional necessária' : 'Cobertura suficiente ✓'}</div>
    </div>
  </div>

  ${(riscos.coberturaContratada || 0) > 0 || (riscos.coberturaNecessaria || 0) > 0 ? `
  <div class="nb" style="margin-bottom:12px;">
    <div class="wf-row wf-normal"><span>Cobertura necessária (gap patrimonial)</span><span class="wf-value">${fmtBRL(riscos.coberturaNecessaria || riscos.cobertura || 0)}</span></div>
    ${(riscos.coberturaContratada || 0) > 0 ? `<div class="wf-row wf-green"><span>(-) Cobertura já contratada</span><span class="wf-value" style="color:#15803d">- ${fmtBRL(riscos.coberturaContratada)}</span></div>` : ''}
    <div class="wf-divider"></div>
    <div class="wf-row ${(riscos.gapDescoberto || 0) > 0 ? 'wf-gold' : 'wf-green'}">
      <span class="wf-total-label">${(riscos.gapDescoberto || 0) > 0 ? 'Gap descoberto' : '✓ Cobertura suficiente'}</span>
      <span class="wf-value">${fmtBRL(riscos.gapDescoberto !== undefined ? riscos.gapDescoberto : 0)}</span>
    </div>
  </div>` : ''}

  ${(riscos.patrimonioAposentadoria || 0) > 0 ? `
  <div class="progress-wrap nb">
    <div class="progress-label">
      <span>Progresso rumo à meta</span>
      <strong>${Math.min(100, ((riscos.patrimonioAtual || 0) / riscos.patrimonioAposentadoria) * 100).toFixed(1)}%</strong>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width:${Math.min(100, ((riscos.patrimonioAtual || 0) / riscos.patrimonioAposentadoria) * 100).toFixed(1)}%"></div>
    </div>
  </div>` : ''}

  ${(riscos.gapDescoberto || riscos.cobertura || 0) > 0 ? `
  <div class="insight">
    💡 ${riscos.coberturaContratada > 0
      ? `Considerando a cobertura já contratada de <strong>${fmtBRL(riscos.coberturaContratada)}</strong>, ainda há um gap descoberto de <strong>${fmtBRL(riscos.gapDescoberto)}</strong> que precisa ser coberto com seguro adicional de invalidez ou vida para garantir a meta patrimonial.`
      : `Para garantir que sua família mantenha o padrão de vida em caso de invalidez, recomenda-se uma cobertura de <strong>${fmtBRL(riscos.coberturaNecessaria || riscos.cobertura)}</strong>, correspondente ao gap entre o patrimônio atual e a meta de aposentadoria.`
    }
  </div>` : ''}
  ` : '<div class="empty-note">Nenhum dado preenchido para este módulo.</div>'}
</div>

<!-- ── SUCESSÃO ── -->
<div class="section">
  <div class="section-tag">Módulo 02</div>
  <div class="section-title">🏛️ Planejamento Sucessório</div>
  ${sucessao ? `
  <div class="nb">
    <table style="margin-bottom:12px;">
      <tr><th>Regime matrimonial</th><td>${REGIMES[sucessao.regimeCasamento] || '—'}</td></tr>
    </table>
  </div>

  ${sucessao.imoveis && sucessao.imoveis.some(function(im) { return im.valor }) ? `
  <div class="nb">
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
  <div class="nb">
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

  <!-- Patrimônio waterfall -->
  <div class="nb" style="margin:14px 0 10px;">
    <div style="font-family:'Montserrat',sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6a8090;font-weight:700;margin-bottom:8px;">Composição do patrimônio</div>
    <div class="wf-row wf-normal"><span>Patrimônio bruto total (sem previdência)</span><span class="wf-value">${fmtBRL((sucessao.totais.totalBruto || 0) - (sucessao.previdenciaNum || 0))}</span></div>
    ${(sucessao.previdenciaNum || 0) > 0 ? `<div class="wf-row wf-green"><span>(-) Previdência privada (não inventariável)</span><span class="wf-value" style="color:#15803d">- ${fmtBRL(sucessao.previdenciaNum)}</span></div>` : ''}
    <div class="wf-divider"></div>
    <div class="wf-row wf-gold"><span class="wf-total-label" style="color:#8a5c10">Patrimônio inventariável</span><span class="wf-value" style="color:#8a5c10">${fmtBRL(sucessao.totais.totalInventariavel || 0)}</span></div>
  </div>

  <div class="grid3 nb">
    <div class="card card-gold">
      <div class="card-label">Patrimônio inventariável</div>
      <div class="card-value">${fmtBRLShort(sucessao.totais.totalInventariavel || 0)}</div>
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

  <!-- Coverage waterfall -->
  ${(sucessao.coberturaNum || 0) > 0 || (sucessao.previdenciaNum || 0) > 0 ? `
  <div class="nb" style="margin:12px 0 10px;">
    <div style="font-family:'Montserrat',sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6a8090;font-weight:700;margin-bottom:8px;">Cobertura dos custos de inventário</div>
    <div class="wf-row wf-normal"><span>Custos totais de inventário</span><span class="wf-value">${fmtBRL(sucessao.totais.totalCustos || 0)}</span></div>
    ${(sucessao.coberturaNum || 0) > 0 ? `<div class="wf-row wf-green"><span>(-) Seguro de vida contratado</span><span class="wf-value" style="color:#15803d">- ${fmtBRL(sucessao.coberturaNum)}</span></div>` : ''}
    ${(sucessao.previdenciaNum || 0) > 0 ? `<div class="wf-row wf-green"><span>(-) Previdência disponível para herdeiros</span><span class="wf-value" style="color:#15803d">- ${fmtBRL(sucessao.previdenciaNum)}</span></div>` : ''}
    <div class="wf-divider"></div>
    <div class="wf-row ${(sucessao.totais.gapCoberturaMorte || 0) > 0 ? 'wf-gold' : 'wf-green'}">
      <span class="wf-total-label ${(sucessao.totais.gapCoberturaMorte || 0) > 0 ? '' : ''}" style="color:${(sucessao.totais.gapCoberturaMorte || 0) > 0 ? '#8a5c10' : '#15803d'}">
        ${(sucessao.totais.gapCoberturaMorte || 0) > 0 ? 'Gap descoberto' : '✓ Custos totalmente cobertos'}
      </span>
      <span class="wf-value" style="color:${(sucessao.totais.gapCoberturaMorte || 0) > 0 ? '#8a5c10' : '#15803d'}">${fmtBRL(sucessao.totais.gapCoberturaMorte || 0)}</span>
    </div>
  </div>` : ''}

  <div class="nb">
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
  <div class="grid2 nb">
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
  <div class="nb">
    <table>
      <thead><tr><th>Ano</th><th class="right">Aportado</th><th class="right">Patrimônio PGBL</th><th class="right">Restituições</th><th class="right">Total</th></tr></thead>
      <tbody>
      ${pgbl.projecao.filter(function(row) {
        const len = pgbl.projecao.length
        if (len <= 15) return true
        return [1, 2, 3, 5, 7, 10, 15, 20, 25, 30].includes(row.ano)
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

</div><!-- end .content -->

<script>window.onload = function() { window.print() }</script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
