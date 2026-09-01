// tests/lib/eventos-checkout.test.ts
//
// El vocabulario de la medición del checkout: los códigos que viajan en los
// eventos y el mapeo de las respuestas de error de POST /api/checkout.
import { describe, it, expect } from "vitest";
import {
  CAMPOS_CHECKOUT,
  ETIQUETAS_CAMPO,
  ETIQUETAS_MOTIVO,
  MOTIVOS_CHECKOUT,
  VALORES_CAMPO_EVENTO,
  motivoRespuestaCheckout,
} from "../../lib/eventos-checkout";

describe("vocabulario de eventos del checkout", () => {
  it("lista los campos en el orden del formulario", () => {
    expect([...CAMPOS_CHECKOUT]).toEqual([
      "email",
      "nombre",
      "apellido",
      "fono",
      "entrega",
      "direccion",
      "depto",
      "region",
      "comuna",
      "notas",
      "cupon",
    ]);
  });

  it("tiene una etiqueta para cada campo y cada motivo", () => {
    for (const campo of CAMPOS_CHECKOUT) expect(ETIQUETAS_CAMPO[campo]).toBeTruthy();
    for (const motivo of MOTIVOS_CHECKOUT) expect(ETIQUETAS_MOTIVO[motivo]).toBeTruthy();
  });

  it("acepta campos y motivos en la lista blanca, y nada más", () => {
    for (const campo of CAMPOS_CHECKOUT) expect(VALORES_CAMPO_EVENTO.has(campo)).toBe(true);
    for (const motivo of MOTIVOS_CHECKOUT) expect(VALORES_CAMPO_EVENTO.has(motivo)).toBe(true);
    // Nada del visitante puede colarse por acá.
    expect(VALORES_CAMPO_EVENTO.has("cliente@correo.cl")).toBe(false);
    expect(VALORES_CAMPO_EVENTO.has("")).toBe(false);
  });

  it("ningún código pasa de 40 caracteres, que es el recorte del endpoint", () => {
    for (const valor of VALORES_CAMPO_EVENTO) expect(valor.length).toBeLessThanOrEqual(40);
  });

  it("distingue la pasarela sin configurar de la pasarela que rechaza", () => {
    expect(motivoRespuestaCheckout(503, "El pago online aún no está conectado.")).toBe(
      "pasarela_sin_config",
    );
    expect(motivoRespuestaCheckout(502, "La pasarela rechazó la solicitud de pago.")).toBe(
      "pasarela",
    );
  });

  it("mapea los mensajes reales de POST /api/checkout", () => {
    const casos: [string, string][] = [
      ["El carrito está vacío.", "carrito_vacio"],
      ["Falta el correo del cliente.", "falta_email"],
      ["Falta la comuna de despacho.", "falta_comuna"],
      ["Pedido inválido.", "pedido_invalido"],
      ['El producto "macetero-x" ya no está disponible.', "producto_no_disponible"],
      ['La variante seleccionada para "Macetero" ya no existe.', "variante_no_existe"],
      ['Solo quedan 2 unidades de "Macetero — Grande".', "sin_stock"],
      ["El monto del pedido no es válido.", "monto_invalido"],
    ];
    for (const [mensaje, motivo] of casos) {
      expect(motivoRespuestaCheckout(400, mensaje)).toBe(motivo);
    }
  });

  it("cae en 'desconocido' cuando el mensaje no es de los conocidos", () => {
    expect(motivoRespuestaCheckout(400, "Otra cosa cualquiera")).toBe("desconocido");
    expect(motivoRespuestaCheckout(500, undefined)).toBe("desconocido");
    expect(motivoRespuestaCheckout(200, null)).toBe("desconocido");
  });
});
