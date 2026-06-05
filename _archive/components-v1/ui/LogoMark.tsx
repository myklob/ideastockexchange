'use client';
import { useId } from 'react';

export function LogoMark({ size = 32 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 144 144" aria-hidden="true">
      <defs>
        <radialGradient id={`bg-${id}`} cx="58%" cy="38%" r="80%">
          <stop offset="0%"   stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
        <radialGradient id={`glow-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#60a5fa" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="144" height="144" rx="28" fill={`url(#bg-${id})`} />
      <circle cx="115" cy="38" r="34" fill={`url(#glow-${id})`} />
      <g stroke="#3b82f6" strokeWidth="1.3" strokeOpacity="0.5" fill="none" strokeLinecap="round">
        <line x1="32"  y1="110" x2="56"  y2="92" />
        <line x1="56"  y1="92"  x2="72"  y2="78" />
        <line x1="72"  y1="78"  x2="92"  y2="58" />
        <line x1="92"  y1="58"  x2="115" y2="38" />
        <line x1="56"  y1="92"  x2="48"  y2="74" />
        <line x1="72"  y1="78"  x2="64"  y2="64" />
        <line x1="92"  y1="58"  x2="106" y2="74" />
      </g>
      <path
        d="M 32 110 L 56 92 L 72 78 L 92 58 L 115 38"
        stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <circle cx="32"  cy="110" r="5"   fill="#ef4444" />
      <circle cx="56"  cy="92"  r="3.5" fill="#e2e8f0" />
      <circle cx="48"  cy="74"  r="3"   fill="#94a3b8" />
      <circle cx="72"  cy="78"  r="4.5" fill="#22c55e" />
      <circle cx="64"  cy="64"  r="3"   fill="#e2e8f0" />
      <circle cx="92"  cy="58"  r="6"   fill="#3b82f6" />
      <circle cx="92"  cy="58"  r="2.2" fill="#f8fafc" />
      <circle cx="106" cy="74"  r="3.5" fill="#ef4444" />
      <circle cx="115" cy="38"  r="7"   fill="#60a5fa" />
      <circle cx="115" cy="38"  r="2.4" fill="#f8fafc" />
    </svg>
  );
}
