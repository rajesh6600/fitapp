import { useState } from 'react'
import { useRouter } from 'next/router'
import { signIn, getSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { cn } from '@/lib/utils'
// Add this import at the top
import { FcGoogle } from 'react-icons/fc'
import { FaFacebook, FaTwitter } from 'react-icons/fa'


export default function Login() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
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

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsLoading(true)
      setError('')

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        return
      }

      // Refresh session and redirect
      await getSession()
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="wellness-card p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to continue your wellness journey
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                autoComplete="email"
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
                  autoComplete="current-password"
                  className={cn(

                    'wellness-input pr-10',
                    errors.password && 'border-destructive focus-visible:ring-destructive'
                  )}
                  placeholder="Enter your password"
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
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign in
                </>
              )}
            </button>
          </form>
          {/* Social login divider */}
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

  <button
    onClick={() => handleSocialSignIn('facebook')}
    type="button"
    className="wellness-button w-full flex items-center justify-center gap-2 bg-black border text-white hover:bg-[#404c5b]"
  >
    {socialLoading === 'facebook' ? (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </>
    ) : (
      <>
        <FaFacebook className="h-8 w-5" />
        Continue with Facebook
      </>
    )}
  </button>

  <button
    onClick={() => handleSocialSignIn('twitter')}
    type="button"
    className="wellness-button w-full flex items-center justify-center gap-2 bg-black border text-white hover:bg-gray-600"
  >
    {socialLoading === 'twitter' ? (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </>
    ) : (
      <>
        <FaTwitter className="h-8 w-5" />
        Continue with Twitter (X)
      </>
    )}
  </button>
</div>


          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium">
                Sign up
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