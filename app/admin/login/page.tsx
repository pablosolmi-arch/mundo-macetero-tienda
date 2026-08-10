"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/admin");
        router.refresh();
        return;
      }
      setError(data.message ?? "No se pudo entrar.");
    } catch {
      setError("No se pudo conectar.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ maxWidth: "420px", margin: "0 auto", padding: "80px 24px" }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e9e6e1",
          borderRadius: "16px",
          padding: "32px",
        }}
      >
        <h1 className="font-display" style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px" }}>
          Administración
        </h1>
        <p style={{ fontSize: "13.5px", color: "#6f6c66", margin: "0 0 22px" }}>
          Pedidos, pagos y métricas de Mundo Macetero.
        </p>
        <form onSubmit={entrar} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
            autoComplete="username"
            required
            style={{
              padding: "12px 14px",
              border: "1px solid #d8d5cf",
              borderRadius: "8px",
              fontSize: "14px",
              background: "#faf9f7",
              outline: "none",
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Clave"
            autoComplete="current-password"
            required
            style={{
              padding: "12px 14px",
              border: "1px solid #d8d5cf",
              borderRadius: "8px",
              fontSize: "14px",
              background: "#faf9f7",
              outline: "none",
            }}
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
            {cargando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
