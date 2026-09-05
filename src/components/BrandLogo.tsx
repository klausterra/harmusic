import './BrandLogo.css'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function BrandLogo({
  size = 'md',
  showText = true,
  className = '',
}: BrandLogoProps) {
  return (
    <span className={`brand-logo brand-logo--${size} ${className}`.trim()}>
      <svg
        className="brand-logo__mark"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="15" fill="#07130e" />
        <rect
          width="62"
          height="62"
          x="1"
          y="1"
          rx="14"
          fill="none"
          stroke="rgba(92,255,157,0.25)"
          strokeWidth="1"
        />
        {/* Left vertical pillar */}
        <rect x="16" y="16" width="5.5" height="32" rx="2.75" fill="url(#blMint)" />
        {/* Right vertical pillar */}
        <rect x="42.5" y="16" width="5.5" height="32" rx="2.75" fill="url(#blMint)" />
        {/* Harmonic wave crossbar */}
        <path
          d="M19 33.5 C 24 30, 30 30, 35 33 C 38 35, 41 34, 45 31.5"
          fill="none"
          stroke="url(#blMint)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Golden note resonance */}
        <circle cx="33" cy="34" r="4.8" fill="url(#blGold)" />
        {/* Accent flag */}
        <path d="M45 18 C 49 19, 52 22, 52 26 C 49 24, 47 23.5, 45 23.5 Z" fill="url(#blGold)" />
        <defs>
          <linearGradient id="blMint" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eafff6" />
            <stop offset="50%" stopColor="#5cff9d" />
            <stop offset="100%" stopColor="#00e6b8" />
          </linearGradient>
          <linearGradient id="blGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff4d4" />
            <stop offset="100%" stopColor="#ffd166" />
          </linearGradient>
        </defs>
      </svg>
      {showText ? <span className="brand-logo__name">Harmusic</span> : null}
    </span>
  )
}
