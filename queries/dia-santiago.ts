// queries/dia-santiago.ts — el día calendario chileno de una columna de fecha.
//
// HALLAZGO EMPÍRICO (1-sep-2026). Las columnas de fecha de la base son
// `timestamp without time zone` y guardan la hora UTC, no la de Chile: el
// pedido #1 se pagó el 24-ago-2026 a las 23:40 de Santiago y quedó guardado
// como "2026-08-25 03:40". El servidor de la base corre con TimeZone = UTC.
//
// Por eso hay que reinterpretar la columna como UTC y recién entonces llevarla a
// Santiago. Sobre el pedido #1:
//
//   to_char(created_at, 'YYYY-MM-DD')                      -> 2026-08-25  (mal: día siguiente)
//   created_at at time zone 'America/Santiago'             -> 2026-08-25 07:40 (mal: suma en vez de restar)
//   created_at at time zone 'UTC' at time zone 'America/Santiago' -> 2026-08-24 23:40 (correcto)
//
// Sin esto, toda venta o visita después de las 20:00 (21:00 en horario de
// invierno) aparecía en el día siguiente.
import type { SQL } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

// Expresión SQL con el día chileno ("YYYY-MM-DD") de una columna de fecha. La
// misma expresión sirve para el SELECT, el GROUP BY y el ORDER BY.
export function diaSantiago(columna: PgColumn | SQL): SQL<string> {
  return sql<string>`to_char(${columna} at time zone 'UTC' at time zone 'America/Santiago', 'YYYY-MM-DD')`;
}

// Condición "dentro de los últimos N días", contada en días calendario chilenos:
// "7 días" es hoy más los 6 días anteriores completos, no las últimas 168 horas.
//
// Es a propósito: con una ventana móvil el día más antiguo entraba a medias y
// las barras del gráfico nunca sumaban lo mismo que las tarjetas. Así el filtro
// 7/30/90 significa exactamente lo mismo en todo el panel.
export function dentroDelPeriodo(columna: PgColumn, dias: number): SQL {
  return sql`${columna} at time zone 'UTC' at time zone 'America/Santiago' >= (timezone('America/Santiago', now())::date - ${dias - 1}::int)`;
}

// Los días del rango, del más antiguo a hoy, en formato "YYYY-MM-DD" y según el
// calendario de Chile. El gráfico los necesita completos para dibujar en cero
// los días sin datos en vez de saltárselos.
export function serieDeDias(dias: number, ahora: Date = new Date()): string[] {
  const hoy = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
  const [anio, mes, dia] = hoy.split("-").map(Number);
  // Se avanza sobre medianoche UTC: son saltos exactos de 24 horas, así que el
  // cambio de horario de Chile no corre ni duplica ningún día.
  const base = Date.UTC(anio, mes - 1, dia);
  const salida: string[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    salida.push(new Date(base - i * 86_400_000).toISOString().slice(0, 10));
  }
  return salida;
}
