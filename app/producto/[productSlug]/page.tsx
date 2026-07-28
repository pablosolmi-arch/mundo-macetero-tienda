// app/producto/[productSlug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "../../../queries/catalog";
import { buildProductJsonLd, buildProductMetadata, serializeJsonLd } from "../../../lib/seo";
import { sanitizeHtml } from "../../../lib/sanitize";
import { formatCLP } from "../../../lib/format";

interface Props {
  params: Promise<{ productSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productSlug } = await params;
  const product = await getProductBySlug(productSlug);
  if (!product) return {};
  return buildProductMetadata(product);
}

export default async function ProductPage({ params }: Props) {
  const { productSlug } = await params;
  const product = await getProductBySlug(productSlug);
  if (!product) notFound();

  const jsonLd = buildProductJsonLd(product);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <div className="mt-2 text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />
      <p className="mt-4 text-xl font-semibold">{formatCLP(product.basePrice)}</p>
      {product.variants.length > 0 && (
        <ul className="mt-4 flex gap-2">
          {product.variants.map((v) => (
            <li key={v.id} className="rounded border px-3 py-1">
              {v.name}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {product.images.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt={product.name} className="rounded" />
        ))}
      </div>
    </main>
  );
}
