// app/producto/[productSlug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "../../../queries/catalog";
import { buildProductJsonLd, buildProductMetadata, serializeJsonLd } from "../../../lib/seo";
import { sanitizeHtml } from "../../../lib/sanitize";
import { ProductGallery } from "../../../components/product/ProductGallery";
import { AddToCart, type VariantOption } from "../../../components/product/AddToCart";

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
  const basePrice = Number(product.basePrice);
  const variantOptions: VariantOption[] = product.variants.map((v) => ({
    id: v.id,
    name: v.name,
    price: v.priceOverride != null ? Number(v.priceOverride) : basePrice,
  }));

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <nav className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-ink">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/tienda" className="hover:text-ink">Tienda</Link>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Buy box (left, like the live storefront) */}
        <div className="order-2 md:order-1">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{product.name}</h1>
          <div className="mt-5">
            <AddToCart
              productSlug={product.slug}
              productName={product.name}
              basePrice={basePrice}
              image={product.images[0] ?? null}
              variants={variantOptions}
            />
          </div>

          {product.description && (
            <div
              className="rte mt-8 border-t border-line pt-6 text-[0.95rem] text-neutral-700"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
            />
          )}
        </div>

        {/* Gallery (right) */}
        <div className="order-1 md:order-2">
          <ProductGallery images={product.images} alt={product.name} />
        </div>
      </div>
    </main>
  );
}
