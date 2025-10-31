import { useState } from 'react'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import axios from 'axios'
import { Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react'
import { registerSchema, type RegisterInput } from '@/lib/validations'
import { cn } from '@/lib/utils'
import { FcGoogle } from 'react-icons/fc'
import { FaFacebook, FaTwitter } from 'react-icons/fa'
import { signIn, getSession } from 'next-auth/react'
export default function Register() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const handleSocialSignIn = async (provider: string) => {
    try {
      setSocialLoading(provider)
      setError('')
      
      const result = await signIn(provider, {
        callbackUrl: '/dashboard',
        redirect: false,
      })
      
      if (result?.error) {
        setError(`Failed to sign in with ${provider}. Please try again.`)
      } else if (result?.ok) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error(`${provider} sign-in error:`, error)
      setError(`An error occurred while signing in with ${provider}`)
    } finally {
      setSocialLoading(null)
    }
  }

  const onSubmit = async (data: RegisterInput) => {
    try {
      setIsLoading(true)
      setError('')

      const response = await axios.post('/api/auth/register', data)

      if (response.status === 201) {
        router.push('/auth/login?message=Account created successfully. Please sign in.')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(
        error.response?.data?.message || 'Failed to create account. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="wellness-card p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">Create your account</h2>
            <p className="text-muted-foreground mt-2">
              Start your wellness journey today
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Full name
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className={cn(
                  'wellness-input',
                  errors.name && 'border-destructive focus-visible:ring-destructive'
                )}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className={cn(
                  'wellness-input',
                  errors.email && 'border-destructive focus-visible:ring-destructive'
                )}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={cn(
                    'wellness-input pr-10',
                    errors.password && 'border-destructive focus-visible:ring-destructive'
                  )}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'wellness-button w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create account
                </>
              )}
            </button>
          </form>
          <div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-border" />
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="bg-background px-2 text-muted-foreground">
      Or continue with
    </span>
  </div>
</div>

{/* Social login buttons */}
<div className="grid grid-cols-1 gap-4">
  <button
    onClick={() => handleSocialSignIn('google')}
    type="button"
    className="wellness-button w-full flex items-center justify-center gap-2 bg-black border text-white hover:bg-gray-600"
  >
    {socialLoading === 'google' ? (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </>
    ) : (
      <>
        <FcGoogle className="h-8 w-5" />
        Continue with Google
      </>
    )}
  </button>
</div>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
} 