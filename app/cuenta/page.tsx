import Link from "next/link";
import type { Metadata } from "next";
import { TIENDA } from "../../content/site";

export const metadata: Metadata = {
  title: "Portal de clientes",
  description: "Consulta el estado de tu pedido escribiéndonos con tu número de orden.",
};

export default function CuentaPage() {
  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "70px 24px 90px" }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e9e6e1",
          borderRadius: "16px",
          padding: "32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: "#f0ece5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a5613f" strokeWidth={2} strokeLinecap="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
          </svg>
        </div>
        <h1 className="font-display" style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 8px" }}>
          Portal de clientes
        </h1>
        <p style={{ fontSize: "14px", color: "#6f6c66", lineHeight: 1.6, margin: "0 0 20px" }}>
          Todavía no tenemos cuentas de usuario. Si quieres saber el estado de tu pedido, escríbenos a{" "}
          <a href={`mailto:${TIENDA.email}`} style={{ color: "#a5613f", fontWeight: 600 }}>
            {TIENDA.email}
          </a>{" "}
          con tu número de orden (empieza con MM-) y te respondemos.
        </p>
        <Link
          href="/tienda"
          className="mm-btn-dark"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: "9px",
            fontSize: "13.5px",
            fontWeight: 700,
          }}
        >
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
