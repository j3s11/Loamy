import React, { useState, useMemo, useEffect } from 'react';
import { Maximize2, X, Sparkles } from 'lucide-react';
import { getPlantImageInfo, PlantImageInfo } from '../utils/plantImages';

interface PlantThumbnailWithModalProps {
  plantId?: string;
  plantName: string;
  photoRef?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onOpenModal?: (info: PlantImageInfo) => void;
}

const DIMENSION_CLASSES = {
  sm: 'w-9 h-9 rounded-lg',
  md: 'w-11 h-11 rounded-xl',
  lg: 'w-14 h-14 rounded-xl'
} as const;

export default function PlantThumbnailWithModal({
  plantId,
  plantName,
  photoRef,
  size = 'md',
  className = '',
  onOpenModal
}: PlantThumbnailWithModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageInfo = useMemo(
    () => getPlantImageInfo(`${plantId || ''} ${plantName || ''}`.trim(), photoRef),
    [plantId, plantName, photoRef]
  );

  const dimensionClasses = DIMENSION_CLASSES[size];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenModal) {
      onOpenModal(imageInfo);
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={`View larger photo of ${plantName}`}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e as any);
          }
        }}
        className={`group relative overflow-hidden shrink-0 cursor-pointer border border-stone-200/90 shadow-2xs hover:border-emerald-600 active:scale-95 transition-transform ${dimensionClasses} ${className}`}
        style={{ backgroundColor: imageInfo.accentColor + '15' }}
      >
        {!imageError ? (
          <img
            src={imageInfo.photoUrl}
            alt={plantName}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            decoding="async"
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold font-mono text-emerald-800">
            {photoRef ? `#${photoRef}` : plantName.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Hover zoom badge overlay */}
        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Maximize2 className="w-3.5 h-3.5 text-white drop-shadow-md" />
        </div>
      </div>

      {/* Internal Modal when not using shared modal state */}
      {isModalOpen && (
        <PlantImageZoomModal
          imageInfo={imageInfo}
          plantName={plantName}
          photoRef={photoRef}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

interface PlantImageZoomModalProps {
  imageInfo: PlantImageInfo;
  plantName: string;
  photoRef?: number;
  onClose: () => void;
}

export function PlantImageZoomModal({
  imageInfo,
  plantName,
  photoRef,
  onClose
}: PlantImageZoomModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Botanical identification photo for ${plantName}`}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border-t sm:border border-stone-200 rounded-t-3xl sm:rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0 sm:my-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="w-10 h-1.5 bg-stone-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header Bar */}
        <div className="p-4 sm:p-5 flex items-start justify-between gap-3 border-b border-stone-100 bg-stone-50/60">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {photoRef && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-mono font-bold text-xs shrink-0">
                  Photo #{photoRef}
                </span>
              )}
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {plantName}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Botanical Plant Identification Preview
            </p>
          </div>

          <button
            type="button"
            aria-label="Close plant preview"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-stone-200/70 hover:bg-stone-200 text-slate-700 hover:text-slate-900 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High Resolution Image */}
        <div className="relative w-full aspect-4/3 sm:aspect-16/10 bg-stone-900 overflow-hidden flex items-center justify-center">
          <img
            src={imageInfo.photoUrl}
            alt={plantName}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/65 text-[10px] text-white backdrop-blur-xs">
            {imageInfo.attribution}
          </div>
        </div>

        {/* Description & ID Characteristics */}
        <div className="p-4 sm:p-5 pb-6 sm:pb-5 space-y-3 bg-white">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs sm:text-sm text-emerald-950">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-emerald-900">Visual Key:</strong>{' '}
              <span>{imageInfo.description}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>RHS UK Garden Reference</span>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
