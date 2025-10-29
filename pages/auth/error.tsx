import { useRouter } from 'next/router'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, Home } from 'lucide-react'

const errors = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You denied access to the application.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An error occurred during authentication.',
}

export default function ErrorPage() {
  const router = useRouter()
  const { error } = router.query

  const errorMessage = error && typeof error === 'string' 
    ? errors[error as keyof typeof errors] || errors.Default
    : errors.Default

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="wellness-card p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Authentication Error
          </h1>
          
          <p className="text-muted-foreground mb-8">
            {errorMessage}
          </p>

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="wellness-button w-full bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-6 w-7" />
              Try Again
            </Link>
            
            <Link
              href="/"
              className="wellness-button w-full bg-secondary text-secondary-foreground hover:bg-secondary/60 inline-flex items-center justify-center gap-2"
            >
              <Home className="h-6 w-7" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 