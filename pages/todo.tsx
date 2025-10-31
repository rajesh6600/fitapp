import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CheckCircle2, Circle, Trash2, Calendar as CalendarIcon, Tag } from 'lucide-react'
import Layout from '@/components/Layout'
import { cn } from '@/lib/utils'

interface Todo {
  id: string
  title: string
  notes?: string | null
  dueAt?: string | null
  timeOfDay?: string | null
  recurrence?: 'NONE' | 'DAILY'
  isTemplate?: boolean

  tags: string[]
  completed: boolean
  position: number
  updatedAt: string
}

export default function TodoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [draft, setDraft] = useState({
    title: '',
    notes: '',
    timeOfDay: new Date().toTimeString().slice(0,5), // HH:mm format, default current time
    recurrence: 'NONE' as 'NONE' | 'DAILY',
    tags: '' as string,
  })
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  // Prefill from query (e.g., workout add-to-todo flow)
  useEffect(() => {
    const title = (router.query.prefillTitle as string) || ''
    if (title) {
      setDraft((d) => ({ ...d, title }))
      setIsDialogOpen(true)
    }
  }, [router.query.prefillTitle])

  const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await axios.get('/api/todo')
      return res.data.todos as Todo[]
    },
    enabled: !!session,
  })

  const todos = data || []
  const now = new Date()
  const active = useMemo(() => {
    return todos.filter(t => !t.completed).sort((a,b) => {
      // Sort by time only
      const timeA = a.dueAt ? new Date(a.dueAt).getTime() : Infinity
      const timeB = b.dueAt ? new Date(b.dueAt).getTime() : Infinity
      return timeA - timeB
    })
  }, [todos])
  
  const pending = useMemo(() => {
    return active.filter(t => {
      if (!t.dueAt) return false
      return new Date(t.dueAt) < now
    })
  }, [active, now])
  
  const upcoming = useMemo(() => {
    return active.filter(t => {
      if (!t.dueAt) return true
      return new Date(t.dueAt) >= now
    })
  }, [active, now])
  
  const completed = useMemo(() => todos.filter(t => t.completed), [todos])

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: draft.title.trim(),
        notes: draft.notes?.trim() || undefined,
        recurrence: draft.recurrence,
        timeOfDay: draft.timeOfDay,
        tags: draft.tags ? draft.tags.split(',').map(s=>s.trim()).filter(Boolean) : [],
      }
      const res = await axios.post('/api/todo', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setIsDialogOpen(false)
      setEditingTodo(null)
      setDraft({ title: '', notes: '', timeOfDay: new Date().toTimeString().slice(0,5), recurrence: 'NONE', tags: '' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (update: Partial<Todo> & { id: string }) => {
      const res = await axios.put('/api/todo', update)
      return res.data
    },
    onSuccess: (data) => {
      const updated: Todo = data.todo
      queryClient.setQueryData(['todos'], (old: any) => {
        if (!Array.isArray(old)) return old
        return old.map((t: Todo) => (t.id === updated.id ? { ...t, ...updated } : t))
      })
      setEditingTodo(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete('/api/todo', { data: { id } })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] })
  })

  const toggleCompleted = (todo: Todo) => updateMutation.mutate({ id: todo.id, completed: !todo.completed })

  const startEdit = (todo: Todo) => {
    setEditingTodo(todo)
    setDraft({
      title: todo.title,
      notes: todo.notes || '',
      timeOfDay: todo.timeOfDay || new Date().toTimeString().slice(0,5),
      recurrence: todo.recurrence || 'NONE',
      tags: todo.tags.join(', '),
    })
    setIsDialogOpen(true)
  }

  // Removed drag-and-drop

  if (status === 'loading') return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </Layout>
  )

  if (!session) return null

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground">To‑Do</h1>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="wellness-button bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add To‑Do
            </button>
          </div>

          <div className="space-y-8">
            {/* Pending */}
            {pending.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold text-red-600">Pending</h2>
                </div>
                <div className="space-y-2">
                  {pending.map((t) => (
                  <div key={t.id} className={cn('p-3 rounded-lg border bg-card flex items-center justify-between')}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleCompleted(t)}
                        className="mt-1 text-primary"
                        aria-label="Complete"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="font-medium text-foreground">{t.title}</div>
                        {t.notes && <div className="text-sm text-muted-foreground">{t.notes}</div>}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {(t.timeOfDay || t.dueAt) && (
                            <span className="inline-flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {t.timeOfDay || new Date(t.dueAt as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                          {t.tags?.length > 0 && (
                            <span className="inline-flex items-center gap-1"><Tag className="w-3 h-3" /> {t.tags.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(t)}
                        className="text-muted-foreground hover:text-foreground p-1"
                        aria-label="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(t.id)}
                        className="text-destructive hover:text-destructive/80 p-1"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            )}

            {/* Upcoming */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-foreground">Upcoming</h2>
              </div>
              <div className="space-y-2">
                {upcoming.length === 0 && (
                  <p className="text-muted-foreground text-sm">No upcoming to‑dos</p>
                )}
                {upcoming.map((t) => (
                  <div key={t.id} className={cn('p-3 rounded-lg border bg-card flex items-center justify-between')}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleCompleted(t)}
                        className="mt-1 text-primary"
                        aria-label="Complete"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="font-medium text-foreground">{t.title}</div>
                        {t.notes && <div className="text-sm text-muted-foreground">{t.notes}</div>}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {(t.timeOfDay || t.dueAt) && (
                            <span className="inline-flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {t.timeOfDay || new Date(t.dueAt as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                          {t.tags?.length > 0 && (
                            <span className="inline-flex items-center gap-1"><Tag className="w-3 h-3" /> {t.tags.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(t)}
                        className="text-muted-foreground hover:text-foreground p-1"
                        aria-label="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(t.id)}
                        className="text-destructive hover:text-destructive/80 p-1"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Completed */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Completed</h2>
              <div className="space-y-2">
                {completed.length === 0 && (
                  <p className="text-muted-foreground text-sm">No completed to‑dos</p>
                )}
                {completed.map((t) => (
                  <div key={t.id} className="p-3 rounded-lg border bg-card flex items-center justify-between opacity-80">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleCompleted(t)}
                        className="mt-1 text-green-600"
                        aria-label="Uncomplete"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="font-medium line-through">{t.title}</div>
                        {t.notes && <div className="text-sm text-muted-foreground line-through">{t.notes}</div>}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {(t.timeOfDay || t.dueAt) && (
                            <span className="inline-flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {t.timeOfDay || new Date(t.dueAt as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                          {t.tags?.length > 0 && (
                            <span className="inline-flex items-center gap-1"><Tag className="w-3 h-3" /> {t.tags.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(t)}
                        className="text-muted-foreground hover:text-foreground p-1"
                        aria-label="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(t.id)}
                        className="text-destructive hover:text-destructive/80 p-1"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Add Dialog (simple inline dialog) */}
          {isDialogOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={(e)=>{ if (e.target===e.currentTarget) setIsDialogOpen(false) }}>
              <div className="bg-background border border-border rounded-lg w-full max-w-md p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">{editingTodo ? 'Edit To‑Do' : 'Add To‑Do'}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-foreground mb-1">Title</label>
                    <input
                      value={draft.title}
                      onChange={(e)=>setDraft(s=>({ ...s, title: e.target.value }))}
                      className="w-full wellness-input"
                      placeholder="e.g., Monday workout, buy groceries"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-foreground mb-1">Notes</label>
                    <textarea
                      value={draft.notes}
                      onChange={(e)=>setDraft(s=>({ ...s, notes: e.target.value }))}
                      rows={3}
                      className="w-full wellness-input"
                      placeholder="Optional details"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-foreground mb-1">Type</label>
                      <select
                        value={draft.recurrence}
                        onChange={(e)=>setDraft(s=>({ ...s, recurrence: e.target.value as any }))}
                        className="w-full wellness-input"
                      >
                        <option value="NONE">Today only</option>
                        <option value="DAILY">Daily</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-foreground mb-1">Time</label>
                    <input
                      type="time"
                      value={draft.timeOfDay}
                      onChange={(e)=>setDraft(s=>({ ...s, timeOfDay: e.target.value }))}
                      className="w-full wellness-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-foreground mb-1">Tags (comma separated)</label>
                    <input
                      value={draft.tags}
                      onChange={(e)=>setDraft(s=>({ ...s, tags: e.target.value }))}
                      className="w-full wellness-input"
                      placeholder="e.g., workout, errands"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={()=>{
                    setIsDialogOpen(false)
                    setEditingTodo(null)
                    setDraft({ title: '', notes: '', timeOfDay: new Date().toTimeString().slice(0,5), recurrence: 'NONE', tags: '' })
                  }} className="wellness-button bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2">Cancel</button>
                  <button
                    onClick={() => {
                      if (!draft.title.trim()) return
                      console.log('Edit mode:', !!editingTodo, 'Todo ID:', editingTodo?.id)
                      if (editingTodo) {
                        console.log('Updating todo:', editingTodo.id)
                        updateMutation.mutate({
                          id: editingTodo.id,
                          title: draft.title.trim(),
                          notes: draft.notes?.trim() || null,
                          timeOfDay: draft.timeOfDay,
                          recurrence: draft.recurrence,
                          tags: draft.tags ? draft.tags.split(',').map(s=>s.trim()).filter(Boolean) : [],
                        })
                      } else {
                        console.log('Creating new todo')
                        createMutation.mutate()
                      }
                    }}
                    disabled={!draft.title.trim() || createMutation.isPending || updateMutation.isPending}
                    className={cn('wellness-button bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2', (createMutation.isPending || updateMutation.isPending) && 'opacity-50 cursor-not-allowed')}
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingTodo ? 'Update' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}


