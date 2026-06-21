import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { prompt, pdf_base64 } = await request.json()

    // Si PDF : on envoie le document + le prompt à Claude
    const messages = pdf_base64
      ? [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: pdf_base64 }
            },
            { type: 'text', text: prompt }
          ]
        }]
      : [{ role: 'user', content: prompt }]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages
      })
    })

    const data = await response.json()
    console.log('Status:', response.status)

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: 500 })
    }

    const content = data.content[0].text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    return NextResponse.json({ content })

  } catch (error) {
    console.error('Erreur route claude-mapping:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}