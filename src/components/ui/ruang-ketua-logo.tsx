"use client";

export function RuangKetuaLogo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="60" cy="60" r="56" fill="url(#rk-grad)" />
      {/* Shield shape */}
      <path
        d="M60 18C60 18 30 28 30 48V72C30 88 60 104 60 104C60 104 90 88 90 72V48C90 28 60 18 60 18Z"
        fill="white"
        fillOpacity="0.15"
        stroke="white"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Letters RK */}
      <text
        x="60"
        y="70"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="32"
        fill="white"
        letterSpacing="-1"
      >
        RK
      </text>
      {/* Small crown on top */}
      <path
        d="M48 30L52 24L56 28L60 20L64 28L68 24L72 30"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <defs>
        <linearGradient id="rk-grad" x1="0" y1="0" x2="120" y2="120">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
