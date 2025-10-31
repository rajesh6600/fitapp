import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import {  Circle, Calendar as CalendarIcon, Wrench, LayoutGrid } from 'lucide-react'
import Layout from '@/components/Layout'
import { getRandomGreeting } from '@/lib/utils'



export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const { data: todos } = useQuery({
    queryKey: ['todos','dashboard'],
    queryFn: async () => {
      const res = await axios.get('/api/todo?completed=false')
      return res.data.todos as Array<{ id:string; title:string; notes?:string; dueAt?:string;  }>
    },
    enabled: !!session,
  })



  if (status === 'loading') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  if (!session) {
    return null
  }



  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {session.user?.name}! 👋
            </h1>
            <p className="text-muted-foreground text-lg">
              {getRandomGreeting()}
            </p>
          </div>



          {/* Active To‑Dos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="wellness-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Your Active To‑Dos</h2>
                  <Link href="/todo" className="text-primary text-sm">Open To‑Do</Link>
                </div>
                <div className="space-y-3 max-h-64 overflow-auto pr-1">
                  {(todos || []).slice(0, 100).map((t, i) => (
                    <div key={t.id} className={`flex items-center justify-between p-3 rounded-lg border ${i<3 ? '' : ''}`}>
                      <div className="flex items-start gap-3">
                        <Circle className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium text-foreground">{t.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {t.dueAt ? new Date(t.dueAt).toLocaleString() : 'No time set'} •
                          </div>
                        </div>
                      </div>
                      <Link href="/todo" className="text-primary text-xs">Details</Link>
                    </div>
                  ))}
                  {(!todos || todos.length === 0) && (
                    <div className="text-sm text-muted-foreground">No active to‑dos</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  )
} 