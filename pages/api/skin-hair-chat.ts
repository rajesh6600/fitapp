import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.CAREAI
  if (!apiKey) throw new Error('Missing CAREAI API key')

  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
  const res = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      generationConfig: { response_mime_type: 'text/plain' },
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ]
    })
  })

  const data = await res.json()
  if (!res.ok) {
    const msg = data?.error?.message || 'Gemini request failed'
    throw new Error(msg)
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { message, conversation } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const apiKey = process.env.CAREAI
    if (!apiKey) {
      return res.status(500).json({ error: 'CAREAI API key not configured' })
    }

    const system = `You are a helpful dermatologist and trichologist. Give concise, evidence-based, safe guidance for skin and hair care. Prefer practical routines, ingredients, nutrition and lifestyle tips. Avoid diagnosis; suggest seeing a professional for severe cases.`
    const convo = Array.isArray(conversation) ? conversation : []
    const history = convo
      .slice(-6)
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n')

    const prompt = `${system}\n\nRecent conversation:\n${history}\n\nUser: ${message}\n\nRespond clearly with short paragraphs and bullet points where helpful.`

    let reply = ''
    try {
      reply = await callGemini(prompt)
    } catch (e: any) {
      console.error('Gemini chat error:', e)
      return res.status(200).json({
        message: "I'm having trouble reaching the AI right now. Please try again shortly.",
        suggestions: []
      })
    }

    // Basic cleanup to avoid markdown bullets and headers
    const cleaned = reply
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/^\*\s*/gm, '• ')
      .replace(/^\-\s*/gm, '• ')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')

    return res.status(200).json({ message: cleaned.trim(), suggestions: [] })

  } catch (error) {
    console.error('Skin hair chat API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
