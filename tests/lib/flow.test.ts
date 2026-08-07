import { describe, it, expect } from "vitest";
import { orderStatusFromFlow, signParams, FLOW_STATUS } from "../../lib/flow";

// Flow's documented order statuses: 1 pendiente, 2 pagada, 3 rechazada, 4 anulada.
// https://developers.flow.cl/en/docs/tutorial-basics/status

describe("orderStatusFromFlow", () => {
  it("marks an order paid ONLY on status 2", () => {
    expect(orderStatusFromFlow(FLOW_STATUS.PAID)).toBe("paid");
    for (const other of [1, 3, 4]) {
      expect(orderStatusFromFlow(other)).not.toBe("paid");
    }
  });

  it("maps the remaining documented statuses", () => {
    expect(orderStatusFromFlow(1)).toBe("pending");
    expect(orderStatusFromFlow(3)).toBe("rejected");
    expect(orderStatusFromFlow(4)).toBe("annulled");
  });

  it("treats an unknown code as pending rather than paid", () => {
    // Reading an unrecognised status as success would ship goods for free.
    for (const weird of [0, 5, 99, -1, Number.NaN]) {
      expect(orderStatusFromFlow(weird)).toBe("pending");
    }
  });
});

describe("signParams", () => {
  it("signs keys sorted alphabetically, independent of insertion order", () => {
    const a = signParams({ b: "2", a: "1", c: "3" }, "secret");
    const b = signParams({ c: "3", a: "1", b: "2" }, "secret");
    expect(a).toBe(b);
  });

  it("produces a hex HMAC-SHA256", () => {
    expect(signParams({ apiKey: "k", token: "t" }, "secret")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes when the secret changes", () => {
    const params = { apiKey: "k", token: "t" };
    expect(signParams(params, "one")).not.toBe(signParams(params, "two"));
  });

  it("changes when any value changes", () => {
    expect(signParams({ amount: "1000" }, "s")).not.toBe(signParams({ amount: "1001" }, "s"));
  });
});
