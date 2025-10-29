import { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Settings, 
  TrendingUp, 
  User, 
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Utensils,

  Package,
  Wrench,
  ChevronDown,
  Bookmark
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Tools', href: '/tools', icon: Wrench },
    { name: 'Todo', href: '/todo', icon: TrendingUp },


  ]

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' })
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and primary nav */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">F</span>
                  </div>
                  <span className="font-bold text-xl text-foreground hidden sm:block">
                    FitAi
                  </span>
                </Link>
              </div>

              {/* Desktop navigation */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = router.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors',
                        isActive
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute top-2 left-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </button>

              {/* User menu */}
              {session ? (
                <div className="relative" ref={dropdownRef}>
                  {/* Profile Button */}
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-2 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-foreground">
                      {session.user?.name || session.user?.email}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-md shadow-lg z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-border">
                          <p className="text-sm font-medium text-foreground">
                            {session.user?.name || 'User'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.user?.email}
                          </p>
                        </div>
                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Bookmark className="w-4 h-4 mr-3" />
                          Saved Plans
                        </Link>
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false)
                            handleSignOut()
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-background border-t border-border">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = router.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
              
              {session && (
                <div className="border-t border-border pt-3 mt-3">
                  <Link
                    href="/profile"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Bookmark className="w-5 h-5 mr-3" />
                    Saved Plans
                  </Link>
                  <div className="flex items-center px-3 py-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {session.user?.name || session.user?.email}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 