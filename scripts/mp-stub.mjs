// Simulador mínimo de Mercado Pago para probar el pipeline sin credenciales.
// Implementa checkout/preferences, /v1/payments/{id} y /v1/payments/{id}/refunds,
// verificando el Bearer token. STUB_MP_STATUS controla el estado del pago
// (approved | rejected | pending). Igual que scripts/flow-stub.mjs para Flow.
import http from "node:http";

const TOKEN = process.env.STUB_MP_TOKEN ?? "TEST-token";
const STATUS = process.env.STUB_MP_STATUS ?? "approved";
const pagos = new Map(); // paymentId -> { external_reference, amount }
let nextId = 9001;

function auth(req) {
  return req.headers.authorization === `Bearer ${TOKEN}`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const json = (code, body) => {
    res.writeHead(code, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };

  if (!auth(req)) return json(401, { message: "invalid token" });

  if (url.pathname === "/checkout/preferences" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const pref = JSON.parse(body);
      const paymentId = String(nextId++);
      pagos.set(paymentId, {
        external_reference: pref.external_reference,
        amount: pref.items?.[0]?.unit_price ?? 0,
      });
      json(201, {
        id: `pref_${paymentId}`,
        // El init_point real es de mercadopago.cl; acá basta una URL que lleve el
        // paymentId para que la prueba pueda simular el retorno y el webhook.
        init_point: `http://localhost:4598/pagar?payment_id=${paymentId}&external_reference=${encodeURIComponent(pref.external_reference)}`,
      });
    });
    return;
  }

  const pagoMatch = url.pathname.match(/^\/v1\/payments\/([^/]+)$/);
  if (pagoMatch && req.method === "GET") {
    const p = pagos.get(pagoMatch[1]);
    if (!p) return json(404, { message: "payment not found" });
    return json(200, {
      id: Number(pagoMatch[1]),
      status: STATUS,
      external_reference: p.external_reference,
      transaction_amount: p.amount,
      payment_method_id: "webpay",
    });
  }

  const refundMatch = url.pathname.match(/^\/v1\/payments\/([^/]+)\/refunds$/);
  if (refundMatch && req.method === "POST") {
    const p = pagos.get(refundMatch[1]);
    if (!p) return json(404, { message: "payment not found" });
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const { amount } = JSON.parse(body || "{}");
      if (!amount || amount <= 0 || amount > p.amount) {
        return json(400, { message: "invalid amount" });
      }
      json(201, { id: nextId++, status: "approved", amount });
    });
    return;
  }

  json(404, { message: "not found" });
});

server.listen(4598, () => console.log("MP_STUB_READY"));
