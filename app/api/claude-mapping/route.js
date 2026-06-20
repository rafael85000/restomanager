import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { prompt } = await request.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    
    // Affiche tout pour déboguer
    console.log('Status:', response.status)
    console.log('Réponse Claude:', JSON.stringify(data))

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: 500 })
    }

    const content = data.content[0].text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return NextResponse.json({ content })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}