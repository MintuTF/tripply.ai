'use client';

import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

interface PhotoGalleryProps {
  photos: string[];
  placeName?: string;
}

export function PhotoGallery({ photos, placeName }: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No photos available</p>
      </div>
    );
  }

  // Prepare slides for lightbox
  const slides = photos.map(photo => ({ src: photo }));

  return (
    <>
      {/* Photo Grid */}
      <div className="grid gap-2">
        {photos.length === 1 ? (
          // Single photo
          <div
            className="relative group cursor-pointer rounded-lg overflow-hidden"
            onClick={() => {
              setCurrentIndex(0);
              setLightboxOpen(true);
            }}
          >
            <img
              src={photos[0]}
              alt={placeName || 'Place photo'}
              className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <Maximize2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        ) : photos.length === 2 ? (
          // Two photos side by side
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="relative group cursor-pointer rounded-lg overflow-hidden"
                onClick={() => {
                  setCurrentIndex(index);
                  setLightboxOpen(true);
                }}
              >
                <img
                  src={photo}
                  alt={`${placeName || 'Place'} photo ${index + 1}`}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Multiple photos - featured + grid
          <div className="grid grid-cols-4 gap-2">
            {/* Main large photo */}
            <div
              className="col-span-4 md:col-span-2 row-span-2 relative group cursor-pointer rounded-lg overflow-hidden"
              onClick={() => {
                setCurrentIndex(0);
                setLightboxOpen(true);
              }}
            >
              <img
                src={photos[0]}
                alt={placeName || 'Place photo'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <Maximize2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            {/* Grid of smaller photos */}
            {photos.slice(1, 5).map((photo, index) => (
              <div
                key={index + 1}
                className="col-span-2 md:col-span-1 relative group cursor-pointer rounded-lg overflow-hidden"
                onClick={() => {
                  setCurrentIndex(index + 1);
                  setLightboxOpen(true);
                }}
              >
                <img
                  src={photo}
                  alt={`${placeName || 'Place'} photo ${index + 2}`}
                  className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                {/* Show "+ X more" overlay on last visible photo if there are more */}
                {index === 3 && photos.length > 5 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      +{photos.length - 5} more
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={currentIndex}
        plugins={[Zoom, Thumbnails]}
        animation={{ fade: 300 }}
        carousel={{
          finite: photos.length <= 1,
        }}
        render={{
          buttonPrev: photos.length <= 1 ? () => null : undefined,
          buttonNext: photos.length <= 1 ? () => null : undefined,
        }}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
        }}
        thumbnails={{
          position: 'bottom',
          width: 120,
          height: 80,
          border: 2,
          borderRadius: 4,
          padding: 8,
          gap: 8,
        }}
      />
    </>
  );
}

// Compact version for chat/list views
export function PhotoGalleryCompact({ photos, placeName }: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!photos || photos.length === 0) {
    return null;
  }

  const slides = photos.map(photo => ({ src: photo }));

  return (
    <>
      <div
        className="relative group cursor-pointer rounded-lg overflow-hidden"
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={photos[0]}
          alt={placeName || 'Place photo'}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {photos.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-semibold">
            +{photos.length - 1} photos
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        plugins={[Zoom, Thumbnails]}
        animation={{ fade: 300 }}
      />
    </>
  );
}
