import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { category, muscleGroup, equipment, difficulty } = req.query

    // Funxtion API credentials
    const API_KEY = process.env.FUNXTION_API_KEY
    const BASE_URL = process.env.FUNXTION_API_URL || 'https://api.funxtion.com/v1'

    if (!API_KEY) {
      console.error('Missing Funxtion API key')
      // Return filtered mock data if API key is missing
      return res.status(200).json({
        success: true,
        data: getFilteredMockExercises({ category, muscleGroup, equipment, difficulty }),
        message: 'Using mock data - API key not configured'
      })
    }

    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (category) params.append('category', category as string)
      if (muscleGroup) params.append('muscle_group', muscleGroup as string)
      if (equipment) params.append('equipment', equipment as string)
      if (difficulty) params.append('difficulty', difficulty as string)

      const apiUrl = `${BASE_URL}/exercises?${params.toString()}`
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()
      
      // Transform the API response to our format
      const exercises = data.data?.map((exercise: any) => ({
        id: exercise.id.toString(),
        name: exercise.name,
        description: exercise.description,
        instructions: exercise.instructions?.split('\n').filter((step: string) => step.trim()) || [],
        category: exercise.category || 'Strength',
        muscleGroups: exercise.muscle_groups || [],
        equipment: exercise.equipment || [],
        difficulty: mapDifficultyLevel(exercise.difficulty_level || 1),
        repetitions: 12,
        sets: 3,
        calories: estimateCalories(exercise.difficulty_level || 1, 3),
        imageUrl: exercise.image_url,
        videoUrl: exercise.video_url
      })) || []

      return res.status(200).json({
        success: true,
        data: exercises
      })

    } catch (apiError) {
      console.error('Funxtion API error:', apiError)
      
      // Return filtered mock data if API fails
      return res.status(200).json({
        success: false,
        data: getFilteredMockExercises({ category, muscleGroup, equipment, difficulty }),
        message: 'Using mock data - API unavailable'
      })
    }

  } catch (error) {
    console.error('Exercises API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Helper functions
function mapDifficultyLevel(level: number): 'Beginner' | 'Intermediate' | 'Advanced' {
  if (level <= 3) return 'Beginner'
  if (level <= 6) return 'Intermediate'
  return 'Advanced'
}

function estimateCalories(difficulty: number, duration: number): number {
  const baseCaloriesPerMinute = 5
  const difficultyMultiplier = 1 + (difficulty / 10)
  return Math.round(baseCaloriesPerMinute * duration * difficultyMultiplier)
}

function getFilteredMockExercises(filters: { 
  category?: string | string[], 
  muscleGroup?: string | string[], 
  equipment?: string | string[], 
  difficulty?: string | string[] 
}) {
  const allExercises = [
    // Chest exercises
    {
      id: '1',
      name: 'Push-ups',
      description: 'Classic bodyweight exercise for chest, shoulders, and triceps',
      instructions: [
        'Start in a plank position with hands slightly wider than shoulders',
        'Lower your body until chest nearly touches the floor',
        'Push back up to starting position',
        'Keep core engaged throughout'
      ],
      category: 'Strength',
      muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
      equipment: ['Bodyweight'],
      difficulty: 'Beginner',
      repetitions: 15,
      sets: 3,
      calories: 50,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    },
    {
      id: '7',
      name: 'Bench Press',
      description: 'Fundamental chest exercise using barbell',
      instructions: [
        'Lie on bench with feet flat on floor',
        'Grip barbell slightly wider than shoulders',
        'Lower bar to chest with control',
        'Press bar back to starting position'
      ],
      category: 'Strength',
      muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
      equipment: ['Barbell', 'Bench'],
      difficulty: 'Intermediate',
      repetitions: 10,
      sets: 4,
      calories: 80,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    },
    {
      id: '8',
      name: 'Dumbbell Flyes',
      description: 'Isolation exercise for chest development',
      instructions: [
        'Lie on bench holding dumbbells above chest',
        'Lower weights in wide arc until stretch is felt',
        'Bring weights back together above chest',
        'Maintain slight bend in elbows throughout'
      ],
      category: 'Strength',
      muscleGroups: ['Chest'],
      equipment: ['Dumbbells', 'Bench'],
      difficulty: 'Intermediate',
      repetitions: 12,
      sets: 3,
      calories: 60,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    },
    // Leg exercises
    {
      id: '2',
      name: 'Squats',
      description: 'Fundamental lower body exercise',
      instructions: [
        'Stand with feet shoulder-width apart',
        'Lower down as if sitting in a chair',
        'Keep chest up and knees behind toes',
        'Return to starting position'
      ],
      category: 'Strength',
      muscleGroups: ['Legs', 'Glutes'],
      equipment: ['Bodyweight'],
      difficulty: 'Beginner',
      repetitions: 20,
      sets: 3,
      calories: 60,
      imageUrl: 'https://images.unsplash.com/photo-1566241134158-b18dd2df4c79?w=400'
    },
    {
      id: '9',
      name: 'Lunges',
      description: 'Unilateral leg exercise for strength and balance',
      instructions: [
        'Step forward with one leg',
        'Lower hips until both knees are 90 degrees',
        'Keep front knee over ankle',
        'Push back to starting position'
      ],
      category: 'Strength',
      muscleGroups: ['Legs', 'Glutes'],
      equipment: ['Bodyweight'],
      difficulty: 'Beginner',
      repetitions: 12,
      sets: 3,
      calories: 55,
      imageUrl: 'https://images.unsplash.com/photo-1566241134158-b18dd2df4c79?w=400'
    },
    {
      id: '10',
      name: 'Leg Press',
      description: 'Machine-based compound leg exercise',
      instructions: [
        'Sit on leg press machine with feet on platform',
        'Lower platform by bending knees to 90 degrees',
        'Press platform back to starting position',
        'Keep core engaged throughout'
      ],
      category: 'Strength',
      muscleGroups: ['Legs', 'Glutes'],
      equipment: ['Machine'],
      difficulty: 'Intermediate',
      repetitions: 15,
      sets: 4,
      calories: 75,
      imageUrl: 'https://images.unsplash.com/photo-1566241134158-b18dd2df4c79?w=400'
    },
    // Back exercises
    {
      id: '4',
      name: 'Deadlifts',
      description: 'Compound exercise targeting posterior chain',
      instructions: [
        'Stand with feet hip-width apart, barbell over mid-foot',
        'Hinge at hips and bend knees to grasp bar',
        'Keep chest up and back straight',
        'Drive through heels to stand tall'
      ],
      category: 'Strength',
      muscleGroups: ['Back', 'Glutes', 'Hamstrings'],
      equipment: ['Barbell'],
      difficulty: 'Intermediate',
      repetitions: 8,
      sets: 4,
      calories: 80,
      imageUrl: 'https://images.unsplash.com/photo-1583500178690-f7706b183b1e?w=400'
    },
    {
      id: '6',
      name: 'Pull-ups',
      description: 'Upper body pulling exercise',
      instructions: [
        'Hang from pull-up bar with arms extended',
        'Pull body up until chin clears bar',
        'Lower with control to starting position',
        'Keep core engaged throughout'
      ],
      category: 'Strength',
      muscleGroups: ['Back', 'Biceps'],
      equipment: ['Pull-up Bar'],
      difficulty: 'Advanced',
      repetitions: 8,
      sets: 3,
      calories: 70,
      imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400'
    },
    {
      id: '11',
      name: 'Bent-over Rows',
      description: 'Compound pulling exercise for back development',
      instructions: [
        'Hold barbell with overhand grip',
        'Hinge at hips keeping back straight',
        'Pull bar to lower chest',
        'Lower with control'
      ],
      category: 'Strength',
      muscleGroups: ['Back', 'Biceps'],
      equipment: ['Barbell'],
      difficulty: 'Intermediate',
      repetitions: 10,
      sets: 4,
      calories: 65,
      imageUrl: 'https://images.unsplash.com/photo-1583500178690-f7706b183b1e?w=400'
    },
    // Cardio exercises
    {
      id: '3',
      name: 'Burpees',
      description: 'Full-body cardio exercise',
      instructions: [
        'Start standing, then squat down and place hands on floor',
        'Jump feet back into plank position',
        'Do a push-up, then jump feet back to squat',
        'Jump up with arms overhead'
      ],
      category: 'Cardio',
      muscleGroups: ['Full Body'],
      equipment: ['Bodyweight'],
      difficulty: 'Intermediate',
      repetitions: 10,
      sets: 3,
      calories: 100,
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'
    },
    {
      id: '12',
      name: 'Mountain Climbers',
      description: 'High-intensity cardio and core exercise',
      instructions: [
        'Start in plank position',
        'Alternate bringing knees to chest rapidly',
        'Keep core engaged and hips level',
        'Maintain steady rhythm'
      ],
      category: 'Cardio',
      muscleGroups: ['Core', 'Cardio'],
      equipment: ['Bodyweight'],
      difficulty: 'Intermediate',
      repetitions: 30,
      sets: 3,
      calories: 90,
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'
    },
    {
      id: '13',
      name: 'Jump Rope',
      description: 'Classic cardio exercise for coordination and endurance',
      instructions: [
        'Hold rope handles at hip level',
        'Jump with feet together as rope passes under',
        'Land softly on balls of feet',
        'Keep elbows close to body'
      ],
      category: 'Cardio',
      muscleGroups: ['Cardio', 'Calves'],
      equipment: ['Jump Rope'],
      difficulty: 'Beginner',
      repetitions: 60,
      sets: 3,
      calories: 120,
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'
    },
    // Core exercises
    {
      id: '5',
      name: 'Plank',
      description: 'Core stability exercise',
      instructions: [
        'Start in a push-up position',
        'Lower to forearms, keeping body straight',
        'Hold position, engaging core',
        'Breathe normally throughout'
      ],
      category: 'Core',
      muscleGroups: ['Core', 'Shoulders'],
      equipment: ['Bodyweight'],
      difficulty: 'Beginner',
      repetitions: 1,
      sets: 3,
      calories: 30,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    },
    {
      id: '14',
      name: 'Russian Twists',
      description: 'Rotational core exercise',
      instructions: [
        'Sit with knees bent, feet off ground',
        'Lean back slightly, keeping back straight',
        'Rotate torso side to side',
        'Keep core engaged throughout'
      ],
      category: 'Core',
      muscleGroups: ['Core', 'Obliques'],
      equipment: ['Bodyweight'],
      difficulty: 'Intermediate',
      repetitions: 20,
      sets: 3,
      calories: 45,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    },
    {
      id: '15',
      name: 'Dead Bug',
      description: 'Core stability and coordination exercise',
      instructions: [
        'Lie on back with arms extended to ceiling',
        'Bring knees to 90 degrees',
        'Extend opposite arm and leg simultaneously',
        'Return to starting position and repeat'
      ],
      category: 'Core',
      muscleGroups: ['Core'],
      equipment: ['Bodyweight'],
      difficulty: 'Beginner',
      repetitions: 10,
      sets: 3,
      calories: 25,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    },
    // Shoulder exercises
    {
      id: '16',
      name: 'Shoulder Press',
      description: 'Overhead pressing exercise for shoulder development',
      instructions: [
        'Hold dumbbells at shoulder height',
        'Press weights directly overhead',
        'Lower with control to starting position',
        'Keep core engaged throughout'
      ],
      category: 'Strength',
      muscleGroups: ['Shoulders', 'Triceps'],
      equipment: ['Dumbbells'],
      difficulty: 'Intermediate',
      repetitions: 12,
      sets: 3,
      calories: 55,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    },
    {
      id: '17',
      name: 'Lateral Raises',
      description: 'Isolation exercise for side deltoids',
      instructions: [
        'Stand with dumbbells at sides',
        'Raise arms out to shoulder height',
        'Lower with control',
        'Keep slight bend in elbows'
      ],
      category: 'Strength',
      muscleGroups: ['Shoulders'],
      equipment: ['Dumbbells'],
      difficulty: 'Beginner',
      repetitions: 15,
      sets: 3,
      calories: 40,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    },
    // Arms exercises
    {
      id: '18',
      name: 'Bicep Curls',
      description: 'Classic arm exercise for bicep development',
      instructions: [
        'Hold dumbbells with arms extended',
        'Curl weights toward shoulders',
        'Squeeze biceps at top',
        'Lower with control'
      ],
      category: 'Strength',
      muscleGroups: ['Biceps'],
      equipment: ['Dumbbells'],
      difficulty: 'Beginner',
      repetitions: 15,
      sets: 3,
      calories: 35,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    },
    {
      id: '19',
      name: 'Tricep Dips',
      description: 'Bodyweight exercise for tricep strength',
      instructions: [
        'Place hands on bench or chair behind you',
        'Lower body by bending elbows',
        'Press back up to starting position',
        'Keep shoulders down'
      ],
      category: 'Strength',
      muscleGroups: ['Triceps', 'Shoulders'],
      equipment: ['Bench', 'Bodyweight'],
      difficulty: 'Intermediate',
      repetitions: 12,
      sets: 3,
      calories: 45,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    },
    // More cardio exercises
    {
      id: '20',
      name: 'High Knees',
      description: 'High-intensity cardio exercise',
      instructions: [
        'Stand with feet hip-width apart',
        'Run in place bringing knees to chest',
        'Pump arms for momentum',
        'Maintain quick rhythm'
      ],
      category: 'Cardio',
      muscleGroups: ['Cardio', 'Legs'],
      equipment: ['Bodyweight'],
      difficulty: 'Beginner',
      repetitions: 30,
      sets: 3,
      calories: 80,
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'
    },
    {
      id: '21',
      name: 'Boxing Jabs',
      description: 'Cardio boxing exercise for upper body',
      instructions: [
        'Stand in boxing stance',
        'Throw alternating straight punches',
        'Keep guard up between punches',
        'Engage core with each punch'
      ],
      category: 'Cardio',
      muscleGroups: ['Arms', 'Core', 'Cardio'],
      equipment: ['Bodyweight'],
      difficulty: 'Intermediate',
      repetitions: 20,
      sets: 3,
      calories: 95,
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'
    },
    // Functional exercises
    {
      id: '22',
      name: 'Kettlebell Swings',
      description: 'Dynamic full-body exercise',
      instructions: [
        'Hold kettlebell with both hands',
        'Hinge at hips and swing up to chest height',
        'Drive with hips, not arms',
        'Control the descent'
      ],
      category: 'Functional',
      muscleGroups: ['Glutes', 'Hamstrings', 'Core'],
      equipment: ['Kettlebell'],
      difficulty: 'Intermediate',
      repetitions: 20,
      sets: 3,
      calories: 110,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    },
    {
      id: '23',
      name: 'Turkish Get-ups',
      description: 'Complex full-body movement pattern',
      instructions: [
        'Start lying down with weight in one hand',
        'Work through the movement to standing',
        'Reverse the movement back down',
        'Focus on control and stability'
      ],
      category: 'Functional',
      muscleGroups: ['Full Body', 'Core'],
      equipment: ['Kettlebell', 'Dumbbells'],
      difficulty: 'Advanced',
      repetitions: 5,
      sets: 3,
      calories: 85,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    },
    // Stretching/Flexibility
    {
      id: '24',
      name: 'Yoga Warrior Pose',
      description: 'Strengthening yoga pose for legs and core',
      instructions: [
        'Step one foot forward into lunge position',
        'Extend arms overhead',
        'Hold position with proper alignment',
        'Breathe deeply throughout'
      ],
      category: 'Flexibility',
      muscleGroups: ['Legs', 'Core'],
      equipment: ['Bodyweight'],
      difficulty: 'Beginner',
      repetitions: 1,
      sets: 3,
      calories: 25,
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'
    },
    {
      id: '25',
      name: 'Downward Dog',
      description: 'Classic yoga pose for flexibility and strength',
      instructions: [
        'Start on hands and knees',
        'Tuck toes and lift hips up',
        'Straighten legs and arms',
        'Create inverted V shape'
      ],
      category: 'Flexibility',
      muscleGroups: ['Shoulders', 'Hamstrings', 'Calves'],
      equipment: ['Bodyweight'],
      difficulty: 'Beginner',
      repetitions: 1,
      sets: 3,
      calories: 20,
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'
    }
  ]

  // Filter exercises based on provided criteria
  let filteredExercises = allExercises

  if (filters.category) {
    const categories = Array.isArray(filters.category) ? filters.category : [filters.category]
    filteredExercises = filteredExercises.filter(exercise => 
      categories.some(cat => exercise.category.toLowerCase().includes(cat.toLowerCase()))
    )
  }

  if (filters.muscleGroup) {
    const muscleGroups = Array.isArray(filters.muscleGroup) ? filters.muscleGroup : [filters.muscleGroup]
    filteredExercises = filteredExercises.filter(exercise => 
      muscleGroups.some(muscle => 
        exercise.muscleGroups.some(group => 
          group.toLowerCase().includes(muscle.toLowerCase())
        )
      )
    )
  }

  if (filters.equipment) {
    const equipmentTypes = Array.isArray(filters.equipment) ? filters.equipment : [filters.equipment]
    filteredExercises = filteredExercises.filter(exercise => 
      equipmentTypes.some(equip => 
        exercise.equipment.some(item => 
          item.toLowerCase().includes(equip.toLowerCase())
        )
      )
    )
  }

  if (filters.difficulty) {
    const difficulties = Array.isArray(filters.difficulty) ? filters.difficulty : [filters.difficulty]
    filteredExercises = filteredExercises.filter(exercise => 
      difficulties.some(diff => exercise.difficulty.toLowerCase() === diff.toLowerCase())
    )
  }

  // Shuffle and return a subset for variety
  const shuffled = filteredExercises.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(12, shuffled.length))
} 