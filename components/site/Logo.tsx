import Link from "next/link";

// Wordmark-style monogram approximating the Mundo Macetero identity: a bold
// "MM" mark over the full name in spaced caps, in white for the dark header.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex flex-col items-center leading-none text-white ${className}`}>
      <span className="font-display text-2xl font-bold tracking-tight">MM</span>
      <span className="mt-0.5 text-[0.55rem] font-medium uppercase tracking-[0.35em] text-white/80">
        Mundo Macetero
      </span>
    </Link>
  );
}
