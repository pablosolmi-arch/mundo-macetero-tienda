import Link from "next/link";

interface Category {
  id: number;
  slug: string;
  name: string;
}

export function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <span className="font-display text-xl font-bold">MM</span>
          <p className="mt-3 max-w-xs text-sm text-white/70">
            Maceteros, jardineras y molduras fabricados en Chile. Diseño para tu espacio.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/60">Tienda</h3>
          <ul className="space-y-2 text-sm text-white/80">
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link href={`/${c.slug}`} className="hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/60">Ayuda</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/tienda" className="hover:text-white">Ver todo</Link></li>
            <li><a href="https://wa.me/56900000000" className="hover:text-white">WhatsApp</a></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/60">Síguenos</h3>
          <p className="text-sm text-white/80">Instagram · @mundomacetero</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Mundo Macetero. Hecho en Chile.
      </div>
    </footer>
  );
}
