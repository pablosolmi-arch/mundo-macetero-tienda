import type { Metadata } from "next";
import { getAllActiveProducts } from "../../queries/catalog";
import { ProductCard } from "../../components/ProductCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Tienda",
  description: "Todos los maceteros, jardineras y molduras de Mundo Macetero.",
};

export default async function TiendaPage() {
  const products = await getAllActiveProducts();

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Tienda</h1>
      <p className="mt-2 text-muted">{products.length} productos</p>
      <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </main>
  );
}
