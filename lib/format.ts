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

// Porcentaje escrito como en Chile: coma decimal, no punto. "3,2%", "74%".
export function formatPorcentaje(valor: number, decimales = 1): string {
  const n = valor.toLocaleString("es-CL", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
  return `${n}%`;
}

// Antigüedad de un cliente en palabras: "Hace 3 meses", "Hace 2 años". Por
// debajo del mes se dice "Este mes" en lugar de "Hace 0 meses".
export function formatAntiguedad(desde: Date, ahora: Date = new Date()): string {
  const meses =
    (ahora.getFullYear() - desde.getFullYear()) * 12 + (ahora.getMonth() - desde.getMonth());
  // El mes recién se cuenta cuando se cumple el día: del 30 de enero al 2 de
  // febrero no es "hace un mes".
  const cumplidos = ahora.getDate() < desde.getDate() ? meses - 1 : meses;
  if (cumplidos < 1) return "Este mes";
  if (cumplidos === 1) return "Hace 1 mes";
  if (cumplidos < 24) return `Hace ${cumplidos} meses`;
  const anios = Math.floor(cumplidos / 12);
  return `Hace ${anios} años`;
}
