import { cn } from '../lib/cn'

type Props = {
  size?: number
  className?: string
  glow?: boolean
}

/**
 * Custom Sworde monogram. A pared-down blade silhouette inscribed in a square —
 * the descender of the blade reads as both "S" and a sword tip. Two-tone fill
 * suggests forged metal catching ember light.
 */
export default function BrandMark({ size = 28, className, glow }: Props) {
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center rounded-edge bg-obsidian-200 border border-edge-strong overflow-hidden',
        glow && 'shadow-ember',
        className
      )}
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0 bg-gradient-to-br from-ember-500/15 via-transparent to-transparent pointer-events-none" />
      <svg
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        viewBox="0 0 24 24"
        fill="none"
        className="relative"
      >
        {/* Blade */}
        <path
          d="M 12 2 L 14.5 5 L 13.5 16 L 10.5 16 L 9.5 5 Z"
          fill="url(#blade)"
          stroke="rgba(248,201,122,0.35)"
          strokeWidth="0.6"
        />
        {/* Crossguard */}
        <rect x="6" y="16.4" width="12" height="1.6" rx="0.4" fill="#F0AE5A" />
        {/* Grip */}
        <rect x="11" y="18.4" width="2" height="3.2" rx="0.4" fill="#945A24" />
        {/* Pommel */}
        <circle cx="12" cy="22" r="0.9" fill="#F0AE5A" />
        <defs>
          <linearGradient id="blade" x1="9" y1="2" x2="15" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FAF6EC" />
            <stop offset="1" stopColor="#B5AB91" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  )
}
