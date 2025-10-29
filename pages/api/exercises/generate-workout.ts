import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

interface WorkoutPreferences {
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
  workoutType: 'strength' | 'cardio' | 'flexibility' | 'full-body'
  duration: number
  equipment: string[]
  goals: string[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const preferences: WorkoutPreferences = req.body

    // AI4Chat API configuration
    const AI4CHAT_API_KEY = process.env.AI4CHAT_API_KEY
    const AI4CHAT_API_URL = 'https://api.ai4chat.co/v1/completions'

    if (!AI4CHAT_API_KEY) {
      console.log('AI4Chat API key not found, using fallback workout generation')
      return res.status(200).json({
        workout: generateFallbackWorkout(preferences)
      })
    }

    try {
      // Create a detailed prompt for AI4Chat
      const prompt = createWorkoutPrompt(preferences)

      const response = await fetch(AI4CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI4CHAT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional fitness trainer and exercise physiologist. Create detailed, safe, and effective workout plans based on user preferences. Always include proper warm-up and cool-down routines.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`AI4Chat API error: ${response.status}`)
      }

      const aiData = await response.json()
      const workoutText = aiData.choices[0]?.message?.content

      if (!workoutText) {
        throw new Error('No workout content received from AI')
      }

      // Parse the AI response into structured workout data
      const workout = parseAIWorkoutResponse(workoutText, preferences)

      return res.status(200).json({ workout })

    } catch (apiError) {
      console.error('AI4Chat API error:', apiError)
      
      // Fallback to generated workout
      return res.status(200).json({
        workout: generateFallbackWorkout(preferences)
      })
    }

  } catch (error) {
    console.error('Generate workout API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

function createWorkoutPrompt(preferences: WorkoutPreferences): string {
  const equipmentList = preferences.equipment.length > 0 
    ? preferences.equipment.join(', ') 
    : 'Bodyweight only'
  
  const goalsList = preferences.goals.length > 0 
    ? preferences.goals.join(', ') 
    : 'General fitness'

  return `Create a ${preferences.duration}-minute ${preferences.workoutType} workout for a ${preferences.fitnessLevel} level person.

Available equipment: ${equipmentList}
Fitness goals: ${goalsList}

Please provide the workout in this exact format:

TITLE: [Workout Name]
DESCRIPTION: [Brief description]
DIFFICULTY: ${preferences.fitnessLevel}
DURATION: ${preferences.duration}

WARMUP:
- [Warmup exercise 1]
- [Warmup exercise 2]
- [Warmup exercise 3]

EXERCISES:
1. [Exercise Name] | [Sets] sets | [Reps] reps | [Rest time] | [Instructions] | [Tips]
2. [Exercise Name] | [Sets] sets | [Reps] reps | [Rest time] | [Instructions] | [Tips]
3. [Exercise Name] | [Sets] sets | [Reps] reps | [Rest time] | [Instructions] | [Tips]
4. [Exercise Name] | [Sets] sets | [Reps] reps | [Rest time] | [Instructions] | [Tips]
5. [Exercise Name] | [Sets] sets | [Reps] reps | [Rest time] | [Instructions] | [Tips]

COOLDOWN:
- [Cooldown exercise 1]
- [Cooldown exercise 2]
- [Cooldown exercise 3]

Make sure all exercises are safe, effective, and appropriate for the ${preferences.fitnessLevel} fitness level. Include proper form cues and safety tips.`
}

function parseAIWorkoutResponse(response: string, preferences: WorkoutPreferences) {
  const lines = response.split('\n').map(line => line.trim()).filter(line => line)
  
  let title = 'AI Generated Workout'
  let description = 'A personalized workout created just for you'
  const warmup: string[] = []
  const exercises: any[] = []
  const cooldown: string[] = []
  
  let currentSection = ''
  
  for (const line of lines) {
    if (line.startsWith('TITLE:')) {
      title = line.replace('TITLE:', '').trim()
    } else if (line.startsWith('DESCRIPTION:')) {
      description = line.replace('DESCRIPTION:', '').trim()
    } else if (line.startsWith('WARMUP:')) {
      currentSection = 'warmup'
    } else if (line.startsWith('EXERCISES:')) {
      currentSection = 'exercises'
    } else if (line.startsWith('COOLDOWN:')) {
      currentSection = 'cooldown'
    } else if (line.startsWith('-') && currentSection === 'warmup') {
      warmup.push(line.replace('-', '').trim())
    } else if (line.startsWith('-') && currentSection === 'cooldown') {
      cooldown.push(line.replace('-', '').trim())
    } else if (/^\d+\./.test(line) && currentSection === 'exercises') {
      const parts = line.split('|').map(part => part.trim())
      if (parts.length >= 5) {
        const exerciseName = parts[0].replace(/^\d+\.\s*/, '')
        const sets = parseInt(parts[1].replace(/\D/g, '')) || 3
        const reps = parts[2].replace('reps', '').trim()
        const rest = parts[3].replace('rest', '').trim()
        const instructions = parts[4] || ''
        const tips = parts[5] || ''
        
        exercises.push({
          name: exerciseName,
          sets,
          reps,
          rest,
          instructions,
          tips
        })
      }
    }
  }
  
  // If parsing failed, use fallback
  if (exercises.length === 0) {
    return generateFallbackWorkout(preferences)
  }
  
  return {
    title,
    description,
    duration: preferences.duration,
    difficulty: preferences.fitnessLevel,
    exercises,
    warmup,
    cooldown
  }
}

function generateFallbackWorkout(preferences: WorkoutPreferences) {
  const workoutTemplates = {
    strength: {
      title: `${preferences.fitnessLevel.charAt(0).toUpperCase() + preferences.fitnessLevel.slice(1)} Strength Training`,
      description: 'A comprehensive strength workout to build muscle and improve power',
      exercises: [
        { name: 'Push-ups', sets: preferences.fitnessLevel === 'beginner' ? 2 : 3, reps: preferences.fitnessLevel === 'beginner' ? '8-12' : '12-15', rest: '60s', instructions: 'Keep your body in a straight line from head to heels', tips: 'Start on knees if full push-ups are too difficult' },
        { name: 'Squats', sets: 3, reps: preferences.fitnessLevel === 'beginner' ? '10-15' : '15-20', rest: '60s', instructions: 'Lower down as if sitting in a chair, keep chest up', tips: 'Keep your weight on your heels' },
        { name: 'Lunges', sets: 3, reps: '10 each leg', rest: '45s', instructions: 'Step forward and lower your hips until both knees are bent at 90 degrees', tips: 'Keep your front knee over your ankle' },
        { name: 'Plank', sets: 3, reps: preferences.fitnessLevel === 'beginner' ? '20-30s' : '30-60s', rest: '45s', instructions: 'Hold a straight line from head to heels', tips: 'Engage your core and breathe normally' },
        { name: 'Glute Bridges', sets: 3, reps: '15-20', rest: '45s', instructions: 'Lift your hips by squeezing your glutes', tips: 'Pause at the top for maximum activation' }
      ]
    },
    cardio: {
      title: `${preferences.fitnessLevel.charAt(0).toUpperCase() + preferences.fitnessLevel.slice(1)} Cardio Blast`,
      description: 'High-energy cardio workout to boost your heart rate and burn calories',
      exercises: [
        { name: 'Jumping Jacks', sets: 3, reps: '30-45s', rest: '30s', instructions: 'Jump while spreading legs and raising arms overhead', tips: 'Land softly on the balls of your feet' },
        { name: 'High Knees', sets: 3, reps: '30s', rest: '30s', instructions: 'Run in place bringing knees up to chest level', tips: 'Pump your arms for momentum' },
        { name: 'Burpees', sets: 3, reps: preferences.fitnessLevel === 'beginner' ? '5-8' : '8-12', rest: '60s', instructions: 'Squat, jump back to plank, jump feet back, then jump up', tips: 'Modify by stepping back instead of jumping' },
        { name: 'Mountain Climbers', sets: 3, reps: '30s', rest: '30s', instructions: 'In plank position, alternate bringing knees to chest rapidly', tips: 'Keep your core engaged and hips level' },
        { name: 'Jump Squats', sets: 3, reps: preferences.fitnessLevel === 'beginner' ? '8-12' : '12-15', rest: '45s', instructions: 'Perform a squat then jump up explosively', tips: 'Land softly and immediately go into the next squat' }
      ]
    },
    flexibility: {
      title: `${preferences.fitnessLevel.charAt(0).toUpperCase() + preferences.fitnessLevel.slice(1)} Flexibility Flow`,
      description: 'Gentle stretching routine to improve flexibility and mobility',
      exercises: [
        { name: 'Cat-Cow Stretch', sets: 3, reps: '10 reps', rest: '30s', instructions: 'Alternate between arching and rounding your spine', tips: 'Move slowly and focus on your breath' },
        { name: 'Downward Dog', sets: 3, reps: '30-45s hold', rest: '30s', instructions: 'Form an inverted V-shape with your body', tips: 'Pedal your feet to stretch your calves' },
        { name: 'Warrior I Pose', sets: 2, reps: '30s each side', rest: '30s', instructions: 'Step one foot forward into a lunge, raise arms overhead', tips: 'Keep your front knee over your ankle' },
        { name: 'Seated Forward Fold', sets: 3, reps: '45s hold', rest: '30s', instructions: 'Sit with legs extended, fold forward from your hips', tips: 'Keep your spine long, don\'t force the stretch' },
        { name: 'Hip Circles', sets: 2, reps: '10 each direction', rest: '30s', instructions: 'Stand and make large circles with your hips', tips: 'Start small and gradually increase the range' }
      ]
    },
    'full-body': {
      title: `${preferences.fitnessLevel.charAt(0).toUpperCase() + preferences.fitnessLevel.slice(1)} Full Body Workout`,
      description: 'Complete workout targeting all major muscle groups',
      exercises: [
        { name: 'Burpees', sets: 3, reps: preferences.fitnessLevel === 'beginner' ? '5-8' : '8-10', rest: '60s', instructions: 'Full body movement combining squat, plank, and jump', tips: 'Focus on form over speed' },
        { name: 'Push-ups', sets: 3, reps: preferences.fitnessLevel === 'beginner' ? '8-12' : '12-15', rest: '45s', instructions: 'Keep body straight from head to heels', tips: 'Modify on knees if needed' },
        { name: 'Squats', sets: 3, reps: '15-20', rest: '45s', instructions: 'Lower down keeping chest up and knees behind toes', tips: 'Imagine sitting back into a chair' },
        { name: 'Plank to T', sets: 3, reps: '10 each side', rest: '45s', instructions: 'From plank, rotate and reach one arm to the ceiling', tips: 'Keep your core engaged throughout' },
        { name: 'Reverse Lunges', sets: 3, reps: '12 each leg', rest: '45s', instructions: 'Step back into a lunge, then return to standing', tips: 'Control the movement on the way down' }
      ]
    }
  }

  const template = workoutTemplates[preferences.workoutType] || workoutTemplates['full-body']
  
  return {
    title: template.title,
    description: template.description,
    duration: preferences.duration,
    difficulty: preferences.fitnessLevel,
    exercises: template.exercises,
    warmup: [
      'Arm circles - 30 seconds',
      'Leg swings - 10 each leg',
      'Light jogging in place - 30 seconds',
      'Dynamic stretching - 1 minute'
    ],
    cooldown: [
      'Walking in place - 1 minute',
      'Deep breathing - 30 seconds',
      'Gentle stretching - 2 minutes',
      'Relaxation pose - 1 minute'
    ]
  }
} 