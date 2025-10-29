import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { duration, difficulty, muscleGroups, equipment } = req.body

    if (!duration || !difficulty) {
      return res.status(400).json({ error: 'Duration and difficulty are required' })
    }

    const wantsWeekly = req.body?.weekly === true || req.body?.day === 'Weekly' || req.body?.day === 'weekly'

    // CAREAI (Gemini) first, if configured
    try {
      const careKey = process.env.CAREAI
      if (careKey) {
        const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
        const systemWeekly = 'You are a certified strength coach. Generate a realistic 7-day weekly workout plan. Each day MUST be distinct (no duplicate names/instructions), balanced across muscle groups and intensities, include rest recommendations, and match user preferences. Return strict JSON only.'
        const systemDaily = 'You are a certified strength coach. Generate a safe, realistic, and balanced workout plan JSON for the user preferences. Focus on clarity and feasibility.'
        const prompt = {
          duration,
          difficulty,
          muscleGroups: Array.isArray(muscleGroups) ? muscleGroups : [],
          equipment: Array.isArray(equipment) ? equipment : []
        }

        if (wantsWeekly) {
          const schemaWeekly = `Return JSON ONLY in this shape: {"week": {"Monday": Workout, "Tuesday": Workout, "Wednesday": Workout, "Thursday": Workout, "Friday": Workout, "Saturday": Workout, "Sunday": Workout}} where Workout is {"id": string, "name": string, "description": string, "exercises": Array<{"exercise": {"id": string, "name": string, "description": string, "instructions": string[], "category": string, "muscleGroups": string[], "equipment": string[], "difficulty": string}, "sets": number, "repetitions"?: number, "duration"?: number, "restTime"?: number, "notes"?: string}>, "totalDuration": number, "difficulty": string, "targetMuscleGroups": string[], "equipment": string[], "calories": number}. Ensure each day's workout content is UNIQUE.`
          const body = {
            generationConfig: { response_mime_type: 'application/json' },
            contents: [
              { role: 'user', parts: [{ text: `${systemWeekly}\n\nUserInputs: ${JSON.stringify(prompt)}\n\n${schemaWeekly}` }] }
            ]
          }
          const aiRes = await fetch(`${endpoint}?key=${careKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
          })
          const aiJson = await aiRes.json()
          if (aiRes.ok) {
            const text = aiJson?.candidates?.[0]?.content?.parts?.[0]?.text || ''
            if (text) {
              try { const parsed = JSON.parse(text); return res.status(200).json({ success: true, data: parsed }) } catch {}
            }
          }
        } else {
          const schemaDaily = `Return JSON ONLY with this structure: {"id": string, "name": string, "description": string, "exercises": Array<{"exercise": {"id": string, "name": string, "description": string, "instructions": string[], "category": string, "muscleGroups": string[], "equipment": string[], "difficulty": string}, "sets": number, "repetitions"?: number, "duration"?: number, "restTime"?: number, "notes"?: string}>, "totalDuration": number, "difficulty": string, "targetMuscleGroups": string[], "equipment": string[], "calories": number}`
          const body = {
            generationConfig: { response_mime_type: 'application/json' },
            contents: [
              { role: 'user', parts: [{ text: `${systemDaily}\n\nUserInputs: ${JSON.stringify(prompt)}\n\n${schemaDaily}` }] }
            ]
          }
          const aiRes = await fetch(`${endpoint}?key=${careKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
          })
          const aiJson = await aiRes.json()
          if (aiRes.ok) {
            const text = aiJson?.candidates?.[0]?.content?.parts?.[0]?.text || ''
            if (text) {
              try { const parsed = JSON.parse(text); return res.status(200).json({ success: true, data: parsed }) } catch {}
            }
          }
        }
      }
    } catch (e) {
      console.error('CAREAI workout generation failed, falling back:', e)
    }

    // Funxtion API credentials
    const API_KEY = process.env.FUNXTION_API_KEY
    const BASE_URL = process.env.FUNXTION_API_URL || 'https://api.funxtion.com/v1'

    if (!API_KEY) {
      console.error('Missing Funxtion API key')
      // Return mock workout if API key is missing
      return res.status(200).json({
        success: true,
        data: generateMockWorkout({ duration, difficulty, muscleGroups, equipment }),
        message: 'Using mock data - API key not configured'
      })
    }

    try {
      const response = await fetch(`${BASE_URL}/workouts/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration,
          difficulty_level: mapDifficultyToLevel(difficulty),
          muscle_groups: muscleGroups,
          equipment: equipment
        })
      })

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()
      
      // Transform the API response to our format
      const workout = transformWorkoutResponse(data.data, { duration, difficulty, muscleGroups, equipment })

      return res.status(200).json({
        success: true,
        data: workout
      })

    } catch (apiError) {
      console.error('Funxtion API error:', apiError)
      
      // Return mock workout if API fails
      return res.status(200).json({
        success: false,
        data: generateMockWorkout({ duration, difficulty, muscleGroups, equipment }),
        message: 'Using mock data - API unavailable'
      })
    }

  } catch (error) {
    console.error('Generate workout API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Helper functions
function mapDifficultyToLevel(difficulty: string): number {
  switch (difficulty.toLowerCase()) {
    case 'beginner': return 2
    case 'intermediate': return 5
    case 'advanced': return 8
    default: return 2
  }
}

function transformWorkoutResponse(apiData: any, preferences: any) {
  return {
    id: apiData.id?.toString() || 'generated-workout',
    name: apiData.name || `${preferences.difficulty} Workout`,
    description: apiData.description || `A ${preferences.difficulty} workout targeting ${preferences.muscleGroups.join(', ')}`,
    exercises: apiData.exercises?.map((exercise: any, index: number) => ({
      exercise: {
        id: exercise.exercise_id?.toString() || `ex-${index}`,
        name: exercise.name || `Exercise ${index + 1}`,
        description: exercise.description || '',
        instructions: exercise.instructions?.split('\n') || [],
        category: 'Strength',
        muscleGroups: preferences.muscleGroups,
        equipment: preferences.equipment,
        difficulty: preferences.difficulty
      },
      sets: exercise.sets || 3,
      repetitions: exercise.reps || 12,
      duration: exercise.duration,
      restTime: exercise.rest_time || 60,
      notes: 'Focus on proper form'
    })) || [],
    totalDuration: preferences.duration,
    difficulty: preferences.difficulty,
    targetMuscleGroups: preferences.muscleGroups,
    equipment: preferences.equipment,
    calories: estimateWorkoutCalories(preferences.duration, preferences.difficulty)
  }
}

function generateMockWorkout(preferences: any) {
  const mockExercises = [
    {
      id: '1',
      name: 'Push-ups',
      description: 'Classic bodyweight exercise for upper body strength',
      instructions: [
        'Start in plank position',
        'Lower body to floor',
        'Push back up',
        'Repeat'
      ],
      category: 'Strength',
      muscleGroups: preferences.muscleGroups.length > 0 ? preferences.muscleGroups : ['Chest', 'Arms'],
      equipment: preferences.equipment.length > 0 ? preferences.equipment : ['Bodyweight'],
      difficulty: preferences.difficulty,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    },
    {
      id: '2',
      name: 'Squats',
      description: 'Lower body strength exercise',
      instructions: [
        'Stand with feet shoulder-width apart',
        'Lower down into squat',
        'Return to standing',
        'Repeat'
      ],
      category: 'Strength',
      muscleGroups: preferences.muscleGroups.length > 0 ? preferences.muscleGroups : ['Legs', 'Glutes'],
      equipment: preferences.equipment.length > 0 ? preferences.equipment : ['Bodyweight'],
      difficulty: preferences.difficulty,
      imageUrl: 'https://images.unsplash.com/photo-1566241134158-b18dd2df4c79?w=400'
    },
    {
      id: '3',
      name: 'Plank',
      description: 'Core stability exercise',
      instructions: [
        'Start in plank position',
        'Hold position',
        'Keep body straight',
        'Breathe normally'
      ],
      category: 'Core',
      muscleGroups: preferences.muscleGroups.length > 0 ? preferences.muscleGroups : ['Core'],
      equipment: preferences.equipment.length > 0 ? preferences.equipment : ['Bodyweight'],
      difficulty: preferences.difficulty,
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    }
  ]

  const exerciseCount = Math.min(mockExercises.length, Math.max(3, Math.floor(preferences.duration / 10)))
  const selectedExercises = mockExercises.slice(0, exerciseCount)

  return {
    id: 'mock-workout-1',
    name: `AI Generated ${preferences.difficulty} Workout`,
    description: `A ${preferences.duration}-minute ${preferences.difficulty} workout targeting ${preferences.muscleGroups.join(', ') || 'multiple muscle groups'}`,
    exercises: selectedExercises.map(exercise => ({
      exercise,
      sets: preferences.difficulty === 'Beginner' ? 2 : preferences.difficulty === 'Advanced' ? 4 : 3,
      repetitions: preferences.difficulty === 'Beginner' ? 10 : preferences.difficulty === 'Advanced' ? 15 : 12,
      restTime: 60,
      notes: 'Focus on proper form and controlled movements'
    })),
    totalDuration: preferences.duration,
    difficulty: preferences.difficulty,
    targetMuscleGroups: preferences.muscleGroups.length > 0 ? preferences.muscleGroups : ['Full Body'],
    equipment: preferences.equipment.length > 0 ? preferences.equipment : ['Bodyweight'],
    calories: estimateWorkoutCalories(preferences.duration, preferences.difficulty)
  }
}

function estimateWorkoutCalories(duration: number, difficulty: string): number {
  const baseCaloriesPerMinute = 5
  const difficultyMultiplier = difficulty === 'Beginner' ? 1 : difficulty === 'Advanced' ? 1.5 : 1.25
  return Math.round(baseCaloriesPerMinute * duration * difficultyMultiplier)
} 