import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/**
 * Format time in minutes to readable format
 */
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

/**
 * Capitalize first letter of each word
 */
export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

/**
 * Generate a random greeting message
 */
export function getRandomGreeting(): string {
  const greetings = [
    "Ready to crush your wellness goals today?",
    "Your health journey continues!",
    "Time to nourish your body and soul",
    "Let's make today amazing!",
    "Your wellness adventure awaits",
    "Fuel your body, ignite your spirit",

"Embrace today with health in mind",

"Wellness starts now—let's go",

"Transform your mind, body, and soul",

"A new day, a new opportunity to thrive",

"Take the first step towards a healthier you",

"Nourish, energize, repeat",

"Elevate your health, elevate your life",

"Your best self starts here",

"Well-being is a journey—let’s take it together",

"Let’s make every moment count for your health",

"Shaping a healthier you, one step at a time",

"Sow the seeds of wellness today",

"Today is the perfect day for a fresh start",

"Achieve your health dreams—starting now",
  ]
  return greetings[Math.floor(Math.random() * greetings.length)]
}
