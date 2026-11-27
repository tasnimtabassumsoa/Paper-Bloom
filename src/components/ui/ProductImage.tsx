import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}

export function ProductImage({
  src,
  alt,
  className = '',
  priority = false,
  width = 480,
  height = 600,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-[#faf6f0] text-[#476553] p-6 text-center ${className}`}
      >
        <BookOpen className="w-8 h-8 mb-2 opacity-60" aria-hidden="true" />
        <span className="text-xs font-medium text-[#525954] line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
