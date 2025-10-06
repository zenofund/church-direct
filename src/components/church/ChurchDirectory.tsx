import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { ImageUpload } from '../ImageUpload'
import { formatPhoneInput, formatNigerianPhone } from '../../lib/phoneUtils'
import { Search, MapPin, Phone, User, Church as ChurchIcon, CreditCard as Edit, X, Calendar, Clock, Mail, ExternalLink, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

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
  submitted_by: string
  is_approved: boolean
}

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'
]

const SERVICE_TIMES = [
  '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM'
]

const ITEMS_PER_PAGE = 12

export function ChurchDirectory() {
  const [churches, setChurches] = useState<Church[]>([])
  const [filteredChurches, setFilteredChurches] = useState<Church[]>([])
  const [displayedChurches, setDisplayedChurches] = useState<Church[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [editingChurch, setEditingChurch] = useState<Church | null>(null)
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { user, isAdmin } = useAuth()
  const states = Array.from(new Set(churches.map(church => church.state))).sort()

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  useEffect(() => {
    fetchChurches()
  }, [])

  useEffect(() => {
    filterChurches()
  }, [searchTerm, selectedState, churches])

  useEffect(() => {
    setCurrentIndex(0)
    setCurrentPage(1)
    updateDisplayedChurches(1)
  }, [filteredChurches])

  const updateDisplayedChurches = (page: number) => {
    const startIndex = 0
    const endIndex = page * ITEMS_PER_PAGE
    setDisplayedChurches(filteredChurches.slice(startIndex, endIndex))
  }

  const fetchChurches = async () => {
    try {
      const { data, error } = await supabase
        .from('churches')
        .select('*')
        .eq('is_approved', true)
        .order('name')

      if (error) throw error
      setChurches(data || [])
    } catch (error: any) {
      setError(error.message || 'Failed to load churches')
    } finally {
      setLoading(false)
    }
  }

  const filterChurches = () => {
    let filtered = churches

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(church => 
        church.name.toLowerCase().includes(term) ||
        church.city.toLowerCase().includes(term) ||
        church.state.toLowerCase().includes(term) ||
        church.minister_name.toLowerCase().includes(term)
      )
    }

    if (selectedState) {
      filtered = filtered.filter(church => church.state === selectedState)
    }

    setFilteredChurches(filtered)
  }

  const handleLoadMore = () => {
    setLoadingMore(true)
    setTimeout(() => {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      updateDisplayedChurches(nextPage)
      setLoadingMore(false)
    }, 500)
  }

  const hasMoreItems = displayedChurches.length < filteredChurches.length

  const handleEditChurch = (church: Church) => {
    setEditingChurch(church)
  }

  // Check if user can edit a church (owner or admin)
  const canEditChurch = (church: Church) => {
    return user?.id === church.submitted_by || isAdmin
  }

  const uploadImageToSupabase = async (imageUrl: string): Promise<string> => {
    if (!imageUrl || imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
      return imageUrl // Return existing URL or default
    }

    try {
      // Convert blob URL to actual blob
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      // Generate unique filename
      const fileExt = 'jpg'
      const fileName = `church-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `churches/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('church-images')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('church-images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      // Return original URL if upload fails
      return imageUrl
    }
  }

  const handleUpdateChurch = async (updatedChurch: Church) => {
    try {
      // Upload image if it's a blob URL
      const finalPhotoUrl = await uploadImageToSupabase(updatedChurch.photo_url || '')

      // Format phone numbers before updating
      const formattedMinisterPhone = updatedChurch.minister_phone ? formatNigerianPhone(updatedChurch.minister_phone) : undefined
      const formattedContactPhone = formatNigerianPhone(updatedChurch.contact_phone)

      const { error } = await supabase
        .from('churches')
        .update({
          name: updatedChurch.name,
          address: updatedChurch.address,
          city: updatedChurch.city,
          state: updatedChurch.state,
          minister_name: updatedChurch.minister_name,
          minister_phone: formattedMinisterPhone,
          contact_phone: formattedContactPhone,
          sunday_service_time: updatedChurch.sunday_service_time,
          photo_url: finalPhotoUrl,
        })
        .eq('id', updatedChurch.id)

      if (error) throw error

      setEditingChurch(null)
      fetchChurches()
    } catch (error: any) {
      setError(error.message || 'Failed to update church')
    }
  }

  // Touch handlers for swipe gestures
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentIndex < filteredChurches.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(filteredChurches.length - 1, prev + 1))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 px-4">
          Church of Christ Directory
        </h1>
        <p className="text-gray-600 px-4">
          Find Churches of Christ across Nigeria
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by church name, city, or minister..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center px-2">
        <div className="text-sm text-gray-600">
          {filteredChurches.length} church{filteredChurches.length !== 1 ? 'es' : ''} found
        </div>
        
        {/* Mobile Navigation Indicators */}
        {filteredChurches.length > 0 && (
          <div className="flex items-center space-x-2 sm:hidden">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="p-2 rounded-full bg-white shadow-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-sm text-gray-600 px-2">
              {currentIndex + 1} of {filteredChurches.length}
            </span>
            <button
              onClick={goToNext}
              disabled={currentIndex === filteredChurches.length - 1}
              className="p-2 rounded-full bg-white shadow-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Church Cards */}
      <div className="relative">
        {/* Desktop Grid View */}
        <div className="hidden sm:grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayedChurches.map((church) => (
            <ChurchCard
              key={church.id}
              church={church}
              onEdit={canEditChurch(church) ? () => handleEditChurch(church) : undefined}
              onClick={() => setSelectedChurch(church)}
            />
          ))}
        </div>

        {/* Mobile Single Card View */}
        <div className="sm:hidden">
          {filteredChurches.length > 0 && (
            <div className="px-4">
              <ChurchCard
                church={filteredChurches[currentIndex]}
                onEdit={canEditChurch(filteredChurches[currentIndex]) ? () => handleEditChurch(filteredChurches[currentIndex]) : undefined}
                onClick={() => setSelectedChurch(filteredChurches[currentIndex])}
                isMobile={true}
              />
            </div>
          )}
        </div>

        {/* Load More Button - Desktop Only */}
        {hasMoreItems && (
          <div className="hidden sm:flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingMore ? (
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

      {/* Empty State */}
      {filteredChurches.length === 0 && (
        <div className="text-center py-12">
          <ChurchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No churches found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or add a new church to the directory.
          </p>
        </div>
      )}

      {/* Church Detail Modal */}
      {selectedChurch && (
        <ChurchDetailModal
          church={selectedChurch}
          onClose={() => setSelectedChurch(null)}
          onEdit={canEditChurch(selectedChurch) ? () => {
            setSelectedChurch(null)
            handleEditChurch(selectedChurch)
          } : undefined}
        />
      )}

      {/* Edit Modal */}
      {editingChurch && (
        <EditChurchModal
          church={editingChurch}
          onSave={handleUpdateChurch}
          onCancel={() => setEditingChurch(null)}
        />
      )}
    </div>
  )
}

// Church Card Component
interface ChurchCardProps {
  church: Church
  onEdit?: () => void
  onClick: () => void
  isMobile?: boolean
}

function ChurchCard({ church, onEdit, onClick, isMobile = false }: ChurchCardProps) {
  const getImageUrl = (url?: string) => {
    if (!url || url === 'https://images.pexels.com/photos/8468689/pexels-photo-8468689.jpeg?auto=compress&cs=tinysrgb&w=400') {
      return '/default.png'
    }
    return url
  }

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group w-full max-w-sm mx-auto"
      onClick={onClick}
    >
      {/* Church Image */}
      <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
        <img
          src={getImageUrl(church.photo_url)}
          alt={church.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Edit button for own listings or admin */}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
            title="Edit this listing"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Church Details */}
      <div className="p-4 sm:p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {church.name}
        </h3>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <MapPin className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
            <div className="text-sm text-gray-600 min-w-0">
              <p className="font-medium">{church.city}, {church.state}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{church.address}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <User className="h-4 w-4 text-green-500 flex-shrink-0" />
            <div className="text-sm min-w-0">
              <p className="font-medium text-gray-900 line-clamp-1">{church.minister_name}</p>
              <p className="text-xs text-gray-500">Minister</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Phone className="h-4 w-4 text-purple-500 flex-shrink-0" />
            <p className="text-sm font-medium text-gray-900 line-clamp-1">{church.contact_phone}</p>
          </div>

          {church.sunday_service_time && (
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <div className="text-sm min-w-0">
                <p className="font-medium text-gray-900">{church.sunday_service_time}</p>
                <p className="text-xs text-gray-500">Sunday Service</p>
              </div>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center text-blue-600 text-sm font-medium group-hover:text-blue-700 transition-colors">
            <span>View Details</span>
            <ExternalLink className="h-4 w-4 ml-2" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Church Detail Modal Component
interface ChurchDetailModalProps {
  church: Church
  onClose: () => void
  onEdit?: () => void
}

function ChurchDetailModal({ church, onClose, onEdit }: ChurchDetailModalProps) {
  const getImageUrl = (url?: string) => {
    if (!url || url === 'https://images.pexels.com/photos/8468689/pexels-photo-8468689.jpeg?auto=compress&cs=tinysrgb&w=400') {
      return '/default.png'
    }
    return url
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header Image */}
        <div className="aspect-[16/9] bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
          <img
            src={getImageUrl(church.photo_url)}
            alt={church.name}
            className="w-full h-full object-cover"
          />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>

          {/* Edit button */}
          {onEdit && (
            <button
              onClick={onEdit}
              className="absolute top-4 right-16 p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
            >
              <Edit className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Church Name */}
          <h2 className="text-lg sm:text-xl lg:text-3xl font-bold text-gray-900 mb-6 leading-tight">
            {church.name}
          </h2>

          {/* Details Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Location */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Location</h3>
                  <p className="text-gray-600">{church.address}</p>
                  <p className="text-gray-600">{church.city}, {church.state}</p>
                </div>
              </div>
            </div>

            {/* Minister */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Minister</h3>
                  <p className="text-gray-600">{church.minister_name}</p>
                  {church.minister_phone && (
                    <p className="text-sm text-gray-500">{church.minister_phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Phone className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Contact Phone</h3>
                  <p className="text-gray-600">{church.contact_phone}</p>
                </div>
              </div>
            </div>

            {/* Sunday Service */}
            {church.sunday_service_time && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Sunday Service</h3>
                    <p className="text-gray-600">{church.sunday_service_time}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Added Date */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Added</h3>
                  <p className="text-gray-600">
                    {new Date(church.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200">
            <a
              href={`tel:${church.contact_phone}`}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium flex items-center justify-center space-x-2"
            >
              <Phone className="h-5 w-5" />
              <span>Call Church</span>
            </a>
            
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(`${church.address}, ${church.city}, ${church.state}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-center font-medium flex items-center justify-center space-x-2"
            >
              <MapPin className="h-5 w-5" />
              <span>Get Directions</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Edit Church Modal Component
interface EditChurchModalProps {
  church: Church
  onSave: (church: Church) => void
  onCancel: () => void
}

function EditChurchModal({ church, onSave, onCancel }: EditChurchModalProps) {
  const [formData, setFormData] = useState(church)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateChurchName = (name: string): boolean => {
    const normalizedName = name.toLowerCase().trim()
    return normalizedName.includes('church of christ')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate church name
    if (!validateChurchName(formData.name)) {
      setErrors({ name: 'Must start with "Church of Christ"' })
      return
    }

    // Clear errors
    setErrors({})
    
    setLoading(true)
    try {
      await onSave(formData)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Church, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Edit Church Listing</h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Church Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Church Photo
              </label>
              <ImageUpload
                currentImageUrl={formData.photo_url}
                onImageChange={(url) => handleChange('photo_url', url)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Church Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                required
                placeholder="Must start with 'Church of Christ'"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Must start with "Church of Christ"
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minister Name
              </label>
              <input
                type="text"
                value={formData.minister_name}
                onChange={(e) => handleChange('minister_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minister Phone (Optional)
              </label>
              <input
                type="tel"
                value={formData.minister_phone || ''}
                onChange={(e) => {
                  const formatted = formatPhoneInput(e.target.value)
                  handleChange('minister_phone', formatted)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+234 XXX XXX XXXX"
                maxLength={18}
              />
              <p className="mt-1 text-xs text-gray-500">
                11-digit Nigerian number
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => {
                  const formatted = formatPhoneInput(e.target.value)
                  handleChange('contact_phone', formatted)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+234 XXX XXX XXXX"
                maxLength={18}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                11-digit Nigerian number (e.g., 08012345678)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sunday Service Time
              </label>
              <select
                value={formData.sunday_service_time || '9:00 AM'}
                onChange={(e) => handleChange('sunday_service_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SERVICE_TIMES.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}