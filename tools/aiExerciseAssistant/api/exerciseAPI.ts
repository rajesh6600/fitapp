import axios from 'axios'
import { 
  Exercise, 
  ExerciseFilters, 
  Workout, 
  APIResponse 
} from '../types/exercise.types'

class ExerciseAPI {
  private baseURL: string

  constructor() {
    this.baseURL = '/api'
  }

  // Fetch exercises with optional filters
  async getExercises(filters?: ExerciseFilters): Promise<APIResponse<Exercise[]>> {
    try {
      const params = new URLSearchParams()
      
      if (filters?.category) params.append('category', filters.category)
      if (filters?.muscleGroup) params.append('muscleGroup', filters.muscleGroup)
      if (filters?.equipment) params.append('equipment', filters.equipment)
      if (filters?.difficulty) params.append('difficulty', filters.difficulty)

      const response = await axios.get(
        `${this.baseURL}/exercises?${params.toString()}`
      )

      return response.data
    } catch (error) {
      console.error('Error fetching exercises:', error)
      
      return {
        success: false,
        data: [],
        error: 'Failed to fetch exercises'
      }
    }
  }

  // Get exercise by ID
  async getExerciseById(id: string): Promise<APIResponse<Exercise>> {
    try {
      const response = await axios.get(`${this.baseURL}/exercises/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching exercise:', error)
      
      return {
        success: false,
        data: {} as Exercise,
        error: 'Exercise not found'
      }
    }
  }

  // Generate AI workout based on preferences
  async generateWorkout(preferences: {
    duration: number
    difficulty: string
    muscleGroups: string[]
    equipment: string[]
  }): Promise<APIResponse<Workout>> {
    try {
      const response = await axios.post(
        `${this.baseURL}/generate-workout`,
        preferences
      )

      return response.data
    } catch (error) {
      console.error('Error generating workout:', error)
      
      return {
        success: false,
        data: {} as Workout,
        error: 'Failed to generate workout'
      }
    }
  }

  // Get muscle groups
  async getMuscleGroups(): Promise<APIResponse<string[]>> {
    try {
      const muscleGroups = [
        'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Glutes', 'Cardio'
      ]

      return {
        success: true,
        data: muscleGroups
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Failed to fetch muscle groups'
      }
    }
  }

  // Get equipment types
  async getEquipment(): Promise<APIResponse<string[]>> {
    try {
      const equipment = [
        'Bodyweight', 'Dumbbells', 'Barbell', 'Resistance Bands', 'Kettlebell', 
        'Cable Machine', 'Pull-up Bar', 'Yoga Mat', 'Bench'
      ]

      return {
        success: true,
        data: equipment
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Failed to fetch equipment'
      }
    }
  }
}

export default new ExerciseAPI() 