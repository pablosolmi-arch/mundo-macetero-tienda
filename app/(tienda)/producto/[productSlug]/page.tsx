// app/producto/[productSlug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getActiveProductsWithVariants,
  getAllCategories,
  getProductBySlug,
} from "../../../../queries/catalog";
import { buildProductJsonLd, buildProductMetadata, serializeJsonLd } from "../../../../lib/seo";
import { sanitizeHtml } from "../../../../lib/sanitize";
import { toCard } from "../../../../lib/catalog";
import { ProductGallery } from "../../../../components/product/ProductGallery";
import { AddToCart, type VariantOption } from "../../../../components/product/AddToCart";
import { formatCLP } from "../../../../lib/format";

interface Props {
  params: Promise<{ productSlug: string }>;
}

const DETAILS: React.CSSProperties = { borderTop: "1px solid #e3e1dc", padding: "14px 2px" };
const SUMMARY: React.CSSProperties = { fontSize: "14px", fontWeight: 700, cursor: "pointer" };

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

  const [categories, todos] = await Promise.all([getAllCategories(), getActiveProductsWithVariants()]);
  const colNombre =
    product.categoryId != null
      ? (categories.find((c) => c.id === product.categoryId)?.name ?? "")
      : "";

  const jsonLd = buildProductJsonLd(product);
  const basePrice = Number(product.basePrice);
  const variantOptions: VariantOption[] = product.variants.map((v) => ({
    id: v.id,
    name: v.name,
    price: v.priceOverride != null ? Number(v.priceOverride) : basePrice,
    stock: v.stock,
    option1: v.option1,
    option2: v.option2,
    option3: v.option3,
    available: v.available,
  }));

  // Related: same collection first, then anything else, never the product itself.
  const mismos = todos.filter((p) => p.slug !== product.slug && p.colSlug === (product.categoryId != null ? categories.find((c) => c.id === product.categoryId)?.slug : null));
  const otros = todos.filter((p) => p.slug !== product.slug && !mismos.some((m) => m.slug === p.slug));
  const relacionados = [...mismos, ...otros].slice(0, 4).map(toCard);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px 70px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <div style={{ fontSize: "12.5px", color: "#9b978f", marginBottom: "22px" }}>
        <Link href="/" className="mm-link" style={{ color: "#9b978f" }}>
          Inicio
        </Link>{" "}
        /{" "}
        <Link href="/tienda" className="mm-link" style={{ color: "#9b978f" }}>
          Tienda
        </Link>{" "}
        / <span style={{ color: "#2a2925" }}>{product.name}</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: "40px",
          alignItems: "start",
        }}
      >
        <ProductGallery images={product.images} thumbs={product.thumbs} alt={product.name} />

        <div>
          {colNombre && (
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: "#a5613f",
              }}
            >
              {colNombre}
            </div>
          )}
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(24px,3vw,34px)",
              fontWeight: 700,
              margin: "6px 0 12px",
              lineHeight: 1.15,
            }}
          >
            {product.name}
          </h1>

          <AddToCart
            productSlug={product.slug}
            productName={product.name}
            basePrice={basePrice}
            image={product.thumbs?.[0] ?? product.images[0] ?? null}
            variants={variantOptions}
            optionNames={product.optionNames}
          />

          {product.description && (
            <details style={DETAILS} open>
              <summary style={SUMMARY}>Descripción</summary>
              <div
                className="rte"
                style={{ fontSize: "14px", color: "#4c4944", margin: "10px 0 0" }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
              />
            </details>
          )}

          <details style={DETAILS}>
            <summary style={SUMMARY}>Material y cuidados</summary>
            <ul style={{ fontSize: "14px", lineHeight: 1.8, color: "#4c4944", margin: "10px 0 0", paddingLeft: "20px" }}>
              <li>Fibrocemento reforzado, ultra liviano</li>
              <li>Apto para interior y exterior</li>
              <li>Perforaciones de drenaje a pedido</li>
              <li>Fabricado en Chile</li>
            </ul>
          </details>

          <details style={{ ...DETAILS, borderBottom: "1px solid #e3e1dc" }}>
            <summary style={SUMMARY}>Envío y retiro</summary>
            <p style={{ fontSize: "14px", lineHeight: 1.65, color: "#4c4944", margin: "10px 0 0" }}>
              Retiro gratis en nuestra tienda de Quilicura (Lun a Vie, 8:30 a 18:00). Despacho gratis en las comunas
              del sector oriente de Santiago. Para el resto de la Región Metropolitana y otras regiones, el despacho se
              cotiza con un transportista externo y lo coordinamos contigo después de la compra.
            </p>
          </details>
        </div>
      </div>

      {relacionados.length > 0 && (
        <div style={{ marginTop: "60px" }}>
          <h3 className="font-display" style={{ fontSize: "22px", fontWeight: 600, margin: "0 0 20px" }}>
            También te puede gustar
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "18px" }}>
            {relacionados.map((p) => (
              <Link
                key={p.slug}
                href={`/producto/${p.slug}`}
                className="mm-tile"
                style={{
                  display: "block",
                  background: "#fff",
                  border: "1px solid #e9e6e1",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "relative", aspectRatio: "1/1", background: "#eceae6" }}>
                  {p.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.image}
                      alt={p.nombre}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                     loading="lazy" decoding="async" />
                  )}
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>{p.nombre}</div>
                  <div style={{ fontSize: "13px", marginTop: "4px" }}>
                    {p.desde && <span style={{ color: "#6f6c66", fontSize: "12px" }}>A partir de </span>}
                    <span style={{ fontWeight: 700 }}>{formatCLP(p.precio)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
