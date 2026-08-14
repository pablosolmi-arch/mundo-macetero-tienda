import Link from "next/link";
import { TIENDA } from "../../content/site";
import { ScrollTopButton } from "./ScrollTopButton";

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  color: "#8b877f",
  marginBottom: "14px",
};

const LINK: React.CSSProperties = { color: "#cfccc5" };

const PILL: React.CSSProperties = {
  border: "1px solid #44413c",
  borderRadius: "999px",
  padding: "9px 18px",
  fontSize: "12.5px",
  fontWeight: 600,
  color: "#cfccc5",
  transition: "border-color .2s,color .2s",
};

export function Footer() {
  return (
    <footer style={{ background: "#23221f", color: "#cfccc5", marginTop: "auto", overflow: "hidden" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "60px 24px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "28px",
            flexWrap: "wrap",
            paddingBottom: "38px",
            borderBottom: "1px solid #38352f",
          }}
        >
          <div style={{ minWidth: 0 }}>
            {/* El monograma reemplaza al wordmark, así que carga solo el peso de
                marca de este bloque. eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-claro.webp"
              alt="Mundo Macetero"
              width={124}
              height={84}
              style={{ height: "84px", width: "auto", display: "block" }}
            />
            <p style={{ fontSize: "13.5px", lineHeight: 1.65, margin: "22px 0 0", color: "#a29d94", maxWidth: "420px" }}>
              Maceteros ultra livianos tipo cemento para interior y exterior, fabricados en Chile.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <a href={TIENDA.facebook} target="_blank" rel="noopener noreferrer" className="mm-footer-link" style={PILL}>
              Facebook
            </a>
            <a href={TIENDA.instagram} target="_blank" rel="noopener noreferrer" className="mm-footer-link" style={PILL}>
              Instagram
            </a>
            <ScrollTopButton />
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "38px 24px 44px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: "34px",
        }}
      >
        <div>
          <div style={SECTION_LABEL}>Contáctanos</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px", fontSize: "13px", lineHeight: 1.5 }}>
            <a
              href="https://goo.gl/maps/x5Kixi1EfCGNdQpL9"
              target="_blank"
              rel="noopener noreferrer"
              className="mm-footer-link"
              style={LINK}
            >
              {TIENDA.direccion}
            </a>
            <span>Horarios {TIENDA.horario}</span>
            {TIENDA.telefonos.map((t) => (
              <a key={t} href={`tel:${t.replace(/\s/g, "")}`} className="mm-footer-link" style={LINK}>
                {t}
              </a>
            ))}
            <a href={`mailto:${TIENDA.email}`} className="mm-footer-link" style={LINK}>
              {TIENDA.email}
            </a>
          </div>
        </div>

        <div>
          <div style={SECTION_LABEL}>Tienda</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px", fontSize: "13px" }}>
            {[
              ["/tienda", "Todos los maceteros"],
              ["/paleta", "Paleta de colores"],
              ["/asesoramiento", "Te asesoramos"],
              ["/quienes-somos", "Quiénes somos"],
              ["/blog", "Noticias"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="mm-footer-link" style={LINK}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div style={SECTION_LABEL}>Legal y pagos</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px", fontSize: "13px" }}>
            {[
              "Política de reembolso",
              "Política de privacidad",
              "Términos del servicio",
              "Política de envío",
            ].map((label) => (
              <Link key={label} href="/politicas" className="mm-footer-link" style={LINK}>
                {label}
              </Link>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
            {["Mercado Pago", "Transferencia", "Crédito / Débito"].map((m) => (
              <span
                key={m}
                style={{
                  border: "1px solid #44413c",
                  borderRadius: "6px",
                  padding: "5px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#a29d94",
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #38352f" }}>
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "16px 24px",
            fontSize: "12px",
            color: "#8b877f",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span>© {new Date().getFullYear()} Mundo Macetero</span>
          <span>Pago seguro procesado por Mercado Pago</span>
        </div>
      </div>
    </footer>
  );
}
