import { describe, it, expect } from "vitest";
import { formatCLP } from "../../lib/format";

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
