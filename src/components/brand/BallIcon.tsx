export function BallIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={className}
      fill="none"
    >
      <circle cx="16" cy="16" r="14" fill="#f97316" />
      <path
        d="M16 2.5c0 7.5-3.2 14-8.8 18.4M16 2.5c0 7.5 3.2 14 8.8 18.4M2.5 16h27M6.2 8.2c6.2 3.2 13.4 3.2 19.6 0M6.2 23.8c6.2-3.2 13.4-3.2 19.6 0"
        stroke="#111"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
