import React from 'react';

interface WhatsAppAvatarProps {
  url?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  alt?: string;
}

export const WhatsAppAvatar: React.FC<WhatsAppAvatarProps> = ({
  size = 'md',
  className = '',
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
