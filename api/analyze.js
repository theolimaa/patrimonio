export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
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
    const { messages, max_tokens } = req.body

    // Converte formato Anthropic → Gemini
    const contents = messages.map(function(msg) {
      if (typeof msg.content === 'string') {
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }
      }

      const parts = msg.content.map(function(block) {
        if (block.type === 'text') {
          return { text: block.text }
        }
        if (block.type === 'image') {
          return { inline_data: { mime_type: block.source.media_type, data: block.source.data } }
        }
        if (block.type === 'document') {
          return { inline_data: { mime_type: 'application/pdf', data: block.source.data } }
        }
        return null
      }).filter(Boolean)

      return { role: 'user', parts }
    })

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: max_tokens || 2000,
            temperature: 0.3,
          }
        })
      }
    )

    const data = await response.json()

    if (data.error) {
      return res.status(400).json({ error: data.error.message || JSON.stringify(data.error) })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Retorna no formato Anthropic para o frontend não precisar mudar
    return res.status(200).json({
      content: [{ type: 'text', text }]
    })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
