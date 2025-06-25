import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Church, 
  LogOut, 
  User, 
  Settings, 
  Plus,
  Home,
  Heart,
  ExternalLink
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, userProfile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { icon: Home, label: 'Directory', path: '/directory' },
    { icon: Plus, label: 'Add Church', path: '/add-church' },
    ...(isAdmin ? [{ icon: Settings, label: 'Admin', path: '/admin' }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Church className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">
                Church Directory
              </h1>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                {/* Support Me Button */}
                <a
                  href="https://paystack.shop/pay/caffeine"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm font-medium rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Heart className="h-4 w-4" />
                  <span>Buy me Coffee</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <div className="hidden sm:flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {userProfile?.full_name || user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {user && (
        <nav className="sm:hidden bg-white border-b border-gray-200">
          <div className="flex justify-around py-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                  location.pathname === item.path
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <item.icon className="h-5 w-5 mb-1" />
                {item.label}
              </button>
            ))}
            
            {/* Mobile Support Button */}
            <a
              href="https://paystack.shop/pay/caffeine"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center py-2 px-3 text-xs text-pink-600 hover:text-pink-700 transition-colors"
            >
              <Heart className="h-5 w-5 mb-1" />
              My Coffee
            </a>
          </div>
        </nav>
      )}

      {/* Desktop Navigation */}
      {user && (
        <nav className="hidden sm:block bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 py-4 text-sm font-medium transition-colors border-b-2 ${
                    location.pathname === item.path
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500" style={{ fontSize: '10px' }}>
              Made with ❤️ by{' '}
              <a
                href="https://elxis.com.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                eLxis
              </a>{' '}
              v.1.1.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}