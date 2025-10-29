import React, { useState } from 'react';
import { User, Calendar, Bookmark, Eye, Plus, Minus, Clock, Users, Star } from 'lucide-react';

interface UserProfile {
  weight: string;
  height: string;
  age: string;
  exerciseType: string;
  goal: string;
  allergies: string[];
  activityLevel: string;
}

interface Recipe {
  uri: string;
  label: string;
  image?: string;
  url: string;
  yield: number;
  calories: number;
  totalTime: number;
  ingredients: string[];
  dietLabels: string[];
  healthLabels: string[];
  totalNutrients: {
    ENERC_KCAL: { quantity: number };
    PROCNT: { quantity: number };
    CHOCDF: { quantity: number };
    FAT: { quantity: number };
    FIBTG: { quantity: number };
  };
}

interface MealPlan {
  calories: number;
  meals: {
    breakfast: Recipe[];
    lunch: Recipe[];
    dinner: Recipe[];
    snacks: Recipe[];
  };
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

interface WeeklyMealPlan {
  [key: string]: MealPlan;
}

export default function MealPlanner() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    weight: '',
    height: '',
    age: '',
    exerciseType: '',
    goal: '',
    allergies: [],
    activityLevel: ''
  });
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyMealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [planType, setPlanType] = useState<'daily' | 'weekly'>('daily');

  const exerciseTypes = [
    'Cardio', 'Strength Training', 'CrossFit', 'Yoga', 'Pilates', 'Running', 'Cycling', 'Swimming', 'Mixed Training'
  ];

  const goals = [
    'Weight Loss', 'Muscle Building', 'Maintenance', 'Weight Gain', 'Athletic Performance', 'General Health'
  ];

  const allergyOptions = [
    'Nuts', 'Dairy', 'Gluten', 'Eggs', 'Soy', 'Fish', 'Shellfish', 'Sesame'
  ];

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little/no exercise)' },
    { value: 'light', label: 'Light (1-3 days/week)' },
    { value: 'moderate', label: 'Moderate (3-5 days/week)' },
    { value: 'active', label: 'Active (6-7 days/week)' },
    { value: 'extra', label: 'Very Active (2x/day, intense)' }
  ];

  const calculateCalories = () => {
    const weight = parseFloat(profile.weight);
    const height = parseFloat(profile.height);
    const age = parseFloat(profile.age);
    
    if (!weight || !height || !age) return 2000;

    const bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    
    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      extra: 1.9
    };
    
    const factor = activityFactors[profile.activityLevel as keyof typeof activityFactors] || 1.55;
    let calories = bmr * factor;

    if (profile.goal === 'Weight Loss') calories -= 500;
    if (profile.goal === 'Weight Gain') calories += 500;
    if (profile.goal === 'Muscle Building') calories += 300;

    return Math.round(calories);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const generateMealPlan = async () => {
    setLoading(true);
    setMealPlan(null);
    
    try {
      const calories = calculateCalories();
      const dietType = getDietFromGoalAndAllergies();
      
      const response = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calories,
          diet: dietType,
          health: profile.allergies.map(allergy => allergy.toLowerCase().replace(' ', '-')),
          profile: profile
        }),
      });

      const data = await response.json();
      setMealPlan(data);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      alert('Failed to generate meal plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyPlan = async () => {
    setLoading(true);
    setWeeklyPlan(null);
    
    try {
      const calories = calculateCalories();
      const dietType = getDietFromGoalAndAllergies();
      const response = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calories,
          diet: dietType,
          health: profile.allergies.map(allergy => allergy.toLowerCase().replace(' ', '-')),
          profile: profile,
          day: 'Weekly'
        }),
      });

      const data = await response.json();

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const weekly: WeeklyMealPlan = {};
      if (data && typeof data === 'object' && !Array.isArray(data) && data.Monday) {
        days.forEach((d) => { weekly[d] = data[d] || data; });
      } else {
        const requests = await Promise.all(days.map(async (d) => {
          const r = await fetch('/api/meal-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              calories,
              diet: dietType,
              health: profile.allergies.map(allergy => allergy.toLowerCase().replace(' ', '-')),
              profile: profile,
              day: d
            }),
          });
          return r.json();
        }))
        days.forEach((d, i) => { weekly[d] = requests[i]; });
      }

      setWeeklyPlan(weekly);
    } catch (error) {
      console.error('Error generating weekly plan:', error);
      alert('Failed to generate weekly plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDietFromGoalAndAllergies = () => {
    if (profile.goal === 'Muscle Building') return 'high-protein';
    if (profile.goal === 'Weight Loss') return 'low-carb';
    if (profile.allergies.includes('Gluten')) return 'gluten-free';
    if (profile.allergies.includes('Dairy')) return 'dairy-free';
    return 'balanced';
  };

  const getGoalTypeForDatabase = (goal: string): string => {
    const goalMapping: { [key: string]: string } = {
      'Weight Loss': 'WEIGHT_LOSS',
      'Muscle Building': 'BUILD_MUSCLE',
      'Weight Gain': 'WEIGHT_GAIN',
      'Athletic Performance': 'GENERAL_WELLNESS',
      'General Health': 'GENERAL_WELLNESS',
      'Maintenance': 'GENERAL_WELLNESS'
    };
    
    return goalMapping[goal] || 'GENERAL_WELLNESS';
  };



  const saveMealPlan = async () => {
    try {
      const planToSave = {
        id: Date.now().toString(),
        name: `${planType === 'weekly' ? 'Weekly' : 'Daily'} Plan - ${new Date().toLocaleDateString()}`,
        type: planType,
        profile: profile,
        data: planType === 'weekly' ? weeklyPlan : mealPlan,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage for now (you can implement API later)
      const saved = JSON.parse(localStorage.getItem('savedMealPlans') || '[]');
      saved.push(planToSave);
      localStorage.setItem('savedMealPlans', JSON.stringify(saved));
      setSavedPlans(saved);
      
      alert('Meal plan saved successfully!');
    } catch (error) {
      console.error('Error saving meal plan:', error);
      alert('Failed to save meal plan.');
    }
  };

  const loadSavedPlans = () => {
    const saved = JSON.parse(localStorage.getItem('savedMealPlans') || '[]');
    setSavedPlans(saved);
  };

  const loadPlan = (plan: any) => {
    try {
      setProfile(plan.profile);
      setPlanType(plan.type);
      
      if (plan.type === 'weekly') {
        setWeeklyPlan(plan.data);
        setMealPlan(null);
      } else {
        setMealPlan(plan.data);
        setWeeklyPlan(null);
      }
      
      setStep(2); // Go to meal planning view
      alert('Plan loaded successfully!');
    } catch (error) {
      console.error('Error loading plan:', error);
      alert('Failed to load plan.');
    }
  };

  React.useEffect(() => {
    loadSavedPlans();
    
    // Check if there's a plan to load from profile
    const planToLoad = localStorage.getItem('planToLoad');
    if (planToLoad) {
      try {
        const { type, planId, plan } = JSON.parse(planToLoad);
        console.log('Loading plan from profile:', { type, planId, plan });
        
        if (type === 'meals' && plan) {
          console.log('Setting meal plan data:', plan);
          setProfile(plan.profile);
          setPlanType(plan.type);
          
          if (plan.type === 'weekly') {
            setWeeklyPlan(plan.data);
            setMealPlan(null);
          } else {
            setMealPlan(plan.data);
            setWeeklyPlan(null);
          }
          
          setStep(2); // Go to meal planning view
          // Clear the plan to load
          localStorage.removeItem('planToLoad');
          console.log('Plan loaded successfully');
        }
      } catch (error) {
        console.error('Error loading plan from profile:', error);
        localStorage.removeItem('planToLoad');
      }
    }
  }, []);

  React.useEffect(() => {
    const planToLoad = localStorage.getItem('planToLoad');
    if (planToLoad && step === 1) {
      try {
        const { type, planId, plan } = JSON.parse(planToLoad);
        if (type === 'meals' && plan) {
          setProfile(plan.profile);
          setPlanType(plan.type);
          
          if (plan.type === 'weekly') {
            setWeeklyPlan(plan.data);
            setMealPlan(null);
          } else {
            setMealPlan(plan.data);
            setWeeklyPlan(null);
          }
          
          setStep(2);
          localStorage.removeItem('planToLoad');
        }
      } catch (error) {
        console.error('Error loading plan:', error);
        localStorage.removeItem('planToLoad');
      }
    }
  }, [step]);

  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Personalized Meal Planner</h2>
          <p className="text-muted-foreground">Tell us about yourself to get the perfect meal plan</p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                value={profile.weight}
                onChange={(e) => setProfile({...profile, weight: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="70"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Height (cm)
              </label>
              <input
                type="number"
                value={profile.height}
                onChange={(e) => setProfile({...profile, height: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="175"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Age
              </label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({...profile, age: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="25"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Exercise Type
              </label>
              <select
                value={profile.exerciseType}
                onChange={(e) => setProfile({...profile, exerciseType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select exercise type</option>
                {exerciseTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Goal
              </label>
              <select
                value={profile.goal}
                onChange={(e) => setProfile({...profile, goal: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select your goal</option>
                {goals.map(goal => (
                  <option key={goal} value={goal}>{goal}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Activity Level
            </label>
            <select
              value={profile.activityLevel}
              onChange={(e) => setProfile({...profile, activityLevel: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select activity level</option>
              {activityLevels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Allergies (Select all that apply)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {allergyOptions.map(allergy => (
                <label key={allergy} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={profile.allergies.includes(allergy)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setProfile({...profile, allergies: [...profile.allergies, allergy]});
                      } else {
                        setProfile({...profile, allergies: profile.allergies.filter(a => a !== allergy)});
                      }
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{allergy}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 px-6 rounded-md font-medium flex items-center justify-center gap-2"
          >
            <User className="w-5 h-5" />
            Continue to Meal Planning
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setStep(1)}
          className="bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 rounded-md"
        >
          ← Edit Profile
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Your Meal Plans</h2>
          <p className="text-muted-foreground">Estimated daily calories: {calculateCalories()}</p>
        </div>
        <div></div>
      </div>

      {/* Plan Type Selection */}
      <div className="flex justify-center mb-6">
        <div className="bg-muted p-1 rounded-lg">
          <button
            onClick={() => setPlanType('daily')}
            className={`px-4 py-2 rounded-md transition-colors ${
              planType === 'daily' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Daily Plan
          </button>
          <button
            onClick={() => setPlanType('weekly')}
            className={`px-4 py-2 rounded-md transition-colors ${
              planType === 'weekly' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Weekly Plan
          </button>
        </div>
      </div>

      {/* Generate Buttons */}
      <div className="flex justify-center gap-4 mb-8">
        {planType === 'daily' ? (
          <button
            onClick={generateMealPlan}
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 py-3 px-6 rounded-md font-medium flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Generate Daily Plan
              </>
            )}
          </button>
        ) : (
          <button
            onClick={generateWeeklyPlan}
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 py-3 px-6 rounded-md font-medium flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating Week...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                Generate Weekly Plan
              </>
            )}
          </button>
        )}

        {((planType === 'daily' && mealPlan) || (planType === 'weekly' && weeklyPlan)) && (
          <button
            onClick={saveMealPlan}
            className="bg-green-600 text-white hover:bg-green-700 py-3 px-6 rounded-md font-medium flex items-center gap-2"
          >
            <Bookmark className="w-5 h-5" />
            Save Plan
          </button>
        )}
      </div>

      {/* Daily Meal Plan */}
      {planType === 'daily' && mealPlan && (
        <div className="space-y-8">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Nutrition Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{mealPlan.totalNutrition.calories}</div>
                <div className="text-sm text-muted-foreground">Calories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{mealPlan.totalNutrition.protein}g</div>
                <div className="text-sm text-muted-foreground">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{mealPlan.totalNutrition.carbs}g</div>
                <div className="text-sm text-muted-foreground">Carbs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{mealPlan.totalNutrition.fat}g</div>
                <div className="text-sm text-muted-foreground">Fat</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{mealPlan.totalNutrition.fiber}g</div>
                <div className="text-sm text-muted-foreground">Fiber</div>
              </div>
            </div>
          </div>

          {Object.entries(mealPlan.meals).map(([mealType, meals]) => (
            <div key={mealType} className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold capitalize mb-4">{mealType}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meals.map((meal: Recipe, i: number) => (
                  <div key={i} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="relative mb-3">
                      {/* image removed */}
                      <div className="absolute top-2 right-2">
                        <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-xs">
                          {meal.calories} cal
                        </div>
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-lg mb-2 line-clamp-2">{meal.label}</h4>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {meal.totalTime || 30} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {meal.yield} servings
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setSelectedRecipe(meal)}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-3 rounded-md text-sm flex items-center justify-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Recipe
                      </button>
                    </div>

                    {meal.dietLabels && meal.dietLabels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {meal.dietLabels.slice(0, 3).map((label, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly Meal Plan */}
      {planType === 'weekly' && weeklyPlan && (
        <div className="space-y-6">
          {Object.entries(weeklyPlan).map(([day, dayPlan]) => (
            <div key={day} className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-2xl font-bold mb-4">{day}</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(dayPlan.meals).map(([mealType, meals]) => (
                  <div key={mealType}>
                    <h4 className="font-semibold capitalize mb-2 text-center">{mealType}</h4>
                        {meals.slice(0, 1).map((meal: Recipe, i: number) => (
                      <div key={i} className="border rounded-lg p-3">
                        {/* image removed */}
                        <h5 className="font-medium text-sm mb-2 line-clamp-2">{meal.label}</h5>
                        <div className="text-xs text-muted-foreground mb-2">
                          {meal.calories} cal • {meal.totalTime || 30} min
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setSelectedRecipe(meal)}
                            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-1 px-2 rounded text-xs"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedRecipe(null);
            }
          }}
        >
          <div className="bg-background border border-border rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-foreground">{selectedRecipe.label}</h2>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="text-muted-foreground hover:text-foreground text-2xl"
                >
                  ×
                </button>
              </div>
              
              {/* image removed */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Ingredients</h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-sm text-foreground">{ingredient}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Cooking Instructions */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3">Cooking Instructions</h3>
                    <div className="space-y-3">
                      <div className="bg-muted rounded-lg p-4">
                        <h4 className="font-medium text-foreground mb-2">Preparation Steps:</h4>
                        <ol className="space-y-2 text-sm text-foreground">
                          <li>1. Gather all ingredients listed above</li>
                          <li>2. Prep ingredients according to the ingredient list</li>
                          <li>3. Follow cooking method based on recipe type</li>
                          <li>4. Cook for approximately {selectedRecipe.totalTime || 30} minutes</li>
                          <li>5. Serve immediately while hot</li>
                        </ol>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                        <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Chef's Tips:</h4>
                        <ul className="space-y-1 text-sm text-blue-600 dark:text-blue-400">
                          <li>• Season to taste and adjust spices as needed</li>
                          <li>• Fresh ingredients will enhance the flavor</li>
                          <li>• Let the dish rest for 2-3 minutes before serving</li>
                          {selectedRecipe.dietLabels.includes('High-Protein') && (
                            <li>• Perfect for post-workout nutrition</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Nutrition Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calories:</span>
                      <span className="font-medium text-foreground">{selectedRecipe.calories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Protein:</span>
                      <span className="font-medium text-foreground">{Math.round(selectedRecipe.totalNutrients.PROCNT.quantity / selectedRecipe.yield)}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Carbs:</span>
                      <span className="font-medium text-foreground">{Math.round(selectedRecipe.totalNutrients.CHOCDF.quantity / selectedRecipe.yield)}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fat:</span>
                      <span className="font-medium text-foreground">{Math.round(selectedRecipe.totalNutrients.FAT.quantity / selectedRecipe.yield)}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fiber:</span>
                      <span className="font-medium text-foreground">{Math.round(selectedRecipe.totalNutrients.FIBTG.quantity / selectedRecipe.yield)}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Servings:</span>
                      <span className="font-medium text-foreground">{selectedRecipe.yield}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cook Time:</span>
                      <span className="font-medium text-foreground">{selectedRecipe.totalTime || 30} minutes</span>
                    </div>
                  </div>

                  {selectedRecipe.dietLabels && selectedRecipe.dietLabels.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2 text-foreground">Diet Labels:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecipe.dietLabels.map((label, i) => (
                          <span key={i} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Equipment & Difficulty */}
                  <div className="mt-6 space-y-4">
                    <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                      <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">Difficulty Level:</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(3)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < 2 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-sm text-green-600 dark:text-green-400">Easy to Medium</span>
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4">
                      <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">Equipment Needed:</h4>
                      <ul className="text-sm text-purple-600 dark:text-purple-400">
                        <li>• Basic kitchen utensils</li>
                        <li>• Cooking pan/pot</li>
                        <li>• Measuring cups</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 py-3 px-6 rounded-md font-medium"
                >
                  Close Recipe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access to Profile */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Want to manage all your saved plans?
        </p>
        <a
          href="/profile"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
        >
          <Bookmark className="w-4 h-4" />
          View Saved Plans
        </a>
      </div>
    </div>
  );
}
