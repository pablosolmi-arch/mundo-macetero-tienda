import { NextResponse } from "next/server";
import { validarCodigo } from "../../../lib/descuentos";

// Valida un código para MOSTRAR el descuento en el carrito. Lo que se cobra se
// resuelve de nuevo en /api/checkout contra la misma tabla: esta respuesta es
// solo para pintar la pantalla.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let codigo = "";
  try {
    const body = (await req.json()) as { codigo?: string };
    codigo = typeof body.codigo === "string" ? body.codigo : "";
  } catch {
    return NextResponse.json({ valido: false }, { status: 400 });
  }
  const d = await validarCodigo(codigo);
  if (!d) return NextResponse.json({ valido: false });
  return NextResponse.json({ valido: true, codigo: d.codigo, tipo: d.tipo, valor: d.valor });
}
