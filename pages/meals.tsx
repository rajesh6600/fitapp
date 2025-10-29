// pages/meals.tsx

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

interface Meal {
  label: string
  calories: number
  url: string
}

export default function MealsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [mealPlan, setMealPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }

    if (status === 'authenticated') {
      // Fetch meal plan from your backend API
      fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calories: 2000, diet: 'vegetarian' })
      })
        .then(res => res.json())
        .then(data => {
          setMealPlan(data)
          setLoading(false)
        })
        .catch(error => {
          console.error('Mealie API error:', error.response?.data || error.message)
          setLoading(false)
        })
    }
  }, [status])

  if (status === 'loading' || loading) {
    return <p className="p-4 text-center">Loading meal plan...</p>
  }

  if (!session) return null

  return (
    <div className="min-h-screen p-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      <h1 className="text-3xl font-bold mb-6">Your AI Meal Plan</h1>

      {mealPlan?.meals
  ? ['breakfast', 'lunch', 'dinner', 'snacks'].map((type) => {
      const meals = mealPlan.meals[type] || []
      return (
        <div key={type}>
          <h3>{type.toUpperCase()}</h3>
          {meals.length === 0 ? (
            <p>No meals found for {type}</p>
          ) : (
            meals.map((meal: any, i: number) => (
              <div key={i}>
                <p><strong>{meal.label}</strong></p>
              </div>
            ))
          )}
        </div>
      )
    })
  : (
    <p className="text-red-500">Meal plan not loaded. Please try again.</p>
  )}



    </div>
  )
}
