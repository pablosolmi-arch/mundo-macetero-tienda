// Minimal stand-in for Flow's API, used to exercise the whole order pipeline
// without real merchant credentials. It verifies the HMAC signature exactly the
// way Flow documents it, so a signing bug would show up here too.
import crypto from "node:crypto";
import http from "node:http";

const SECRET = process.env.STUB_SECRET ?? "test-secret";
const orders = new Map(); // token -> { commerceOrder, amount, status }
let nextToken = 1;

// Status returned by getStatus. Overridable per run: 2 = pagada.
const STATUS = Number(process.env.STUB_STATUS ?? 2);

function sign(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("");
  return crypto.createHmac("sha256", SECRET).update(toSign).digest("hex");
}

function checkSignature(params) {
  const received = params.s;
  const rest = { ...params };
  delete rest.s;
  return received === sign(rest);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/api/payment/create" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const params = Object.fromEntries(new URLSearchParams(body));
      if (!checkSignature(params)) {
        res.writeHead(401, { "content-type": "application/json" });
        res.end(JSON.stringify({ code: 401, message: "firma inválida" }));
        return;
      }
      const token = `tok_${nextToken++}`;
      orders.set(token, {
        commerceOrder: params.commerceOrder,
        amount: params.amount,
        urlConfirmation: params.urlConfirmation,
        urlReturn: params.urlReturn,
      });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ url: "http://localhost:4599/pagar", token, flowOrder: 12345 }));
    });
    return;
  }

  if (url.pathname === "/api/payment/getStatus" && req.method === "GET") {
    const params = Object.fromEntries(url.searchParams);
    if (!checkSignature(params)) {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ code: 401, message: "firma inválida" }));
      return;
    }
    const order = orders.get(params.token);
    if (!order) {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ code: 404, message: "token desconocido" }));
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        status: STATUS,
        commerceOrder: order.commerceOrder,
        flowOrder: 12345,
        amount: order.amount,
        paymentData: { media: "Webpay" },
      }),
    );
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

server.listen(4599, () => console.log("STUB_READY"));
