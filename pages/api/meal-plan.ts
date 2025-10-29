import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'

interface EdamamRecipe {
  uri: string
  label: string
  image: string
  url: string
  yield: number
  calories: number
  totalTime: number
  ingredients: { text: string }[]
  dietLabels: string[]
  healthLabels: string[]
  totalNutrients: {
    ENERC_KCAL: { quantity: number }
    PROCNT: { quantity: number }
    CHOCDF: { quantity: number }
    FAT: { quantity: number }
    FIBTG: { quantity: number }
  }
}

interface EdamamResponse {
  hits: { recipe: EdamamRecipe }[]
}

interface UserProfile {
  weight: string;
  height: string;
  age: string;
  exerciseType: string;
  goal: string;
  allergies: string[];
  activityLevel: string;
}

// Helper: strip any `image` fields from responses to avoid fetching images client-side
function stripImages<T = any>(value: any): T {
  if (Array.isArray(value)) {
    return value.map(v => stripImages(v)) as any
  }
  if (value && typeof value === 'object') {
    const out: any = {}
    for (const k of Object.keys(value)) {
      if (k === 'image') {
        out[k] = null
      } else {
        out[k] = stripImages((value as any)[k])
      }
    }
    return out
  }
  return value
}

// Enhanced search terms based on user profile and day for more variety
function getSearchTermsForProfile(mealType: string, userPrefs: { diet?: string, health?: string[], profile?: UserProfile, day?: string }) {
  const { profile, day } = userPrefs;
  
  // Base terms with more variety
  const baseTerms = {
    breakfast: [
      'healthy breakfast', 'protein breakfast', 'nutritious morning meal', 'energy breakfast',
      'oatmeal', 'smoothie bowl', 'avocado toast', 'eggs benedict', 'pancakes', 'granola',
      'yogurt parfait', 'breakfast burrito', 'chia pudding', 'french toast', 'quinoa bowl',
      'acai bowl', 'overnight oats', 'breakfast wrap', 'protein pancakes', 'bagel with cream cheese'
    ],
    lunch: [
      'healthy lunch', 'balanced meal', 'protein lunch', 'nutritious lunch',
      'caesar salad', 'grilled chicken sandwich', 'vegetable soup', 'pasta primavera', 'quinoa bowl', 'chicken wrap',
      'buddha bowl', 'salmon salad', 'turkey sandwich', 'lentil curry', 'stir fry noodles',
      'mediterranean bowl', 'taco bowl', 'sushi bowl', 'chicken tikka', 'greek salad'
    ],
    dinner: [
      'healthy dinner', 'protein dinner', 'balanced dinner', 'nutritious evening meal',
      'grilled salmon', 'chicken marsala', 'beef stir fry', 'pork tenderloin', 'vegetable lasagna', 'fish tacos',
      'lamb curry', 'stuffed peppers', 'roasted chicken', 'beef tenderloin', 'seafood paella',
      'mushroom risotto', 'thai curry', 'moroccan tagine', 'italian pasta', 'mexican enchiladas'
    ],
    snack: [
      'healthy snack', 'protein snack', 'nutritious snack', 'energy snack',
      'trail mix', 'apple slices', 'greek yogurt', 'protein smoothie', 'energy balls', 'hummus plate',
      'cheese crackers', 'protein bar', 'fruit salad', 'nut butter toast', 'veggie sticks',
      'cottage cheese bowl', 'dark chocolate', 'roasted chickpeas', 'smoothie bowl', 'protein muffin'
    ]
  }

  let terms = [...(baseTerms[mealType as keyof typeof baseTerms] || baseTerms.breakfast)];

  // Add variety based on day of the week
  if (day) {
    const dayVariations = {
      'Monday': ['energizing', 'motivation boost', 'start week right'],
      'Tuesday': ['balanced', 'steady energy', 'midweek fuel'],
      'Wednesday': ['comfort food', 'hump day special', 'satisfying'],
      'Thursday': ['prep for weekend', 'almost there', 'power through'],
      'Friday': ['celebration meal', 'end week strong', 'treat yourself'],
      'Saturday': ['weekend special', 'leisure cooking', 'family meal'],
      'Sunday': ['meal prep', 'sunday special', 'comfort food']
    };
    
    const dayTerms = dayVariations[day as keyof typeof dayVariations] || [];
    terms = terms.map(term => {
      const dayTerm = dayTerms[Math.floor(Math.random() * dayTerms.length)];
      return Math.random() > 0.5 ? `${dayTerm} ${term}` : term;
    });
  }

  // Goal-specific modifications
  if (profile?.goal) {
    switch (profile.goal) {
      case 'Muscle Building':
        terms = terms.map(term => `high protein ${term}`);
        break;
      case 'Weight Loss':
        terms = terms.map(term => `low calorie ${term}`);
        break;
      case 'Athletic Performance':
        terms = terms.map(term => `performance ${term}`);
        break;
      case 'General Health':
        terms = terms.map(term => `nutritious ${term}`);
        break;
    }
  }

  // Exercise type specific modifications
  if (profile?.exerciseType) {
    switch (profile.exerciseType) {
      case 'Strength Training':
        terms = [...terms, 'muscle building', 'protein rich', 'recovery meal'];
        break;
      case 'Cardio':
        terms = [...terms, 'energy boost', 'endurance', 'light meal'];
        break;
      case 'Yoga':
        terms = [...terms, 'clean eating', 'mindful', 'plant based'];
        break;
    }
  }

  // Diet-specific terms
  if (userPrefs.diet) {
    switch (userPrefs.diet) {
      case 'high-protein':
        terms = terms.map(term => `high protein ${term}`);
        break;
      case 'low-carb':
        terms = terms.map(term => `low carb ${term}`);
        break;
      case 'gluten-free':
        terms = terms.map(term => `gluten free ${term}`);
        break;
      case 'dairy-free':
        terms = terms.map(term => `dairy free ${term}`);
        break;
    }
  }

  // Shuffle and add more randomness
  return terms.sort(() => Math.random() - 0.5).slice(0, 20);
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

    const { calories, diet, health, profile, day } = req.body

    if (!calories) {
      return res.status(400).json({ error: 'Calories parameter is required' })
    }

    // If CAREAI is configured, try Gemini-generated meal plan first
    const careKey = process.env.CAREAI
    if (careKey) {
      try {
        const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
        const system = 'You are a nutritionist. Generate a realistic daily meal plan with breakfast, lunch, dinner, and snacks matching the user\'s calories, goal, activity, exercise type, and allergies. Output concise JSON with specific fields.'
        const prompt = {
          calories,
          diet: diet || 'balanced',
          health: health || [],
          profile: profile || {},
          day: day || 'Daily'
        }
        const schemaHint = `Return JSON only with this structure: {"calories": number, "meals": {"breakfast": Recipe[], "lunch": Recipe[], "dinner": Recipe[], "snacks": Recipe[]}, "totalNutrition": {"calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number}}. Each Recipe: {"uri": string, "label": string, "image": string, "url": string, "yield": number, "calories": number, "totalTime": number, "ingredients": string[], "dietLabels": string[], "healthLabels": string[], "totalNutrients": {"ENERC_KCAL": {"quantity": number}, "PROCNT": {"quantity": number}, "CHOCDF": {"quantity": number}, "FAT": {"quantity": number}, "FIBTG": {"quantity": number}}}`

        const body = {
          generationConfig: { response_mime_type: 'application/json' },
          contents: [
            { role: 'user', parts: [{ text: `${system}\n\nUserInputs: ${JSON.stringify(prompt)}\n\n${schemaHint}` }] }
          ]
        }

        const aiRes = await fetch(`${endpoint}?key=${careKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        const aiJson = await aiRes.json()
        if (aiRes.ok) {
          const text = aiJson?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          if (text) {
            try {
              const parsed = JSON.parse(text)
              return res.status(200).json(stripImages(parsed))
            } catch {
              if (typeof aiJson?.candidates?.[0]?.content?.parts?.[0]?.text === 'object') {
                return res.status(200).json(stripImages(aiJson.candidates[0].content.parts[0].text))
              }
            }
          }
        }
        // If AI failed, continue to Edamam fallback below
      } catch (e) {
        console.error('Gemini meal-plan error, falling back:', e)
      }
    }

    // If weekly requested and Gemini not used/failed, try to build distinct plans per day
    if ((day === 'Weekly' || day === 'weekly') && (!careKey)) {
      try {
        const daysList = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
        const weekly: any = {}

        // Helper to build a daily plan using existing Edamam logic with day-aware variety
        const buildDaily = async (dayLabel: string) => {
          // Edamam API credentials
          const APP_ID = process.env.EDAMAM_RECIPE_APP_ID
          const APP_KEY = process.env.EDAMAM_RECIPE_APP_KEY
          if (!APP_ID || !APP_KEY) {
            throw new Error('API configuration error')
          }

          const mealCalories = {
            breakfast: Math.round(calories * 0.25),
            lunch: Math.round(calories * 0.35),
            dinner: Math.round(calories * 0.30),
            snack: Math.round(calories * 0.10)
          }
          const out: any = {
            calories,
            meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
            totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
          }
          const mealTypes = ['breakfast','lunch','dinner','snack']
          for (const mealType of mealTypes) {
            try {
              const baseUrl = 'https://api.edamam.com/api/recipes/v2'
              const searchTerms = getSearchTermsForProfile(mealType, { diet, health, profile, day: dayLabel })
              const randomSearchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)]
              const randomOffset = Math.floor(Math.random() * 100)
              const params = new URLSearchParams({
                type: 'public',
                app_id: APP_ID!,
                app_key: APP_KEY!,
                q: randomSearchTerm,
                mealType: mealType,
                calories: `${mealCalories[mealType as keyof typeof mealCalories] - 150}-${mealCalories[mealType as keyof typeof mealCalories] + 150}`,
                imageSize: 'REGULAR',
                random: 'true',
                from: randomOffset.toString(),
                to: (randomOffset + 15).toString(),
                time: `1-${Math.floor(Math.random() * 120) + 30}`
              })
              if (diet && diet !== 'balanced') {
                if (diet === 'high-protein') params.append('nutrients[PROCNT]', '25+')
                else if (diet === 'low-carb') params.append('nutrients[CHOCDF]', '0-30')
                else if (diet === 'low-fat') params.append('nutrients[FAT]', '0-10')
                else params.append('diet', diet)
              }
              if (health && health.length > 0) {
                health.forEach((restriction: string) => {
                  if (restriction === 'nuts') { params.append('health', 'tree-nut-free'); params.append('health', 'peanut-free') }
                  else if (restriction === 'dairy') params.append('health', 'dairy-free')
                  else if (restriction === 'gluten') params.append('health', 'gluten-free')
                  else if (restriction === 'eggs') params.append('health', 'egg-free')
                  else if (restriction === 'soy') params.append('health', 'soy-free')
                  else if (restriction === 'fish') params.append('health', 'fish-free')
                  else if (restriction === 'shellfish') params.append('health', 'shellfish-free')
                  else params.append('health', restriction)
                })
              }
              if (profile?.goal) {
                switch (profile.goal) {
                  case 'Muscle Building': params.append('nutrients[PROCNT]', '20+'); break
                  case 'Weight Loss': params.append('nutrients[ENERC_KCAL]', `0-${mealCalories[mealType as keyof typeof mealCalories]}`); break
                  case 'Athletic Performance': params.append('nutrients[CHOCDF]', '30+'); break
                }
              }
              const apiUrl = `${baseUrl}?${params.toString()}`
              const response = await fetch(apiUrl)
              if (!response.ok) continue
              const data: any = await response.json()
              const recipes = (data?.hits || []).slice(0, 3).map((hit: any) => {
                const recipe = hit.recipe
                return {
                  uri: recipe.uri,
                  label: recipe.label,
                  image: null, // prevent image fetching
                  url: recipe.url,
                  yield: recipe.yield,
                  calories: Math.round((recipe.calories || 0) / (recipe.yield || 1)),
                  totalTime: recipe.totalTime || 30,
                  ingredients: (recipe.ingredients || []).map((ing: any) => ing.text),
                  dietLabels: recipe.dietLabels || [],
                  healthLabels: recipe.healthLabels || [],
                  totalNutrients: {
                    ENERC_KCAL: { quantity: recipe.totalNutrients?.ENERC_KCAL?.quantity || 0 },
                    PROCNT: { quantity: recipe.totalNutrients?.PROCNT?.quantity || 0 },
                    CHOCDF: { quantity: recipe.totalNutrients?.CHOCDF?.quantity || 0 },
                    FAT: { quantity: recipe.totalNutrients?.FAT?.quantity || 0 },
                    FIBTG: { quantity: recipe.totalNutrients?.FIBTG?.quantity || 0 }
                  }
                }
              })
              if (mealType === 'snack') out.meals.snacks = recipes
              else out.meals[mealType as keyof typeof out.meals] = recipes
              recipes.forEach((r: any) => {
                out.totalNutrition.calories += Math.round(r.calories)
                out.totalNutrition.protein += Math.round(r.totalNutrients.PROCNT.quantity / r.yield)
                out.totalNutrition.carbs += Math.round(r.totalNutrients.CHOCDF.quantity / r.yield)
                out.totalNutrition.fat += Math.round(r.totalNutrients.FAT.quantity / r.yield)
                out.totalNutrition.fiber += Math.round(r.totalNutrients.FIBTG.quantity / r.yield)
              })
              await new Promise(res => setTimeout(res, 150))
            } catch {}
          }
          return out
        }

        for (const d of daysList) {
          weekly[d] = await buildDaily(d)
        }

        return res.status(200).json(stripImages(weekly))
      } catch (e) {
        console.error('Weekly Edamam fallback failed:', e)
      }
    }

    // Edamam API credentials (fallback daily plan)
    const APP_ID = process.env.EDAMAM_RECIPE_APP_ID
    const APP_KEY = process.env.EDAMAM_RECIPE_APP_KEY

    if (!APP_ID || !APP_KEY) {
      console.error('Missing Edamam API credentials')
      return res.status(500).json({ error: 'API configuration error' })
    }

    // Calculate calories per meal type with better distribution
    const mealCalories = {
      breakfast: Math.round(calories * 0.25), // 25%
      lunch: Math.round(calories * 0.35),     // 35%
      dinner: Math.round(calories * 0.30),    // 30%
      snack: Math.round(calories * 0.10)      // 10%
    }

    const mealPlan: {
      calories: number,
      meals: {
        breakfast: any[],
        lunch: any[],
        dinner: any[],
        snacks: any[]
      },
      totalNutrition: {
        calories: number,
        protein: number,
        carbs: number,
        fat: number,
        fiber: number
      }
    } = {
      calories,
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
      },
      totalNutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      }
    }

    // Fetch recipes for each meal type
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
    
    for (const mealType of mealTypes) {
      try {
        // Build Edamam API URL with enhanced search terms
        const baseUrl = 'https://api.edamam.com/api/recipes/v2'
        
        // Add variety with different search terms based on user profile and day
        const searchTerms = getSearchTermsForProfile(mealType, { diet, health, profile, day })
        const randomSearchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)]
        
        // Add more randomization factors
        const timestamp = Date.now()
        const randomOffset = Math.floor(Math.random() * 100)
        
        const params = new URLSearchParams({
          type: 'public',
          app_id: APP_ID,
          app_key: APP_KEY,
          q: randomSearchTerm,
          mealType: mealType,
          calories: `${mealCalories[mealType as keyof typeof mealCalories] - 150}-${mealCalories[mealType as keyof typeof mealCalories] + 150}`,
          imageSize: 'REGULAR',
          random: 'true',
          from: randomOffset.toString(),
          to: (randomOffset + 15).toString(),
          time: `1-${Math.floor(Math.random() * 120) + 30}`
        })

        // Add diet preferences with enhanced logic
        if (diet && diet !== 'balanced') {
          if (diet === 'high-protein') {
            params.append('nutrients[PROCNT]', '25+')
          } else if (diet === 'low-carb') {
            params.append('nutrients[CHOCDF]', '0-30')
          } else if (diet === 'low-fat') {
            params.append('nutrients[FAT]', '0-10')
          } else {
            params.append('diet', diet)
          }
        }

        // Add health restrictions based on allergies
        if (health && health.length > 0) {
          health.forEach((restriction: string) => {
            if (restriction === 'nuts') {
              params.append('health', 'tree-nut-free')
              params.append('health', 'peanut-free')
            } else if (restriction === 'dairy') {
              params.append('health', 'dairy-free')
            } else if (restriction === 'gluten') {
              params.append('health', 'gluten-free')
            } else if (restriction === 'eggs') {
              params.append('health', 'egg-free')
            } else if (restriction === 'soy') {
              params.append('health', 'soy-free')
            } else if (restriction === 'fish') {
              params.append('health', 'fish-free')
            } else if (restriction === 'shellfish') {
              params.append('health', 'shellfish-free')
            } else {
              params.append('health', restriction)
            }
          })
        }

        // Add goal-specific nutritional parameters
        if (profile?.goal) {
          switch (profile.goal) {
            case 'Muscle Building':
              params.append('nutrients[PROCNT]', '20+')
              break;
            case 'Weight Loss':
              params.append('nutrients[ENERC_KCAL]', `0-${mealCalories[mealType as keyof typeof mealCalories]}`)
              break;
            case 'Athletic Performance':
              params.append('nutrients[CHOCDF]', '30+')
              break;
          }
        }

        const apiUrl = `${baseUrl}?${params.toString()}`
        console.log(`Fetching ${mealType} recipes for ${day || 'daily'} plan:`, randomSearchTerm)

        const response = await fetch(apiUrl)
        
        if (!response.ok) {
          console.error(`Edamam API error for ${mealType}:`, response.status, response.statusText)
          
          // Use enhanced fallback recipes
          const fallbackRecipes = getEnhancedFallbackRecipes(mealType, mealCalories[mealType as keyof typeof mealCalories], profile)
          
          if (mealType === 'snack') {
            mealPlan.meals.snacks = fallbackRecipes
          } else {
            mealPlan.meals[mealType as keyof typeof mealPlan.meals] = fallbackRecipes
          }

          // Add fallback nutrition to totals
          fallbackRecipes.forEach(recipe => {
            mealPlan.totalNutrition.calories += Math.round(recipe.calories)
            mealPlan.totalNutrition.protein += Math.round(recipe.totalNutrients.PROCNT.quantity / recipe.yield)
            mealPlan.totalNutrition.carbs += Math.round(recipe.totalNutrients.CHOCDF.quantity / recipe.yield)
            mealPlan.totalNutrition.fat += Math.round(recipe.totalNutrients.FAT.quantity / recipe.yield)
            mealPlan.totalNutrition.fiber += Math.round(recipe.totalNutrients.FIBTG.quantity / recipe.yield)
          })
          
          continue
        }

        const data: EdamamResponse = await response.json()
        
        if (!data.hits || data.hits.length === 0) {
          console.warn(`No recipes found for ${mealType}`)
          
          // Use enhanced fallback recipes
          const fallbackRecipes = getEnhancedFallbackRecipes(mealType, mealCalories[mealType as keyof typeof mealCalories], profile)
          
          if (mealType === 'snack') {
            mealPlan.meals.snacks = fallbackRecipes
          } else {
            mealPlan.meals[mealType as keyof typeof mealPlan.meals] = fallbackRecipes
          }

          // Add fallback nutrition to totals
          fallbackRecipes.forEach(recipe => {
            mealPlan.totalNutrition.calories += Math.round(recipe.calories)
            mealPlan.totalNutrition.protein += Math.round(recipe.totalNutrients.PROCNT.quantity / recipe.yield)
            mealPlan.totalNutrition.carbs += Math.round(recipe.totalNutrients.CHOCDF.quantity / recipe.yield)
            mealPlan.totalNutrition.fat += Math.round(recipe.totalNutrients.FAT.quantity / recipe.yield)
            mealPlan.totalNutrition.fiber += Math.round(recipe.totalNutrients.FIBTG.quantity / recipe.yield)
          })
          
          continue
        }

        // Process recipes with enhanced data
        const recipes = data.hits.slice(0, 3).map(hit => {
          const recipe = hit.recipe
          return {
            uri: recipe.uri,
            label: recipe.label,
            image: null, // prevent image fetching
            url: recipe.url,
            yield: recipe.yield,
            calories: Math.round(recipe.calories / recipe.yield), // Per serving
            totalTime: recipe.totalTime || 30,
            ingredients: recipe.ingredients.map(ing => ing.text),
            dietLabels: recipe.dietLabels,
            healthLabels: recipe.healthLabels,
            totalNutrients: {
              ENERC_KCAL: { quantity: recipe.totalNutrients.ENERC_KCAL?.quantity || 0 },
              PROCNT: { quantity: recipe.totalNutrients.PROCNT?.quantity || 0 },
              CHOCDF: { quantity: recipe.totalNutrients.CHOCDF?.quantity || 0 },
              FAT: { quantity: recipe.totalNutrients.FAT?.quantity || 0 },
              FIBTG: { quantity: recipe.totalNutrients.FIBTG?.quantity || 0 }
            }
          }
        })

        if (mealType === 'snack') {
          mealPlan.meals.snacks = recipes
        } else {
          mealPlan.meals[mealType as keyof typeof mealPlan.meals] = recipes
        }

        // Add to total nutrition (per serving calculations)
        recipes.forEach(recipe => {
          mealPlan.totalNutrition.calories += Math.round(recipe.calories)
          mealPlan.totalNutrition.protein += Math.round(recipe.totalNutrients.PROCNT.quantity / recipe.yield)
          mealPlan.totalNutrition.carbs += Math.round(recipe.totalNutrients.CHOCDF.quantity / recipe.yield)
          mealPlan.totalNutrition.fat += Math.round(recipe.totalNutrients.FAT.quantity / recipe.yield)
          mealPlan.totalNutrition.fiber += Math.round(recipe.totalNutrients.FIBTG.quantity / recipe.yield)
        })

        // Add delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        console.error(`Error fetching ${mealType} recipes:`, error)
        
        // Use enhanced fallback recipes on error
        const fallbackRecipes = getEnhancedFallbackRecipes(mealType, mealCalories[mealType as keyof typeof mealCalories], profile)
        
        if (mealType === 'snack') {
          mealPlan.meals.snacks = fallbackRecipes
        } else {
          mealPlan.meals[mealType as keyof typeof mealPlan.meals] = fallbackRecipes
        }

        // Add fallback nutrition to totals
        fallbackRecipes.forEach(recipe => {
          mealPlan.totalNutrition.calories += Math.round(recipe.calories)
          mealPlan.totalNutrition.protein += Math.round(recipe.totalNutrients.PROCNT.quantity / recipe.yield)
          mealPlan.totalNutrition.carbs += Math.round(recipe.totalNutrients.CHOCDF.quantity / recipe.yield)
          mealPlan.totalNutrition.fat += Math.round(recipe.totalNutrients.FAT.quantity / recipe.yield)
          mealPlan.totalNutrition.fiber += Math.round(recipe.totalNutrients.FIBTG.quantity / recipe.yield)
        })
      }
    }

    res.status(200).json(stripImages(mealPlan))

  } catch (error) {
    console.error('Meal plan API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Enhanced fallback recipes with more variety and profile-based customization
function getEnhancedFallbackRecipes(mealType: string, targetCalories: number, profile?: UserProfile) {
  const goalBasedMealSets = {
    'Weight Loss': {
      breakfast: [
        {
          uri: 'fallback_breakfast_wl_1',
          label: 'Green Smoothie Bowl',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400',
          url: '#',
          yield: 1,
          calories: targetCalories,
          totalTime: 10,
          ingredients: ['Spinach', 'Banana', 'Almond milk', 'Chia seeds', 'Berries'],
          dietLabels: ['Low-Calorie'],
          healthLabels: ['Vegan', 'Gluten-Free'],
          totalNutrients: {
            ENERC_KCAL: { quantity: targetCalories },
            PROCNT: { quantity: 15 },
            CHOCDF: { quantity: 25 },
            FAT: { quantity: 8 },
            FIBTG: { quantity: 12 }
          }
        }
      ],
      lunch: [
        {
          uri: 'fallback_lunch_wl_1',
          label: 'Mediterranean Quinoa Salad',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
          url: '#',
          yield: 1,
          calories: targetCalories,
          totalTime: 20,
          ingredients: ['Quinoa', 'Cucumber', 'Tomatoes', 'Feta cheese', 'Olive oil', 'Lemon'],
          dietLabels: ['Low-Calorie', 'Mediterranean'],
          healthLabels: ['Vegetarian', 'Gluten-Free'],
          totalNutrients: {
            ENERC_KCAL: { quantity: targetCalories },
            PROCNT: { quantity: 20 },
            CHOCDF: { quantity: 30 },
            FAT: { quantity: 12 },
            FIBTG: { quantity: 8 }
          }
        }
      ],
      dinner: [
        {
          uri: 'fallback_dinner_wl_1',
          label: 'Grilled Fish with Steamed Vegetables',
          image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
          url: '#',
          yield: 1,
          calories: targetCalories,
          totalTime: 25,
          ingredients: ['White fish fillet', 'Broccoli', 'Carrots', 'Lemon', 'Herbs'],
          dietLabels: ['Low-Calorie', 'Low-Carb'],
          healthLabels: ['Pescatarian', 'Gluten-Free'],
          totalNutrients: {
            ENERC_KCAL: { quantity: targetCalories },
            PROCNT: { quantity: 35 },
            CHOCDF: { quantity: 15 },
            FAT: { quantity: 8 },
            FIBTG: { quantity: 6 }
          }
        }
      ],
      snack: [
        {
          uri: 'fallback_snack_wl_1',
          label: 'Apple with Almond Butter',
          image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400',
          url: '#',
          yield: 1,
          calories: targetCalories,
          totalTime: 0,
          ingredients: ['Apple', 'Almond butter'],
          dietLabels: ['Low-Calorie'],
          healthLabels: ['Vegan', 'Gluten-Free'],
          totalNutrients: {
            ENERC_KCAL: { quantity: targetCalories },
            PROCNT: { quantity: 6 },
            CHOCDF: { quantity: 15 },
            FAT: { quantity: 8 },
            FIBTG: { quantity: 4 }
          }
        }
      ]
    },
    'Muscle Building': {
      breakfast: [
        {
          uri: 'fallback_breakfast_mb_1',
          label: 'Protein Power Breakfast',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400',
          url: '#',
          yield: 1,
          calories: targetCalories,
          totalTime: 15,
          ingredients: ['Eggs', 'Greek yogurt', 'Protein powder', 'Oats', 'Berries', 'Nuts'],
          dietLabels: ['High-Protein'],
          healthLabels: ['Vegetarian'],
          totalNutrients: {
            ENERC_KCAL: { quantity: targetCalories },
            PROCNT: { quantity: 35 },
            CHOCDF: { quantity: 25 },
            FAT: { quantity: 15 },
            FIBTG: { quantity: 8 }
          }
        }
      ],
      lunch: [
        {
          uri: 'fallback_lunch_mb_1',
          label: 'Chicken and Quinoa Power Bowl',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
          url: '#',
          yield: 1,
          calories: targetCalories,
          totalTime: 30,
          ingredients: ['Grilled chicken breast', 'Quinoa', 'Black beans', 'Avocado', 'Sweet potato'],
          dietLabels: ['High-Protein'],
          healthLabels: ['Gluten-Free'],
          totalNutrients: {
            ENERC_KCAL: { quantity: targetCalories },
            PROCNT: { quantity: 40 },
            CHOCDF: { quantity: 35 },
            FAT: { quantity: 18 },
            FIBTG: { quantity: 12 }
          }
        }
      ],
      dinner: [
        {
          uri: 'fallback_dinner_mb_1',
          label: 'Lean Beef Stir Fry',
          image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
          url: '#',
          yield: 1,
          calories: targetCalories,
          totalTime: 25,
          ingredients: ['Lean beef', 'Brown rice', 'Mixed vegetables', 'Teriyaki sauce'],
          dietLabels: ['High-Protein'],
          healthLabels: ['Dairy-Free'],
          totalNutrients: {
            ENERC_KCAL: { quantity: targetCalories },
            PROCNT: { quantity: 45 },
            CHOCDF: { quantity: 30 },
            FAT: { quantity: 20 },
            FIBTG: { quantity: 8 }
          }
        }
      ],
      snack: [
        {
          uri: 'fallback_snack_mb_1',
          label: 'Protein Smoothie',
          image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400',
          url: '#',
          yield: 1,
          calories: targetCalories,
          totalTime: 5,
          ingredients: ['Protein powder', 'Banana', 'Peanut butter', 'Milk'],
          dietLabels: ['High-Protein'],
          healthLabels: ['Vegetarian'],
          totalNutrients: {
            ENERC_KCAL: { quantity: targetCalories },
            PROCNT: { quantity: 25 },
            CHOCDF: { quantity: 15 },
            FAT: { quantity: 10 },
            FIBTG: { quantity: 3 }
          }
        }
      ]
    }
  }

  // Default fallback
  const defaultFallback = {
    breakfast: [
      {
        uri: 'fallback_breakfast_default_1',
        label: 'Balanced Breakfast Bowl',
        image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400',
        url: '#',
        yield: 1,
        calories: targetCalories,
        totalTime: 15,
        ingredients: ['Oats', 'Greek yogurt', 'Berries', 'Honey', 'Nuts'],
        dietLabels: ['Balanced'],
        healthLabels: ['Vegetarian'],
        totalNutrients: {
          ENERC_KCAL: { quantity: targetCalories },
          PROCNT: { quantity: 20 },
          CHOCDF: { quantity: 30 },
          FAT: { quantity: 12 },
          FIBTG: { quantity: 8 }
        }
      }
    ],
    lunch: [
      {
        uri: 'fallback_lunch_default_1',
        label: 'Balanced Lunch Plate',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
        url: '#',
        yield: 1,
        calories: targetCalories,
        totalTime: 25,
        ingredients: ['Grilled protein', 'Mixed vegetables', 'Whole grains', 'Healthy fats'],
        dietLabels: ['Balanced'],
        healthLabels: ['Gluten-Free'],
        totalNutrients: {
          ENERC_KCAL: { quantity: targetCalories },
          PROCNT: { quantity: 25 },
          CHOCDF: { quantity: 35 },
          FAT: { quantity: 15 },
          FIBTG: { quantity: 10 }
        }
      }
    ],
    dinner: [
      {
        uri: 'fallback_dinner_default_1',
        label: 'Balanced Dinner',
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
        url: '#',
        yield: 1,
        calories: targetCalories,
        totalTime: 30,
        ingredients: ['Lean protein', 'Roasted vegetables', 'Complex carbs', 'Herbs'],
        dietLabels: ['Balanced'],
        healthLabels: ['Gluten-Free'],
        totalNutrients: {
          ENERC_KCAL: { quantity: targetCalories },
          PROCNT: { quantity: 30 },
          CHOCDF: { quantity: 25 },
          FAT: { quantity: 18 },
          FIBTG: { quantity: 8 }
        }
      }
    ],
    snack: [
      {
        uri: 'fallback_snack_default_1',
        label: 'Balanced Snack',
        image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400',
        url: '#',
        yield: 1,
        calories: targetCalories,
        totalTime: 5,
        ingredients: ['Nuts', 'Fruit', 'Yogurt'],
        dietLabels: ['Balanced'],
        healthLabels: ['Vegetarian'],
        totalNutrients: {
          ENERC_KCAL: { quantity: targetCalories },
          PROCNT: { quantity: 8 },
          CHOCDF: { quantity: 15 },
          FAT: { quantity: 10 },
          FIBTG: { quantity: 5 }
        }
      }
    ]
  }

  // Select based on user goal
  const goalMeals = profile?.goal && goalBasedMealSets[profile.goal as keyof typeof goalBasedMealSets] 
    ? goalBasedMealSets[profile.goal as keyof typeof goalBasedMealSets]
    : defaultFallback;

  return goalMeals[mealType as keyof typeof goalMeals] || defaultFallback[mealType as keyof typeof defaultFallback] || [];
} 