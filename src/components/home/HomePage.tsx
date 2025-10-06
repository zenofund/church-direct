import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Search,
  MapPin,
  Church as ChurchIcon,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  Phone,
  Heart,
  Shield,
  Zap,
  Star,
  TrendingUp
} from 'lucide-react'

interface Church {
  id: string
  name: string
  address: string
  city: string
  state: string
  minister_name: string
  minister_phone?: string
  contact_phone: string
  sunday_service_time?: string
  photo_url?: string
  created_at: string
}

interface Stats {
  totalChurches: number
  totalStates: number
  recentListings: number
}

export function HomePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [featuredChurches, setFeaturedChurches] = useState<Church[]>([])
  const [stats, setStats] = useState<Stats>({ totalChurches: 0, totalStates: 0, recentListings: 0 })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: churches, error } = await supabase
        .from('churches')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error

      const { data: allChurches } = await supabase
        .from('churches')
        .select('state')
        .eq('is_approved', true)

      const uniqueStates = new Set(allChurches?.map(c => c.state) || [])

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: recentChurches } = await supabase
        .from('churches')
        .select('id')
        .eq('is_approved', true)
        .gte('created_at', thirtyDaysAgo.toISOString())

      setFeaturedChurches(churches || [])
      setStats({
        totalChurches: allChurches?.length || 0,
        totalStates: uniqueStates.size,
        recentListings: recentChurches?.length || 0
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/directory?search=${encodeURIComponent(searchTerm)}`)
    } else {
      navigate('/directory')
    }
  }

  const getImageUrl = (url?: string) => {
    if (!url || url === 'https://images.pexels.com/photos/8468689/pexels-photo-8468689.jpeg?auto=compress&cs=tinysrgb&w=400') {
      return '/default.png'
    }
    return url
  }

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20">
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDEyYzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L2c+PC9zdmc+')] opacity-20"></div>

        <div className="relative px-6 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-full mb-4">
              <ChurchIcon className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
              Find Churches of Christ
              <span className="block text-blue-200 mt-2">Across Nigeria</span>
            </h1>

            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Connect with congregations nationwide. Discover fellowship opportunities, service times, and contact information for Churches of Christ in your area.
            </p>

            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mt-8">
              <div className="relative flex flex-col sm:flex-row gap-3 bg-white rounded-xl sm:rounded-full p-2 shadow-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by church name, city, or state..."
                    className="w-full pl-12 pr-4 py-3 sm:py-4 text-gray-900 bg-transparent rounded-lg sm:rounded-full focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-full font-semibold transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  Search Directory
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto mt-12 pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-1">{stats.totalChurches}+</div>
                <div className="text-sm sm:text-base text-blue-200">Churches Listed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-1">{stats.totalStates}</div>
                <div className="text-sm sm:text-base text-blue-200">States Covered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-1">{stats.recentListings}</div>
                <div className="text-sm sm:text-base text-blue-200">Recent Additions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Recently Added Churches
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Explore the latest congregations added to our directory
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredChurches.map((church) => (
              <div
                key={church.id}
                onClick={() => navigate('/directory')}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 relative overflow-hidden">
                  <img
                    src={getImageUrl(church.photo_url)}
                    alt={church.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {church.name}
                  </h3>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-600 min-w-0">
                        <p className="font-medium">{church.city}, {church.state}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{church.minister_name}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{church.contact_phone}</p>
                    </div>

                    {church.sunday_service_time && (
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-900">{church.sunday_service_time}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center pt-4">
          <button
            onClick={() => navigate('/directory')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg font-semibold transition-colors shadow-md"
          >
            View All Churches
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 sm:p-12 text-center space-y-6">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-2">
          <Heart className="h-8 w-8 text-blue-600" />
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
          Add Your Church to Our Directory
        </h2>

        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Help others discover your congregation. Share your church's information and connect with believers seeking fellowship in your area.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          {user ? (
            <button
              onClick={() => navigate('/add-church')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg font-semibold transition-colors shadow-md"
            >
              <ChurchIcon className="h-5 w-5" />
              Add Your Church
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg font-semibold transition-colors shadow-md"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 px-8 py-3.5 rounded-lg font-semibold transition-colors border-2 border-gray-200"
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </section>

      <section className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Why Use Our Directory?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Trusted by congregations across Nigeria
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Verified Listings</h3>
            <p className="text-sm text-gray-600">All churches are verified to ensure accurate information</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Fast & Easy</h3>
            <p className="text-sm text-gray-600">Quick search and instant access to church details</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Nationwide Coverage</h3>
            <p className="text-sm text-gray-600">Churches across all states in Nigeria</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Always Updated</h3>
            <p className="text-sm text-gray-600">Regular updates with new church listings</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            Simple steps to connect with churches
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full font-bold text-2xl">
              1
            </div>
            <h3 className="font-bold text-lg text-gray-900">Search</h3>
            <p className="text-sm text-gray-600">
              Use our search feature to find churches by name, city, or state
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full font-bold text-2xl">
              2
            </div>
            <h3 className="font-bold text-lg text-gray-900">Discover</h3>
            <p className="text-sm text-gray-600">
              Browse detailed information including service times and contact details
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full font-bold text-2xl">
              3
            </div>
            <h3 className="font-bold text-lg text-gray-900">Connect</h3>
            <p className="text-sm text-gray-600">
              Call the church directly or get directions to visit in person
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-8 sm:p-12 text-center space-y-6">
        <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-full mb-2">
          <Star className="h-8 w-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Join Our Growing Community
        </h2>

        <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
          Be part of the largest directory of Churches of Christ in Nigeria. Help us build a comprehensive resource for believers nationwide.
        </p>

        <div className="flex flex-wrap gap-4 justify-center pt-4">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Free to Use</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Easy Registration</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Community Driven</span>
          </div>
        </div>
      </section>
    </div>
  )
}
