import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { ImageUpload } from '../ImageUpload'
import { 
  ChevronLeft, 
  ChevronRight, 
  Church, 
  MapPin, 
  User, 
  Phone, 
  Camera,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react'

interface ChurchData {
  name: string
  address: string
  city: string
  state: string
  ministerName: string
  ministerPhone: string
  contactPhone: string
  sundayServiceTime: string
  photoUrl: string
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

export function AddChurchWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ChurchData>({
    name: '',
    address: '',
    city: '',
    state: '',
    ministerName: '',
    ministerPhone: '',
    contactPhone: '',
    sundayServiceTime: '9:00 AM',
    photoUrl: '/default.png'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [userChurchCount, setUserChurchCount] = useState(0)
  const [checkingRestrictions, setCheckingRestrictions] = useState(true)

  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const totalSteps = 7

  useEffect(() => {
    checkUserRestrictions()
  }, [user])

  const checkUserRestrictions = async () => {
    if (!user || isAdmin) {
      setCheckingRestrictions(false)
      return
    }

    try {
      // Check how many churches this user has already created
      const { data, error } = await supabase
        .from('churches')
        .select('id')
        .eq('created_by', user.id)

      if (error) throw error

      setUserChurchCount(data?.length || 0)
    } catch (error) {
      console.error('Error checking user restrictions:', error)
    } finally {
      setCheckingRestrictions(false)
    }
  }

  const validateChurchName = (name: string): boolean => {
    const normalizedName = name.toLowerCase().trim()
    return normalizedName.includes('church of christ')
  }

  const checkForDuplicateChurch = async (name: string, city: string, state: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('churches')
        .select('id')
        .ilike('name', name.trim())
        .ilike('city', city.trim())
        .eq('state', state)
        .limit(1)

      if (error) throw error

      return (data?.length || 0) > 0
    } catch (error) {
      console.error('Error checking for duplicate church:', error)
      return false
    }
  }

  const validateStep = async (step: number): Promise<boolean> => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          newErrors.name = 'Church name is required'
        } else if (!validateChurchName(formData.name)) {
          newErrors.name = 'Start with "Church of Christ"'
        }
        break
      case 2:
        if (!formData.address.trim()) newErrors.address = 'Address is required'
        if (!formData.city.trim()) newErrors.city = 'City is required'
        if (!formData.state) newErrors.state = 'State is required'
        
        // Check for duplicate church
        if (formData.name && formData.city && formData.state) {
          const isDuplicate = await checkForDuplicateChurch(formData.name, formData.city, formData.state)
          if (isDuplicate) {
            newErrors.duplicate = 'A church with this name already exists in this city'
          }
        }
        break
      case 3:
        if (!formData.ministerName.trim()) newErrors.ministerName = 'Minister name is required'
        break
      case 4:
        if (!formData.contactPhone.trim()) {
          newErrors.contactPhone = 'Contact phone is required'
        } else if (!/^\+?([0-9]{10,15})$/.test(formData.contactPhone.replace(/[\s\-\(\)]/g, ''))) {
          newErrors.contactPhone = 'Please enter a valid phone number'
        }
        break
      case 5:
        if (!formData.sundayServiceTime) {
          newErrors.sundayServiceTime = 'Sunday service time is required'
        }
        break
      case 6:
        // Photo is optional, no validation needed
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
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
      // Return default image if upload fails
      return '/default.png'
    }
  }

  const handleSubmit = async () => {
    const isValid = await validateStep(6)
    if (!isValid) return

    setLoading(true)
    try {
      // Upload image if it's a blob URL
      const finalPhotoUrl = await uploadImageToSupabase(formData.photoUrl)

      const { error } = await supabase
        .from('churches')
        .insert({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          minister_name: formData.ministerName,
          minister_phone: formData.ministerPhone || undefined,
          contact_phone: formData.contactPhone,
          sunday_service_time: formData.sundayServiceTime,
          photo_url: finalPhotoUrl,
          created_by: user!.id,
          status: 'approved' // Auto-approve for now
        })

      if (error) throw error

      setSuccess(true)
      setCurrentStep(7)
    } catch (error: any) {
      setErrors({ submit: error.message || 'An error occurred while submitting' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ChurchData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    // Clear duplicate error when name, city, or state changes
    if (['name', 'city', 'state'].includes(field) && errors.duplicate) {
      setErrors(prev => ({ ...prev, duplicate: '' }))
    }
  }

  // Show loading while checking restrictions
  if (checkingRestrictions) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show restriction message for non-admin users who already have a church
  if (!isAdmin && userChurchCount >= 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-yellow-100 rounded-full p-4">
                <AlertCircle className="h-16 w-16 text-yellow-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Church Listing Limit Reached
            </h2>
            <p className="text-gray-600">
              You have already added a church to the directory. Each member can only list one church to maintain directory quality and prevent duplicates.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/directory')}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Directory
              </button>
              <p className="text-sm text-gray-500">
                If you need to add another church, please contact an administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Church className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                What is your church's name?
              </h2>
              <p className="text-gray-600">
                The name of your congregation. Ex Church of Christ, Kado
              </p>
            </div>
            
            <div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Church of Christ, Kado..."
                className={`w-full px-4 py-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Must start with "Church of Christ"
              </p>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Where is the church located?
              </h2>
              <p className="text-gray-600">
                Please provide the church's address
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main Street"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.address ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.city ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.state ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select State</option>
                    {NIGERIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                  )}
                </div>
              </div>

              {errors.duplicate && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{errors.duplicate}</p>
                </div>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Who is the minister in charge?
              </h2>
              <p className="text-gray-600">
                Please provide the minister's information
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minister's Name
                </label>
                <input
                  type="text"
                  value={formData.ministerName}
                  onChange={(e) => handleInputChange('ministerName', e.target.value)}
                  placeholder="Enter minister's full name"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.ministerName ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.ministerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.ministerName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minister's Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.ministerPhone}
                  onChange={(e) => handleInputChange('ministerPhone', e.target.value)}
                  placeholder="+234 xxx xxx xxxx"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Phone className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                What is the main contact number?
              </h2>
              <p className="text-gray-600">
                This will be the primary phone number for the church
              </p>
            </div>
            
            <div>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                placeholder="+234 xxx xxx xxxx"
                className={`w-full px-4 py-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contactPhone ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.contactPhone && (
                <p className="mt-2 text-sm text-red-600">{errors.contactPhone}</p>
              )}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Clock className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                When is Sunday Service?
              </h2>
              <p className="text-gray-600">
                What time does your Sunday worship service begin?
              </p>
            </div>
            
            <div>
              <select
                value={formData.sundayServiceTime}
                onChange={(e) => handleInputChange('sundayServiceTime', e.target.value)}
                className={`w-full px-4 py-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sundayServiceTime ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select service time</option>
                {SERVICE_TIMES.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              {errors.sundayServiceTime && (
                <p className="mt-2 text-sm text-red-600">{errors.sundayServiceTime}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Choose the time when your main Sunday worship service begins
              </p>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Camera className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Add a church photo (Optional)
              </h2>
              <p className="text-gray-600">
                Upload an image of your church building or congregation
              </p>
            </div>
            
            <ImageUpload
              currentImageUrl={formData.photoUrl}
              onImageChange={(url) => handleInputChange('photoUrl', url)}
              className="max-w-md mx-auto"
            />
          </div>
        )

      case 7:
        if (success) {
          return (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-green-100 rounded-full p-4">
                  <Check className="h-16 w-16 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Church Added Successfully!
              </h2>
              <p className="text-gray-600">
                Your church has been added to the directory and is now visible to all members.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/directory')}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Directory
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setCurrentStep(1)
                      setFormData({
                        name: '',
                        address: '',
                        city: '',
                        state: '',
                        ministerName: '',
                        ministerPhone: '',
                        contactPhone: '',
                        sundayServiceTime: '9:00 AM',
                        photoUrl: '/default.png'
                      })
                      setErrors({})
                      setSuccess(false)
                    }}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Add Another Church
                  </button>
                )}
              </div>
            </div>
          )
        }
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Review Your Submission
              </h2>
              <p className="text-gray-600">
                Please review the information before submitting
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Church Name</h3>
                <p className="text-gray-600">{formData.name}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Address</h3>
                <p className="text-gray-600">
                  {formData.address}<br />
                  {formData.city}, {formData.state}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Minister</h3>
                <p className="text-gray-600">
                  {formData.ministerName}
                  {formData.ministerPhone && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({formData.ministerPhone})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Contact Phone</h3>
                <p className="text-gray-600">{formData.contactPhone}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Sunday Service</h3>
                <p className="text-gray-600">{formData.sundayServiceTime}</p>
              </div>
              {formData.photoUrl && formData.photoUrl !== '/default.png' && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Church Photo</h3>
                  <div className="aspect-[4/3] w-32 rounded-lg overflow-hidden">
                    <img
                      src={formData.photoUrl}
                      alt="Church preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        {!success && (
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {currentStep < 7 ? (
              <button
                onClick={currentStep === 6 ? handleSubmit : handleNext}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : currentStep === 6 ? (
                  <>
                    <span>Submit</span>
                    <Check className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}