import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerProducto } from "../../../../../queries/admin-productos";
import { EditorProducto } from "../../../../../components/admin/EditorProducto";

export const dynamic = "force-dynamic";

export default async function AdminProductoDetalle({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const producto = await obtenerProducto(slug);
  if (!producto) notFound();

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <Link href="/admin/productos" style={{ fontSize: "13px", color: "#a5613f", fontWeight: 600 }}>
        ← Productos
      </Link>
      <div style={{ display: "flex", alignItems: "baseline", gap: "14px", margin: "10px 0 4px", flexWrap: "wrap" }}>
        <h1 className="font-display" style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
          {producto.name}
        </h1>
        <Link
          href={`/producto/${producto.slug}`}
          target="_blank"
          style={{ fontSize: "12.5px", color: "#6f6c66" }}
        >
          Ver en la tienda ↗
        </Link>
      </div>

      <EditorProducto
        slug={producto.slug}
        nombre={producto.name}
        descripcion={producto.description}
        precioBase={producto.basePrice}
        estado={producto.status}
        trackStock={producto.trackStock}
        images={producto.images}
        thumbs={producto.thumbs}
        optionNames={producto.optionNames}
        variantes={producto.variantes.map((v) => ({
          id: v.id,
          name: v.name,
          priceOverride: v.priceOverride,
          stock: v.stock,
          available: v.available,
        }))}
      />
    </div>
  );
}
