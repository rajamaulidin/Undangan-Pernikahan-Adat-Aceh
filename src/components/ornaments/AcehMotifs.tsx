import React from "react";

interface MotifProps {
  className?: string;
}

export function PintoAcehCorner({ className = "w-8 h-8 text-gold-ornament" }: MotifProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 2L21 9H15L18 2ZM9 15H2L9 18V15ZM27 15V18L34 15H27ZM15 27H21L18 34L15 27Z"
        fill="currentColor"
      />
      <circle
        cx="18"
        cy="18"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="18" cy="18" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function PintoAcehDivider({ className = "w-full max-w-xs mx-auto text-gold-ornament" }: MotifProps) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-line-gold opacity-70" />
      <svg className="w-7 h-7 shrink-0" viewBox="0 0 32 32" fill="none">
        <path
          d="M16 3L20 11L16 15L12 11L16 3Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="M16 29L20 21L16 17L12 21L16 29Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <circle cx="16" cy="16" r="2.5" fill="currentColor" />
      </svg>
      <span className="h-px flex-1 bg-line-gold opacity-70" />
    </div>
  );
}

export function BungongJeumpaEmblem({ className = "w-10 h-10 text-gold-ornament" }: MotifProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 4C22.5 10 22.5 14 20 18C17.5 14 17.5 10 20 4Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M20 36C22.5 30 22.5 26 20 22C17.5 26 17.5 30 20 36Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M4 20C10 17.5 14 17.5 18 20C14 22.5 10 22.5 4 20Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M36 20C30 17.5 26 17.5 22 20C26 22.5 30 22.5 36 20Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="20" cy="20" r="3" fill="currentColor" />
    </svg>
  );
}
