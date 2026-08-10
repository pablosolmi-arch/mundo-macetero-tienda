import { CartProvider } from "../../components/cart/CartContext";
import { CartDrawer } from "../../components/cart/CartDrawer";
import { Header } from "../../components/site/Header";
import { Footer } from "../../components/site/Footer";
import { Tracker } from "../../components/site/Tracker";
import { getNavData } from "../../queries/catalog";

// Chrome de la tienda. Vive en un grupo de rutas para que /admin no lo herede:
// el administrador tiene su propia navegación y no debe mostrar el carrito.
export const dynamic = "force-dynamic";

export default async function TiendaLayout({ children }: { children: React.ReactNode }) {
  const { productos, colecciones, otros } = await getNavData();

  return (
    <CartProvider>
      <Header productos={productos} colecciones={colecciones} otros={otros} />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <CartDrawer />
      <Tracker />
    </CartProvider>
  );
}
