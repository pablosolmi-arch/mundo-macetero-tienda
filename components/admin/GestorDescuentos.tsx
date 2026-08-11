"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Creación de códigos y encendido/apagado de los existentes. Igual que en
// AccionesPedido: se llama a la API, se refresca la ruta y el servidor vuelve a
// leer la tabla, así nunca se muestra un estado que la base no tenga.

const CAMPO: React.CSSProperties = {
  padding: "9px 12px",
  border: "1px solid #d8d5cf",
  borderRadius: "8px",
  fontSize: "13px",
  background: "#fff",
  outline: "none",
  width: "100%",
};

const ETIQUETA: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  color: "#6f6c66",
  marginBottom: "5px",
};

export function GestorDescuentos() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState("porcentaje");
  const [valor, setValor] = useState("");
  const [expiraEn, setExpiraEn] = useState("");
  const [maxUsos, setMaxUsos] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    setOk("");
    try {
      const res = await fetch("/api/admin/descuentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo,
          tipo,
          valor: Number(valor),
          expiraEn: expiraEn || null,
          maxUsos: maxUsos || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOk(`Código ${codigo.trim().toUpperCase()} creado.`);
        setCodigo("");
        setValor("");
        setExpiraEn("");
        setMaxUsos("");
        router.refresh();
      } else {
        setError(data.message ?? "No se pudo crear el código.");
      }
    } catch {
      setError("No se pudo conectar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={crear}
      style={{
        background: "#fff",
        border: "1px solid #e9e6e1",
        borderRadius: "12px",
        padding: "18px 20px",
        marginBottom: "20px",
      }}
    >
      <div className="font-display" style={{ fontSize: "15px", fontWeight: 600, marginBottom: "14px" }}>
        Crear un código
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
          gap: "12px",
          alignItems: "end",
        }}
      >
        <div>
          <label style={ETIQUETA} htmlFor="dcto-codigo">
            Código
          </label>
          <input
            id="dcto-codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="VERANO15"
            style={CAMPO}
          />
        </div>
        <div>
          <label style={ETIQUETA} htmlFor="dcto-tipo">
            Tipo
          </label>
          <select id="dcto-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} style={CAMPO}>
            <option value="porcentaje">Porcentaje</option>
            <option value="monto">Monto fijo</option>
          </select>
        </div>
        <div>
          <label style={ETIQUETA} htmlFor="dcto-valor">
            {tipo === "porcentaje" ? "Porcentaje (1 a 100)" : "Monto en pesos"}
          </label>
          <input
            id="dcto-valor"
            value={valor}
            onChange={(e) => setValor(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder={tipo === "porcentaje" ? "15" : "5000"}
            style={CAMPO}
          />
        </div>
        <div>
          <label style={ETIQUETA} htmlFor="dcto-expira">
            Vence (opcional)
          </label>
          <input
            id="dcto-expira"
            type="date"
            value={expiraEn}
            onChange={(e) => setExpiraEn(e.target.value)}
            style={CAMPO}
          />
        </div>
        <div>
          <label style={ETIQUETA} htmlFor="dcto-max">
            Máximo de usos (opcional)
          </label>
          <input
            id="dcto-max"
            value={maxUsos}
            onChange={(e) => setMaxUsos(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder="sin tope"
            style={CAMPO}
          />
        </div>
        <button
          type="submit"
          disabled={guardando || !codigo.trim() || !valor}
          className="mm-btn-dark"
          style={{
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: guardando ? "default" : "pointer",
          }}
        >
          {guardando ? "Creando…" : "Crear código"}
        </button>
      </div>

      {error && (
        <div style={{ fontSize: "12.5px", color: "#8f4a2b", fontWeight: 600, marginTop: "12px" }}>{error}</div>
      )}
      {ok && (
        <div style={{ fontSize: "12.5px", color: "#4c7a4c", fontWeight: 600, marginTop: "12px" }}>{ok}</div>
      )}
    </form>
  );
}

// Botón por fila. Vive en este archivo para compartir el patrón de llamada con el
// formulario: es el mismo endpoint con otro método.
export function ToggleDescuento({ id, activo }: { id: number; activo: boolean }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function cambiar() {
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/admin/descuentos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, activo: !activo }),
      });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else {
        setError(data.message ?? "No se pudo cambiar el estado.");
      }
    } catch {
      setError("No se pudo conectar.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <button
        onClick={cambiar}
        disabled={cargando}
        style={{
          padding: "6px 12px",
          borderRadius: "7px",
          fontSize: "12.5px",
          fontWeight: 600,
          cursor: cargando ? "default" : "pointer",
          background: "#fff",
          border: "1px solid #d8d5cf",
          color: activo ? "#8f4a2b" : "#2a2925",
          whiteSpace: "nowrap",
        }}
      >
        {cargando ? "Guardando…" : activo ? "Desactivar" : "Activar"}
      </button>
      {error && <span style={{ fontSize: "11.5px", color: "#8f4a2b" }}>{error}</span>}
    </div>
  );
}
