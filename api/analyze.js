export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured' })
  }

  try {
    const { messages, max_tokens } = req.body

    // Pega só o texto (Groq não suporta imagem/PDF binário)
    const textMessages = messages.map(function(msg) {
      if (typeof msg.content === 'string') {
        return { role: msg.role, content: msg.content }
      }
      const textParts = msg.content
        .filter(function(b) { return b.type === 'text' })
        .map(function(b) { return b.text })
        .join('\n')
      return { role: msg.role, content: textParts }
    })

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: max_tokens || 2000,
        messages: textMessages,
      })
    })

    const data = await response.json()
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error))

    const text = data.choices?.[0]?.message?.content || ''
    return res.status(200).json({ content: [{ type: 'text', text }] })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
