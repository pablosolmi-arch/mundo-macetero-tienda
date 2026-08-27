import Link from "next/link";

// Migas de pan de las páginas editoriales (guías y preguntas frecuentes), con el
// mismo aspecto que las de la ficha de producto. El último tramo es la página
// actual y por eso no es un enlace.
export function Breadcrumb({ items }: { items: { nombre: string; href?: string }[] }) {
  return (
    <nav aria-label="Migas de pan" style={{ fontSize: "12.5px", color: "#9b978f", marginBottom: "22px" }}>
      {items.map((item, i) => (
        <span key={item.nombre}>
          {i > 0 && " / "}
          {item.href ? (
            <Link href={item.href} className="mm-link" style={{ color: "#9b978f" }}>
              {item.nombre}
            </Link>
          ) : (
            <span style={{ color: "#2a2925" }}>{item.nombre}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
