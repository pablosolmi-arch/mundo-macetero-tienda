"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useCart } from "../../../components/cart/CartContext";
import { formatCLP } from "../../../lib/format";
import { calcTotales, type Entrega } from "../../../lib/pricing";
import { COMUNAS_RM, ENVIO, REGIONES, TIENDA } from "../../../content/site";
import { montoDescuento } from "../../../lib/descuento-monto";
import { origenSesion, track } from "../../../lib/track";
import {
  motivoRespuestaCheckout,
  type CampoCheckout,
  type MotivoCheckout,
} from "../../../lib/eventos-checkout";
import { IniciarCheckout } from "../../../components/site/EventosGA4";
import { AyudaAntesDeIrte } from "../../../components/checkout/AyudaAntesDeIrte";

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

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e9e6e1",
  borderRadius: "14px",
  padding: "24px",
};

const H2: React.CSSProperties = { fontSize: "17px", fontWeight: 600, margin: "0 0 16px" };

function radioCard(on: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    border: on ? "1.5px solid #2a2925" : "1px solid #d8d5cf",
    background: on ? "#faf8f5" : "#fff",
  };
}

// Cada campo del formulario con el nombre que viaja en el evento: nunca el
// valor escrito, solo el nombre del campo.
const CAMPO_EVENTO = {
  email: "email",
  nombre: "nombre",
  apellido: "apellido",
  fono: "fono",
  entrega: "entrega",
  dir: "direccion",
  depto: "depto",
  region: "region",
  comuna: "comuna",
  nota: "notas",
} as const satisfies Record<string, CampoCheckout>;

export default function CheckoutPage() {
  const { items, subtotal, codigo, aplicarCodigo, quitarCodigo } = useCart();
  const [form, setForm] = useState({
    email: "",
    nombre: "",
    apellido: "",
    fono: "",
    entrega: "retiro" as Entrega,
    dir: "",
    depto: "",
    region: ENVIO.regionRM as string,
    comuna: "",
    nota: "",
  });
  const [codigoInput, setCodigoInput] = useState("");
  const [codigoMsg, setCodigoMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // El pago se intentó y no salió por algo del servidor o de la pasarela. No es
  // lo mismo que un campo sin llenar: acá la persona hizo todo y quedó parada,
  // así que es cuando más sentido tiene ofrecerle ayuda.
  const [fallo, setFallo] = useState(false);

  // Los campos que ya avisamos: el evento se manda UNA vez por campo y por
  // sesión de formulario, si no un campo largo mandaría un evento por tecla.
  const avisados = useRef(new Set<CampoCheckout>());

  const avisarCampo = (campo: CampoCheckout) => {
    if (avisados.current.has(campo)) return;
    avisados.current.add(campo);
    track("checkout_campo", { campo });
  };

  const avisarError = (campo: MotivoCheckout) => track("checkout_error", { campo });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
    // Entrega y región ya vienen con un valor, así que su primer aviso es la
    // primera vez que la persona los toca; el resto, al dejar de estar vacíos.
    if (v.trim()) avisarCampo(CAMPO_EVENTO[k]);
  };

  const esDespacho = form.entrega === "despacho";
  const esRM = form.region === ENVIO.regionRM;
  const totales = calcTotales({
    subtotal,
    descuento: montoDescuento(subtotal, codigo),
    entrega: form.entrega,
    region: form.region,
    comuna: form.comuna,
  });

  async function pagar() {
    const falta: string[] = [];
    // `motivos` va en paralelo a `falta`: el texto es para la persona y el
    // código corto para la medición, uno por cada cosa que impidió el envío.
    const motivos: MotivoCheckout[] = [];
    if (!form.email.trim() || !form.email.includes("@")) {
      falta.push("correo válido");
      motivos.push(form.email.trim() ? "email_invalido" : "falta_email");
    }
    if (!form.nombre.trim()) {
      falta.push("nombre");
      motivos.push("falta_nombre");
    }
    if (!form.fono.trim()) {
      falta.push("teléfono");
      motivos.push("falta_fono");
    }
    if (esDespacho) {
      if (!form.dir.trim()) {
        falta.push("dirección");
        motivos.push("falta_direccion");
      }
      if (!form.comuna.trim()) {
        falta.push("comuna");
        motivos.push("falta_comuna");
      }
    }
    if (falta.length) {
      setError(`Completa: ${falta.join(", ")}.`);
      for (const motivo of motivos) avisarError(motivo);
      return;
    }

    setLoading(true);
    setError("");
    setFallo(false);
    track("checkout");
    // Identificador anónimo de la sesión y el origen de su primer contacto, para
    // que el pedido quede atribuido al canal que realmente trajo la venta.
    const visita = origenSesion();
    // Se apretó pagar y la petición sale: es el paso que cierra la cadena de
    // campos completados.
    track("checkout_envio");
    try {
      // Only identifiers and quantities travel to the server; it recomputes every
      // price, the shipping cost and the discount before charging.
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((it) => ({
            productSlug: it.productSlug,
            variantId: it.variantId,
            // La terminación no mueve el precio, así que sí viaja tal cual: el
            // servidor la valida contra la lista y la guarda con la línea.
            terminacion: it.terminacion ?? null,
            qty: it.qty,
          })),
          customer: {
            email: form.email,
            name: [form.nombre, form.apellido].filter(Boolean).join(" "),
            phone: form.fono,
            address: [form.dir, form.depto].filter(Boolean).join(", "),
            city: form.comuna,
            region: form.region,
            note: form.nota,
          },
          entrega: form.entrega,
          codigo: codigo?.codigo ?? null,
          sessionId: visita.sessionId,
          origenVisita: {
            canal: visita.canal,
            fuente: visita.fuente,
            campana: visita.campana,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setError(data.message ?? "No se pudo iniciar el pago.");
      avisarError(motivoRespuestaCheckout(res.status, data.message));
      setFallo(true);
    } catch {
      setError("No se pudo conectar con el servicio de pago.");
      avisarError("sin_conexion");
      setFallo(true);
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "40px 24px 70px" }}>
        <h1 className="font-display" style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 700, margin: "0 0 28px" }}>
          Finalizar compra
        </h1>
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#fff",
            border: "1px solid #e9e6e1",
            borderRadius: "14px",
            color: "#6f6c66",
          }}
        >
          No tienes productos en el carrito.{" "}
          <Link href="/tienda" style={{ color: "#a5613f", fontWeight: 600 }}>
            Ir a la tienda →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <IniciarCheckout
        items={items.map((it) => ({
          item_id: it.productSlug,
          item_name: it.name,
          item_variant: it.variantName ?? undefined,
          price: it.unitPrice,
          quantity: it.qty,
        }))}
        total={totales.total}
      />
      {/* data-checkout: el CSS lo usa para esconder el botón flotante de WhatsApp
          mientras se paga, así nunca tapa el botón de pago en móvil. */}
      <div data-checkout style={{ maxWidth: "1120px", margin: "0 auto", padding: "40px 24px 70px" }}>
      <h1 className="font-display" style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 700, margin: "0 0 4px" }}>
        Finalizar compra
      </h1>
      <div style={{ fontSize: "13px", color: "#6f6c66", marginBottom: "28px" }}>
        Compra segura · Pago procesado por Mercado Pago
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: "30px",
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
          <section style={CARD}>
            <h2 className="font-display" style={H2}>
              1 · Contacto
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="Correo electrónico *"
                type="email"
                style={INPUT}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <input
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  placeholder="Nombre *"
                  style={INPUT}
                />
                <input
                  value={form.apellido}
                  onChange={(e) => set("apellido", e.target.value)}
                  placeholder="Apellido"
                  style={INPUT}
                />
              </div>
              <input
                value={form.fono}
                onChange={(e) => set("fono", e.target.value)}
                placeholder="Teléfono (+56 9…) *"
                style={INPUT}
              />
            </div>
          </section>

          <section style={CARD}>
            <h2 className="font-display" style={H2}>
              2 · Entrega
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              <label style={radioCard(!esDespacho)}>
                <input
                  type="radio"
                  name="entrega"
                  checked={!esDespacho}
                  onChange={() => set("entrega", "retiro")}
                  style={{ accentColor: "#a5613f" }}
                />
                <span style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: "14px" }}>Retiro en tienda</span>
                  <br />
                  <span style={{ fontSize: "12.5px", color: "#6f6c66" }}>
                    {TIENDA.direccion} · {TIENDA.horario}
                  </span>
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#4c7a4c" }}>Gratis</span>
              </label>
              <label style={radioCard(esDespacho)}>
                <input
                  type="radio"
                  name="entrega"
                  checked={esDespacho}
                  onChange={() => set("entrega", "despacho")}
                  style={{ accentColor: "#a5613f" }}
                />
                <span style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: "14px" }}>Despacho a domicilio</span>
                  <br />
                  <span style={{ fontSize: "12.5px", color: "#6f6c66" }}>
                    Gratis en el sector oriente de Santiago · El resto se cotiza con transportista externo
                  </span>
                </span>
              </label>
            </div>

            {esDespacho && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  value={form.dir}
                  onChange={(e) => set("dir", e.target.value)}
                  placeholder="Calle y número *"
                  style={INPUT}
                />
                <input
                  value={form.depto}
                  onChange={(e) => set("depto", e.target.value)}
                  placeholder="Depto / casa / oficina (opcional)"
                  style={INPUT}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <select
                    value={form.region}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, region: e.target.value, comuna: "" }));
                      setError("");
                      // Cambiar de región no pasa por `set`, así que el aviso va acá.
                      avisarCampo("region");
                    }}
                    aria-label="Región"
                    style={INPUT}
                  >
                    {REGIONES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {esRM ? (
                    <select
                      value={form.comuna}
                      onChange={(e) => set("comuna", e.target.value)}
                      aria-label="Comuna"
                      style={INPUT}
                    >
                      <option value="">Comuna *</option>
                      {COMUNAS_RM.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={form.comuna}
                      onChange={(e) => set("comuna", e.target.value)}
                      placeholder="Comuna / ciudad *"
                      style={INPUT}
                    />
                  )}
                </div>
                <input
                  value={form.nota}
                  onChange={(e) => set("nota", e.target.value)}
                  placeholder="Indicaciones para la entrega (opcional)"
                  style={INPUT}
                />
                <div
                  style={{
                    background: "#f0ece5",
                    borderRadius: "9px",
                    padding: "11px 14px",
                    fontSize: "13px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <span>{totales.envio.label}</span>
                  <span style={{ fontWeight: 700 }}>{totales.envio.txt}</span>
                </div>
                {totales.envio.txt === "Se cotiza" && (
                  <div style={{ fontSize: "12.5px", color: "#6f6c66" }}>{ENVIO.notaExterna}</div>
                )}
              </div>
            )}
          </section>

          <section style={CARD}>
            <h2 className="font-display" style={{ ...H2, margin: "0 0 6px" }}>
              3 · Pago
            </h2>
            <div style={{ fontSize: "12.5px", color: "#6f6c66", marginBottom: "14px" }}>
              Al confirmar te llevamos a Mercado Pago para completar el pago.
            </div>
            <div style={radioCard(true)}>
              <input type="radio" checked readOnly style={{ accentColor: "#a5613f" }} />
              <span style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: "14px" }}>Mercado Pago</span>
                <br />
                <span style={{ fontSize: "12.5px", color: "#6f6c66" }}>
                  Tarjetas de crédito y débito, y saldo Mercado Pago
                </span>
              </span>
            </div>
          </section>

          {error && (
            <div
              style={{
                background: "#f7e8e2",
                border: "1px solid #e0b8a5",
                color: "#8f4a2b",
                borderRadius: "10px",
                padding: "13px 16px",
                fontSize: "13.5px",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={pagar}
            disabled={loading}
            className="mm-btn-dark"
            style={{
              border: "none",
              borderRadius: "10px",
              padding: "16px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Redirigiendo al pago…" : `Pagar ${formatCLP(totales.total)}`}
          </button>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e9e6e1",
            borderRadius: "14px",
            padding: "22px",
            position: "sticky",
            top: "84px",
          }}
        >
          <div className="font-display" style={{ fontSize: "16px", fontWeight: 600, marginBottom: "14px" }}>
            Tu pedido
          </div>
          {items.map((it) => (
            <div
              key={`${it.productSlug}-${it.variantName ?? ""}-${it.terminacion ?? ""}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                fontSize: "13.5px",
                padding: "7px 0",
                borderBottom: "1px solid #f0eeea",
              }}
            >
              <span style={{ color: "#4c4944" }}>
                {it.name} <span style={{ color: "#9b978f" }}>× {it.qty}</span>
                {it.variantName && it.variantName !== "Default Title" && (
                  <>
                    <br />
                    <span style={{ fontSize: "11.5px", color: "#9b978f" }}>{it.variantName}</span>
                  </>
                )}
                {it.terminacion && (
                  <>
                    <br />
                    <span style={{ fontSize: "11.5px", color: "#9b978f" }}>
                      Terminación: {it.terminacion}
                    </span>
                  </>
                )}
              </span>
              <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{formatCLP(it.unitPrice * it.qty)}</span>
            </div>
          ))}

          {codigo ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f0ece5",
                borderRadius: "8px",
                padding: "8px 11px",
                margin: "14px 0 4px",
                fontSize: "12.5px",
              }}
            >
              <span style={{ fontWeight: 700, color: "#4c7a4c" }}>✓ {codigo.codigo}</span>
              <button
                onClick={quitarCodigo}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "11.5px",
                  color: "#9b978f",
                  textDecoration: "underline",
                }}
              >
                Quitar
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: "8px", margin: "14px 0 4px" }}>
                <input
                  value={codigoInput}
                  onChange={(e) => {
                    setCodigoInput(e.target.value);
                    setCodigoMsg("");
                    if (e.target.value.trim()) avisarCampo("cupon");
                  }}
                  placeholder="Código de descuento"
                  style={{ ...INPUT, padding: "10px 12px", fontSize: "13px" }}
                />
                <button
                  onClick={async () => {
                    if (!(await aplicarCodigo(codigoInput))) setCodigoMsg("Código no válido o vencido.");
                    else setCodigoMsg("");
                  }}
                  className="mm-btn-dark"
                  style={{
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Aplicar
                </button>
              </div>
              {codigoMsg && <div style={{ fontSize: "12px", color: "#a5613f", marginBottom: "4px" }}>{codigoMsg}</div>}
            </>
          )}

          <div style={{ marginTop: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", padding: "4px 0" }}>
              <span style={{ color: "#6f6c66" }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{formatCLP(totales.subtotal)}</span>
            </div>
            {totales.descuento > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13.5px",
                  padding: "4px 0",
                  color: "#4c7a4c",
                }}
              >
                <span>Descuento{codigo?.tipo === "porcentaje" ? ` (${codigo.valor}%)` : ""}</span>
                <span style={{ fontWeight: 600 }}>−{formatCLP(totales.descuento)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", padding: "4px 0" }}>
              <span style={{ color: "#6f6c66" }}>Envío</span>
              <span style={{ fontWeight: 600 }}>{totales.envio.txt}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "18px",
                fontWeight: 700,
                padding: "10px 0 0",
                borderTop: "1px solid #e9e6e1",
                marginTop: "8px",
              }}
            >
              <span>Total</span>
              <span>{formatCLP(totales.total)}</span>
            </div>
            <div style={{ fontSize: "11.5px", color: "#9b978f", marginTop: "4px" }}>CLP · IVA incluido</div>
          </div>
        </div>
      </div>
      </div>

      {/* No hay otro botón flotante acá: el flotante general está oculto en el
          checkout y esto es lo único que puede interrumpir, una sola vez. */}
      <AyudaAntesDeIrte
        contacto={{ nombre: [form.nombre, form.apellido].filter(Boolean).join(" "), email: form.email, telefono: form.fono }}
        contexto={{
          producto: items[0]?.name ?? null,
          variante:
            items[0]?.variantName && items[0].variantName !== "Default Title"
              ? items[0].variantName
              : null,
          terminacion: items[0]?.terminacion ?? null,
        }}
        activo={!loading}
        fallo={fallo}
      />
    </>
  );
}
