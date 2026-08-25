import { describe, it, expect } from "vitest";
import { formatAntiguedad, formatCLP } from "../../lib/format";

describe("formatCLP", () => {
  it("formats a numeric string price with no decimals and '.' thousands separator", () => {
    const result = formatCLP("9990.00");
    expect(result).toContain("9.990");
    expect(result).not.toContain(".00");
    expect(result).not.toContain(",00");
  });

  it("formats larger amounts with multiple thousands separators", () => {
    const result = formatCLP("1000000");
    expect(result).toContain("1.000.000");
  });

  it("formats zero as a $0-style string", () => {
    const result = formatCLP("0");
    expect(result).toContain("0");
  });

  it("returns $0 for a non-numeric value", () => {
    expect(formatCLP("not-a-number")).toBe("$0");
  });
});

describe("formatAntiguedad", () => {
  const ahora = new Date("2026-08-25T12:00:00");

  it("dentro del mismo mes dice Este mes", () => {
    expect(formatAntiguedad(new Date("2026-08-02T12:00:00"), ahora)).toBe("Este mes");
  });

  it("un mes cumplido se dice en singular", () => {
    expect(formatAntiguedad(new Date("2026-07-10T12:00:00"), ahora)).toBe("Hace 1 mes");
  });

  it("cuenta los meses cumplidos, no los cambios de mes", () => {
    // Del 30 de julio al 25 de agosto todavía no se cumple el mes.
    expect(formatAntiguedad(new Date("2026-07-30T12:00:00"), ahora)).toBe("Este mes");
    expect(formatAntiguedad(new Date("2026-02-25T12:00:00"), ahora)).toBe("Hace 6 meses");
  });

  it("pasados los dos años cuenta en años", () => {
    expect(formatAntiguedad(new Date("2024-08-25T12:00:00"), ahora)).toBe("Hace 2 años");
    expect(formatAntiguedad(new Date("2025-08-25T12:00:00"), ahora)).toBe("Hace 12 meses");
  });
});
