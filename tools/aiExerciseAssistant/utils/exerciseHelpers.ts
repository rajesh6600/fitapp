import { Exercise, Workout, FunxtionExercise, FunxtionWorkout } from '../types/exercise.types'


export function transformFunxtionExercise(funxtionExercise: FunxtionExercise): Exercise {
  return {
    id: funxtionExercise.id.toString(),
    name: funxtionExercise.name,
    description: funxtionExercise.description,
    instructions: funxtionExercise.instructions.split('\n').filter(step => step.trim()),
    category: 'Strength', 
    muscleGroups: funxtionExercise.muscle_groups,
    equipment: funxtionExercise.equipment,
    difficulty: mapDifficultyLevel(funxtionExercise.difficulty_level),
    imageUrl: funxtionExercise.image_url,
    videoUrl: funxtionExercise.video_url,
    repetitions: 12, 
    sets: 3, 
    calories: estimateCalories(funxtionExercise.difficulty_level, 3)
  }
}

// Transform Funxtion API workout to our Workout type
export function transformFunxtionWorkout(funxtionWorkout: FunxtionWorkout): Workout {
  return {
    id: funxtionWorkout.id.toString(),
    name: funxtionWorkout.name,
    description: funxtionWorkout.description,
    exercises: funxtionWorkout.exercises.map(we => ({
      exercise: {
        id: we.exercise_id.toString(),
        name: `Exercise ${we.exercise_id}`,
        description: '',
        instructions: [],
        category: 'Strength',
        muscleGroups: funxtionWorkout.muscle_groups,
        equipment: [],
        difficulty: mapDifficultyLevel(funxtionWorkout.difficulty)
      },
      sets: we.sets,
      repetitions: we.reps,
      duration: we.duration,
      restTime: we.rest_time
    })),
    totalDuration: funxtionWorkout.duration,
    difficulty: mapDifficultyLevel(funxtionWorkout.difficulty),
    targetMuscleGroups: funxtionWorkout.muscle_groups,
    equipment: [],
    calories: estimateCalories(funxtionWorkout.difficulty, funxtionWorkout.duration)
  }
}

// Map numeric difficulty level to string
export function mapDifficultyLevel(level: number): 'Beginner' | 'Intermediate' | 'Advanced' {
  if (level <= 3) return 'Beginner'
  if (level <= 6) return 'Intermediate'
  return 'Advanced'
}

// Estimate calories burned based on difficulty and duration
export function estimateCalories(difficulty: number, duration: number): number {
  const baseCaloriesPerMinute = 5
  const difficultyMultiplier = 1 + (difficulty / 10)
  return Math.round(baseCaloriesPerMinute * duration * difficultyMultiplier)
}

// Format exercise duration
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}min`
}

// Get difficulty color for UI
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'beginner':
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900'
    case 'intermediate':
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900'
    case 'advanced':
      return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900'
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900'
  }
}

// Get muscle group emoji
export function getMuscleGroupEmoji(muscleGroup: string): string {
  const emojiMap: { [key: string]: string } = {
    'chest': '💪',
    'back': '🏋️',
    'shoulders': '💪',
    'arms': '💪',
    'legs': '🦵',
    'core': '🫀',
    'glutes': '🍑',
    'cardio': '❤️',
    'full body': '🔥'
  }
  
  return emojiMap[muscleGroup.toLowerCase()] || '💪'
}

// Generate workout summary
export function generateWorkoutSummary(workout: Workout): string {
  const totalExercises = workout.exercises.length
  const totalSets = workout.exercises.reduce((sum, we) => sum + we.sets, 0)
  const muscleGroups = workout.targetMuscleGroups.join(', ')
  
  return `${totalExercises} exercises, ${totalSets} total sets, targeting ${muscleGroups}`
}

// Validate exercise data
export function validateExercise(exercise: Partial<Exercise>): string[] {
  const errors: string[] = []
  
  if (!exercise.name?.trim()) {
    errors.push('Exercise name is required')
  }
  
  if (!exercise.description?.trim()) {
    errors.push('Exercise description is required')
  }
  
  if (!exercise.instructions?.length) {
    errors.push('Exercise instructions are required')
  }
  
  if (!exercise.muscleGroups?.length) {
    errors.push('At least one muscle group is required')
  }
  
  return errors
}

// Search exercises by name or muscle group
export function searchExercises(exercises: Exercise[], query: string): Exercise[] {
  const lowerQuery = query.toLowerCase()
  
  return exercises.filter(exercise => 
    exercise.name.toLowerCase().includes(lowerQuery) ||
    exercise.description.toLowerCase().includes(lowerQuery) ||
    exercise.muscleGroups.some(mg => mg.toLowerCase().includes(lowerQuery)) ||
    exercise.equipment.some(eq => eq.toLowerCase().includes(lowerQuery))
  )
}

// Group exercises by muscle group
export function groupExercisesByMuscleGroup(exercises: Exercise[]): { [key: string]: Exercise[] } {
  const grouped: { [key: string]: Exercise[] } = {}
  
  exercises.forEach(exercise => {
    exercise.muscleGroups.forEach(muscleGroup => {
      if (!grouped[muscleGroup]) {
        grouped[muscleGroup] = []
      }
      if (!grouped[muscleGroup].find(e => e.id === exercise.id)) {
        grouped[muscleGroup].push(exercise)
      }
    })
  })
  
  return grouped
} 