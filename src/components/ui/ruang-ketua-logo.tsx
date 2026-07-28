"use client";

import { useId } from "react";

export function RuangKetuaLogo({ size = 36, className = "" }: { size?: number; className?: string }) {
  const baseId = useId();
  const id = `rk-${baseId.replace(/:/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>

      {/* Abstract book/door shape — represents "Ruang" (space/room) */}
      <path
        d="M30 28h40a4 4 0 0 1 4 4v36a4 4 0 0 1-4 4H30a4 4 0 0 1-4-4V32a4 4 0 0 1 4-4Z"
        fill={`url(#${id}-bg)`}
        fillOpacity="0.12"
      />
      <path
        d="M50 28v44"
        stroke={`url(#${id}-bg)`}
        strokeOpacity="0.25"
        strokeWidth="1"
      />

      {/* Letter R */}
      <path
        d="M32 38h10c4 0 7 2 7 6s-3 6-7 6h-4l12 14"
        stroke={`url(#${id}-bg)`}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Letter K */}
      <path
        d="M58 38v26M58 52l12-14M58 52l12 12"
        stroke={`url(#${id}-bg)`}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Small diamond accent — represents leadership/ketua */}
      <rect
        x="46"
        y="74"
        width="8"
        height="8"
        rx="1.5"
        transform="rotate(45 50 78)"
        fill={`url(#${id}-bg)`}
        fillOpacity="0.7"
      />
    </svg>
  );
}
