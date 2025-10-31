import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { 
  Dumbbell,
  Sparkles,
  ChefHat,
  MessageCircle,
  ArrowRight,
  Activity,
  Music
} from 'lucide-react'
import Layout from '@/components/Layout'
import MealPlanner from '@/components/MealPlanner'
import SkinHairChatbot from '@/components/SkinHairChatbot'
import ExerciseAssistant from '@/tools/aiExerciseAssistant/components/ExerciseAssistant'
import { cn } from '@/lib/utils'
import { MusicGenerator } from '../components/tools/MusicGenerator';

export default function Tools() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTool, setActiveTool] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // Handle URL fragments to auto-open tools
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1); // Remove the # symbol
      if (hash === 'meal-generator') {
        setActiveTool('body-weight');
      } else if (hash === 'exercise-assistant') {
        setActiveTool('exercise-assistant');
      }
    }
  }, []);

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

  const tools = [
    {
      id: 'body-weight',
      title: 'Meal Generator',
      description: 'Get personalized meal plans for your fitness goals',
      icon: ChefHat,
      color: 'bg-blue-500',
      features: [
        'Personalized meal planning',
        'Nutrition tracking',
        'Recipe instructions',
        'Calorie & macro breakdowns'
      ]
    },
    {
      id: 'exercise-assistant',
      title: 'AI Exercise Assistant',
      description: 'Discover exercises and generate personalized workouts',
      icon: Dumbbell,
      color: 'bg-orange-500',
      features: [
        'Exercise database with filtering',
        'AI-powered workout generation',
        'Custom workout builder',
        'Muscle group targeting'
      ]
    },
    {
      id: 'skin-hair',
      title: 'Skin & Hair Care',
      description: 'AI-powered tips for healthy skin and hair',
      icon: Sparkles,
      color: 'bg-pink-500',
      features: [
        'Personalized skincare advice',
        'Hair care recommendations',
        'Natural remedy suggestions',
        'Nutritional guidance'
      ]
    },
    {
      id: 'music-generator',
      title: 'AI Music Generator',
      description: 'Create custom music tracks with AI',
      icon: Music,
      color: 'bg-purple-500',
      features: [
        'AI-powered music generation',
        'Custom music prompts',
        'Download generated music'
      ]
    }
  ]

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Wellness Tools 🛠️
            </h1>
            <p className="text-muted-foreground">
              Choose from our specialized tools to enhance your wellness journey
            </p>
          </div>

          {!activeTool && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {tools.map((tool) => {
                const IconComponent = tool.icon
                return (
                  <div key={tool.id} className="wellness-card p-8 hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-6">
                      <div className={cn('p-3 rounded-lg mr-4', tool.color)}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">{tool.title}</h2>
                        <p className="text-muted-foreground">{tool.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {tool.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-muted-foreground">
                          <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                          {feature}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setActiveTool(tool.id)}
                      className="wellness-button bg-primary text-primary-foreground hover:bg-primary/90 w-full py-3 flex items-center justify-center gap-2"
                    >
                      {tool.id === 'body-weight' ? (
                        <Dumbbell className="w-4 h-4" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tool Components */}
          {activeTool === 'body-weight' && (
            <div>
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setActiveTool(null)}
                  className="wellness-button bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 mr-4"
                >
                  ← Back to Tools
                </button>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <ChefHat className="w-6 h-6" />
                  Meal Generator
                </h2>
              </div>
              <MealPlanner />
            </div>
          )}

          {activeTool === 'exercise-assistant' && (
            <div>
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setActiveTool(null)}
                  className="wellness-button bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 mr-4"
                >
                  ← Back to Tools
                </button>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Activity className="w-6 h-6" />
                  AI Exercise Assistant
                </h2>
              </div>
              <ExerciseAssistant />
            </div>
          )}

          {activeTool === 'skin-hair' && (
            <div>
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setActiveTool(null)}
                  className="wellness-button bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 mr-4"
                >
                  ← Back to Tools
                </button>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  Skin & Hair Care Assistant
                </h2>
              </div>
              <SkinHairChatbot />
            </div>
          )}

          {activeTool === 'music-generator' && (
            <div>
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setActiveTool(null)}
                  className="wellness-button bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 mr-4"
                >
                  ← Back to Tools
                </button>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Music className="w-6 h-6" />
                  AI Music Generator
                </h2>
              </div>
              <MusicGenerator />
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
} 