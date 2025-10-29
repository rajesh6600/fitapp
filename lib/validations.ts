import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

// Goal schemas
export const goalSchema = z.object({
  type: z.enum([
    'BUILD_MUSCLE',
    'GLOWING_SKIN', 
    'HAIR_GROWTH',
    'HAIR_PROBLEM_SOLVER',
    'HEALTHY_AGING',
    'MANAGE_CONDITION',
    'WEIGHT_LOSS',
    'WEIGHT_GAIN',
    'GENERAL_WELLNESS'
  ]),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  targetValue: z.number().positive().optional(),
  specificArea: z.string().optional(), // For muscle building
  skinConcern: z.string().optional(), // For skin issues
  hairConcern: z.string().optional(), // For hair issues
})

// To-Do schema
export const todoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
  recurrence: z.enum(['NONE', 'DAILY']).default('NONE').optional(),
  isTemplate: z.boolean().optional(),
  timeOfDay: z.string().optional(),

  tags: z.array(z.string()).default([]).optional(),
  completed: z.boolean().optional(),
  position: z.number().int().optional(),
})


// Type exports
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type GoalInput = z.infer<typeof goalSchema>
export type TodoInput = z.infer<typeof todoSchema>



// Meal Planner schema
export const mealPlannerSchema = z.object({
  age: z.number().min(10, 'Age must be at least 10').max(100, 'Age must be less than 100'),
  weight: z.number().min(30, 'Weight must be at least 30kg').max(300, 'Weight must be less than 300kg'),
  height: z.number().min(100, 'Height must be at least 100cm').max(250, 'Height must be less than 250cm'),
  gender: z.enum(['male', 'female']),
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']),
  fitnessGoal: z.enum(['weight_loss', 'weight_gain', 'muscle_gain', 'maintenance']),
  dietType: z.enum(['balanced', 'high_protein', 'low_carb', 'low_fat', 'vegetarian', 'vegan']),
  allergies: z.array(z.string()).optional(),
})

export type MealPlannerInput = z.infer<typeof mealPlannerSchema> 