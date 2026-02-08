'use client'

import { useState, useCallback, useEffect } from 'react'
import { Pin, PinType } from '@/lib/supabase'
import { PIN_TYPES } from '@/lib/pins'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Plus, X, Upload, Link as LinkIcon, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface AddPinModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (pin: Pin) => void
  editPin?: Pin | null
  initialLocation?: { lat: number; lng: number; name?: string }
}

interface LinkInput {
  title: string
  url: string
}

interface ImageInput {
  url: string
  caption: string
  file?: File
  uploading?: boolean
}

export function AddPinModal({
  isOpen,
  onClose,
  onSave,
  editPin,
  initialLocation,
}: AddPinModalProps) {
  const [pinType, setPinType] = useState<PinType>(editPin?.pin_type || 'bucket_list')
  const [title, setTitle] = useState(editPin?.title || '')
  const [locationName, setLocationName] = useState(editPin?.location_name || initialLocation?.name || '')
  const [description, setDescription] = useState(editPin?.description || '')
  const [tripDate, setTripDate] = useState(editPin?.trip_date || '')
  const [links, setLinks] = useState<LinkInput[]>(editPin?.links || [])
  const [images, setImages] = useState<ImageInput[]>(
    editPin?.images?.map(img => ({ url: img.url, caption: img.caption || '' })) || []
  )
  const [lat, setLat] = useState(editPin?.lat?.toString() || initialLocation?.lat?.toString() || '')
  const [lng, setLng] = useState(editPin?.lng?.toString() || initialLocation?.lng?.toString() || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update lat/lng when globe is clicked (initialLocation changes)
  useEffect(() => {
    if (initialLocation && !editPin) {
      setLat(initialLocation.lat.toString())
      setLng(initialLocation.lng.toString())
      if (initialLocation.name) {
        setLocationName(initialLocation.name)
      }
    }
  }, [initialLocation, editPin])

  const handleAddLink = () => {
    setLinks([...links, { title: '', url: '' }])
  }

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const handleLinkChange = (index: number, field: 'title' | 'url', value: string) => {
    const newLinks = [...links]
    newLinks[index][field] = value
    setLinks(newLinks)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        continue
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        continue
      }

      const tempUrl = URL.createObjectURL(file)
      const newImage: ImageInput = { url: tempUrl, caption: '', file, uploading: true }
      setImages(prev => [...prev, newImage])

      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/pins/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) throw new Error('Upload failed')

        const { url } = await res.json()
        setImages(prev =>
          prev.map(img =>
            img.url === tempUrl ? { ...img, url, uploading: false, file: undefined } : img
          )
        )
      } catch (error) {
        toast.error('Failed to upload image')
        setImages(prev => prev.filter(img => img.url !== tempUrl))
      }
    }

    e.target.value = ''
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleImageCaptionChange = (index: number, caption: string) => {
    const newImages = [...images]
    newImages[index].caption = caption
    setImages(newImages)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!lat || !lng) {
      toast.error('Location coordinates are required')
      return
    }

    // Check for any images still uploading
    if (images.some(img => img.uploading)) {
      toast.error('Please wait for images to finish uploading')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        location_name: locationName || null,
        pin_type: pinType,
        title: title.trim(),
        description: description.trim() || null,
        links: links.filter(l => l.url.trim()),
        images: images.map(({ url, caption }) => ({ url, caption: caption || undefined })),
        trip_date: tripDate || null,
      }

      const url = editPin ? `/api/pins/${editPin.id}` : '/api/pins'
      const method = editPin ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save pin')
      }

      const savedPin = await res.json()
      toast.success(editPin ? 'Pin updated' : 'Pin created')
      onSave(savedPin)
      handleClose()
    } catch (error) {
      console.error('Error saving pin:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save pin')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Reset form
    setPinType('bucket_list')
    setTitle('')
    setLocationName('')
    setDescription('')
    setTripDate('')
    setLinks([])
    setImages([])
    setLat('')
    setLng('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-popover border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {editPin ? 'Edit Pin' : 'Add Pin'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pin Type */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Pin Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(PIN_TYPES) as [PinType, typeof PIN_TYPES[PinType]][]).map(
                ([type, config]) => {
                  const Icon = config.icon
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPinType(type)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border transition-all text-left',
                        pinType === type
                          ? 'border-transparent'
                          : 'border-border hover:border-border'
                      )}
                      style={{
                        backgroundColor: pinType === type ? config.bgColor : undefined,
                        borderColor: pinType === type ? config.color : undefined,
                      }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: pinType === type ? config.color : '#71717a' }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: pinType === type ? config.color : '#a1a1aa' }}
                      >
                        {config.label}
                      </span>
                    </button>
                  )
                }
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-muted-foreground">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Tokyo Cherry Blossoms"
              className="bg-muted border-border"
              required
            />
          </div>

          {/* Location Name */}
          <div className="space-y-2">
            <Label htmlFor="locationName" className="text-muted-foreground">Location Name</Label>
            <Input
              id="locationName"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g., Tokyo, Japan"
              className="bg-muted border-border"
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat" className="text-muted-foreground">Latitude *</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="35.6762"
                className="bg-muted border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng" className="text-muted-foreground">Longitude *</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="139.6503"
                className="bg-muted border-border"
                required
              />
            </div>
          </div>

          {/* Trip Date (for planned trips) */}
          {(pinType === 'trip_planned') && (
            <div className="space-y-2">
              <Label htmlFor="tripDate" className="text-muted-foreground">Trip Date</Label>
              <Input
                id="tripDate"
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                className="bg-muted border-border"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-muted-foreground">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share your thoughts about this place..."
              className="bg-muted border-border min-h-[100px]"
            />
          </div>

          {/* Images */}
          <div className="space-y-3">
            <Label className="text-muted-foreground flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Images
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative aspect-square group">
                  <img
                    src={image.url}
                    alt=""
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {image.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-1">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <Label className="text-muted-foreground flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Links
            </Label>
            {links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={link.title}
                  onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                  placeholder="Title"
                  className="bg-muted border-border flex-1"
                />
                <Input
                  value={link.url}
                  onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className="bg-muted border-border flex-[2]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveLink(index)}
                  className="text-muted-foreground hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLink}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editPin ? 'Save Changes' : 'Create Pin'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
