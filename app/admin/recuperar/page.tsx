"use client";

import { useState } from "react";
import Link from "next/link";

const CAJA = {
  background: "#fff",
  border: "1px solid #e9e6e1",
  borderRadius: "16px",
  padding: "32px",
} as const;

const CAMPO = {
  padding: "12px 14px",
  border: "1px solid #d8d5cf",
  borderRadius: "8px",
  fontSize: "14px",
  background: "#faf9f7",
  outline: "none",
} as const;

export default function AdminRecuperarPage() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function pedir(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/admin/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        // El mensaje es el mismo con cuenta o sin cuenta: no se le dice a nadie
        // qué correos tienen acceso al panel.
        setMensaje(data.message ?? "Si el correo tiene cuenta, te enviamos un enlace.");
        return;
      }
      setError(data.message ?? "No se pudo enviar el enlace.");
    } catch {
      setError("No se pudo conectar.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ maxWidth: "420px", margin: "0 auto", padding: "80px 24px" }}>
      <div style={CAJA}>
        <h1 className="font-display" style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px" }}>
          Recuperar la clave
        </h1>
        <p style={{ fontSize: "13.5px", color: "#6f6c66", margin: "0 0 22px" }}>
          Te enviamos un enlace para crear una clave nueva. Vence en 30 minutos.
        </p>

        {mensaje ? (
          <div
            style={{
              background: "#eef2e8",
              border: "1px solid #c3d0b2",
              color: "#4d5f38",
              borderRadius: "8px",
              padding: "12px 14px",
              fontSize: "13.5px",
              fontWeight: 600,
            }}
          >
            {mensaje}
          </div>
        ) : (
          <form onSubmit={pedir} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo"
              autoComplete="username"
              required
              style={CAMPO}
            />
            {error && (
              <div
                style={{
                  background: "#f7e8e2",
                  border: "1px solid #e0b8a5",
                  color: "#8f4a2b",
                  borderRadius: "8px",
                  padding: "10px 13px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={cargando}
              className="mm-btn-dark"
              style={{
                border: "none",
                borderRadius: "9px",
                padding: "13px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: cargando ? "default" : "pointer",
                opacity: cargando ? 0.7 : 1,
              }}
            >
              {cargando ? "Enviando…" : "Enviar el enlace"}
            </button>
          </form>
        )}

        <p style={{ fontSize: "13px", margin: "16px 0 0", textAlign: "center" }}>
          <Link href="/admin/login" style={{ color: "#a5613f", fontWeight: 600 }}>
            Volver a entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
