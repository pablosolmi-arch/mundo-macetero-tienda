import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "../../../lib/admin/auth";
import { SalirButton } from "../../../components/admin/SalirButton";

// Todo lo que cuelga de este layout exige sesión. Está en un grupo de rutas para
// que /admin/login quede fuera del guardia y no haya un bucle de redirección.
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getSessionUser();
  if (!usuario) redirect("/admin/login");

  const enlaces = [
    ["/admin", "Resumen"],
    ["/admin/pedidos", "Pedidos"],
    ["/admin/productos", "Productos"],
    ["/admin/descuentos", "Descuentos"],
    ["/admin/clientes", "Clientes"],
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        // La barra no se imprime: la nota de entrega tiene que salir limpia.
        className="mm-no-print"
        style={{
          background: "#23221f",
          color: "#efece6",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          height: "56px",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-claro.webp" alt="Mundo Macetero" style={{ height: "26px", width: "auto", display: "block" }} />
          <span className="font-display" style={{ color: "#a29d94", fontWeight: 500, fontSize: "15px" }}>admin</span>
        </span>
        <nav style={{ display: "flex", gap: "18px", fontSize: "13.5px" }}>
          {enlaces.map(([href, label]) => (
            <Link key={href} href={href} style={{ color: "#cfccc5" }} className="mm-footer-link">
              {label}
            </Link>
          ))}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "14px" }}>
          <Link href="/" target="_blank" style={{ color: "#a29d94", fontSize: "12.5px" }} className="mm-footer-link">
            Ver la tienda ↗
          </Link>
          <span style={{ fontSize: "12.5px", color: "#a29d94" }}>{usuario.nombre || usuario.email}</span>
          <SalirButton />
        </div>
      </header>
      <main className="mm-hoja" style={{ flex: 1, padding: "28px 24px 60px" }}>
        {children}
      </main>
    </div>
  );
}
