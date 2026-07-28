// Formats a price value (numeric string like "9990.00" or a number) as Chilean
// pesos: no decimals, "." thousands separator, leading "$". E.g. "9990.00" -> "$9.990".
export function formatCLP(value: string | number): string {
  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount)) return "$0";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}
