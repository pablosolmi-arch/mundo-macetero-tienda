import Link from "next/link";
import { getActiveProductsWithVariants } from "../../../../../queries/catalog";
import { NuevoPedido, type ProductoLiviano } from "../../../../../components/admin/NuevoPedido";

export const dynamic = "force-dynamic";

export default async function AdminNuevoPedido() {
  const productos = await getActiveProductsWithVariants();

  // Al cliente solo baja lo que el formulario necesita para armar las líneas: los
  // precios que manda son los de la base, y de todos modos el servidor los vuelve
  // a leer al crear el pedido.
  const catalogo: ProductoLiviano[] = productos
    .map((p) => ({
      slug: p.slug,
      nombre: p.name,
      precioBase: Number(p.basePrice),
      variantes: p.variants.map((v) => ({
        id: v.id,
        nombre: v.name,
        precio: v.priceOverride != null ? Number(v.priceOverride) : Number(p.basePrice),
        disponible: v.available,
      })),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <Link href="/admin/pedidos" style={{ fontSize: "13px", color: "#a5613f", fontWeight: 600 }}>
        ← Pedidos
      </Link>
      <h1 className="font-display" style={{ fontSize: "24px", fontWeight: 700, margin: "10px 0 4px" }}>
        Nuevo pedido
      </h1>
      <div style={{ fontSize: "13.5px", color: "#6f6c66", marginBottom: "18px" }}>
        Para ventas tomadas por WhatsApp o teléfono. Se crea pendiente de pago: con link de pago o
        cobrable por transferencia.
      </div>

      <NuevoPedido productos={catalogo} />
    </div>
  );
}
