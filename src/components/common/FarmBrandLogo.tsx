import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';

export interface FarmBrandLogoProps {
  logoUrl?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  fallbackText?: string;
  variant?: 'sidebar' | 'header' | 'report' | 'banner' | 'card' | 'badge';
  onClick?: () => void;
  title?: string;
}

const SIZE_CONFIGS = {
  xs: { container: 'w-7 h-7 rounded-lg', text: 'text-[10px]', icon: 'w-3.5 h-3.5' },
  sm: { container: 'w-9 h-9 rounded-xl', text: 'text-xs', icon: 'w-4 h-4' },
  md: { container: 'w-10 h-10 rounded-2xl', text: 'text-sm font-black', icon: 'w-5 h-5' },
  lg: { container: 'w-14 h-14 rounded-2xl', text: 'text-base font-black', icon: 'w-7 h-7' },
  xl: { container: 'w-16 h-16 rounded-2xl', text: 'text-lg font-black', icon: 'w-8 h-8' },
  '2xl': { container: 'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl', text: 'text-xl font-black', icon: 'w-10 h-10' },
  custom: { container: '', text: 'text-sm font-black', icon: 'w-5 h-5' }
};

export const FarmBrandLogo: React.FC<FarmBrandLogoProps> = ({
  logoUrl,
  alt = 'Farm Logo',
  size = 'md',
  className = '',
  fallbackText = 'FF',
  variant = 'sidebar',
  onClick,
  title
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset error state whenever the URL changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [logoUrl]);

  const sizeConfig = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;
  const isClickable = Boolean(onClick);

  // If no URL provided or image loading failed, show robust brand fallback emblem
  if (!logoUrl || hasError) {
    let fallbackStyle = 'bg-gradient-to-br from-mint-400 to-emerald-500 text-forest-950 font-black shadow-md shadow-emerald-500/10 font-display';
    if (variant === 'sidebar') {
      fallbackStyle = 'bg-gradient-to-br from-mint-400 to-emerald-500 text-forest-950 font-black italic shadow-md shadow-emerald-500/20';
    } else if (variant === 'header' || variant === 'banner') {
      fallbackStyle = 'bg-gradient-to-br from-forest-900 to-forest-950 text-mint-300 border border-mint-500/30 shadow-md';
    } else if (variant === 'report') {
      fallbackStyle = 'bg-forest-950 text-mint-300 border-2 border-slate-900 print:border-black';
    } else if (variant === 'card') {
      fallbackStyle = 'bg-forest-950 text-mint-400 border border-forest-800 shadow-sm';
    }

    return (
      <div
        onClick={onClick}
        title={title || alt}
        className={`${sizeConfig.container} flex flex-col items-center justify-center shrink-0 select-none ${fallbackStyle} ${className} ${
          isClickable ? 'cursor-pointer hover:opacity-95 transition' : ''
        }`}
      >
        {variant === 'report' ? (
          <>
            <Building2 className={`${sizeConfig.icon} text-mint-400 mb-0.5 print:text-black`} />
            <span className="text-[9px] font-black uppercase tracking-wider print:text-black">{fallbackText}</span>
          </>
        ) : (
          <span className={`${sizeConfig.text} uppercase tracking-tight`}>{fallbackText}</span>
        )}
      </div>
    );
  }

  // Active Logo Container
  let containerBg = 'bg-white p-1 border border-slate-200/80 shadow-xs';
  if (variant === 'sidebar') {
    containerBg = 'bg-white/95 p-0.5 shadow-md shadow-black/20 border border-forest-800';
  } else if (variant === 'banner') {
    containerBg = 'bg-white p-1 shadow-md shadow-black/25 border border-emerald-500/30';
  } else if (variant === 'report') {
    containerBg = 'bg-white p-1.5 border-2 border-slate-900 shadow-sm print:border-black';
  } else if (variant === 'card') {
    containerBg = 'bg-white p-1 border border-slate-200 shadow-xs';
  }

  return (
    <div
      onClick={onClick}
      title={title || alt}
      className={`${sizeConfig.container} overflow-hidden shrink-0 flex items-center justify-center relative select-none ${containerBg} ${className} ${
        isClickable ? 'cursor-pointer hover:opacity-95 transition' : ''
      }`}
    >
      <img
        src={logoUrl}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="eager"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-contain transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-90'
        }`}
      />
    </div>
  );
};
