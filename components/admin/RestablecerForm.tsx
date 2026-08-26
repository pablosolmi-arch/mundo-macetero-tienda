"use client";

import { useState } from "react";
import Link from "next/link";

// Mismo mínimo que exige el servidor, para avisar antes de mandar la solicitud.
const MIN_LARGO = 12;

const CAMPO = {
  padding: "12px 14px",
  border: "1px solid #d8d5cf",
  borderRadius: "8px",
  fontSize: "14px",
  background: "#faf9f7",
  outline: "none",
} as const;

const AVISO_MALO = {
  background: "#f7e8e2",
  border: "1px solid #e0b8a5",
  color: "#8f4a2b",
  borderRadius: "8px",
  padding: "10px 13px",
  fontSize: "13px",
  fontWeight: 600,
} as const;

export function RestablecerForm({ token }: { token: string }) {
  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (clave.length < MIN_LARGO) {
      setError(`La clave debe tener al menos ${MIN_LARGO} caracteres.`);
      return;
    }
    if (clave !== repetida) {
      setError("Las dos claves no son iguales.");
      return;
    }
    setCargando(true);
    try {
      const res = await fetch("/api/admin/restablecer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: clave }),
      });
      const data = await res.json();
      if (res.ok) {
        setListo(true);
        return;
      }
      setError(data.message ?? "No se pudo cambiar la clave.");
    } catch {
      setError("No se pudo conectar.");
    } finally {
      setCargando(false);
    }
  }

  // Sin token no hay nada que hacer: el enlace llegó cortado o a mano.
  if (!token) {
    return (
      <>
        <div style={AVISO_MALO}>El enlace no es válido. Pide uno nuevo.</div>
        <p style={{ fontSize: "13px", margin: "16px 0 0", textAlign: "center" }}>
          <Link href="/admin/recuperar" style={{ color: "#a5613f", fontWeight: 600 }}>
            Pedir un enlace nuevo
          </Link>
        </p>
      </>
    );
  }

  if (listo) {
    return (
      <>
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
          Clave actualizada. Cerramos las sesiones que estaban abiertas.
        </div>
        <p style={{ fontSize: "13px", margin: "16px 0 0", textAlign: "center" }}>
          <Link href="/admin/login" style={{ color: "#a5613f", fontWeight: 600 }}>
            Entrar con la clave nueva
          </Link>
        </p>
      </>
    );
  }

  return (
    <form onSubmit={guardar} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <input
        type="password"
        value={clave}
        onChange={(e) => setClave(e.target.value)}
        placeholder="Clave nueva"
        autoComplete="new-password"
        required
        style={CAMPO}
      />
      <input
        type="password"
        value={repetida}
        onChange={(e) => setRepetida(e.target.value)}
        placeholder="Repite la clave nueva"
        autoComplete="new-password"
        required
        style={CAMPO}
      />
      {error && <div style={AVISO_MALO}>{error}</div>}
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
        {cargando ? "Guardando…" : "Guardar la clave"}
      </button>
    </form>
  );
}
