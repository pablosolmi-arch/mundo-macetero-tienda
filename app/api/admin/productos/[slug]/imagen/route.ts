import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { db } from "../../../../../../db/client";
import { products } from "../../../../../../db/schema";
import { getSessionUser } from "../../../../../../lib/admin/auth";
import { obtenerProducto } from "../../../../../../queries/admin-productos";

// Sube una imagen nueva a la galería de un producto.
//
// El archivo que llega del panel no se guarda como viene: las fotos del catálogo
// venían de la cámara a 1,4 MB promedio y una ficha llegaba a pesar 11 MB. Acá se
// aplican las mismas medidas que scripts/optimize-images.ts y scripts/make-thumbs.ts
// (1200 px calidad 78 en `opt/`, miniatura de 600 px calidad 76 en `thumb/`), para
// que lo cargado a mano pese lo mismo que lo importado.

export const dynamic = "force-dynamic";

const ANCHO = 1200;
const CALIDAD = 78;
const ANCHO_MINI = 600;
const CALIDAD_MINI = 76;
const MAX_BYTES = 10 * 1024 * 1024;

function nombreBase(archivo: string): string {
  const limpio = (archivo.split("/").pop() ?? "")
    .replace(/\.\w+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-56);
  return limpio || "imagen";
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const usuario = await getSessionUser();
  if (!usuario) return NextResponse.json({ message: "No autorizado." }, { status: 401 });

  const { slug } = await params;
  const producto = await obtenerProducto(slug);
  if (!producto) return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });

  let file: File;
  try {
    const form = await req.formData();
    const dato = form.get("file");
    if (!(dato instanceof File)) {
      return NextResponse.json({ message: "Falta el archivo." }, { status: 400 });
    }
    file = dato;
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ message: "El archivo tiene que ser una imagen." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: "La imagen no puede pesar más de 10 MB." }, { status: 400 });
  }

  const original = Buffer.from(await file.arrayBuffer());

  let grande: Buffer;
  let mini: Buffer;
  try {
    // .rotate() antes de redimensionar: las fotos de teléfono traen la
    // orientación en el EXIF y sin esto quedan acostadas.
    grande = await sharp(original)
      .rotate()
      .resize({ width: ANCHO, withoutEnlargement: true })
      .webp({ quality: CALIDAD })
      .toBuffer();
    mini = await sharp(original)
      .rotate()
      .resize({ width: ANCHO_MINI, withoutEnlargement: true })
      .webp({ quality: CALIDAD_MINI })
      .toBuffer();
  } catch {
    return NextResponse.json({ message: "No se pudo procesar la imagen." }, { status: 400 });
  }

  const base = nombreBase(file.name);
  let urlGrande: string;
  let urlMini: string;
  try {
    const [subidaGrande, subidaMini] = await Promise.all([
      put(`opt/${base}-${ANCHO}.webp`, grande, {
        access: "public",
        addRandomSuffix: true,
        contentType: "image/webp",
      }),
      put(`thumb/${base}-${ANCHO_MINI}.webp`, mini, {
        access: "public",
        addRandomSuffix: true,
        contentType: "image/webp",
      }),
    ]);
    urlGrande = subidaGrande.url;
    urlMini = subidaMini.url;
  } catch (error) {
    // Sin datos del archivo ni del usuario en el log.
    console.error(
      "blob put falló:",
      error instanceof Error ? error.message : "error desconocido",
    );
    return NextResponse.json(
      { message: "No se pudo guardar la imagen en el almacenamiento." },
      { status: 502 },
    );
  }

  // `thumbs` se lee por índice contra `images` (la tira de la ficha muestra
  // thumbs[i] al elegir images[i]). Si venía más corta, se completa con las
  // propias images antes de agregar, o la miniatura nueva quedaría apuntando a
  // otra foto.
  const thumbsAlineados = producto.images.map((img, i) => producto.thumbs[i] ?? img);

  await db
    .update(products)
    .set({
      images: [...producto.images, urlGrande],
      thumbs: [...thumbsAlineados, urlMini],
    })
    .where(eq(products.id, producto.id));

  return NextResponse.json({ ok: true });
}
