export function Steering({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 9.8V4" />
      <path d="m9.8 13-4.6 2.6" />
      <path d="m14.2 13 4.6 2.6" />
    </svg>
  );
}
