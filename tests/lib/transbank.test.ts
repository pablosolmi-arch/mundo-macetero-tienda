import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TBK_MAX_BUY_ORDER,
  TBK_PRODUCTION_URL,
  commitTransaccion,
  crearTransaccion,
  getTBKCredentials,
  orderStatusFromTBK,
  reembolsarTransaccion,
} from "../../lib/transbank";
import { crearLinkPago, gatewayActiva } from "../../lib/pagos";

// Webpay Plus REST. Nada acá toca la API real: fetch va mockeado y las
// credenciales son las públicas de integración de Transbank.
const COMMERCE_CODE = "597055555532";
const API_KEY = "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C";

// .env.local trae MP_ACCESS_TOKEN, así que cada prueba arma el entorno que quiere
// y lo devuelve como estaba: el selector se decide por variables de entorno.
const CLAVES = ["MP_ACCESS_TOKEN", "TBK_COMMERCE_CODE", "TBK_API_KEY", "TBK_BASE_URL", "FLOW_API_KEY", "FLOW_SECRET"] as const;
let respaldo: Record<string, string | undefined> = {};

function sinPasarelas() {
  for (const clave of CLAVES) delete process.env[clave];
}

function conTransbank() {
  process.env.TBK_COMMERCE_CODE = COMMERCE_CODE;
  process.env.TBK_API_KEY = API_KEY;
  process.env.TBK_BASE_URL = "http://localhost:4599";
}

function respuesta(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 422, json: async () => body } as Response;
}

beforeEach(() => {
  respaldo = {};
  for (const clave of CLAVES) respaldo[clave] = process.env[clave];
  sinPasarelas();
});

afterEach(() => {
  for (const clave of CLAVES) {
    if (respaldo[clave] === undefined) delete process.env[clave];
    else process.env[clave] = respaldo[clave];
  }
  vi.unstubAllGlobals();
});

describe("getTBKCredentials", () => {
  it("devuelve null si falta cualquiera de las dos credenciales", () => {
    expect(getTBKCredentials()).toBeNull();
    process.env.TBK_COMMERCE_CODE = COMMERCE_CODE;
    expect(getTBKCredentials()).toBeNull();
    delete process.env.TBK_COMMERCE_CODE;
    process.env.TBK_API_KEY = API_KEY;
    expect(getTBKCredentials()).toBeNull();
  });

  it("con ambas credenciales apunta a producción salvo que TBK_BASE_URL diga otra cosa", () => {
    process.env.TBK_COMMERCE_CODE = COMMERCE_CODE;
    process.env.TBK_API_KEY = API_KEY;
    expect(getTBKCredentials()).toEqual({
      commerceCode: COMMERCE_CODE,
      apiKey: API_KEY,
      baseUrl: TBK_PRODUCTION_URL,
    });
    process.env.TBK_BASE_URL = "https://webpay3gint.transbank.cl";
    expect(getTBKCredentials()?.baseUrl).toBe("https://webpay3gint.transbank.cl");
  });
});

describe("orderStatusFromTBK", () => {
  it("marca pagado SOLO con AUTHORIZED y response_code 0", () => {
    expect(orderStatusFromTBK("AUTHORIZED", 0)).toBe("paid");
    // Un response_code distinto de 0 es rechazo del emisor, aunque diga AUTHORIZED.
    expect(orderStatusFromTBK("AUTHORIZED", -1)).toBe("rejected");
    expect(orderStatusFromTBK("AUTHORIZED", undefined)).toBe("rejected");
    for (const otro of ["INITIALIZED", "FAILED", "NULLIFIED", "REVERSED"]) {
      expect(orderStatusFromTBK(otro, 0)).not.toBe("paid");
    }
  });

  it("mapea rechazos y anulaciones", () => {
    expect(orderStatusFromTBK("FAILED", -1)).toBe("rejected");
    expect(orderStatusFromTBK("NULLIFIED", 0)).toBe("annulled");
    expect(orderStatusFromTBK("REVERSED", 0)).toBe("annulled");
    expect(orderStatusFromTBK("INITIALIZED", 0)).toBe("pending");
  });

  it("un estado desconocido queda pendiente, nunca pagado", () => {
    for (const raro of ["", "authorized", "ALGO_NUEVO", null, undefined]) {
      expect(orderStatusFromTBK(raro, 0)).toBe("pending");
    }
  });
});

describe("buy_order", () => {
  it("nuestro commerceOrder cabe en los 26 caracteres de Webpay", () => {
    // Mismo formato que app/api/checkout/route.ts: MM- + Date.now() + - + 6 hex.
    const commerceOrder = `MM-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    expect(commerceOrder.length).toBe(23);
    expect(commerceOrder.length).toBeLessThanOrEqual(TBK_MAX_BUY_ORDER);
    // Sigue cabiendo cuando Date.now() pase a 14 dígitos (año 2286).
    expect(`MM-${"9".repeat(14)}-abcdef`.length).toBeLessThanOrEqual(TBK_MAX_BUY_ORDER);
  });

  it("no crea la transacción si el buy_order excediera el límite", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    conTransbank();
    const creds = getTBKCredentials()!;
    await expect(
      crearTransaccion(creds, {
        commerceOrder: "MM-1786000000000-abcdef-demasiado-largo",
        amount: 1000,
        urlRetorno: "https://tienda.cl/api/checkout/tbk-return",
      }),
    ).rejects.toThrow(/26 caracteres/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("crearTransaccion", () => {
  it("manda buy_order, monto entero y return_url, y arma la URL con token_ws", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respuesta({ token: "tok123", url: "https://webpay3gint.transbank.cl/webpayserver/initTransaction" }),
    );
    vi.stubGlobal("fetch", fetchMock);
    conTransbank();

    const { redirectUrl, token } = await crearTransaccion(getTBKCredentials()!, {
      commerceOrder: "MM-1786000000000-a1b2c3",
      amount: 19990,
      urlRetorno: "https://tienda.cl/api/checkout/tbk-return",
    });

    expect(token).toBe("tok123");
    expect(redirectUrl).toBe(
      "https://webpay3gint.transbank.cl/webpayserver/initTransaction?token_ws=tok123",
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:4599/rswebpaytransaction/api/webpay/v1.2/transactions");
    expect(init.method).toBe("POST");
    const enviados = init.headers as Record<string, string>;
    expect(enviados["Tbk-Api-Key-Id"]).toBe(COMMERCE_CODE);
    expect(enviados["Tbk-Api-Key-Secret"]).toBe(API_KEY);
    expect(JSON.parse(String(init.body))).toEqual({
      buy_order: "MM-1786000000000-a1b2c3",
      session_id: "MM-1786000000000-a1b2c3",
      amount: 19990,
      return_url: "https://tienda.cl/api/checkout/tbk-return",
    });
  });

  it("propaga el error si Webpay no acepta la creación", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta({ error_message: "no" }, false)));
    conTransbank();
    await expect(
      crearTransaccion(getTBKCredentials()!, {
        commerceOrder: "MM-1786000000000-a1b2c3",
        amount: 1000,
        urlRetorno: "https://tienda.cl/api/checkout/tbk-return",
      }),
    ).rejects.toThrow(/respondió 422/);
  });
});

describe("commitTransaccion", () => {
  it("confirma con PUT sin cuerpo y un pago aprobado queda paid", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respuesta({
        status: "AUTHORIZED",
        response_code: 0,
        buy_order: "MM-1786000000000-a1b2c3",
        amount: 19990,
        authorization_code: "1213",
        payment_type_code: "VD",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    conTransbank();

    const trx = await commitTransaccion(getTBKCredentials()!, "tok123");
    expect(orderStatusFromTBK(trx.status, trx.response_code)).toBe("paid");
    expect(trx.buy_order).toBe("MM-1786000000000-a1b2c3");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:4599/rswebpaytransaction/api/webpay/v1.2/transactions/tok123");
    expect(init.method).toBe("PUT");
    expect(init.body).toBeUndefined();
  });

  it("un pago rechazado queda rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        respuesta({ status: "FAILED", response_code: -1, buy_order: "MM-1786000000000-a1b2c3" }),
      ),
    );
    conTransbank();
    const trx = await commitTransaccion(getTBKCredentials()!, "tok123");
    expect(orderStatusFromTBK(trx.status, trx.response_code)).toBe("rejected");
  });
});

describe("reembolsarTransaccion", () => {
  it("pide el reembolso contra el token con el monto entero", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(respuesta({ type: "NULLIFIED", response_code: 0, nullified_amount: 5000 }));
    vi.stubGlobal("fetch", fetchMock);
    conTransbank();

    const r = await reembolsarTransaccion(getTBKCredentials()!, "tok123", 5000.4);
    expect(r.type).toBe("NULLIFIED");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "http://localhost:4599/rswebpaytransaction/api/webpay/v1.2/transactions/tok123/refunds",
    );
    expect(JSON.parse(String(init.body))).toEqual({ amount: 5000 });
  });
});

describe("selector de pasarela", () => {
  it("sin credenciales no hay pasarela activa", () => {
    expect(gatewayActiva()).toBeNull();
  });

  it("con solo Transbank configurado elige transbank", () => {
    conTransbank();
    expect(gatewayActiva()).toBe("transbank");
  });

  it("Mercado Pago sigue ganando cuando está configurado", () => {
    // Criterio de aceptación: con MP_ACCESS_TOKEN el comportamiento no cambia.
    process.env.MP_ACCESS_TOKEN = "TEST-token";
    expect(gatewayActiva()).toBe("mercadopago");
    conTransbank();
    expect(gatewayActiva()).toBe("mercadopago");
  });

  it("Transbank va antes que Flow", () => {
    process.env.FLOW_API_KEY = "k";
    process.env.FLOW_SECRET = "s";
    expect(gatewayActiva()).toBe("flow");
    conTransbank();
    expect(gatewayActiva()).toBe("transbank");
  });

  it("crearLinkPago con Transbank apunta el retorno a /api/checkout/tbk-return", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(respuesta({ token: "tok999", url: "https://webpay3gint.transbank.cl/webpayserver/initTransaction" }));
    vi.stubGlobal("fetch", fetchMock);
    conTransbank();

    const { gateway, redirectUrl } = await crearLinkPago({
      commerceOrder: "MM-1786000000000-a1b2c3",
      titulo: "Compra Mundo Macetero (2 productos)",
      amount: 19990,
      email: "cliente@example.com",
    });

    expect(gateway).toBe("transbank");
    expect(redirectUrl).toContain("token_ws=tok999");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const cuerpo = JSON.parse(String(init.body)) as { return_url: string };
    expect(cuerpo.return_url).toMatch(/\/api\/checkout\/tbk-return$/);
  });
});
