import Link from "next/link";
import type { Product } from "../db/schema";
import { formatCLP } from "../lib/format";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/producto/${product.slug}`} className="group block">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">Sin imagen</div>
        )}
      </div>
      <h3 className="mt-3 font-display text-base font-medium">{product.name}</h3>
      <p className="mt-1 text-sm text-muted">
        Desde <span className="text-foreground">{formatCLP(product.basePrice)}</span>
      </p>
    </Link>
  );
}
