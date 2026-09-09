// tests/app/leads-llamada.test.ts
//
// Las solicitudes de "que me llamen" entran por el MISMO endpoint y la MISMA
// tabla que el resto de las consultas (`leads`): no hay un registro paralelo.
// Lo que cambia es qué se exige: un teléfono al que se pueda llamar, y el correo
// deja de ser obligatorio porque alguien trabado en el checkout no va a volver a
// escribirlo.
import { describe, it, expect, afterAll, beforeAll, vi } from "vitest";
import { eq, like } from "drizzle-orm";
import { db } from "../../db/client";
import { leads } from "../../db/schema";
import { POST } from "../../app/api/leads/route";

const TELEFONO = "+56 9 0000 1234";
const NOMBRE = "test-leads-llamada";

function pedir(cuerpo: unknown): Request {
  return new Request("http://localhost/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
}

// El endpoint avisa al equipo por correo cuando la solicitud queda guardada. Acá
// se apaga a propósito: una prueba no puede mandarle un correo real al equipo si
// la máquina tiene la clave de Resend cargada.
beforeAll(() => {
  vi.stubEnv("RESEND_API_KEY", "");
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await db.delete(leads).where(like(leads.nombre, `${NOMBRE}%`));
  await db.delete(leads).where(eq(leads.telefono, TELEFONO));
});

describe("POST /api/leads con tipo 'llamada'", () => {
  it("acepta la solicitud con teléfono y sin correo", async () => {
    const res = await POST(
      pedir({
        tipo: "llamada",
        nombre: NOMBRE,
        telefono: TELEFONO,
        detalle: "Pidió que lo llamemos desde el checkout.\nDuda: Despacho",
      }),
    );
    expect(res.status).toBe(200);

    const filas = await db.select().from(leads).where(eq(leads.telefono, TELEFONO));
    expect(filas).toHaveLength(1);
    expect(filas[0].tipo).toBe("llamada");
    expect(filas[0].detalle).toContain("Duda: Despacho");
  });

  it("rechaza un teléfono que no sirve para llamar", async () => {
    for (const telefono of ["", "no tengo", "123"]) {
      const res = await POST(pedir({ tipo: "llamada", telefono }));
      expect(res.status).toBe(400);
    }
  });

  it("sigue exigiendo nombre y correo en las consultas de asesoría", async () => {
    const sinCorreo = await POST(pedir({ tipo: "asesoria", nombre: `${NOMBRE}-2` }));
    expect(sinCorreo.status).toBe(400);
    const sinNombre = await POST(pedir({ tipo: "asesoria", email: "alguien@correo.cl" }));
    expect(sinNombre.status).toBe(400);
  });

  it("rechaza un tipo que no existe", async () => {
    const res = await POST(pedir({ tipo: "cualquier-cosa", telefono: TELEFONO }));
    expect(res.status).toBe(400);
  });
});
