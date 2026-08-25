import Link from "next/link";
import { getActiveProductsWithVariants } from "../../../../../queries/catalog";
import { obtenerPedido } from "../../../../../queries/admin";
import { obtenerCliente } from "../../../../../queries/admin-clientes";
import {
  NuevoPedido,
  type PrellenadoPedido,
  type ProductoLiviano,
} from "../../../../../components/admin/NuevoPedido";

export const dynamic = "force-dynamic";

export default async function AdminNuevoPedido({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const desde = typeof params.desde === "string" ? params.desde : undefined;
  const email = typeof params.email === "string" ? params.email : undefined;

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

  // "Duplicar" desde el detalle de un pedido: se copian líneas, cliente y
  // entrega. Un `desde` que ya no existe se ignora y el formulario sale vacío,
  // que es mejor que un error para algo que es solo un atajo.
  const original = desde ? await obtenerPedido(desde) : null;
  // Slug del producto vivo, buscado por variante y por producto: una línea sin
  // variante (producto de configuración única) también se puede volver a cargar.
  const slugPorVariante = new Map(
    productos.flatMap((p) => p.variants.map((v) => [v.id, p.slug] as const)),
  );
  const slugPorProducto = new Map(productos.map((p) => [p.id, p.slug] as const));

  let prellenado: PrellenadoPedido | undefined;
  if (original) {
    prellenado = {
      items: original.items.flatMap((it) => {
        // El catálogo se reimporta seguido: si el producto ya no existe, la línea
        // no se puede cotizar y se omite en silencio.
        const slug =
          (it.variantId != null ? slugPorVariante.get(it.variantId) : undefined) ??
          (it.productId != null ? slugPorProducto.get(it.productId) : undefined);
        if (!slug) return [];
        return [{ slug, variantId: it.variantId, qty: it.qty }];
      }),
      nombre: original.customerName,
      correo: original.customerEmail,
      telefono: original.customerPhone,
      entrega: original.entrega === "despacho" ? "despacho" : "retiro",
      direccion: original.shippingAddress,
      region: original.shippingRegion,
      comuna: original.shippingCity,
    };
  } else if (email) {
    // Desde la ficha de un cliente: se traen sus datos de contacto para no
    // tipearlos otra vez.
    const cliente = await obtenerCliente(email);
    prellenado = {
      correo: email,
      nombre: cliente?.nombre ?? "",
      telefono: cliente?.telefono ?? "",
    };
  }

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
        {original && " Viene copiado del pedido anterior: revisa las cantidades antes de crearlo."}
      </div>

      <NuevoPedido productos={catalogo} prellenado={prellenado} />
    </div>
  );
}
