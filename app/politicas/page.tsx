import type { Metadata } from "next";
import { ENVIO, TIENDA } from "../../content/site";

export const metadata: Metadata = {
  title: "Políticas de la tienda",
  description: "Política de envío, reembolso, privacidad y términos del servicio de Mundo Macetero.",
};

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e9e6e1",
  borderRadius: "12px",
  padding: "16px 20px",
};

const SUMMARY: React.CSSProperties = { fontSize: "15px", fontWeight: 700, cursor: "pointer" };
const BODY: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.7,
  color: "#4c4944",
  margin: "12px 0 0",
};

// The delivery policy is stated in full because it is what the checkout charges.
// The remaining three are legal texts the store still has to provide, so instead
// of inventing them the page says plainly that they are pending and how to ask.
const PENDIENTE = "Estamos finalizando la redacción de este documento.";

export default function PoliticasPage() {
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px 80px" }}>
      <h1 className="font-display" style={{ fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 700, margin: "0 0 26px" }}>
        Políticas de la tienda
      </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <details style={CARD} open>
          <summary style={SUMMARY}>Política de envío</summary>
          <p style={BODY}>
            Retiro gratis en nuestra tienda de Quilicura ({TIENDA.direccion}, {TIENDA.horario}). Despacho gratis en las
            comunas del sector oriente de Santiago: {ENVIO.comunasOriente.join(", ")}. Resto de la Región Metropolitana
            con tarifa fija de ${ENVIO.tarifaRM.toLocaleString("es-CL")}, informada en el checkout antes de pagar.{" "}
            {ENVIO.notaRegiones}
          </p>
        </details>

        <details style={CARD}>
          <summary style={SUMMARY}>Política de reembolso</summary>
          <p style={BODY}>
            {PENDIENTE} Mientras tanto, si tienes un problema con tu compra escríbenos a {TIENDA.email} o llámanos al{" "}
            {TIENDA.telefonos[0]} y lo resolvemos caso a caso, respetando tus derechos como consumidor.
          </p>
        </details>

        <details style={CARD}>
          <summary style={SUMMARY}>Política de privacidad</summary>
          <p style={BODY}>
            {PENDIENTE} Usamos tus datos únicamente para procesar y despachar tu pedido y para responder tus consultas.
            El pago lo procesa Flow: no almacenamos datos de tarjetas en este sitio. Para consultar o eliminar tus datos,
            escríbenos a {TIENDA.email}.
          </p>
        </details>

        <details style={CARD}>
          <summary style={SUMMARY}>Términos del servicio</summary>
          <p style={BODY}>{PENDIENTE} Para cualquier duda contractual, escríbenos a {TIENDA.email}.</p>
        </details>

        <details style={CARD}>
          <summary style={SUMMARY}>Información de contacto</summary>
          <p style={BODY}>
            {TIENDA.direccion} · {TIENDA.horario} · {TIENDA.telefonos.join(" · ")} · {TIENDA.email}
          </p>
        </details>
      </div>
    </div>
  );
}
