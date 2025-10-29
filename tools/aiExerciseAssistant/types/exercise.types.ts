// Exercise API Response Types
export interface Exercise {
  id: string
  name: string
  description: string
  instructions: string[]
  category: string
  muscleGroups: string[]
  equipment: string[]
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  duration?: number
  repetitions?: number
  sets?: number
  calories?: number
  imageUrl?: string
  videoUrl?: string
}

export interface ExerciseCategory {
  id: string
  name: string
  description: string
  exerciseCount: number
}

export interface MuscleGroup {
  id: string
  name: string
  description: string
  exercises: Exercise[]
}

export interface Equipment {
  id: string
  name: string
  description: string
  category: string
}

export interface Workout {
  id: string
  name: string
  description: string
  exercises: WorkoutExercise[]
  totalDuration: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  targetMuscleGroups: string[]
  equipment: string[]
  calories: number
}

export interface WorkoutExercise {
  exercise: Exercise
  sets: number
  repetitions: number
  duration?: number
  restTime?: number
  notes?: string
}

export interface ExerciseFilters {
  category?: string
  muscleGroup?: string
  equipment?: string
  difficulty?: string
  duration?: {
    min: number
    max: number
  }
}

export interface APIResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

// Funxtion API specific types
export interface FunxtionExercise {
  id: number
  name: string
  description: string
  instructions: string
  muscle_groups: string[]
  equipment: string[]
  difficulty_level: number
  image_url?: string
  video_url?: string
}

export interface FunxtionWorkout {
  id: number
  name: string
  description: string
  exercises: FunxtionWorkoutExercise[]
  duration: number
  difficulty: number
  muscle_groups: string[]
}

export interface FunxtionWorkoutExercise {
  exercise_id: number
  sets: number
  reps: number
  duration?: number
  rest_time?: number
} 