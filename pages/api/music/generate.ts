
import type { NextApiRequest, NextApiResponse } from 'next';

const BASE_URL = 'https://api.sonauto.ai/v1'

async function createGeneration(prompt: string, apiKey: string, opts?: { instrumental?: boolean; num_songs?: number; output_format?: string; output_bit_rate?: number | null; seed?: number | null }) {
  const response = await fetch(`${BASE_URL}/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: prompt || '',
      instrumental: opts?.instrumental ?? false,
      num_songs: opts?.num_songs ?? 1,
      output_format: opts?.output_format ?? 'mp3',
      output_bit_rate: opts?.output_bit_rate ?? 192,
      prompt_strength: 2.3,
      balance_strength: 0.7,
    })
  })
  if (!response.ok) {
    const errText = await response.text().catch(()=>'')
    throw new Error(`Create generation failed: ${response.status} ${errText}`)
  }
  const json = await response.json()
  return json as { task_id: string }
}

async function getGeneration(taskId: string, apiKey: string) {
  const response = await fetch(`${BASE_URL}/generations/${taskId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  if (!response.ok) {
    const errText = await response.text().catch(()=>'')
    throw new Error(`Get generation failed: ${response.status} ${errText}`)
  }
  return await response.json() as {
    id: string
    status: string
    song_paths?: string[]
    error_message?: string | null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt = '', duration } = req.body;

    // Check if API key exists
    const apiKey = process.env.MUSICAPI;

    if (!apiKey) {
      return res.status(200).json({
        url: '/api/music/mock-audio.mp3',
        mock: true,
      });
    }

    // Create generation task
    const { task_id } = await createGeneration(String(prompt).trim(), apiKey, {
      instrumental: false,
      num_songs: 1,
      output_format: 'mp3',
      output_bit_rate: 192,
    })

    // Poll status up to ~90s (15 * 6s)
    const maxAttempts = 15
    let attempt = 0
    let last: any = null

    while (attempt < maxAttempts) {
      // wait between polls except first
      if (attempt > 0) await new Promise(r => setTimeout(r, 6000))
      last = await getGeneration(task_id, apiKey)
      if (last.status === 'SUCCESS' && Array.isArray(last.song_paths) && last.song_paths.length > 0) {
        return res.status(200).json({ url: last.song_paths[0], mock: false })
      }
      if (last.status === 'FAILURE') {
        throw new Error(last.error_message || 'Generation failed')
      }
      attempt++
    }

    // Timed out
    return res.status(200).json({ url: '/api/music/mock-audio.mp3', mock: true })

  } catch (err: any) {
    console.error('Music generation error:', err);
    return res.status(200).json({ url: '/api/music/mock-audio.mp3', mock: true });
  }
}
