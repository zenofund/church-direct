import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Users, 
  Church as ChurchIcon, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trash2,
  Shield,
  User,
  MoreHorizontal
} from 'lucide-react'

interface Church {
  id: string
  name: string
  address: string
  city: string
  state: string
  minister_name: string
  contact_phone: string
  is_approved: boolean
  created_at: string
  submitted_by: string
  user_profiles?: {
    full_name: string
    email: string
  }
}

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'member' | 'admin'
  is_approved: boolean
  created_at: string
}

const ITEMS_PER_PAGE = 20

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'churches' | 'users'>('churches')
  const [churches, setChurches] = useState<Church[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [displayedChurches, setDisplayedChurches] = useState<Church[]>([])
  const [displayedUsers, setDisplayedUsers] = useState<UserProfile[]>([])
  const [churchPage, setChurchPage] = useState(1)
  const [userPage, setUserPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMoreChurches, setLoadingMoreChurches] = useState(false)
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    updateDisplayedChurches(1)
  }, [churches])

  useEffect(() => {
    updateDisplayedUsers(1)
  }, [users])

  const updateDisplayedChurches = (page: number) => {
    const startIndex = 0
    const endIndex = page * ITEMS_PER_PAGE
    setDisplayedChurches(churches.slice(startIndex, endIndex))
  }

  const updateDisplayedUsers = (page: number) => {
    const startIndex = 0
    const endIndex = page * ITEMS_PER_PAGE
    setDisplayedUsers(users.slice(startIndex, endIndex))
  }

  const fetchData = async () => {
    try {
      // Fetch churches with user profiles
      const { data: churchData, error: churchError } = await supabase
        .from('churches')
        .select(`
          *,
          user_profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (churchError) throw churchError

      // Fetch user profiles
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (userError) throw userError

      setChurches(churchData || [])
      setUsers(userData || [])
    } catch (error: any) {
      setError(error.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMoreChurches = () => {
    setLoadingMoreChurches(true)
    setTimeout(() => {
      const nextPage = churchPage + 1
      setChurchPage(nextPage)
      updateDisplayedChurches(nextPage)
      setLoadingMoreChurches(false)
    }, 500)
  }

  const handleLoadMoreUsers = () => {
    setLoadingMoreUsers(true)
    setTimeout(() => {
      const nextPage = userPage + 1
      setUserPage(nextPage)
      updateDisplayedUsers(nextPage)
      setLoadingMoreUsers(false)
    }, 500)
  }

  const updateChurchStatus = async (churchId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('churches')
        .update({ is_approved: approved })
        .eq('id', churchId)

      if (error) throw error
      fetchData()
    } catch (error: any) {
      setError(error.message || 'Failed to update church status')
    }
  }

  const deleteChurch = async (churchId: string) => {
    if (!confirm('Are you sure you want to delete this church?')) return

    try {
      const { error } = await supabase
        .from('churches')
        .delete()
        .eq('id', churchId)

      if (error) throw error
      fetchData()
    } catch (error: any) {
      setError(error.message || 'Failed to delete church')
    }
  }

  const updateUserStatus = async (userId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_approved: approved })
        .eq('id', userId)

      if (error) throw error
      fetchData()
    } catch (error: any) {
      setError(error.message || 'Failed to update user status')
    }
  }

  const updateUserRole = async (userId: string, role: 'member' | 'admin') => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId)

      if (error) throw error
      fetchData()
    } catch (error: any) {
      setError(error.message || 'Failed to update user role')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

    try {
      // First delete the user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      // Then delete the auth user (requires admin privileges)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      
      if (authError) {
        console.error('Failed to delete auth user:', authError)
        // Profile was deleted but auth user remains - this is acceptable
      }

      fetchData()
    } catch (error: any) {
      setError(error.message || 'Failed to delete user')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const pendingChurches = churches.filter(c => !c.is_approved).length
  const pendingUsers = users.filter(u => !u.is_approved).length
  const hasMoreChurches = displayedChurches.length < churches.length
  const hasMoreUsers = displayedUsers.length < users.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage churches and users in the directory
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <ChurchIcon className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total Churches</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{churches.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-600" />
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Pending Churches</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{pendingChurches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-600" />
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Pending Users</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{pendingUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 lg:space-x-8 px-4 lg:px-6">
            <button
              onClick={() => setActiveTab('churches')}
              className={`py-3 lg:py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'churches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Churches ({churches.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 lg:py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Users ({users.length})
            </button>
          </nav>
        </div>

        <div className="p-4 lg:p-6">
          {activeTab === 'churches' ? (
            <div className="space-y-4">
              {displayedChurches.length > 0 && (
                <div className="text-sm text-gray-600 mb-4">
                  Showing {displayedChurches.length} of {churches.length} churches
                </div>
              )}
              
              {displayedChurches.map((church) => (
                <div
                  key={church.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 mb-4 lg:mb-0">
                      <div className="flex items-start space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 flex-1">{church.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${
                          church.is_approved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {church.is_approved ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          <span>{church.is_approved ? 'approved' : 'pending'}</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {church.address}, {church.city}, {church.state}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Minister: {church.minister_name} • {church.contact_phone}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">
                        Added by: {church.user_profiles?.full_name || 'Unknown'} ({church.user_profiles?.email})
                      </p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(church.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 lg:ml-4">
                      {!church.is_approved && (
                        <button
                          onClick={() => updateChurchStatus(church.id, true)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {church.is_approved && (
                        <button
                          onClick={() => updateChurchStatus(church.id, false)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          title="Unapprove"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteChurch(church.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {hasMoreChurches && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleLoadMoreChurches}
                    disabled={loadingMoreChurches}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadingMoreChurches ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <MoreHorizontal className="h-4 w-4" />
                        <span>Load More Churches</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedUsers.length > 0 && (
                <div className="text-sm text-gray-600 mb-4">
                  Showing {displayedUsers.length} of {users.length} users
                </div>
              )}
              
              {displayedUsers.map((user) => (
                <div
                  key={user.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 mb-4 lg:mb-0">
                      <div className="flex items-start space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 flex-1">{user.full_name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${
                            user.is_approved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.is_approved ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            <span>{user.is_approved ? 'approved' : 'pending'}</span>
                          </span>
                          
                          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role === 'admin' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                            <span>{user.role}</span>
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 lg:ml-4">
                      {!user.is_approved && (
                        <button
                          onClick={() => updateUserStatus(user.id, true)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {user.is_approved && (
                        <button
                          onClick={() => updateUserStatus(user.id, false)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          title="Unapprove"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}

                      {user.is_approved && (
                        <button
                          onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'member' : 'admin')}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title={user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {hasMoreUsers && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleLoadMoreUsers}
                    disabled={loadingMoreUsers}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadingMoreUsers ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <MoreHorizontal className="h-4 w-4" />
                        <span>Load More Users</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}