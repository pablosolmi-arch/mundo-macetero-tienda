"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCLP } from "../../lib/format";

// Acciones sobre un pedido. El reembolso pide confirmación explícita del monto
// porque mueve dinero de verdad; el resto son cambios de estado reversibles.

interface Props {
  commerceOrder: string;
  pagado: boolean;
  entregado: boolean;
  cancelado: boolean;
  disponibleParaReembolso: number;
}

export function AccionesPedido({
  commerceOrder,
  pagado,
  entregado,
  cancelado,
  disponibleParaReembolso,
}: Props) {
  const router = useRouter();
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [nota, setNota] = useState("");
  const [montoRef, setMontoRef] = useState(String(Math.round(disponibleParaReembolso)));
  const [confirmandoRef, setConfirmandoRef] = useState(false);

  async function ejecutar(accion: string, extra?: { detalle?: string; monto?: number }) {
    setCargando(accion);
    setError("");
    setOk("");
    try {
      const res = await fetch(`/api/admin/pedidos/${commerceOrder}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, ...extra }),
      });
      const data = await res.json();
      if (res.ok) {
        setOk("Listo.");
        setNota("");
        setConfirmandoRef(false);
        router.refresh();
      } else {
        setError(data.message ?? "No se pudo completar la acción.");
      }
    } catch {
      setError("No se pudo conectar.");
    } finally {
      setCargando(null);
    }
  }

  const boton: React.CSSProperties = {
    padding: "9px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid #d8d5cf",
    background: "#fff",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {pagado && !entregado && !cancelado && (
          <button
            onClick={() => ejecutar("entregado")}
            disabled={cargando !== null}
            style={{ ...boton, background: "#2a2925", color: "#fff", border: "none" }}
          >
            {cargando === "entregado" ? "Guardando…" : "Marcar entregado"}
          </button>
        )}
        {entregado && (
          <button onClick={() => ejecutar("pendiente")} disabled={cargando !== null} style={boton}>
            Revertir entrega
          </button>
        )}
        {!cancelado && (
          <button
            onClick={() => ejecutar("cancelado")}
            disabled={cargando !== null}
            style={{ ...boton, color: "#8f4a2b", borderColor: "#e0b8a5" }}
          >
            {cargando === "cancelado" ? "Guardando…" : "Cancelar pedido"}
          </button>
        )}
        {pagado && disponibleParaReembolso > 0 && !confirmandoRef && (
          <button
            onClick={() => setConfirmandoRef(true)}
            disabled={cargando !== null}
            style={{ ...boton, color: "#8f4a2b", borderColor: "#e0b8a5" }}
          >
            Reembolsar
          </button>
        )}
      </div>

      {confirmandoRef && (
        <div
          style={{
            background: "#f7e8e2",
            border: "1px solid #e0b8a5",
            borderRadius: "10px",
            padding: "14px 16px",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#8f4a2b", marginBottom: "8px" }}>
            Reembolso a través de Flow
          </div>
          <div style={{ fontSize: "12.5px", color: "#6f6c66", marginBottom: "10px" }}>
            Se le devuelve el dinero al cliente. Disponible: {formatCLP(disponibleParaReembolso)}.
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <input
              value={montoRef}
              onChange={(e) => setMontoRef(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              style={{
                padding: "9px 12px",
                border: "1px solid #d8d5cf",
                borderRadius: "8px",
                fontSize: "13px",
                width: "140px",
                background: "#fff",
                outline: "none",
              }}
            />
            <button
              onClick={() => ejecutar("reembolso", { monto: Number(montoRef) })}
              disabled={cargando !== null || !Number(montoRef)}
              style={{ ...boton, background: "#8f4a2b", color: "#fff", border: "none" }}
            >
              {cargando === "reembolso" ? "Enviando a Flow…" : `Confirmar ${formatCLP(Number(montoRef) || 0)}`}
            </button>
            <button onClick={() => setConfirmandoRef(false)} style={boton}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Agregar una nota interna"
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "1px solid #d8d5cf",
            borderRadius: "8px",
            fontSize: "13px",
            background: "#fff",
            outline: "none",
          }}
        />
        <button
          onClick={() => ejecutar("nota", { detalle: nota })}
          disabled={cargando !== null || !nota.trim()}
          style={boton}
        >
          Guardar
        </button>
      </div>

      {error && <div style={{ fontSize: "12.5px", color: "#8f4a2b", fontWeight: 600 }}>{error}</div>}
      {ok && <div style={{ fontSize: "12.5px", color: "#4c7a4c", fontWeight: 600 }}>{ok}</div>}
    </div>
  );
}
