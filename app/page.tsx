import Link from "next/link";
import { getAllCategories, getAllActiveProducts } from "../queries/catalog";
import { ProductCard } from "../components/ProductCard";

export const revalidate = 3600;

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getAllCategories(),
    getAllActiveProducts(),
  ]);

  const heroImage = products.find((p) => p.images?.length)?.images[0] ?? null;
  const featured = products.slice(0, 8);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        {heroImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
          </>
        )}
        <div className="relative mx-auto flex min-h-[62vh] max-w-7xl flex-col justify-center px-5 py-20">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-white/70">Fabricado en Chile</p>
          <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            ¿Cuál es el macetero ideal para tu espacio?
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/80">
            Maceteros, jardineras y molduras de diseño, hechos a mano. Encuentra el tuyo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/tienda" className="rounded-md bg-white px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90">
              Ver la tienda
            </Link>
            <a href="https://wa.me/56900000000" className="rounded-md border border-white/40 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10">
              Quiero que me asesoren
            </a>
          </div>
        </div>
      </section>

      {/* Categories strip */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-12">
          <div className="flex flex-wrap gap-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/${c.slug}`}
                className="rounded-full border border-line px-5 py-2 text-sm transition-colors hover:border-ink hover:bg-ink hover:text-white"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-5 pb-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Productos destacados</h2>
          <Link href="/tienda" className="text-sm text-muted underline hover:text-ink">
            Ver todo
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Brand band */}
      <section className="mt-16 bg-ink text-white">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Tu espacio, con un macetero</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Diseñamos y fabricamos piezas para interiores y proyectos. Escríbenos y te ayudamos a elegir.
          </p>
          <a href="https://wa.me/56900000000" className="mt-8 inline-block rounded-md bg-white px-6 py-3 text-sm font-medium text-ink">
            Hablemos por WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
