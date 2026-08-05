// app/[categorySlug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, getProductsByCategory } from "../../queries/catalog";
import { ProductCard } from "../../components/ProductCard";

interface Props {
  params: Promise<{ categorySlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return {};
  return {
    title: category.name,
    description: `Maceteros y piezas de la categoría ${category.name} en Mundo Macetero.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) {
    notFound();
  }

  const products = await getProductsByCategory(categorySlug);

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">{category.name}</h1>
      <p className="mt-2 text-muted">{products.length} productos</p>
      {products.length === 0 ? (
        <p className="mt-10 text-muted">Aún no hay productos en esta categoría.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
