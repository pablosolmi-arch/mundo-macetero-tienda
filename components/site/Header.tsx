"use client";

import Link from "next/link";
import { useCart } from "../cart/CartContext";
import { Logo } from "./Logo";

interface Category {
  id: number;
  slug: string;
  name: string;
}

export function Header({ categories }: { categories: Category[] }) {
  const { count, open } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-ink text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        {/* Left: primary nav (desktop) */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/" className="transition-colors hover:text-white/70">
            Inicio
          </Link>
          <Link href="/tienda" className="transition-colors hover:text-white/70">
            Tienda
          </Link>
          {categories.slice(0, 3).map((c) => (
            <Link key={c.id} href={`/${c.slug}`} className="transition-colors hover:text-white/70">
              {c.name}
            </Link>
          ))}
        </nav>

        {/* Center: logo */}
        <Logo className="md:absolute md:left-1/2 md:-translate-x-1/2" />

        {/* Right: cart */}
        <div className="flex items-center gap-4">
          <Link href="/tienda" className="text-sm md:hidden">
            Tienda
          </Link>
          <button
            type="button"
            onClick={open}
            aria-label="Abrir carrito"
            className="relative flex items-center gap-2 text-sm transition-colors hover:text-white/70"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M6 7h12l-1 13H7L6 7Z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[0.65rem] font-semibold text-ink">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
