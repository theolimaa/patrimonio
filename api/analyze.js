export const config = {
  api: { bodyParser: { sizeLimit: '30mb' } },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' })
  }

  try {
    const { messages, max_tokens, pdf_base64 } = req.body

    const parts = []

    if (pdf_base64) {
      parts.push({ inline_data: { mime_type: 'application/pdf', data: pdf_base64 } })
    }

    if (messages && messages.length > 0) {
      for (const msg of messages) {
        if (typeof msg.content === 'string') {
          parts.push({ text: msg.content })
        } else if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === 'text') parts.push({ text: block.text })
          }
        }
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            maxOutputTokens: max_tokens || 2000,
            temperature: 0.1,
            // Desativa thinking para respostas mais rápidas e simples
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    )

    // Lê resposta como texto primeiro para evitar erro de JSON inválido
    const rawText = await response.text()

    let data
    try {
      data = JSON.parse(rawText)
    } catch (e) {
      return res.status(500).json({ error: 'Resposta inválida da API Gemini: ' + rawText.slice(0, 200) })
    }

    if (data.error) {
      return res.status(400).json({ error: data.error.message || JSON.stringify(data.error) })
    }

    // Gemini 2.5 pode retornar múltiplos parts (thinking + resposta)
    // Pega só as parts de texto que não são thinking
    const parts_out = data.candidates?.[0]?.content?.parts || []
    const text = parts_out
      .filter(p => p.text && !p.thought)
      .map(p => p.text)
      .join('')

    return res.status(200).json({ content: [{ type: 'text', text }] })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
