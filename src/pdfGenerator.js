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
  body{
    font-family:'DM Sans',sans-serif;
    background:#fff;
    color:#1a2744;
    font-size:13px;
    line-height:1.6;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }

  @page { margin: 14mm 15mm; size: A4 portrait; }

  /* ── CAPA ── */
  .cover{
    background:#1a2744;
    color:#fff;
    margin: -14mm -15mm 0 -15mm;
    padding: 0;
    page-break-after: always;
    break-after: page;
    position: relative;
    overflow: hidden;
    min-height: 260mm;
    display: flex;
    flex-direction: column;
  }

  /* Padrão geométrico de fundo — círculos e linhas decorativas */
  .cover-bg{
    position:absolute;
    inset:0;
    overflow:hidden;
    pointer-events:none;
  }
  .cover-bg svg{
    position:absolute;
    top:0; right:0;
    width:320px;
    opacity:0.07;
  }
  .cover-accent-line{
    position:absolute;
    bottom:0; left:0; right:0;
    height:4px;
    background:linear-gradient(90deg,#c9a84c,#e2c97e,transparent);
  }

  /* Conteúdo principal da capa */
  .cover-main{
    position:relative;
    z-index:1;
    padding: 22mm 20mm 10mm;
    flex:1;
    display:flex;
    flex-direction:column;
  }

  .cover-tag{
    font-family:'Montserrat',sans-serif;
    font-size:9px;
    letter-spacing:0.22em;
    text-transform:uppercase;
    color:#c9a84c;
    font-weight:700;
    margin-bottom:14px;
    display:flex;
    align-items:center;
    gap:8px;
  }
  .cover-tag::before{
    content:'';
    display:inline-block;
    width:20px;
    height:2px;
    background:#c9a84c;
  }

  .cover-title{
    font-family:'Montserrat',sans-serif;
    font-size:38px;
    font-weight:800;
    color:#fff;
    line-height:1.1;
    margin-bottom:6px;
    letter-spacing:-0.5px;
  }
  .cover-title span{
    color:#c9a84c;
  }

  .cover-subtitle{
    font-family:'Montserrat',sans-serif;
    font-size:13px;
    font-weight:300;
    color:rgba(255,255,255,0.45);
    letter-spacing:0.08em;
    text-transform:uppercase;
    margin-bottom:0;
  }

  .cover-divider{
    width:48px;
    height:3px;
    background:linear-gradient(90deg,#c9a84c,transparent);
    margin:20px 0;
  }

  .cover-client-block{
    margin-top:auto;
    padding-top:20px;
  }
  .cover-hello{
    font-family:'Montserrat',sans-serif;
    font-size:20px;
    color:#fff;
    font-weight:300;
    margin-bottom:6px;
    line-height:1.3;
  }
  .cover-hello strong{
    color:#e2c97e;
    font-weight:800;
    display:block;
    font-size:26px;
  }
  .cover-advisor{
    font-size:12px;
    color:rgba(255,255,255,0.4);
    margin-top:8px;
    font-style:italic;
  }
  .cover-date{
    font-size:11px;
    color:rgba(255,255,255,0.25);
    margin-top:4px;
    font-family:'IBM Plex Mono',monospace;
  }

  /* Cards dos módulos na capa */
  .cover-modules{
    position:relative;
    z-index:1;
    display:grid;
    grid-template-columns:1fr 1fr 1fr;
    gap:0;
    border-top:1px solid rgba(255,255,255,0.08);
    margin-top:24px;
  }
  .cover-module{
    padding:16px 18px;
    border-right:1px solid rgba(255,255,255,0.08);
  }
  .cover-module:last-child{
    border-right:none;
  }
  .cover-module-icon{
    font-size:18px;
    margin-bottom:8px;
    display:block;
  }
  .cover-module-title{
    font-family:'Montserrat',sans-serif;
    font-size:10px;
    font-weight:700;
    color:#c9a84c;
    text-transform:uppercase;
    letter-spacing:0.1em;
    margin-bottom:5px;
  }
  .cover-module-desc{
    font-size:11px;
    color:rgba(255,255,255,0.45);
    line-height:1.6;
    font-weight:400;
  }

  /* ── Seções ── */
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
  .footer{margin-top:24px;padding-top:12px;border-top:1px solid #e0e8f0;font-size:10px;color:#8aa0b8;text-align:center;}
</style>
</head>
<body>

<!-- ═══════════ CAPA ═══════════ -->
<div class="cover">

  <!-- Padrão geométrico decorativo -->
  <div class="cover-bg">
    <svg viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Círculos concêntricos -->
      <circle cx="340" cy="80" r="220" stroke="white" stroke-width="1"/>
      <circle cx="340" cy="80" r="170" stroke="white" stroke-width="0.8"/>
      <circle cx="340" cy="80" r="120" stroke="white" stroke-width="0.6"/>
      <circle cx="340" cy="80" r="70" stroke="white" stroke-width="0.5"/>
      <!-- Linhas diagonais -->
      <line x1="0" y1="200" x2="400" y2="0" stroke="white" stroke-width="0.5"/>
      <line x1="0" y1="280" x2="400" y2="80" stroke="white" stroke-width="0.5"/>
      <line x1="0" y1="360" x2="400" y2="160" stroke="white" stroke-width="0.5"/>
      <!-- Grid de pontos -->
      <circle cx="20" cy="420" r="2" fill="white"/>
      <circle cx="60" cy="420" r="2" fill="white"/>
      <circle cx="100" cy="420" r="2" fill="white"/>
      <circle cx="140" cy="420" r="2" fill="white"/>
      <circle cx="20" cy="460" r="2" fill="white"/>
      <circle cx="60" cy="460" r="2" fill="white"/>
      <circle cx="100" cy="460" r="2" fill="white"/>
      <circle cx="140" cy="460" r="2" fill="white"/>
      <circle cx="20" cy="500" r="2" fill="white"/>
      <circle cx="60" cy="500" r="2" fill="white"/>
      <circle cx="100" cy="500" r="2" fill="white"/>
      <circle cx="140" cy="500" r="2" fill="white"/>
    </svg>
    <div class="cover-accent-line"></div>
  </div>

  <!-- Conteúdo principal -->
  <div class="cover-main">
    <div class="cover-tag">Planejamento Patrimonial</div>

    <div class="cover-title">
      Relatório<br/>
      Financeiro<br/>
      <span>Patrimonial</span>
    </div>

    <div class="cover-divider"></div>

    <div class="cover-client-block">
      ${info.clientName ? `
      <div class="cover-hello">
        Olá,
        <strong>${info.clientName}</strong>
      </div>` : `
      <div class="cover-hello" style="color:rgba(255,255,255,0.3);font-size:14px;">
        Relatório de Planejamento Financeiro
      </div>`}
      ${info.advisorName ? `<div class="cover-advisor">Assessor responsável: ${info.advisorName}</div>` : ''}
      <div class="cover-date">${fmtDate()}</div>
    </div>
  </div>

  <!-- Cards dos módulos -->
  <div class="cover-modules">
    <div class="cover-module">
      <span class="cover-module-icon">🛡️</span>
      <div class="cover-module-title">Gestão de Riscos</div>
      <div class="cover-module-desc">Análise do gap patrimonial e cobertura de invalidez necessária para proteger sua família.</div>
    </div>
    <div class="cover-module">
      <span class="cover-module-icon">🏛️</span>
      <div class="cover-module-title">Sucessão</div>
      <div class="cover-module-desc">Consolidação do patrimônio inventariável e estimativa dos custos de inventário por regime matrimonial.</div>
    </div>
    <div class="cover-module">
      <span class="cover-module-icon">📊</span>
      <div class="cover-module-title">Tributário</div>
      <div class="cover-module-desc">Benefício fiscal do PGBL, economia no IR e projeção patrimonial com rentabilidade real de 4% a.a.</div>
    </div>
  </div>

</div>
<!-- ═══════════ FIM CAPA ═══════════ -->

<!-- RISCOS -->
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
    <div class="${(riscos.gapDescoberto || 0) > 0 ? 'card card-gold' : 'card card-green'}">
      <div class="card-label">Gap descoberto</div>
      <div class="card-value">${fmtBRLShort(riscos.gapDescoberto || 0)}</div>
      <div class="card-sub">${(riscos.gapDescoberto || 0) > 0 ? 'Cobertura adicional necessária' : 'Cobertura suficiente ✓'}</div>
    </div>
  </div>

  <div class="nb" style="margin-bottom:12px;">
    <div class="wf-row wf-normal">
      <span>Cobertura necessária (gap patrimonial)</span>
      <span class="wf-value">${fmtBRL(riscos.coberturaNecessaria || 0)}</span>
    </div>
    ${(riscos.coberturaContratada || 0) > 0 ? `
    <div class="wf-row wf-green">
      <span>(-) Cobertura já contratada</span>
      <span class="wf-value" style="color:#15803d">- ${fmtBRL(riscos.coberturaContratada)}</span>
    </div>` : ''}
    <div class="wf-divider"></div>
    <div class="wf-row ${(riscos.gapDescoberto || 0) > 0 ? 'wf-gold' : 'wf-green'}">
      <span class="wf-total-label" style="color:${(riscos.gapDescoberto || 0) > 0 ? '#8a5c10' : '#15803d'}">
        ${(riscos.gapDescoberto || 0) > 0 ? 'Gap descoberto' : '✓ Cobertura suficiente'}
      </span>
      <span class="wf-value" style="color:${(riscos.gapDescoberto || 0) > 0 ? '#8a5c10' : '#15803d'}">${fmtBRL(riscos.gapDescoberto || 0)}</span>
    </div>
  </div>

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

  ${(riscos.gapDescoberto || 0) > 0 ? `
  <div class="insight">
    💡 ${(riscos.coberturaContratada || 0) > 0
      ? `Considerando a cobertura já contratada de <strong>${fmtBRL(riscos.coberturaContratada)}</strong>, ainda há um gap descoberto de <strong>${fmtBRL(riscos.gapDescoberto)}</strong> a ser coberto com seguro adicional de invalidez ou vida.`
      : `Para garantir que sua família mantenha o padrão de vida em caso de invalidez, recomenda-se uma cobertura de <strong>${fmtBRL(riscos.coberturaNecessaria || 0)}</strong>, correspondente ao gap entre o patrimônio atual e a meta de aposentadoria.`
    }
  </div>` : ''}
  ` : '<div class="empty-note">Nenhum dado preenchido para este módulo.</div>'}
</div>

<!-- SUCESSÃO -->
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

  <div class="nb" style="margin:14px 0 10px;">
    <div style="font-family:'Montserrat',sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6a8090;font-weight:700;margin-bottom:8px;">Composição do patrimônio</div>
    <div class="wf-row wf-normal">
      <span>Patrimônio bruto (sem previdência)</span>
      <span class="wf-value">${fmtBRL((sucessao.totais.totalBruto || 0) - (sucessao.previdenciaNum || 0))}</span>
    </div>
    ${(sucessao.previdenciaNum || 0) > 0 ? `
    <div class="wf-row wf-green">
      <span>(-) Previdência privada (não inventariável)</span>
      <span class="wf-value" style="color:#15803d">- ${fmtBRL(sucessao.previdenciaNum)}</span>
    </div>` : ''}
    <div class="wf-divider"></div>
    <div class="wf-row wf-gold">
      <span class="wf-total-label" style="color:#8a5c10">Patrimônio inventariável</span>
      <span class="wf-value" style="color:#8a5c10">${fmtBRL(sucessao.totais.totalInventariavel || 0)}</span>
    </div>
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

  ${(sucessao.coberturaNum || 0) > 0 || (sucessao.previdenciaNum || 0) > 0 ? `
  <div class="nb" style="margin:12px 0 10px;">
    <div style="font-family:'Montserrat',sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6a8090;font-weight:700;margin-bottom:8px;">Cobertura dos custos de inventário</div>
    <div class="wf-row wf-normal">
      <span>Custos totais de inventário</span>
      <span class="wf-value">${fmtBRL(sucessao.totais.totalCustos || 0)}</span>
    </div>
    ${(sucessao.coberturaNum || 0) > 0 ? `
    <div class="wf-row wf-green">
      <span>(-) Seguro de vida contratado</span>
      <span class="wf-value" style="color:#15803d">- ${fmtBRL(sucessao.coberturaNum)}</span>
    </div>` : ''}
    ${(sucessao.previdenciaNum || 0) > 0 ? `
    <div class="wf-row wf-green">
      <span>(-) Previdência disponível para herdeiros</span>
      <span class="wf-value" style="color:#15803d">- ${fmtBRL(sucessao.previdenciaNum)}</span>
    </div>` : ''}
    <div class="wf-divider"></div>
    <div class="wf-row ${(sucessao.totais.gapCoberturaMorte || 0) > 0 ? 'wf-gold' : 'wf-green'}">
      <span class="wf-total-label" style="color:${(sucessao.totais.gapCoberturaMorte || 0) > 0 ? '#8a5c10' : '#15803d'}">
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

<!-- PGBL -->
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

<script>window.onload = function() { window.print() }</script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
