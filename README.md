# Planejamento Financeiro — Sistema de Assessment Patrimonial

Sistema de três módulos para planejamento financeiro pessoal.

## Módulos

1. **Gestão de Riscos** — Calcula a cobertura de invalidez necessária com base no gap entre patrimônio atual e meta de aposentadoria.
2. **Sucessão** — Consolida patrimônio (imóveis, financeiro, veículos), considera regime matrimonial e calcula os custos de inventário com gráfico de pizza.
3. **PGBL Tributário** — Análise de benefício fiscal, projeção patrimonial com 4% real a.a. e upload de holerites/IR para análise automática por IA.

---

## Deploy na Vercel

### 1. Instalar Vercel CLI (opcional)
```bash
npm install -g vercel
```

### 2. Configurar API key da Anthropic

No painel da Vercel → Settings → Environment Variables, adicione:

```
ANTHROPIC_API_KEY = sk-ant-...
```

### 3. Deploy

**Via GitHub (recomendado):**
1. Suba o projeto no GitHub
2. Acesse [vercel.com](https://vercel.com) → New Project → importe o repo
3. Adicione a env var `ANTHROPIC_API_KEY`
4. Deploy!

**Via CLI:**
```bash
npm install
vercel
```

---

## Desenvolvimento local

```bash
npm install
```

Crie um arquivo `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Para dev com Vercel Functions localmente:
```bash
npm install -g vercel
vercel dev
```

Ou sem functions (apenas frontend):
```bash
npm run dev
```

---

## Observações técnicas

- O upload de documentos usa a API da Anthropic via serverless function (`/api/analyze.js`).
- Limite de tamanho: 20MB por requisição (configurado no handler).
- A projeção patrimonial usa 4% real a.a. sem projeção de inflação.
- ITCMD considerado a 8% (varia por estado; ajuste em `src/utils.js` se necessário).
- Tabela do IR 2024 configurada em `src/utils.js`.
