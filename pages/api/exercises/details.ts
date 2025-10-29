import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { exerciseName } = req.body

    if (!exerciseName) {
      return res.status(400).json({ error: 'Exercise name is required' })
    }

    // ExerciseDB API configuration
    const EXERCISEDB_API_KEY = process.env.EXERCISEDB_API_KEY
    const EXERCISEDB_BASE_URL = 'https://exercisedb.p.rapidapi.com'

    if (!EXERCISEDB_API_KEY) {
      console.log('ExerciseDB API key not found, using fallback exercise data')
      return res.status(200).json({
        exercise: generateFallbackExerciseDetail(exerciseName)
      })
    }

    try {
      // First, search for exercises by name
      const searchResponse = await fetch(`${EXERCISEDB_BASE_URL}/exercises/name/${encodeURIComponent(exerciseName.toLowerCase())}`, {
        headers: {
          'X-RapidAPI-Key': EXERCISEDB_API_KEY,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      })

      if (!searchResponse.ok) {
        throw new Error(`ExerciseDB API error: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()
      
      // If exact match not found, try searching by target muscle or body part
      let exerciseData = null
      
      if (Array.isArray(searchData) && searchData.length > 0) {
        // Use the first matching exercise
        exerciseData = searchData[0]
      } else {
        // Try searching by similar names or body parts
        const similarExercise = await findSimilarExercise(exerciseName, EXERCISEDB_API_KEY, EXERCISEDB_BASE_URL)
        if (similarExercise) {
          exerciseData = similarExercise
        }
      }

      if (!exerciseData) {
        // Return fallback data if no exercise found
        return res.status(200).json({
          exercise: generateFallbackExerciseDetail(exerciseName)
        })
      }

      // Transform ExerciseDB data to our format
      const exercise = {
        id: exerciseData.id,
        name: exerciseData.name,
        target: exerciseData.target,
        equipment: exerciseData.equipment,
        gifUrl: exerciseData.gifUrl,
        instructions: exerciseData.instructions || [],
        bodyPart: exerciseData.bodyPart,
        secondaryMuscles: exerciseData.secondaryMuscles || []
      }

      return res.status(200).json({ exercise })

    } catch (apiError) {
      console.error('ExerciseDB API error:', apiError)
      
      // Return fallback data on API error
      return res.status(200).json({
        exercise: generateFallbackExerciseDetail(exerciseName)
      })
    }

  } catch (error) {
    console.error('Exercise details API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function findSimilarExercise(exerciseName: string, apiKey: string, baseUrl: string) {
  try {
    // Common exercise name mappings
    const exerciseMapping: Record<string, string> = {
      'push-ups': 'pushup',
      'push ups': 'pushup',
      'sit-ups': 'situp',
      'sit ups': 'situp',
      'pull-ups': 'pullup',
      'pull ups': 'pullup',
      'jumping jacks': 'jumping jack',
      'mountain climbers': 'mountain climber',
      'high knees': 'high knee',
      'squat': 'squat',
      'lunge': 'lunge',
      'plank': 'plank',
      'burpee': 'burpee',
      'deadlift': 'deadlift',
      'bench press': 'bench press'
    }

    const mappedName = exerciseMapping[exerciseName.toLowerCase()] || exerciseName.toLowerCase()
    
    // Try to get a list of all exercises and find the best match
    const allExercisesResponse = await fetch(`${baseUrl}/exercises?limit=50`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    })

    if (allExercisesResponse.ok) {
      const allExercises = await allExercisesResponse.json()
      
      // Find the best match based on name similarity
      const bestMatch = allExercises.find((exercise: any) => 
        exercise.name.toLowerCase().includes(mappedName) ||
        mappedName.includes(exercise.name.toLowerCase().split(' ')[0])
      )

      return bestMatch || null
    }

    return null
  } catch (error) {
    console.error('Error finding similar exercise:', error)
    return null
  }
}

function generateFallbackExerciseDetail(exerciseName: string) {
  // Common exercise fallback data with realistic GIF URLs from exercisedb
  const fallbackExercises: Record<string, any> = {
    'push-ups': {
      id: 'fallback_pushup',
      name: 'Push-ups',
      target: 'pectorals',
      equipment: 'body weight',
      gifUrl: 'https://v2.exercisedb.io/image/r9oHIz4O5GKACX',
      instructions: [
        'Start in a plank position with hands slightly wider than shoulders',
        'Lower your body until chest nearly touches the floor',
        'Push back up to starting position',
        'Keep core engaged throughout'
      ],
      bodyPart: 'chest',
      secondaryMuscles: ['shoulders', 'triceps']
    },
    'squats': {
      id: 'fallback_squat',
      name: 'Squats',
      target: 'quadriceps',
      equipment: 'body weight',
      gifUrl: 'https://v2.exercisedb.io/image/rp0PDaJfwqY3oI',
      instructions: [
        'Stand with feet shoulder-width apart',
        'Lower down as if sitting in a chair',
        'Keep chest up and knees behind toes',
        'Return to starting position'
      ],
      bodyPart: 'lower legs',
      secondaryMuscles: ['glutes', 'hamstrings']
    },
    'lunges': {
      id: 'fallback_lunge',
      name: 'Lunges',
      target: 'quadriceps',
      equipment: 'body weight',
      gifUrl: 'https://v2.exercisedb.io/image/Uo7Xhq-Qb-sWvJ',
      instructions: [
        'Step forward with one leg',
        'Lower hips until both knees are bent at 90 degrees',
        'Keep front knee over ankle',
        'Push back to starting position'
      ],
      bodyPart: 'upper legs',
      secondaryMuscles: ['glutes', 'hamstrings']
    },
    'plank': {
      id: 'fallback_plank',
      name: 'Plank',
      target: 'abs',
      equipment: 'body weight',
      gifUrl: 'https://v2.exercisedb.io/image/B3T1IjN9CQnKE6',
      instructions: [
        'Start in a push-up position',
        'Lower to forearms, keeping body straight',
        'Hold position, engaging core',
        'Breathe normally throughout'
      ],
      bodyPart: 'waist',
      secondaryMuscles: ['shoulders', 'back']
    },
    'burpees': {
      id: 'fallback_burpee',
      name: 'Burpees',
      target: 'cardiovascular system',
      equipment: 'body weight',
      gifUrl: 'https://v2.exercisedb.io/image/eGQpIW9Yv7lZ9t',
      instructions: [
        'Start standing, then squat down and place hands on floor',
        'Jump feet back into plank position',
        'Do a push-up, then jump feet back to squat',
        'Jump up with arms overhead'
      ],
      bodyPart: 'cardio',
      secondaryMuscles: ['full body']
    },
    'jumping jacks': {
      id: 'fallback_jumping_jacks',
      name: 'Jumping Jacks',
      target: 'cardiovascular system',
      equipment: 'body weight',
      gifUrl: 'https://v2.exercisedb.io/image/k9wkgJjkFv8PLr',
      instructions: [
        'Stand upright with legs together and arms at sides',
        'Jump while spreading legs and raising arms overhead',
        'Jump back to starting position',
        'Repeat at a steady pace'
      ],
      bodyPart: 'cardio',
      secondaryMuscles: ['full body']
    },
    'mountain climbers': {
      id: 'fallback_mountain_climbers',
      name: 'Mountain Climbers',
      target: 'abs',
      equipment: 'body weight',
      gifUrl: 'https://v2.exercisedb.io/image/dYtShx5R8gO2X9',
      instructions: [
        'Start in plank position',
        'Alternate bringing knees to chest rapidly',
        'Keep core engaged and hips level',
        'Maintain steady rhythm'
      ],
      bodyPart: 'waist',
      secondaryMuscles: ['shoulders', 'legs']
    },
    'high knees': {
      id: 'fallback_high_knees',
      name: 'High Knees',
      target: 'quadriceps',
      equipment: 'body weight',
      gifUrl: 'https://v2.exercisedb.io/image/C7fZWj2Hd4OVvX',
      instructions: [
        'Stand with feet hip-width apart',
        'Run in place bringing knees to chest',
        'Pump arms for momentum',
        'Maintain quick rhythm'
      ],
      bodyPart: 'upper legs',
      secondaryMuscles: ['calves', 'core']
    }
  }

  // Try to find exact match or similar exercise
  const exactMatch = fallbackExercises[exerciseName.toLowerCase()]
  if (exactMatch) return exactMatch

  // Try to find partial match
  const partialMatch = Object.keys(fallbackExercises).find(key => 
    key.includes(exerciseName.toLowerCase()) || 
    exerciseName.toLowerCase().includes(key)
  )
  
  if (partialMatch) return fallbackExercises[partialMatch]

  // Return generic fallback
  return {
    id: 'fallback_generic',
    name: exerciseName,
    target: 'full body',
    equipment: 'body weight',
    gifUrl: 'https://v2.exercisedb.io/image/r9oHIz4O5GKACX', // Default push-up GIF
    instructions: [
      'Follow proper form for this exercise',
      'Start slowly and build up intensity',
      'Focus on controlled movements',
      'Breathe consistently throughout'
    ],
    bodyPart: 'full body',
    secondaryMuscles: ['core']
  }
} 