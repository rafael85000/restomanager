import { NextResponse } from 'next/server'
export const maxDuration = 300 // 5 minutes
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
  signal: AbortSignal.timeout(120000), // 2 minutes
  headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
model: 'claude-sonnet-4-6',
max_tokens: 64000,
        messages
      })
    })

    const data = await response.json()
    console.log('Status:', response.status)

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: 500 })
    }

// Extraire le JSON même s'il y a du texte autour
const text = data.content[0].text
console.log('Réponse brute Claude:', text)
const jsonMatch = text.match(/\{[\s\S]*\}/)
const content = jsonMatch ? jsonMatch[0] : text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    return NextResponse.json({ content })

  } catch (error) {
    console.error('Erreur route claude-mapping:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}