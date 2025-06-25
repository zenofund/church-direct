import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, Crop, Check } from 'lucide-react'

interface ImageUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string) => void
  className?: string
}

export function ImageUpload({ currentImageUrl, onImageChange, className = '' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cropperRef = useRef<HTMLDivElement>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      alert('Please select a valid image file (.jpg, .jpeg, or .png)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setOriginalImage(img)
        setPreviewUrl(e.target?.result as string)
        setShowCropper(true)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [])

  const cropImage = useCallback(() => {
    if (!originalImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to 4:3 aspect ratio (800x600 for good quality)
    const targetWidth = 800
    const targetHeight = 600
    canvas.width = targetWidth
    canvas.height = targetHeight

    // Calculate crop dimensions to maintain 4:3 aspect ratio
    const sourceAspectRatio = originalImage.width / originalImage.height
    const targetAspectRatio = 4 / 3

    let sourceX = 0
    let sourceY = 0
    let sourceWidth = originalImage.width
    let sourceHeight = originalImage.height

    if (sourceAspectRatio > targetAspectRatio) {
      // Image is wider than 4:3, crop width
      sourceWidth = originalImage.height * targetAspectRatio
      sourceX = (originalImage.width - sourceWidth) / 2
    } else {
      // Image is taller than 4:3, crop height
      sourceHeight = originalImage.width / targetAspectRatio
      sourceY = (originalImage.height - sourceHeight) / 2
    }

    // Draw the cropped and resized image
    ctx.drawImage(
      originalImage,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, targetWidth, targetHeight
    )

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob)
        setPreviewUrl(croppedUrl)
        setShowCropper(false)
        onImageChange(croppedUrl)
      }
    }, 'image/jpeg', 0.9)
  }, [originalImage, onImageChange])

  const handleRemoveImage = useCallback(() => {
    setPreviewUrl(null)
    setOriginalImage(null)
    onImageChange('/default.png')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onImageChange])

  const getDisplayUrl = () => {
    if (previewUrl) return previewUrl
    if (currentImageUrl && currentImageUrl !== 'https://images.pexels.com/photos/8468689/pexels-photo-8468689.jpeg?auto=compress&cs=tinysrgb&w=400') {
      return currentImageUrl
    }
    return '/default.png'
  }

  const displayUrl = getDisplayUrl()

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <div className="relative group">
          <div className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-gray-100">
            <img
              src={displayUrl}
              alt="Church preview"
              className="w-full h-full object-cover"
            />
          </div>
          {displayUrl !== '/default.png' && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <div className="bg-white rounded-full p-3 shadow-lg">
              <Upload className="h-6 w-6 text-gray-600" />
            </div>
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
      >
        <Upload className="h-4 w-4" />
        <span>{displayUrl === '/default.png' ? 'Upload Church Image' : 'Change Image'}</span>
      </button>

      {/* Cropper Modal */}
      {showCropper && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Crop Image to 4:3 Aspect Ratio
              </h3>
              
              <div className="mb-6">
                <div className="relative inline-block">
                  <img
                    src={previewUrl || ''}
                    alt="Crop preview"
                    className="max-w-full max-h-96 rounded-lg"
                  />
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  The image will be automatically cropped to maintain a 4:3 aspect ratio
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCropper(false)
                    setPreviewUrl(null)
                    setOriginalImage(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={cropImage}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Crop className="h-4 w-4" />
                  <span>Apply Crop</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}