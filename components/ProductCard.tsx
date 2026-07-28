// components/ProductCard.tsx
import Link from "next/link";
import type { Product } from "../db/schema";
import { formatCLP } from "../lib/format";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/producto/${product.slug}`} className="block rounded border p-4 hover:shadow">
      {product.images[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.images[0]} alt={product.name} className="mb-2 aspect-square w-full object-cover rounded" />
      )}
      <h3 className="font-medium">{product.name}</h3>
      <p className="text-gray-700">{formatCLP(product.basePrice)}</p>
    </Link>
  );
}
