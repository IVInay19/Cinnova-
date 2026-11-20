import { useState } from 'react';
import { resolveTMDBPosterUrl } from '../services/api.ts';
import type { ArtworkSpec } from '../types/cinema.ts';

interface MovieArtworkProps {
  title: string;
  imagePath: string | null;
  artwork: ArtworkSpec;
  variant?: 'poster' | 'backdrop';
  className?: string;
}

export function MovieArtwork({
  title,
  imagePath,
  artwork,
  variant = 'poster',
  className = '',
}: MovieArtworkProps) {
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = resolveTMDBPosterUrl(imagePath, variant === 'backdrop' ? 'original' : 'w500');

  if (resolvedUrl && !imgError) {
    return (
      <img
        src={resolvedUrl}
        alt={title}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  const uid = title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) + variant;
  const isBackdrop = variant === 'backdrop';

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={{
        backgroundColor: artwork.primaryHex,
      }}
    >
      <svg
        viewBox={isBackdrop ? '0 0 800 450' : '0 0 300 450'}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={artwork.secondaryHex} />
            <stop offset="65%" stopColor={artwork.primaryHex} />
            <stop offset="100%" stopColor="#09090B" />
          </linearGradient>
          <radialGradient id={`spot-${uid}`} cx={isBackdrop ? '68%' : '50%'} cy="34%" r="58%">
            <stop offset="0%" stopColor={artwork.accentHex} stopOpacity="0.32" />
            <stop offset="48%" stopColor={artwork.secondaryHex} stopOpacity="0.22" />
            <stop offset="100%" stopColor={artwork.primaryHex} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill={`url(#bg-${uid})`} />
        <rect width="100%" height="100%" fill={`url(#spot-${uid})`} />

        {/* Editorial studio poster shapes — warm, atmospheric, zero AI neon grids */}
        {artwork.motif === 'eclipse' && (
          <g>
            <circle cx={isBackdrop ? 550 : 150} cy={isBackdrop ? 185 : 165} r={isBackdrop ? 115 : 80} fill={artwork.accentHex} opacity="0.18" />
            <circle cx={isBackdrop ? 550 : 150} cy={isBackdrop ? 185 : 165} r={isBackdrop ? 88 : 62} fill={artwork.primaryHex} />
            <circle cx={isBackdrop ? 550 : 150} cy={isBackdrop ? 185 : 165} r={isBackdrop ? 88 : 62} fill="none" stroke={artwork.accentHex} strokeWidth="1.2" opacity="0.55" />
          </g>
        )}

        {artwork.motif === 'skyline' && (
          <g opacity="0.55">
            <rect x={isBackdrop ? 420 : 30} y={isBackdrop ? 140 : 155} width={isBackdrop ? 46 : 34} height="280" fill="#09090B" />
            <rect x={isBackdrop ? 478 : 74} y={isBackdrop ? 95 : 115} width={isBackdrop ? 64 : 46} height="320" fill="#111115" />
            <rect x={isBackdrop ? 555 : 130} y={isBackdrop ? 150 : 170} width={isBackdrop ? 52 : 40} height="270" fill="#09090B" />
            <rect x={isBackdrop ? 620 : 182} y={isBackdrop ? 115 : 130} width={isBackdrop ? 78 : 56} height="305" fill="#141418" />
            <rect x={isBackdrop ? 710 : 246} y={isBackdrop ? 175 : 195} width={isBackdrop ? 50 : 36} height="240" fill="#09090B" />
          </g>
        )}

        {artwork.motif === 'vortex' && (
          <g opacity="0.4">
            {[42, 74, 108, 144].map((r, i) => (
              <circle
                key={r}
                cx={isBackdrop ? 555 : 150}
                cy={isBackdrop ? 195 : 175}
                r={r}
                fill="none"
                stroke={i === 0 ? artwork.accentHex : '#FFFFFF'}
                strokeWidth="1"
                opacity={0.6 - i * 0.12}
              />
            ))}
          </g>
        )}

        {artwork.motif === 'horizon' && (
          <g>
            <circle cx={isBackdrop ? 610 : 195} cy={isBackdrop ? 135 : 130} r={isBackdrop ? 54 : 38} fill={artwork.accentHex} opacity="0.72" />
            <path
              d={isBackdrop ? 'M0 325 L220 235 L420 295 L615 190 L800 285 L800 450 L0 450 Z' : 'M0 310 L85 225 L165 270 L240 195 L300 255 L300 450 L0 450 Z'}
              fill="#0B0B0E"
              opacity="0.88"
            />
          </g>
        )}

        {artwork.motif === 'prism' && (
          <g>
            <polygon
              points={isBackdrop ? '555,70 690,320 420,320' : '150,75 245,275 55,275'}
              fill="#0B0B0E"
              fillOpacity="0.45"
              stroke={artwork.accentHex}
              strokeWidth="1.2"
              strokeOpacity="0.55"
            />
          </g>
        )}

        {artwork.motif === 'waves' && (
          <g fill="none" strokeWidth="1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                d={
                  isBackdrop
                    ? `M0 ${255 + i * 24} Q 200 ${215 + i * 24}, 400 ${255 + i * 24} T 800 ${255 + i * 24}`
                    : `M0 ${185 + i * 24} Q 75 ${155 + i * 24}, 150 ${185 + i * 24} T 300 ${185 + i * 24}`
                }
                stroke={i === 1 ? artwork.accentHex : '#FFFFFF'}
                opacity={0.35 - i * 0.05}
              />
            ))}
          </g>
        )}

        {artwork.motif === 'grid' && (
          <g opacity="0.25">
            <rect x={isBackdrop ? 430 : 48} y={isBackdrop ? 75 : 70} width={isBackdrop ? 260 : 204} height={isBackdrop ? 270 : 270} fill="none" stroke="#FFFFFF" strokeWidth="1" />
            <rect x={isBackdrop ? 455 : 68} y={isBackdrop ? 100 : 90} width={isBackdrop ? 210 : 164} height={isBackdrop ? 220 : 230} fill="none" stroke={artwork.accentHex} strokeWidth="1" />
          </g>
        )}

        {artwork.motif === 'spire' && (
          <g>
            <polygon
              points={isBackdrop ? '555,55 615,390 495,390' : '150,60 192,340 108,340'}
              fill="#0A0A0D"
              opacity="0.72"
            />
            <circle cx={isBackdrop ? 555 : 150} cy={isBackdrop ? 130 : 120} r={isBackdrop ? 26 : 18} fill={artwork.accentHex} opacity="0.55" />
          </g>
        )}

        {artwork.motif === 'orbit' && (
          <g fill="none">
            <ellipse
              cx={isBackdrop ? 560 : 150}
              cy={isBackdrop ? 205 : 180}
              rx={isBackdrop ? 150 : 102}
              ry={isBackdrop ? 46 : 34}
              transform={`rotate(-18 ${isBackdrop ? 560 : 150} ${isBackdrop ? 205 : 180})`}
              stroke="#FFFFFF"
              strokeWidth="1"
              opacity="0.3"
            />
            <circle cx={isBackdrop ? 560 : 150} cy={isBackdrop ? 205 : 180} r={isBackdrop ? 36 : 24} fill={artwork.accentHex} opacity="0.55" />
          </g>
        )}

        {artwork.motif === 'noir' && (
          <g>
            <polygon
              points={isBackdrop ? '450,0 700,0 590,450 400,450' : '85,0 230,0 185,450 70,450'}
              fill="#FFFFFF"
              opacity="0.07"
            />
            <circle cx={isBackdrop ? 565 : 150} cy={isBackdrop ? 145 : 140} r={isBackdrop ? 38 : 26} fill={artwork.accentHex} opacity="0.35" />
          </g>
        )}
      </svg>

      {/* Studio Poster Typography Overlay */}
      {!isBackdrop && (
        <div className="relative z-10 h-full flex flex-col justify-between p-3.5 bg-gradient-to-t from-black/95 via-black/30 to-black/20">
          <div className="flex items-center justify-between">
            <span className="font-mono-tabular text-[9px] tracking-[0.2em] uppercase text-white/60">
              CinNova Select
            </span>
          </div>
          <div>
            <p className="font-mono-tabular text-[9px] tracking-[0.16em] uppercase text-amber-200/80 mb-1 line-clamp-1">
              {artwork.tagline}
            </p>
            <h4 className="font-display text-base font-bold leading-tight text-white drop-shadow line-clamp-2">
              {title}
            </h4>
          </div>
        </div>
      )}
    </div>
  );
}
