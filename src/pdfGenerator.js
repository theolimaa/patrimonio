import { fmtBRL, fmtBRLShort } from './utils.js'

const LOGO_DARK = '/logo-dark.png'
const LOGO_LIGHT = '/logo-light.png'

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

  const logoD = LOGO_DARK
  const logoL = LOGO_LIGHT

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Planejamento Financeiro</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;800&family=DM+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:#fff;color:#1a2744;font-size:13px;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  @page{margin:0;size:A4 portrait;}

  .cover{background:#1a2744;color:#fff;width:210mm;height:297mm;padding:0;page-break-after:always;break-after:page;position:relative;overflow:hidden;display:flex;flex-direction:column;}
  .cover-geo{position:absolute;top:0;right:0;width:55%;height:65%;pointer-events:none;opacity:0.06;}
  .cover-gold-bar{position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#c9a84c,#e2c97e,transparent);}
  .cover-body{position:relative;z-index:1;flex:1;display:flex;flex-direction:column;padding:16mm 18mm 14mm;}
  .cover-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16mm;}
  .cover-logo img{height:34px;object-fit:contain;filter:brightness(0) invert(1);}
  .cover-eyebrow{display:flex;align-items:center;gap:10px;margin-bottom:20px;}
  .cover-eyebrow-line{width:22px;height:2px;background:#c9a84c;flex-shrink:0;}
  .cover-eyebrow-text{font-family:'Montserrat',sans-serif;font-size:8.5px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a84c;font-weight:700;}
  .cover-title{font-family:'Montserrat',sans-serif;font-size:42px;font-weight:800;color:#fff;line-height:1.05;letter-spacing:-0.5px;}
  .cover-title-gold{color:#c9a84c;}
  .cover-rule{width:44px;height:3px;background:linear-gradient(90deg,#c9a84c,transparent);margin:22px 0;flex-shrink:0;}
  .cover-spacer{flex:1;}
  .cover-client{margin-bottom:8mm;}
  .cover-greeting{font-family:'Montserrat',sans-serif;font-size:14px;font-weight:300;color:rgba(255,255,255,0.6);margin-bottom:4px;}
  .cover-client-name{font-family:'Montserrat',sans-serif;font-size:28px;font-weight:800;color:#e2c97e;line-height:1.15;margin-bottom:10px;}
  .cover-advisor-line{font-size:11.5px;color:rgba(255,255,255,0.38);font-style:italic;margin-bottom:4px;}
  .cover-date-line{font-family:'IBM Plex Mono',monospace;font-size:10px;color:rgba(255,255,255,0.22);letter-spacing:0.04em;}
  .cover-modules{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid rgba(255,255,255,0.1);}
  .cover-mod{padding:14px 16px 18px;border-right:1px solid rgba(255,255,255,0.08);}
  .cover-mod:last-child{border-right:none;}
  .cover-mod-num{font-family:'IBM Plex Mono',monospace;font-size:9px;color:rgba(201,168,76,0.5);font-weight:600;letter-spacing:0.08em;margin-bottom:6px;}
  .cover-mod-title{font-family:'Montserrat',sans-serif;font-size:9.5px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:5px;}
  .cover-mod-desc{font-size:10.5px;color:rgba(255,255,255,0.38);line-height:1.55;}

  .content{padding:14mm 15mm 14mm;}
  .section{margin-bottom:22px;padding-bottom:8px;border-bottom:1.5px solid #e8edf5;page-break-inside:avoid;break-inside:avoid;}
  .section:last-of-type{border-bottom:none;}
  .section-tag{font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#c9a84c;font-weight:700;margin-bottom:5px;}
  .section-title{font-family:'Montserrat',sans-serif;font-size:17px;font-weight:800;color:#1a2744;margin-bottom:14px;}
  .nb{page-break-inside:avoid;break-inside:avoid;}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;}
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
  .wf-row{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:7px;margin-bottom:5px;font-size:12px;}
  .wf-normal{background:#f5f7fb;border:1px solid #e0e8f0;}
  .wf-green{background:#f0fdf5;border:1px solid #a7f3d0;color:#166534;}
  .wf-gold{background:#fffbf0;border:1.5px solid #c9a84c;}
  .wf-total-label{font-family:'Montserrat',sans-serif;font-weight:700;font-size:13px;}
  .wf-value{font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:14px;}
  .wf-divider{height:1px;background:#e0e8f0;margin:6px 0;}
  .progress-wrap{margin:12px 0;page-break-inside:avoid;break-inside:avoid;}
  .progress-label{display:flex;justify-content:space-between;font-size:11px;color:#6a8090;margin-bottom:5px;}
  .progress-bar{height:7px;background:#e0e8f0;border-radius:4px;overflow:hidden;}
  .progress-fill{height:100%;background:linear-gradient(90deg,#b5862a,#e2c97e);border-radius:4px;}
  .insight{background:#fffbf0;border:1px solid #e8d070;border-radius:9px;padding:12px 15px;margin:12px 0;font-size:12px;color:#6a5020;line-height:1.7;page-break-inside:avoid;break-inside:avoid;}
  .insight strong{color:#1a2744;}
  table{width:100%;border-collapse:collapse;margin:10px 0;font-size:11.5px;page-break-inside:avoid;break-inside:avoid;}
  th{background:#f0f4f9;font-family:'Montserrat',sans-serif;font-weight:700;font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#6a8090;padding:8px 10px;text-align:left;border-bottom:1.5px solid #dde5f0;}
  th.right,td.right{text-align:right;}
  td{padding:7px 10px;border-bottom:1px solid #eef2f8;color:#1a2744;vertical-align:middle;}
  td.mono{font-family:'IBM Plex Mono',monospace;}
  td.bold{font-weight:700;}
  tr.total-row td{background:#f5f7fb;font-weight:700;border-top:1.5px solid #dde5f0;}
  tr.highlight td{background:#fffbf0;}
  .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:middle;}
  .dot-gold{background:#c9a84c;}
  .dot-blue{background:#4a9fd4;}
  .dot-green{background:#2ecc71;}
  .empty-note{padding:18px;text-align:center;color:#8aa0b8;font-style:italic;background:#f9fafc;border:1px dashed #dde5f0;border-radius:9px;margin:6px 0;}
  .footer{margin-top:24px;padding-top:14px;border-top:1px solid #e0e8f0;display:flex;align-items:center;justify-content:space-between;}
  .footer-text{font-size:10px;color:#8aa0b8;}
  .footer-logo img{height:22px;object-fit:contain;opacity:0.75;}
</style>
</head>
<body>

<div class="cover">
  <svg class="cover-geo" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="360" cy="60" r="260" stroke="white" stroke-width="1.2"/>
    <circle cx="360" cy="60" r="200" stroke="white" stroke-width="0.9"/>
    <circle cx="360" cy="60" r="140" stroke="white" stroke-width="0.7"/>
    <circle cx="360" cy="60" r="80" stroke="white" stroke-width="0.5"/>
    <circle cx="360" cy="60" r="30" stroke="white" stroke-width="0.4"/>
    <line x1="0" y1="180" x2="420" y2="0" stroke="white" stroke-width="0.5"/>
    <line x1="0" y1="260" x2="420" y2="80" stroke="white" stroke-width="0.4"/>
    <line x1="0" y1="340" x2="420" y2="160" stroke="white" stroke-width="0.4"/>
  </svg>
  <div class="cover-gold-bar"></div>

  <div class="cover-body">
    <div class="cover-header">
      <div></div>
      <div class="cover-logo"><img src="${logoD}" alt="Big Invest"/></div>
    </div>

    <div class="cover-eyebrow">
      <div class="cover-eyebrow-line"></div>
      <div class="cover-eyebrow-text">Planejamento Patrimonial</div>
    </div>

    <div class="cover-title">
      Relatório<br/>
      Financeiro<br/>
      <span class="cover-title-gold">Patrimonial</span>
    </div>

    <div class="cover-rule"></div>
    <div class="cover-spacer"></div>

    <div class="cover-client">
      ${info.clientName ? '<div class="cover-greeting">Olá,</div><div class="cover-client-name">' + info.clientName + '</div>' : ''}
      ${info.advisorName ? '<div class="cover-advisor-line">Assessor responsável: ' + info.advisorName + '</div>' : ''}
      <div class="cover-date-line">${fmtDate()}</div>
    </div>
  </div>

  <div class="cover-modules">
    <div class="cover-mod">
      <div class="cover-mod-num">01</div>
      <div class="cover-mod-title">Gestão de Riscos</div>
      <div class="cover-mod-desc">Análise do gap patrimonial e da cobertura de invalidez necessária para proteger sua família.</div>
    </div>
    <div class="cover-mod">
      <div class="cover-mod-num">02</div>
      <div class="cover-mod-title">Sucessão</div>
      <div class="cover-mod-desc">Consolidação do patrimônio inventáriável e estimativa dos custos de inventário por regime matrimonial.</div>
    </div>
    <div class="cover-mod">
      <div class="cover-mod-num">03</div>
      <div class="cover-mod-title">Tributário</div>
      <div class="cover-mod-desc">Benefício fiscal do PGBL, economia no IR e projeção patrimonial com rentabilidade real de 4% a.a.</div>
    </div>
  </div>
</div>

<div class="content">

<div class="section">
  <div class="section-tag">Módulo 01</div>
  <div class="section-title">Gestão de Riscos</div>
  ${riscos ? `
  <div class="grid3 nb">
    <div class="card"><div class="card-label">Patrimônio atual</div><div class="card-value">${fmtBRLShort(riscos.patrimonioAtual || 0)}</div></div>
    <div class="card"><div class="card-label">Meta para aposentadoria</div><div class="card-value">${fmtBRLShort(riscos.patrimonioAposentadoria || 0)}</div></div>
    <div class="${(riscos.gapDescoberto || 0) > 0 ? 'card card-gold' : 'card card-green'}">
      <div class="card-label">Gap descoberto</div>
      <div class="card-value">${fmtBRLShort(riscos.gapDescoberto || 0)}</div>
      <div class="card-sub">${(riscos.gapDescoberto || 0) > 0 ? 'Cobertura adicional necessária' : 'Cobertura suficiente'}</div>
    </div>
  </div>
  <div class="nb" style="margin-bottom:12px;">
    <div class="wf-row wf-normal"><span>Cobertura necessária (gap patrimonial)</span><span class="wf-value">${fmtBRL(riscos.coberturaNecessaria || 0)}</span></div>
    ${(riscos.coberturaContratada || 0) > 0 ? `<div class="wf-row wf-green"><span>(-) Cobertura já contratada</span><span class="wf-value" style="color:#15803d">- ${fmtBRL(riscos.coberturaContratada)}</span></div>` : ''}
    <div class="wf-divider"></div>
    <div class="wf-row ${(riscos.gapDescoberto || 0) > 0 ? 'wf-gold' : 'wf-green'}">
      <span class="wf-total-label" style="color:${(riscos.gapDescoberto || 0) > 0 ? '#8a5c10' : '#15803d'}">${(riscos.gapDescoberto || 0) > 0 ? 'Gap descoberto' : 'Cobertura suficiente'}</span>
      <span class="wf-value" style="color:${(riscos.gapDescoberto || 0) > 0 ? '#8a5c10' : '#15803d'}">${fmtBRL(riscos.gapDescoberto || 0)}</span>
    </div>
  </div>
  ${(riscos.patrimonioAposentadoria || 0) > 0 ? `
  <div class="progress-wrap nb">
    <div class="progress-label"><span>Progresso rumo à meta</span><strong>${Math.min(100, ((riscos.patrimonioAtual || 0) / riscos.patrimonioAposentadoria) * 100).toFixed(1)}%</strong></div>
    <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, ((riscos.patrimonioAtual || 0) / riscos.patrimonioAposentadoria) * 100).toFixed(1)}%"></div></div>
  </div>` : ''}
  ${(riscos.gapDescoberto || 0) > 0 ? `<div class="insight">${(riscos.coberturaContratada || 0) > 0 ? 'Considerando a cobertura já contratada de <strong>' + fmtBRL(riscos.coberturaContratada) + '</strong>, ainda há um gap de <strong>' + fmtBRL(riscos.gapDescoberto) + '</strong> a ser coberto com seguro adicional.' : 'Recomenda-se uma cobertura de <strong>' + fmtBRL(riscos.coberturaNecessaria || 0) + '</strong>, correspondente ao gap entre o patrimônio atual e a meta de aposentadoria.'}</div>` : ''}
  ` : '<div class="empty-note">Nenhum dado preenchido para este módulo.</div>'}
</div>

<div class="section">
  <div class="section-tag">Módulo 02</div>
  <div class="section-title">Planejamento Sucessório</div>
  ${sucessao ? `
  <div class="nb"><table style="margin-bottom:12px;"><tr><th>Regime matrimonial</th><td>${REGIMES[sucessao.regimeCasamento] || '—'}</td></tr></table></div>
  ${sucessao.imoveis && sucessao.imoveis.some(function(im) { return im.valor }) ? `<div class="nb"><table><thead><tr><th>Imóvel</th><th>Tipo</th>${sucessao.regimeCasamento === 'comunhao_parcial' ? '<th>Aquisição</th>' : ''}<th class="right">Valor</th><th class="right">Inventariável</th></tr></thead><tbody>${sucessao.imoveis.map(function(im, i) { const val = im.valor ? (parseInt(im.valor) / 100) : 0; const frac = sucessao.regimeCasamento === 'separacao_total' ? 1 : (sucessao.regimeCasamento === 'comunhao_universal' ? 0.5 : (im.antesCasamento ? 1 : 0.5)); return '<tr><td>Imóvel ' + (i+1) + '</td><td>' + (im.tipo||'—') + '</td>' + (sucessao.regimeCasamento === 'comunhao_parcial' ? '<td>' + (im.antesCasamento ? 'Antes' : 'Depois') + ' do casamento</td>' : '') + '<td class="right mono">' + fmtBRL(val) + '</td><td class="right mono">' + fmtBRL(val * frac) + '</td></tr>' }).join('')}</tbody></table></div>` : ''}
  ${sucessao.veiculos && sucessao.veiculos.some(function(ve) { return ve.valor }) ? `<div class="nb"><table><thead><tr><th>Veículo</th><th>Tipo</th><th class="right">Valor</th></tr></thead><tbody>${sucessao.veiculos.map(function(ve, i) { const val = ve.valor ? (parseInt(ve.valor) / 100) : 0; return '<tr><td>Veículo ' + (i+1) + '</td><td>' + (ve.tipo||'—') + '</td><td class="right mono">' + fmtBRL(val) + '</td></tr>' }).join('')}</tbody></table></div>` : ''}
  <div class="nb" style="margin:14px 0 10px;">
    <div class="wf-row wf-normal"><span>Patrimônio bruto (sem previdência)</span><span class="wf-value">${fmtBRL((sucessao.totais.totalBruto || 0) - (sucessao.previdenciaNum || 0))}</span></div>
    ${(sucessao.previdenciaNum || 0) > 0 ? `<div class="wf-row wf-green"><span>(-) Previdência privada (não inventariável)</span><span class="wf-value" style="color:#15803d">- ${fmtBRL(sucessao.previdenciaNum)}</span></div>` : ''}
    <div class="wf-divider"></div>
    <div class="wf-row wf-gold"><span class="wf-total-label" style="color:#8a5c10">Patrimônio inventariável</span><span class="wf-value" style="color:#8a5c10">${fmtBRL(sucessao.totais.totalInventariavel || 0)}</span></div>
  </div>
  <div class="grid3 nb">
    <div class="card card-gold"><div class="card-label">Patrimônio inventariável</div><div class="card-value">${fmtBRLShort(sucessao.totais.totalInventariavel || 0)}</div></div>
    <div class="card card-red"><div class="card-label">Custos de inventário (15%)</div><div class="card-value">- ${fmtBRLShort(sucessao.totais.totalCustos || 0)}</div></div>
    <div class="card card-green"><div class="card-label">Patrimônio líquido transferido</div><div class="card-value">${fmtBRLShort(sucessao.totais.patrimonioLiquido || 0)}</div></div>
  </div>
  ${(sucessao.coberturaNum || 0) > 0 || (sucessao.previdenciaNum || 0) > 0 ? `
  <div class="nb" style="margin:12px 0 10px;">
    <div class="wf-row wf-normal"><span>Custos totais de inventário</span><span class="wf-value">${fmtBRL(sucessao.totais.totalCustos || 0)}</span></div>
    ${(sucessao.coberturaNum || 0) > 0 ? `<div class="wf-row wf-green"><span>(-) Seguro de vida contratado</span><span class="wf-value" style="color:#15803d">- ${fmtBRL(sucessao.coberturaNum)}</span></div>` : ''}
    ${(sucessao.previdenciaNum || 0) > 0 ? `<div class="wf-row wf-green"><span>(-) Previdência disponível para herdeiros</span><span class="wf-value" style="color:#15803d">- ${fmtBRL(sucessao.previdenciaNum)}</span></div>` : ''}
    <div class="wf-divider"></div>
    <div class="wf-row ${(sucessao.totais.gapCoberturaMorte || 0) > 0 ? 'wf-gold' : 'wf-green'}">
      <span class="wf-total-label" style="color:${(sucessao.totais.gapCoberturaMorte || 0) > 0 ? '#8a5c10' : '#15803d'}">${(sucessao.totais.gapCoberturaMorte || 0) > 0 ? 'Gap descoberto' : 'Custos totalmente cobertos'}</span>
      <span class="wf-value" style="color:${(sucessao.totais.gapCoberturaMorte || 0) > 0 ? '#8a5c10' : '#15803d'}">${fmtBRL(sucessao.totais.gapCoberturaMorte || 0)}</span>
    </div>
  </div>` : ''}
  <div class="nb"><table><thead><tr><th>Custo de Inventário</th><th class="right">Alíquota</th><th class="right">Valor</th></tr></thead><tbody>
    <tr><td><span class="dot dot-gold"></span>ITCMD</td><td class="right">8,0%</td><td class="right mono">${fmtBRL((sucessao.totais.totalInventariavel || 0) * 0.08)}</td></tr>
    <tr><td><span class="dot dot-blue"></span>Honorários Advocatícios</td><td class="right">4,0%</td><td class="right mono">${fmtBRL((sucessao.totais.totalInventariavel || 0) * 0.04)}</td></tr>
    <tr><td><span class="dot dot-green"></span>Custas Cartorárias</td><td class="right">3,0%</td><td class="right mono">${fmtBRL((sucessao.totais.totalInventariavel || 0) * 0.03)}</td></tr>
    <tr class="total-row"><td class="bold">Total</td><td class="right bold">15,0%</td><td class="right mono bold">${fmtBRL(sucessao.totais.totalCustos || 0)}</td></tr>
  </tbody></table></div>
  ` : '<div class="empty-note">Nenhum dado preenchido para este módulo.</div>'}
</div>

<div class="section">
  <div class="section-tag">Módulo 03</div>
  <div class="section-title">PGBL & Planejamento Tributário</div>
  ${pgbl ? `
  <div class="grid2 nb">
    <div class="card"><div class="card-label">Renda bruta anual</div><div class="card-value">${fmtBRL(pgbl.rendaAnual || 0)}</div></div>
    <div class="card"><div class="card-label">Alíquota marginal IR</div><div class="card-value">${((pgbl.aliquotaMarginal || 0) * 100).toFixed(1)}%</div></div>
    <div class="card card-gold"><div class="card-label">PGBL ideal (12% da renda)</div><div class="card-value">${fmtBRL(pgbl.pgblIdeal || 0)}/ano</div><div class="card-sub">${fmtBRL((pgbl.pgblIdeal || 0) / 12)}/mês</div></div>
    <div class="card card-green"><div class="card-label">Economia fiscal anual</div><div class="card-value">${fmtBRL(pgbl.economiaAnual || 0)}</div><div class="card-sub">${fmtBRL((pgbl.economiaAnual || 0) / 12)}/mês</div></div>
  </div>
  <div class="insight">Ao contribuir com <strong>${fmtBRL(pgbl.pgblIdeal || 0)}</strong>/ano no PGBL (12% da renda bruta), você deduz da base do IR. Com alíquota marginal de <strong>${((pgbl.aliquotaMarginal || 0) * 100).toFixed(1)}%</strong>, economia de <strong>${fmtBRL(pgbl.economiaAnual || 0)}/ano</strong>. Projeção com rentabilidade real de 4% a.a.</div>
  ${pgbl.projecao && pgbl.projecao.length > 0 ? `<div class="nb"><table>
    <thead><tr><th>Ano</th><th class="right">Aportado</th><th class="right">Patrimônio PGBL</th><th class="right">Restituições</th><th class="right">Total</th></tr></thead>
    <tbody>${pgbl.projecao.filter(function(row) { const len = pgbl.projecao.length; if (len <= 15) return true; return [1,2,3,5,7,10,15,20,25,30].includes(row.ano) }).map(function(row, idx, arr) { const isLast = idx === arr.length - 1; return '<tr class="' + (isLast ? 'highlight' : '') + '"><td class="bold">' + row.ano + '</td><td class="right mono">' + fmtBRL(row.aportado) + '</td><td class="right mono">' + fmtBRL(row.patrimonioPGBL) + '</td><td class="right mono">' + fmtBRL(row.restituicoes) + '</td><td class="right mono bold">' + fmtBRL(row.total) + '</td></tr>' }).join('')}</tbody>
  </table></div>` : ''}
  ` : '<div class="empty-note">Nenhum dado preenchido para este módulo.</div>'}
</div>

<div class="footer">
  <div class="footer-text">Relatório gerado em ${fmtDate()} · Projeções com caráter ilustrativo · 4% a.a. real</div>
  <div class="footer-logo"><img src="${logoL}" alt="Big Invest"/></div>
</div>

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
