import React, { useState, useEffect } from 'react'
import { getSession } from 'next-auth/react'
import { GetServerSideProps } from 'next'
import Layout from '@/components/Layout'
import { User, Bookmark, Calendar, Clock, Target, Activity, Trash2 } from 'lucide-react'

interface SavedPlan {
  id: string;
  name: string;
  type: 'daily' | 'weekly';
  createdAt: string;
  profile?: any;
  preferences?: any;
  data: any;
}

export default function Profile() {
  const [savedMealPlans, setSavedMealPlans] = useState<SavedPlan[]>([]);
  const [savedWorkoutPlans, setSavedWorkoutPlans] = useState<SavedPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'meals' | 'workouts'>('meals');

  useEffect(() => {
    loadSavedPlans();
  }, []);

  const loadSavedPlans = () => {
    const mealPlans = JSON.parse(localStorage.getItem('savedMealPlans') || '[]');
    const workoutPlans = JSON.parse(localStorage.getItem('savedWorkoutPlans') || '[]');
    
    setSavedMealPlans(mealPlans);
    setSavedWorkoutPlans(workoutPlans);
  };

  const deletePlan = (type: 'meals' | 'workouts', planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      if (type === 'meals') {
        const updated = savedMealPlans.filter(plan => plan.id !== planId);
        setSavedMealPlans(updated);
        localStorage.setItem('savedMealPlans', JSON.stringify(updated));
      } else {
        const updated = savedWorkoutPlans.filter(plan => plan.id !== planId);
        setSavedWorkoutPlans(updated);
        localStorage.setItem('savedWorkoutPlans', JSON.stringify(updated));
      }
    }
  };

  const loadPlan = (type: 'meals' | 'workouts', planId: string) => {
    const plans = type === 'meals' ? savedMealPlans : savedWorkoutPlans;
    const plan = plans.find(p => p.id === planId);
    
    if (plan) {
      // Store the plan to load in localStorage
      localStorage.setItem('planToLoad', JSON.stringify({ type, planId, plan }));
      
      // Navigate to the appropriate tool
      if (type === 'meals') {
        window.location.href = '/tools#meal-generator';
      } else {
        window.location.href = '/tools#exercise-assistant';
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <Bookmark className="w-8 h-8 text-primary" />
            Saved Plans
          </h1>
          <p className="text-muted-foreground">Manage your saved meal plans and workout routines</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('meals')}
              className={`px-6 py-3 rounded-md transition-colors font-medium ${
                activeTab === 'meals' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bookmark className="w-4 h-4 inline mr-2" />
              Saved Meal Plans ({savedMealPlans.length})
            </button>
            <button
              onClick={() => setActiveTab('workouts')}
              className={`px-6 py-3 rounded-md transition-colors font-medium ${
                activeTab === 'workouts' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Saved Workouts ({savedWorkoutPlans.length})
            </button>
          </div>
        </div>

        {/* Saved Meal Plans */}
        {activeTab === 'meals' && (
          <div className="space-y-6">
            {savedMealPlans.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Saved Meal Plans</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't saved any meal plans yet. Create and save meal plans to access them here.
                </p>
                <a
                  href="/tools#meal-generator"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md inline-flex items-center gap-2"
                >
                  Create Meal Plan
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedMealPlans.map((plan) => (
                  <div key={plan.id} className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-lg text-foreground line-clamp-2">{plan.name}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => deletePlan('meals', plan.id)}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {new Date(plan.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span>Type: {plan.type === 'weekly' ? 'Weekly Plan' : 'Daily Plan'}</span>
                      </div>
                      {plan.profile && (
                        <>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            <span>Goal: {plan.profile.goal}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Exercise: {plan.profile.exerciseType}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Quick Preview */}
                    {plan.data && plan.data.totalNutrition && (
                      <div className="bg-muted rounded-lg p-3 mb-4">
                        <h4 className="text-sm font-medium mb-2">Nutrition Summary</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Calories: {plan.data.totalNutrition.calories}</div>
                          <div>Protein: {plan.data.totalNutrition.protein}g</div>
                          <div>Carbs: {plan.data.totalNutrition.carbs}g</div>
                          <div>Fat: {plan.data.totalNutrition.fat}g</div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => loadPlan('meals', plan.id)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md text-sm font-medium"
                    >
                      View & Load Plan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Workout Plans */}
        {activeTab === 'workouts' && (
          <div className="space-y-6">
            {savedWorkoutPlans.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Saved Workout Plans</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't saved any workout plans yet. Create and save workout plans to access them here.
                </p>
                <a
                  href="/tools#exercise-assistant"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md inline-flex items-center gap-2"
                >
                  Create Workout Plan
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedWorkoutPlans.map((plan) => (
                  <div key={plan.id} className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-lg text-foreground line-clamp-2">{plan.name}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => deletePlan('workouts', plan.id)}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {new Date(plan.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span>Type: {plan.type === 'weekly' ? 'Weekly Plan' : 'Daily Workout'}</span>
                      </div>
                      {plan.preferences && (
                        <>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            <span>Level: {plan.preferences.fitnessLevel}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Type: {plan.preferences.workoutType}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Duration: {plan.preferences.duration} min</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Quick Preview */}
                    {plan.data && plan.data.exercises && (
                      <div className="bg-muted rounded-lg p-3 mb-4">
                        <h4 className="text-sm font-medium mb-2">Workout Overview</h4>
                        <div className="text-xs space-y-1">
                          <div>Exercise Count: {plan.data.exercises.length}</div>
                          <div>Difficulty: {plan.data.difficulty}</div>
                          <div>Duration: {plan.data.duration} minutes</div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => loadPlan('workouts', plan.id)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md text-sm font-medium"
                    >
                      View & Load Plan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  return {
    props: {
      session,
    },
  }
} 