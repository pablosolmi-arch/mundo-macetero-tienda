import { describe, it, expect } from "vitest";
import { orderStatusFromMP } from "../../lib/mercadopago";

// Estados documentados de un pago de Mercado Pago. Solo "approved" es dinero
// confirmado: leer cualquier otro como pagado despacharía pedidos impagos.

describe("orderStatusFromMP", () => {
  it("marca pagado SOLO con approved", () => {
    expect(orderStatusFromMP("approved")).toBe("paid");
    for (const otro of ["pending", "in_process", "in_mediation", "authorized", "rejected", "cancelled", "charged_back"]) {
      expect(orderStatusFromMP(otro)).not.toBe("paid");
    }
  });

  it("mapea rechazos y anulaciones", () => {
    expect(orderStatusFromMP("rejected")).toBe("rejected");
    expect(orderStatusFromMP("cancelled")).toBe("annulled");
    expect(orderStatusFromMP("charged_back")).toBe("annulled");
  });

  it("un estado desconocido queda pendiente, nunca pagado", () => {
    for (const raro of ["", "refunded", "algo_nuevo", "APPROVED"]) {
      expect(orderStatusFromMP(raro)).toBe("pending");
    }
  });
});
