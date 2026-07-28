// app/[categorySlug]/page.tsx
import { getProductsByCategory } from "../../queries/catalog";
import { ProductGrid } from "../../components/ProductGrid";

interface Props {
  params: Promise<{ categorySlug: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const products = await getProductsByCategory(categorySlug);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold capitalize">{categorySlug.replace(/-/g, " ")}</h1>
      <ProductGrid products={products} />
    </main>
  );
}
