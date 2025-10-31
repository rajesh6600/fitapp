import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Link from 'next/link'
import { 
  Dumbbell,
  Sparkles,
  ChefHat,
  MessageCircle,
  Activity,
  Music,Heart
} from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  const handleFeatureClick = (path: string) => {
    if (session) {
      router.push(path)
    } else {
      router.push('/auth/register')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (session) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="relative z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary">Fitai ✨</span>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Transform Your{' '}
              <span className="wellness-gradient bg-clip-text text-transparent">
                Wellness Journey
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Set personalized wellness goals, get AI-powered meal suggestions, and track your todo in one beautiful, easy-to-use platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Your Journey
              </Link>
              <Link
                href="/auth/login"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need for wellness
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform helps you achieve your health goals with personalized recommendations and easy tracking.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            {[
              {
                icon: ChefHat,
                title: 'Personalized Meals',
                description: 'Get AI-powered meal suggestions tailored to your specific wellness goals and dietary needs.',
                color: 'text-blue-600 dark:text-blue-400',
                path: '/meals',
              },
              {
                icon: Dumbbell,
                title: 'AI Exercise Assistant',
                description: 'Get personalized workout suggestions tailored to your specific wellness goals and dietary needs.',
                color: 'text-orange-600 dark:text-orange-400',
                path: '/exercise-assistant',
              },
              {
                icon: MessageCircle,
                title: 'Skin & Hair Care',
                description: 'Get personalized skincare and hair care recommendations tailored to your specific wellness goals and dietary needs.',
                color: 'text-pink-600 dark:text-pink-400',
                path: '/skin-hair-care',
              },
              {
                icon: Music,
                title: 'AI Music Generator',
                description: 'Create custom music tracks with AI',
                color: 'text-purple-600 dark:text-purple-400',
                path: '/music-generator',
              },
              {
                icon: Activity,
                title: 'To‑Do',
                description: 'Plan your week with a simple, powerful to‑do list for workouts and tasks.',
                color: 'text-purple-600 dark:text-purple-400',
                path: '/todo',
              },

            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  onClick={() => handleFeatureClick(feature.path)}
                  className="wellness-card p-6 text-center animate-fade-in hover:scale-105 transition-transform duration-200 cursor-pointer group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${feature.color} bg-gray-100 dark:bg-gray-700 mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                  <div className="mt-4 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    {session ? 'Go to feature →' : 'Sign up to access →'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to start your wellness transformation?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            
          </p>
          <Link
            href="/auth/register"
            className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center"
          >
            <Heart className="w-5 h-5 mr-2" />
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-2xl font-bold text-primary mb-4 block">Fitai ✨</span>
            <p className="text-muted-foreground">
              © 2025 Fitai. Start your health journey.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 