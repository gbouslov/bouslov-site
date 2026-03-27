'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface PhotoCarouselProps {
  photos?: string[]
  interval?: number
}

export function PhotoCarousel({ photos = [], interval = 6000 }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const hasPhotos = photos.length > 0

  const advance = useCallback(() => {
    if (photos.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % photos.length)
    }
  }, [photos.length])

  useEffect(() => {
    if (!hasPhotos || photos.length <= 1) return
    const timer = setInterval(advance, interval)
    return () => clearInterval(timer)
  }, [hasPhotos, photos.length, interval, advance])

  return (
    <div className="relative w-full h-[340px] md:h-[420px] rounded-2xl overflow-hidden">
      {/* Photo layers or gradient fallback */}
      {hasPhotos ? (
        photos.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: i === currentIndex ? 1 : 0 }}
          >
            <Image
              src={src}
              alt="Bouslov family"
              fill
              className="object-cover"
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          </div>
        ))
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-violet-600/20 to-rose-600/20" />
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/30 to-background/30" />

      {/* Title text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
          The Bouslovs
        </h1>
        <p className="mt-2 text-sm md:text-base text-muted-foreground tracking-wide">
          Family hub
        </p>
      </div>

      {/* Photo indicators */}
      {hasPhotos && photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-6 bg-foreground/80'
                  : 'w-1.5 bg-foreground/30 hover:bg-foreground/50'
              }`}
              aria-label={`Go to photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
