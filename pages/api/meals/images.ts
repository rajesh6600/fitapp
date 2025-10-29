// Image fetching has been disabled per product decision.
export default function handler(_req: any, res: any) {
  if (_req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  return res.status(200).json({ image: null })
}
