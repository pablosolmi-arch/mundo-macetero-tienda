import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { inArray } from "drizzle-orm";
import { db } from "../../../../db/client";
import { products } from "../../../../db/schema";
import { getOrderWithItems } from "../../../../queries/orders";
import { RetomarCarrito } from "../../../../components/cart/RetomarCarrito";

export const metadata: Metadata = { title: "Retomando tu compra" };
export const dynamic = "force-dynamic";

// Destino del botón "Retomar mi compra" del correo de carrito abandonado
// (lib/email.ts). El pedido pendiente guarda el carrito en la base, así que aquí
// se reconstruye y se deja al cliente en el checkout con todo puesto.
//
// El carrito vive en el navegador (localStorage), no en el servidor: por eso la
// restauración la hace un componente de cliente y esta página solo le entrega
// las líneas ya resueltas contra el catálogo.

export default async function RetomarPage({
  params,
}: {
  params: Promise<{ commerceOrder: string }>;
}) {
  const { commerceOrder } = await params;
  const pedido = await getOrderWithItems(commerceOrder);

  // Sin pedido no hay nada que retomar, y si ya está pagado el link es viejo:
  // volver a llenar el carrito invitaría a pagar dos veces lo mismo.
  if (!pedido || pedido.status === "paid") redirect("/tienda");

  // El catálogo se reimporta seguido: el slug y la miniatura se leen del producto
  // vivo, porque son lo que el carrito y el checkout necesitan para funcionar.
  const productIds = pedido.items
    .map((it) => it.productId)
    .filter((id): id is number => id != null);

  const catalogo =
    productIds.length > 0
      ? await db.query.products.findMany({ where: inArray(products.id, productIds) })
      : [];
  const porId = new Map(catalogo.map((p) => [p.id, p]));

  const items = pedido.items.flatMap((it) => {
    const producto = it.productId != null ? porId.get(it.productId) : undefined;
    // Producto borrado o dado de baja: se omite la línea en silencio en lugar de
    // mandar al checkout un slug que ya no se puede cotizar ni cobrar.
    if (!producto || producto.status !== "active") return [];
    return [
      {
        productSlug: producto.slug,
        name: it.productName,
        variantId: it.variantId,
        // El pedido guarda la terminación pegada al nombre de la variante (para que
        // el correo y el panel la muestren); acá se vuelve a separar.
        variantName: varianteSinTerminacion(it.variantName, it.terminacion),
        terminacion: it.terminacion,
        unitPrice: Number(it.unitPrice),
        image: producto.thumbs[0] ?? producto.images[0] ?? null,
        qty: it.qty,
      },
    ];
  });

  return <RetomarCarrito items={items} />;
}
