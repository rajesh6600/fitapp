import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  Dumbbell, 
  Clock, 
  Zap, 
  Target,
  Play,
  Calendar,
  Loader2,
  ChevronRight,
  Activity,
  Bookmark,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface WorkoutPreferences {
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
  workoutType: 'strength' | 'cardio' | 'flexibility' | 'full-body'
  duration: number
  equipment: string[]
  goals: string[]
}

interface ExerciseDetail {
  id: string
  name: string
  target: string
  equipment: string
  gifUrl: string
  instructions: string[]
  bodyPart: string
  secondaryMuscles: string[]
}

interface WorkoutPlan {
  title: string
  description: string
  duration: number
  difficulty: string
  exercises: {
    name: string
    sets: number
    reps: string
    rest: string
    instructions: string
    tips: string
  }[]
  warmup: string[]
  cooldown: string[]
}

interface WeeklyWorkoutPlan {
  [key: string]: WorkoutPlan;
}

export default function ExerciseAssistant() {
  const [preferences, setPreferences] = useState<WorkoutPreferences>({
    fitnessLevel: 'beginner',
    workoutType: 'full-body',
    duration: 30,
    equipment: [],
    goals: []
  })
  const [generatedWorkout, setGeneratedWorkout] = useState<WorkoutPlan | null>(null)
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyWorkoutPlan | null>(null)
  const [exerciseDetails, setExerciseDetails] = useState<Record<string, ExerciseDetail>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [planType, setPlanType] = useState<'daily' | 'weekly'>('daily')
  const [savedPlans, setSavedPlans] = useState<any[]>([])

  const equipmentOptions = [
    'Dumbbells', 'Barbell', 'Resistance Bands', 'Kettlebell', 
    'Bodyweight Only', 'Pull-up Bar', 'Bench', 'Cable Machine'
  ]

  const goalOptions = [
    'Weight Loss', 'Muscle Building', 'Strength Training', 'Endurance',
    'Flexibility', 'Athletic Performance', 'General Fitness', 'Rehabilitation'
  ]

  // Fetch exercise details from ExerciseDB
  const fetchExerciseDetails = async (exerciseName: string): Promise<ExerciseDetail | null> => {
    try {
      const response = await fetch('/api/exercises/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exerciseName }),
      })
      
      if (!response.ok) throw new Error('Failed to fetch exercise details')
      
      const data = await response.json()
      return data.exercise
    } catch (error) {
      console.error('Error fetching exercise details:', error)
      return null
    }
  }

  // Generate workout using CAREAI-backed API
  const generateWorkoutMutation = useMutation({
    mutationFn: async (prefs: WorkoutPreferences) => {
      setIsGenerating(true)
      try {
        const response = await fetch('/api/generate-workout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            duration: prefs.duration,
            difficulty: prefs.fitnessLevel, 
            muscleGroups: prefs.goals,      
            equipment: prefs.equipment
          })
        })
        if (!response.ok) throw new Error('Failed to generate workout')
        const json = await response.json()
        const workout = json.data || json.workout || json
        return workout
      } finally {
        setIsGenerating(false)
      }
    },
    onSuccess: (workout: any) => {
      // Normalize minimal into UI shape
      const normalized: WorkoutPlan = {
        title: workout.name || 'Workout',
        description: workout.description || '',
        duration: workout.totalDuration || preferences.duration,
        difficulty: workout.difficulty || preferences.fitnessLevel,
        exercises: (workout.exercises || []).map((we: any) => ({
          name: we.exercise?.name || we.name || 'Exercise',
          sets: we.sets || 3,
          reps: we.repetitions?.toString?.() || we.repetitions || '10-12',
          rest: (we.restTime ? `${we.restTime}s` : '60s'),
          instructions: Array.isArray(we.exercise?.instructions) ? we.exercise.instructions.join(' ') : (we.instructions || ''),
          tips: we.notes || ''
        })),
        warmup: workout.warmup || [],
        cooldown: workout.cooldown || []
      }
      setGeneratedWorkout(normalized)
    },
    onError: (error) => {
      console.error('Error generating workout:', error)
      alert('Failed to generate workout. Please try again.')
    }
  })

  // Generate weekly workout plan (single API call)
  const generateWeeklyPlan = async () => {
    setIsGenerating(true)
    setWeeklyPlan(null)
    try {
      const response = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: preferences.duration,
          difficulty: preferences.fitnessLevel,
          muscleGroups: preferences.goals,
          equipment: preferences.equipment,
          weekly: true
        })
      })
      if (!response.ok) throw new Error('Failed to generate weekly workout')
      const json = await response.json()
      const week = json?.data?.week || json.week || json.data
      if (!week) throw new Error('Invalid weekly workout response')

      const normalized: WeeklyWorkoutPlan = {}
      Object.keys(week).forEach(day => {
        const w = week[day]
        normalized[day] = {
          title: w.name || day,
          description: w.description || '',
          duration: w.totalDuration || preferences.duration,
          difficulty: w.difficulty || preferences.fitnessLevel,
          exercises: (w.exercises || []).map((we: any) => ({
            name: we.exercise?.name || we.name || 'Exercise',
            sets: we.sets || 3,
            reps: we.repetitions?.toString?.() || we.repetitions || '10-12',
            rest: (we.restTime ? `${we.restTime}s` : '60s'),
            instructions: Array.isArray(we.exercise?.instructions) ? we.exercise.instructions.join(' ') : (we.instructions || ''),
            tips: we.notes || ''
          })),
          warmup: w.warmup || [],
          cooldown: w.cooldown || []
        }
      })
      setWeeklyPlan(normalized)
    } catch (error) {
      console.error('Error generating weekly plan:', error)
      alert('Failed to generate weekly plan. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const saveWorkoutPlan = async () => {
    try {
      const planToSave = {
        id: Date.now().toString(),
        name: `${planType === 'weekly' ? 'Weekly' : 'Daily'} Workout - ${new Date().toLocaleDateString()}`,
        type: planType,
        preferences: preferences,
        data: planType === 'weekly' ? weeklyPlan : generatedWorkout,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage for now (you can implement API later)
      const saved = JSON.parse(localStorage.getItem('savedWorkoutPlans') || '[]');
      saved.push(planToSave);
      localStorage.setItem('savedWorkoutPlans', JSON.stringify(saved));
      setSavedPlans(saved);
      
      alert('Workout plan saved successfully!');
    } catch (error) {
      console.error('Error saving workout plan:', error);
      alert('Failed to save workout plan.');
    }
  };

  const loadSavedPlans = () => {
    const saved = JSON.parse(localStorage.getItem('savedWorkoutPlans') || '[]');
    setSavedPlans(saved);
  };

  const loadPlan = (plan: any) => {
    try {
      setPreferences(plan.preferences);
      setPlanType(plan.type);
      
      if (plan.type === 'weekly') {
        setWeeklyPlan(plan.data);
        setGeneratedWorkout(null);
      } else {
        setGeneratedWorkout(plan.data);
        setWeeklyPlan(null);
      }
      
      alert('Workout plan loaded successfully!');
    } catch (error) {
      console.error('Error loading plan:', error);
      alert('Failed to load workout plan.');
    }
  };

  React.useEffect(() => {
    loadSavedPlans();
    
    // Check if there's a plan to load from profile
    const planToLoad = localStorage.getItem('planToLoad');
    if (planToLoad) {
      try {
        const { type, planId, plan } = JSON.parse(planToLoad);
        console.log('Loading workout plan from profile:', { type, planId, plan });
        
        if (type === 'workouts' && plan) {
          console.log('Setting workout plan data:', plan);
          setPreferences(plan.preferences);
          setPlanType(plan.type);
          
          if (plan.type === 'weekly') {
            setWeeklyPlan(plan.data);
            setGeneratedWorkout(null);
          } else {
            setGeneratedWorkout(plan.data);
            setWeeklyPlan(null);
          }
          
          // Clear the plan to load
          localStorage.removeItem('planToLoad');
          console.log('Workout plan loaded successfully');
        }
      } catch (error) {
        console.error('Error loading workout plan from profile:', error);
        localStorage.removeItem('planToLoad');
      }
    }
  }, []);

  const handlePreferenceChange = (key: keyof WorkoutPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleArrayToggle = (key: 'equipment' | 'goals', value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }))
  }

  const generateWorkout = () => {
    generateWorkoutMutation.mutate(preferences)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
          <Activity className="w-8 h-8 text-primary" />
          AI Exercise Assistant
        </h2>
        <p className="text-muted-foreground text-lg">
          Generate personalized workout plans with AI-powered exercise recommendations
        </p>
      </div>

      {/* Plan Type Selection */}
      <div className="flex justify-center mb-6">
        <div className="bg-muted p-1 rounded-lg">
          <button
            onClick={() => setPlanType('daily')}
            className={`px-4 py-2 rounded-md transition-colors ${
              planType === 'daily' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Daily Workout
          </button>
          <button
            onClick={() => setPlanType('weekly')}
            className={`px-4 py-2 rounded-md transition-colors ${
              planType === 'weekly' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Weekly Plan
          </button>
        </div>
      </div>

      {/* Workout Generation Form */}
      {((planType === 'daily' && !generatedWorkout) || (planType === 'weekly' && !weeklyPlan)) && (
        <div className="wellness-card p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold text-foreground mb-6 text-center">
            Tell us about your fitness preferences for {planType === 'weekly' ? 'weekly planning' : 'daily workout'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Fitness Level */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Fitness Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => handlePreferenceChange('fitnessLevel', level)}
                    className={cn(
                      'p-3 rounded-lg border text-center transition-all',
                      preferences.fitnessLevel === level
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary/50'
                    )}
                  >
                    <div className="capitalize font-medium">{level}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Workout Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Workout Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'strength', label: 'Strength', icon: '💪' },
                  { key: 'cardio', label: 'Cardio', icon: '❤️' },
                  { key: 'flexibility', label: 'Flexibility', icon: '🧘‍♀️' },
                  { key: 'full-body', label: 'Full Body', icon: '🏃‍♂️' }
                ] as const).map(type => (
                  <button
                    key={type.key}
                    onClick={() => handlePreferenceChange('workoutType', type.key)}
                    className={cn(
                      'p-3 rounded-lg border text-center transition-all',
                      preferences.workoutType === type.key
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary/50'
                    )}
                  >
                    <div className="text-lg mb-1">{type.icon}</div>
                    <div className="font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-3">
                Workout Duration: {preferences.duration} minutes
              </label>
              <input
                type="range"
                min="15"
                max="90"
                step="15"
                value={preferences.duration}
                onChange={(e) => handlePreferenceChange('duration', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>15 min</span>
                <span>30 min</span>
                <span>45 min</span>
                <span>60 min</span>
                <span>75 min</span>
                <span>90 min</span>
              </div>
            </div>

            {/* Equipment */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-3">
                Available Equipment
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {equipmentOptions.map(equipment => (
                  <button
                    key={equipment}
                    onClick={() => handleArrayToggle('equipment', equipment)}
                    className={cn(
                      'p-2 rounded-lg border text-sm transition-all',
                      preferences.equipment.includes(equipment)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary/50'
                    )}
                  >
                    {equipment}
                  </button>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-3">
                Fitness Goals
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {goalOptions.map(goal => (
                  <button
                    key={goal}
                    onClick={() => handleArrayToggle('goals', goal)}
                    className={cn(
                      'p-2 rounded-lg border text-sm transition-all',
                      preferences.goals.includes(goal)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary/50'
                    )}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            {planType === 'daily' ? (
              <button
                onClick={generateWorkout}
                disabled={isGenerating}
                className="wellness-button bg-gradient-to-r from-primary to-blue-600 text-white hover:from-primary/90 hover:to-blue-700 py-4 px-8 text-lg font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 mr-3" />
                    Generate Daily Workout
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={generateWeeklyPlan}
                disabled={isGenerating}
                className="wellness-button bg-gradient-to-r from-primary to-blue-600 text-white hover:from-primary/90 hover:to-blue-700 py-4 px-8 text-lg font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Generating Week...
                  </>
                ) : (
                  <>
                    <Calendar className="w-6 h-6 mr-3" />
                    Generate Weekly Plan
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      {((planType === 'daily' && generatedWorkout) || (planType === 'weekly' && weeklyPlan)) && (
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => {
              setGeneratedWorkout(null)
              setWeeklyPlan(null)
              setExerciseDetails({})
            }}
            className="wellness-button bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-2"
          >
            Generate New Plan
          </button>
          <button
            onClick={saveWorkoutPlan}
            className="bg-green-600 text-white hover:bg-green-700 py-2 px-6 rounded-md font-medium flex items-center gap-2"
          >
            <Bookmark className="w-5 h-5" />
            Save Plan
          </button>
        </div>
      )}

      {/* Daily Workout Display */}
      {planType === 'daily' && generatedWorkout && (
        <div className="space-y-6">
          {/* Workout Header */}
          <div className="wellness-card p-6 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {generatedWorkout.title}
            </h3>
            <p className="text-muted-foreground mb-4">
              {generatedWorkout.description}
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>{generatedWorkout.duration} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span>{generatedWorkout.difficulty}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span>{generatedWorkout.exercises.length} exercises</span>
              </div>
            </div>
            {/* Add to To-Do button (opens To-Do page with prefilled title) */}
            <div className="mt-4">
              <a
                href={`/todo?prefillTitle=${encodeURIComponent(`Workout: ${generatedWorkout.title}`)}`}
                className="wellness-button bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to To‑Do
              </a>
            </div>
          </div>

          {/* Warmup */}
          {generatedWorkout.warmup && (
            <div className="wellness-card p-6">
              <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                Warm-up (5 minutes)
              </h4>
              <ul className="space-y-2">
                {generatedWorkout.warmup.map((exercise, index) => (
                  <li key={index} className="flex items-center gap-2 text-muted-foreground">
                    <ChevronRight className="w-4 h-4 text-primary" />
                    {exercise}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Exercises */}
          <div className="space-y-4">
            <h4 className="text-xl font-semibold text-foreground">Workout Exercises</h4>
            {generatedWorkout.exercises.map((exercise, index) => {
              const details = exerciseDetails[exercise.name]
              
              return (
                <div key={index} className="wellness-card p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Exercise Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <h5 className="text-lg font-semibold text-foreground">
                          {exercise.name}
                        </h5>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                          <div className="font-semibold text-blue-700 dark:text-blue-300">
                            {exercise.sets}
                          </div>
                          <div className="text-xs text-muted-foreground">Sets</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
                          <div className="font-semibold text-green-700 dark:text-green-300">
                            {exercise.reps}
                          </div>
                          <div className="text-xs text-muted-foreground">Reps</div>
                        </div>
                        <div className="text-center p-2 bg-orange-50 dark:bg-orange-950 rounded">
                          <div className="font-semibold text-orange-700 dark:text-orange-300">
                            {exercise.rest}
                          </div>
                          <div className="text-xs text-muted-foreground">Rest</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h6 className="font-medium text-foreground mb-1">Instructions:</h6>
                          <p className="text-sm text-muted-foreground">{exercise.instructions}</p>
                        </div>
                        
                        {exercise.tips && (
                          <div>
                            <h6 className="font-medium text-foreground mb-1">Pro Tips:</h6>
                            <p className="text-sm text-muted-foreground">{exercise.tips}</p>
                          </div>
                        )}

                        {details && details.secondaryMuscles.length > 0 && (
                          <div>
                            <h6 className="font-medium text-foreground mb-1">Target Muscles:</h6>
                            <div className="flex flex-wrap gap-1">
                              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                                {details.target}
                              </span>
                              {details.secondaryMuscles.map(muscle => (
                                <span key={muscle} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                                  {muscle}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Exercise GIF/Video */}
                    <div className="flex items-center justify-center">
                      {details?.gifUrl ? (
                        <div className="relative w-full max-w-xs">
                          <Image
                            src={details.gifUrl}
                            alt={exercise.name}
                            width={300}
                            height={300}
                            className="rounded-lg shadow-lg"
                            unoptimized // For GIFs
                          />
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                            <Play className="w-3 h-3 inline mr-1" />
                            GIF
                          </div>
                        </div>
                      ) : (
                        <div className="w-full max-w-xs h-64 bg-muted rounded-lg flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <Dumbbell className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm">Exercise demonstration</p>
                            <p className="text-xs">will be added soon</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Cooldown */}
          {generatedWorkout.cooldown && (
            <div className="wellness-card p-6">
              <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
              </h4>
              <ul className="space-y-2">
                {generatedWorkout.cooldown.map((exercise, index) => (
                  <li key={index} className="flex items-center gap-2 text-muted-foreground">
                    <ChevronRight className="w-4 h-4 text-primary" />
                    {exercise}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Weekly Workout Display */}
      {planType === 'weekly' && weeklyPlan && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-2">Your Weekly Workout Plan</h3>
            <p className="text-muted-foreground">A complete 7-day workout schedule tailored to your preferences</p>
          </div>

          {Object.entries(weeklyPlan).map(([day, workout]) => (
            <div key={day} className="wellness-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-foreground">{day}</h4>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {workout.duration} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {workout.difficulty}
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    {workout.exercises.length} exercises
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground mb-4">{workout.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {workout.exercises.slice(0, 6).map((exercise, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <h5 className="font-medium text-sm mb-1">{exercise.name}</h5>
                    <div className="text-xs text-muted-foreground">
                      {exercise.sets} sets × {exercise.reps}
                    </div>
                  </div>
                ))}
                {workout.exercises.length > 6 && (
                  <div className="border rounded-lg p-3 flex items-center justify-center text-muted-foreground">
                    <span className="text-sm">+{workout.exercises.length - 6} more exercises</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Access to Profile */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Want to manage all your saved workout plans?
        </p>
        <a
          href="/profile"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
        >
          <Bookmark className="w-4 h-4" />
          View Saved Plans
        </a>
      </div>
    </div>
  )
} 