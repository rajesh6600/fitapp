// Progress API removed. Redirect users to /api/todo instead.
export default function handler(_req: any, res: any) {
  res.status(410).json({ message: 'Progress API removed. Use /api/todo instead.' })
}