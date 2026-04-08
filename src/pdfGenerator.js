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
  .cover-logo img{height:36px;object-fit:contain;}
  .cover-eyebrow{display:flex;align-items:center;gap:10px;margin-bottom:20px;}
  .cover-eyebrow-line{width:22px;height:2px;background:#c9a84c;flex-shrink:0;}
  .cover-eyebrow-text{font-family:'Montserrat',sans-serif;font-size:8.5px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a84c;font-weight:700;}
  .cover-title{font-family:'Montserrat',sans-serif;font-size:52px;font-weight:800;color:#fff;line-height:1.05;letter-spacing:-0.5px;}
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
  .module{page-break-before:always;break-before:page;padding-top:6mm;}
  .module:first-child{page-break-before:avoid;break-before:avoid;padding-top:0;}
  .section{margin-bottom:22px;padding-bottom:8px;border-bottom:1.5px solid #e8edf5;page-break-inside:avoid;break-inside:avoid;}
  .section:last-of-type{border-bottom:none;}
  .section-tag{font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#c9a84c;font-weight:700;margin-bottom:5px;}
  .section-title{font-family:'Montserrat',sans-serif;font-size:17px;font-weight:800;color:#1a2744;margin-bottom:8px;}
  .section-desc{font-size:12px;color:#5a7a9a;line-height:1.6;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #e8edf5;}
  .obs-box{background:#fffbf0;border:1px solid #e8d070;border-radius:9px;padding:14px 16px;margin:14px 0;font-size:12px;color:#4a3a10;line-height:1.8;}
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
      <div class="cover-logo"><img src="data:image/png;base64,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" alt="Big Invest"/></div>
    </div>

    <div class="cover-eyebrow">
      <div class="cover-eyebrow-line"></div>
      <div class="cover-eyebrow-text">Planejamento Patrimonial</div>
    </div>

    <div class="cover-title">
      Relatório<br/>
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

<div class="module">
<div class="section">
  <div class="section-tag">Módulo 01</div>
  <div class="section-title">Gestão de Riscos</div>
  <div class="section-desc">O planejamento de gestão de riscos tem como objetivo proteger o patrimônio e a renda do investidor durante a sua vida ativa. Analisamos o gap entre o patrimônio atual e a meta de aposentadoria, identificando a necessidade de cobertura por invalidez ou morte prematura para garantir a segurança financeira da família.</div>
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
  ${riscos.observacaoRiscos ? `<div class="obs-box"><strong>Observações do Assessor:</strong><br/><br/>${riscos.observacaoRiscos.replace(/\n/g, '<br/>')}</div>` : ''}
  ` : '<div class="empty-note">Nenhum dado preenchido para este módulo.</div>'}
</div>
</div>

<div class="module">
<div class="section">
  <div class="section-tag">Módulo 02</div>
  <div class="section-title">Planejamento Sucessório</div>
  <div class="section-desc">O planejamento sucessório visa organizar a transferência do patrimônio aos herdeiros da forma mais eficiente possível, minimizando os custos de inventário e garantindo que os bens cheguem ao destino certo. Consolidamos o patrimônio inventariável com base no regime matrimonial e estimamos os custos totais do processo sucessório.</div>
  ${sucessao ? `
  <div class="nb"><table style="margin-bottom:12px;"><tr><th>Regime matrimonial</th><td>${REGIMES[sucessao.regimeCasamento] || '—'}</td></tr></table></div>
  ${sucessao.imoveis && sucessao.imoveis.some(function(im) { return im.valor }) ? `<div class="nb"><table><thead><tr><th>Imóvel</th><th>Tipo</th>${sucessao.regimeCasamento === 'comunhao_parcial' ? '<th>Aquisição</th>' : ''}<th class="right">Valor</th><th class="right">Inventariável</th></tr></thead><tbody>${sucessao.imoveis.map(function(im, i) { const val = im.valor ? (parseInt(im.valor) / 100) : 0; const frac = sucessao.regimeCasamento === 'separacao_total' ? 1 : (sucessao.regimeCasamento === 'comunhao_universal' ? 0.5 : (im.antesCasamento ? 1 : 0.5)); return '<tr><td>Imóvel ' + (i+1) + '</td><td>' + (im.tipo||'—') + '</td>' + (sucessao.regimeCasamento === 'comunhao_parcial' ? '<td>' + (im.antesCasamento ? 'Antes' : 'Depois') + ' do casamento</td>' : '') + '<td class="right mono">' + fmtBRL(val) + '</td><td class="right mono">' + fmtBRL(val * frac) + '</td></tr>' }).join('')}</tbody></table></div>` : ''}
  ${sucessao.veiculos && sucessao.veiculos.some(function(ve) { return ve.valor }) ? `<div class="nb"><table><thead><tr><th>Veículo</th><th>Tipo</th>${sucessao.regimeCasamento === 'comunhao_parcial' ? '<th>Aquisição</th>' : ''}<th class="right">Valor</th><th class="right">Inventariável</th></tr></thead><tbody>${sucessao.veiculos.map(function(ve, i) { const val = ve.valor ? (parseInt(ve.valor) / 100) : 0; const frac = sucessao.regimeCasamento === 'separacao_total' ? 1 : sucessao.regimeCasamento === 'comunhao_universal' ? 0.5 : (ve.antesCasamento ? 1 : 0.5); return '<tr><td>Veículo ' + (i+1) + '</td><td>' + (ve.tipo||'—') + '</td>' + (sucessao.regimeCasamento === 'comunhao_parcial' ? '<td>' + (ve.antesCasamento ? 'Antes' : 'Depois') + ' do casamento</td>' : '') + '<td class="right mono">' + fmtBRL(val) + '</td><td class="right mono">' + fmtBRL(val * frac) + '</td></tr>' }).join('')}</tbody></table></div>` : ''}
  ${(sucessao.patrimonioFinanceiro || 0) > 0 ? `<div class="nb"><table><thead><tr><th>Patrimônio Financeiro</th><th class="right">Valor total</th><th class="right">Inventariável</th></tr></thead><tbody>${(sucessao.previdenciaNum || 0) > 0 ? '<tr><td>Previdência privada (PGBL/VGBL)</td><td class="right mono">' + fmtBRL(sucessao.previdenciaNum) + '</td><td class="right mono" style="color:#15803d">Isento</td></tr>' : ''}<tr><td>Investimentos e aplicações <span style="font-size:10px;color:#8aa0b8;">(excl. previdência${sucessao.regimeCasamento !== 'separacao_total' ? ' · meação ' + (sucessao.regimeCasamento === 'comunhao_universal' ? '50%' : '50%') : ''})</span></td><td class="right mono">${fmtBRL((sucessao.patrimonioFinanceiro || 0) - (sucessao.previdenciaNum || 0))}</td><td class="right mono">${fmtBRL(((sucessao.patrimonioFinanceiro || 0) - (sucessao.previdenciaNum || 0)) * (sucessao.regimeCasamento === 'separacao_total' ? 1 : 0.5))}</td></tr></tbody></table></div>` : ''}
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
  ${sucessao.observacaoSucessao ? `<div class="obs-box"><strong>Observações do Assessor:</strong><br/><br/>${sucessao.observacaoSucessao.replace(/\n/g, '<br/>')}</div>` : ''}
  ` : '<div class="empty-note">Nenhum dado preenchido para este módulo.</div>'}
</div>
</div>

<div class="module">
<div class="section">
  <div class="section-tag">Módulo 03</div>
  <div class="section-title">Planejamento Tributário</div>
  <div class="section-desc">O objetivo do planejamento tributário é fazer o investidor pagar menos imposto de formas totalmente legais, seja através de estratégias de renda ou de investimento. O PGBL é uma das principais ferramentas disponíveis, permitindo deduzir até 12% da renda bruta tributável e gerar economia real no Imposto de Renda, com o capital continuando a crescer dentro do plano.</div>
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
  ${pgbl.observacaoTributaria ? `<div class="obs-box"><strong>Observações do Planejamento Tributário:</strong><br/><br/>${pgbl.observacaoTributaria.replace(/\n/g, '<br/>')}</div>` : ''}
  ` : '<div class="empty-note">Nenhum dado preenchido para este módulo.</div>'}
</div>
</div>

<div class="footer">
  <div class="footer-text">Relatório gerado em ${fmtDate()} · Projeções com caráter ilustrativo · 4% a.a. real</div>
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
