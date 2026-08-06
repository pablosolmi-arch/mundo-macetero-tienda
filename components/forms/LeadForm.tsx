"use client";

import { useState } from "react";

// Shared form for the three enquiry pages. Field layout is declared per page so
// each one keeps the design's exact composition; the submit path is the same.

export type FieldKind = "text" | "email" | "tel" | "select" | "textarea";

export interface Field {
  name: string;
  placeholder: string;
  kind: FieldKind;
  required?: boolean;
  options?: string[];
  rows?: number;
  // Two fields sharing a row, as in the design's 1fr 1fr grids.
  half?: boolean;
}

const INPUT: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #d8d5cf",
  borderRadius: "8px",
  fontSize: "14px",
  background: "#faf9f7",
  color: "#2a2925",
  outline: "none",
};

interface LeadFormProps {
  tipo: "asesoria" | "espacio" | "proyecto";
  fields: Field[];
  submitLabel: string;
  okTitle: string;
  okBody: string;
  // Rendered under the button, e.g. asking for a photo over WhatsApp.
  nota?: React.ReactNode;
}

export function LeadForm({ tipo, fields, submitLabel, okTitle, okBody, nota }: LeadFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "loading" | "ok">("idle");
  const [error, setError] = useState("");

  const set = (name: string, v: string) => {
    setValues((prev) => ({ ...prev, [name]: v }));
    setError("");
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError("");

    // Everything that is not a first-class column travels in `detalle`, labelled,
    // so no answer is silently dropped.
    const known = new Set(["nombre", "email", "telefono", "empresa", "mensaje"]);
    const detalle = fields
      .filter((f) => !known.has(f.name))
      .map((f) => `${f.placeholder}: ${values[f.name] ?? ""}`)
      .join("\n");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          nombre: values.nombre ?? "",
          email: values.email ?? "",
          telefono: values.telefono ?? "",
          empresa: values.empresa ?? "",
          mensaje: values.mensaje ?? "",
          detalle,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("ok");
        return;
      }
      setError(data.message ?? "No pudimos enviar tu solicitud.");
      setState("idle");
    } catch {
      setError("No pudimos conectar. Escríbenos a mundo@mundomacetero.cl.");
      setState("idle");
    }
  }

  if (state === "ok") {
    return (
      <div style={{ textAlign: "center", padding: "30px 10px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "#4c7a4c",
            color: "#fff",
            fontSize: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
          }}
        >
          ✓
        </div>
        <div className="font-display" style={{ fontWeight: 600, fontSize: "17px", marginBottom: "6px" }}>
          {okTitle}
        </div>
        <div style={{ fontSize: "13.5px", color: "#6f6c66" }}>{okBody}</div>
        {nota && <div style={{ fontSize: "13.5px", color: "#6f6c66", marginTop: "10px" }}>{nota}</div>}
      </div>
    );
  }

  // Group consecutive half-width fields into pairs.
  const rows: Field[][] = [];
  for (const f of fields) {
    const last = rows[rows.length - 1];
    if (f.half && last?.length === 1 && last[0].half) last.push(f);
    else rows.push([f]);
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {rows.map((row, i) => (
        <div
          key={i}
          style={
            row.length === 2
              ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }
              : undefined
          }
        >
          {row.map((f) => {
            if (f.kind === "select") {
              return (
                <select
                  key={f.name}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  aria-label={f.placeholder}
                  style={INPUT}
                >
                  <option value="">{f.placeholder}</option>
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              );
            }
            if (f.kind === "textarea") {
              return (
                <textarea
                  key={f.name}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  rows={f.rows ?? 4}
                  required={f.required}
                  style={{ ...INPUT, resize: "vertical" }}
                />
              );
            }
            return (
              <input
                key={f.name}
                type={f.kind}
                value={values[f.name] ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
                placeholder={f.placeholder}
                required={f.required}
                style={INPUT}
              />
            );
          })}
        </div>
      ))}

      {error && (
        <div
          style={{
            background: "#f7e8e2",
            border: "1px solid #e0b8a5",
            color: "#8f4a2b",
            borderRadius: "8px",
            padding: "11px 14px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={state === "loading"}
        className="mm-btn-dark"
        style={{
          border: "none",
          borderRadius: "9px",
          padding: "14px",
          fontSize: "14px",
          fontWeight: 700,
          cursor: state === "loading" ? "default" : "pointer",
          opacity: state === "loading" ? 0.7 : 1,
        }}
      >
        {state === "loading" ? "Enviando…" : submitLabel}
      </button>

      {nota && <div style={{ fontSize: "12.5px", color: "#6f6c66" }}>{nota}</div>}
    </form>
  );
}
