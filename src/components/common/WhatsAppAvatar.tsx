import React from 'react';

interface WhatsAppAvatarProps {
  url?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  alt?: string;
  isIncognito?: boolean;
}

export const WhatsAppAvatar: React.FC<WhatsAppAvatarProps> = ({
  url,
  size = 'md',
  className = '',
  alt = 'Avatar',
  isIncognito = false,
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28',
  };

  const iconSizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16',
  };

  if (isIncognito) {
    return (
      <div 
        className={`${sizeMap[size]} rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-zinc-400 overflow-hidden shadow-sm ${className}`}
        title="Modo Incógnito Activado"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          className={iconSizeMap[size]}
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
      </div>
    );
  }

  if (url && url.trim().length > 0) {
    return (
      <img
        src={url}
        alt={alt}
        className={`${sizeMap[size]} rounded-full object-cover border border-zinc-300 dark:border-zinc-700/80 shadow-sm flex-shrink-0 ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Classic WhatsApp profile silhouette default (soft neutral gray background with stylized bust silhouette)
  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-neutral-300 dark:bg-zinc-700/90 text-neutral-500 dark:text-zinc-400 flex items-center justify-center overflow-hidden flex-shrink-0 border border-neutral-200 dark:border-zinc-600/60 shadow-sm ${className}`}
      title="Avatar Genérico"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`${iconSizeMap[size]} translate-y-1`}
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
};
