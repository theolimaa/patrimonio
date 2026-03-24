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
  <div class="section-title">🛡️ Gestã
