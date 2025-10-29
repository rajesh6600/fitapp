import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import prisma from '@/lib/prisma'
import { todoSchema } from '@/lib/validations'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const userId = session.user.id

    switch (req.method) {
      case 'GET': {
        const { completed, limit = '200' } = req.query

        // Ensure today's instances exist for DAILY templates
        const templates = await prisma.todo.findMany({
          where: { userId, isTemplate: true, recurrence: 'DAILY' },
        })
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
        for (const tpl of templates) {
          const exists = await prisma.todo.findFirst({
            where: {
              userId,
              isTemplate: false,
              templateId: tpl.id,
              dueAt: { gte: startOfDay, lte: endOfDay },
            },
          })
          if (!exists) {
            // Build today's dueAt from template timeOfDay
            const [hh, mm] = (tpl.timeOfDay || '09:00').split(':').map((v) => parseInt(v))
            const dueAt = new Date(startOfDay)
            dueAt.setHours(hh || 9, mm || 0, 0, 0)
            await prisma.todo.create({
              data: {
                userId,
                title: tpl.title,
                notes: tpl.notes,
                dueAt,
                tags: tpl.tags,
                templateId: tpl.id,
                isTemplate: false,
                recurrence: 'NONE',
              },
            })
          }
        }

        const where: any = { userId, isTemplate: false }
        if (typeof completed === 'string') where.completed = completed === 'true'
        const todos = await prisma.todo.findMany({ where, take: parseInt(String(limit)) })
        // Sort by time only
        todos.sort((a: any, b: any) => {
          const da = (a.dueAt ? new Date(a.dueAt).getTime() : Infinity) - (b.dueAt ? new Date(b.dueAt).getTime() : Infinity)
          return da
        })
        return res.status(200).json({ todos })
      }
      case 'POST': {
        const parsed = todoSchema.safeParse(req.body)
        if (!parsed.success) {
          return res.status(400).json({ error: 'Invalid input', details: parsed.error })
        }
        const isTemplate = parsed.data.recurrence === 'DAILY' || req.body.isTemplate === true
        let todo
        if (isTemplate) {
          // Expect time in parsed.data.dueDate or separate time; use dueDate's time
          const base = parsed.data.dueDate ? new Date(parsed.data.dueDate) : new Date()
          const hh = String(base.getHours()).padStart(2, '0')
          const mm = String(base.getMinutes()).padStart(2, '0')
          todo = await prisma.todo.create({
            data: {
              userId,
              title: parsed.data.title,
              notes: parsed.data.notes,
              timeOfDay: `${hh}:${mm}`,
              recurrence: 'DAILY',
              isTemplate: true,
              tags: parsed.data.tags || [],
            },
          })
        } else {
          // For one-off todos, use time only (default to current time)
          const now = new Date()
          const timeStr = parsed.data.timeOfDay || now.toTimeString().slice(0,5)
          const [hh, mm] = timeStr.split(':').map(v => parseInt(v))
          const dueAt = new Date()
          dueAt.setHours(hh || now.getHours(), mm || now.getMinutes(), 0, 0)
          
          todo = await prisma.todo.create({
            data: {
              userId,
              title: parsed.data.title,
              notes: parsed.data.notes,
              dueAt,
              timeOfDay: timeStr,
              recurrence: 'NONE',
              isTemplate: false,
              tags: parsed.data.tags || [],
              completed: parsed.data.completed ?? false,
            },
          })
        }
        return res.status(201).json({ todo })
      }
      case 'PUT': {
        const { id, ...rest } = req.body || {}
        console.log('PUT request - ID:', id, 'Body:', rest)
        if (!id) return res.status(400).json({ error: 'id is required' })
        const updates: any = {}
        if (typeof rest.title === 'string') updates.title = rest.title
        if (typeof rest.notes === 'string' || rest.notes === null) updates.notes = rest.notes
        if (Array.isArray(rest.tags)) updates.tags = rest.tags
        if (typeof rest.completed === 'boolean') updates.completed = rest.completed
        if (typeof rest.timeOfDay === 'string') {
          updates.timeOfDay = rest.timeOfDay
          // Update dueAt based on timeOfDay
          const [hh, mm] = rest.timeOfDay.split(':').map((v: string) => parseInt(v))
          const dueAt = new Date()
          dueAt.setHours(hh || 0, mm || 0, 0, 0)
          updates.dueAt = dueAt
        }
        if (typeof rest.recurrence === 'string') updates.recurrence = rest.recurrence
        if (typeof rest.isTemplate === 'boolean') updates.isTemplate = rest.isTemplate

        console.log('Updates to apply:', updates)
        const todo = await prisma.todo.update({
          where: { id, userId },
          data: updates,
        })
        console.log('Updated todo:', todo)
        return res.status(200).json({ todo })
      }
      case 'DELETE': {
        const { id } = req.body || {}
        if (!id) return res.status(400).json({ error: 'id is required' })
      
        const todo = await prisma.todo.findUnique({ where: { id, userId } })
        if (!todo) return res.status(404).json({ error: 'Todo not found' })
      
        // If it's a generated daily instance, delete its template too
        if (todo.templateId) {
          await prisma.todo.delete({
            where: { id: todo.templateId, userId },
          })
          // Also delete all generated instances
          await prisma.todo.deleteMany({
            where: { templateId: todo.templateId, userId },
          })
        } else if (todo.isTemplate) {
          // Delete template and all its children
          await prisma.todo.deleteMany({
            where: { OR: [{ id }, { templateId: id }], userId },
          })
        } else {
          // Normal one-off todo
          await prisma.todo.delete({ where: { id, userId } })
        }
      
        return res.status(200).json({ message: 'Deleted' })
      }
      
      default: {
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
      }
    }
  } catch (e) {
    console.error('Todo API error:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}


