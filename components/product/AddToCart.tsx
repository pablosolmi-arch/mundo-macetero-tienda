"use client";

import { agregarAlCarro } from "../../lib/gtm";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "../cart/CartContext";
import { formatCLP } from "../../lib/format";
import { HEXES } from "../../content/site";
import {
  HEX_TERMINACION,
  TERMINACIONES,
  TERMINACION_PENDIENTE,
  esEjeDeColor,
} from "../../content/terminaciones";
import { VentajasClave } from "./VentajasClave";
import { PREGUNTAS, linkWhatsapp } from "../../lib/whatsapp";
import { asesoriaIniciada, clicWhatsapp } from "../../lib/gtm";
import { track } from "../../lib/track";

// Buy box: one group of buttons per option axis (size, drainage…), the standard
// finish choice, a price that tracks the selected combination, quantity and
// add-to-cart.
//
// A variant is one sellable COMBINATION. Values that no combination can reach with
// the current selection are shown struck through and cannot be picked, so the
// customer never lands on something that does not exist.
//
// El eje de color que traía el catálogo NO se muestra: la terminación se pregunta
// aparte, igual en las 23 fichas (ver content/terminaciones.ts). La variante se
// resuelve ignorando ese eje, tomando la primera combinación disponible del tamaño
// y la forma elegidos.
//
// Prices here are display only: /api/checkout recomputes the charged amount from
// the database using the variant id.

export interface VariantOption {
  id: number;
  name: string;
  price: number;
  stock: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  available: boolean;
}

interface AddToCartProps {
  productSlug: string;
  productName: string;
  basePrice: number;
  image: string | null;
  variants: VariantOption[];
  optionNames: string[];
}

const AXIS_KEYS = ["option1", "option2", "option3"] as const;

function valueOf(v: VariantOption, axis: number): string | null {
  return v[AXIS_KEYS[axis]];
}

// Some option values name a finish; show its colour as a dot, as the design does.
function hexFor(name: string): string | null {
  const key = name.trim().toLowerCase();
  for (const [id, hex] of Object.entries(HEXES)) {
    if (key.includes(id)) return hex;
  }
  return null;
}

// El doble fondo (cámara de agua interior) es una decisión de fabricación, no
// algo que el cliente deba poder marcar solo en la ficha: se saca de la venta
// por autoservicio en cualquier eje donde aparezca (Drenaje u otro).
function esOpcionDobleFondo(valor: string | null): boolean {
  return !!valor && valor.toLowerCase().includes("doble fondo");
}

export function AddToCart({
  productSlug,
  productName,
  basePrice,
  image,
  variants,
  optionNames,
}: AddToCartProps) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  // Variantes vendibles de verdad: sin las que llevan doble fondo, que se
  // consultan aparte en vez de elegirse solas en la ficha (ver esOpcionDobleFondo).
  const variantesDisponibles = useMemo(
    () => variants.filter((v) => ![v.option1, v.option2, v.option3].some(esOpcionDobleFondo)),
    [variants],
  );
  // El feed de Google Merchant Center enlaza cada variante como
  // /producto/<slug>?variante=<id>, así que la ficha abre con esa combinación ya
  // elegida en vez de la primera disponible.
  const variantePedida = useSearchParams().get("variante");

  // Distinct values per axis, in the order the catalog lists them. `oculto` marca
  // el eje de color: sigue existiendo para resolver la variante, pero no se pinta.
  const axes = useMemo(
    () =>
      optionNames.map((nombre, i) => ({
        nombre,
        oculto: esEjeDeColor(nombre),
        valores: [
          ...new Set(variantesDisponibles.map((v) => valueOf(v, i)).filter((x): x is string => !!x)),
        ],
      })),
    [optionNames, variantesDisponibles],
  );

  // Default to the variant asked for in the URL, otherwise the first combination
  // that can actually be bought.
  const initial = useMemo(() => {
    const pedida = variantePedida
      ? variantesDisponibles.find((v) => String(v.id) === variantePedida)
      : undefined;
    const first = pedida ?? variantesDisponibles.find((v) => v.available) ?? variantesDisponibles[0];
    return axes.map((_, i) => (first ? (valueOf(first, i) ?? "") : ""));
  }, [axes, variantesDisponibles, variantePedida]);

  const [seleccion, setSeleccion] = useState<string[]>(initial);
  // Nadie sale por defecto: la terminación es una decisión del cliente, y elegirla
  // por él dejaría pedidos "Cemento Natural" que nunca miró.
  const [terminacion, setTerminacion] = useState<string | null>(null);
  const [faltaTerminacion, setFaltaTerminacion] = useState(false);

  // El botón de comprar real. Cuando se va de pantalla aparece la barra fija de
  // abajo, que llama exactamente a la misma función: no hay una segunda lógica
  // de compra que se pueda desincronizar de esta.
  const botonRef = useRef<HTMLButtonElement>(null);
  const [botonALaVista, setBotonALaVista] = useState(true);

  useEffect(() => {
    const boton = botonRef.current;
    if (!boton || typeof IntersectionObserver === "undefined") return;
    const observador = new IntersectionObserver(
      ([entrada]) => setBotonALaVista(entrada.isIntersecting),
      // Un poco de margen abajo: la barra no aparece justo cuando el botón roza
      // el borde, si no titila mientras se desliza la página.
      { rootMargin: "-60px 0px -20px 0px" },
    );
    observador.observe(boton);
    return () => observador.disconnect();
  }, []);

  // Una variante calza cuando coincide en todos los ejes VISIBLES; el de color se
  // ignora, así que varias variantes pueden calzar y manda la primera disponible.
  function coincide(v: VariantOption, sel: string[], salvo = -1): boolean {
    return axes.every(
      (eje, i) => eje.oculto || i === salvo || (valueOf(v, i) ?? "") === (sel[i] ?? ""),
    );
  }

  const selected =
    variantesDisponibles.find((v) => coincide(v, seleccion) && v.available) ??
    variantesDisponibles.find((v) => coincide(v, seleccion)) ??
    null;

  const unitPrice = selected?.price ?? basePrice;
  const agotado = selected != null && !selected.available;

  function pick(axis: number, value: string) {
    const next = [...seleccion];
    next[axis] = value;

    // If the new value makes the rest of the selection impossible, slide the other
    // axes to the first combination that works with it.
    const exists = variantesDisponibles.some((v) => coincide(v, next));
    if (!exists) {
      const fallback =
        variantesDisponibles.find((v) => (valueOf(v, axis) ?? "") === value && v.available) ??
        variantesDisponibles.find((v) => (valueOf(v, axis) ?? "") === value);
      if (fallback) {
        for (let i = 0; i < next.length; i += 1) next[i] = valueOf(fallback, i) ?? "";
      }
    }
    setSeleccion(next);
  }

  // A value is reachable when some variant has it alongside every OTHER visible
  // axis as currently selected.
  function reachable(axis: number, value: string): boolean {
    return variantesDisponibles.some(
      (v) => (valueOf(v, axis) ?? "") === value && v.available && coincide(v, seleccion, axis),
    );
  }

  // "Color" en las bases metálicas: son de metal, no llevan acabado de cemento,
  // pero el dueño quiere preguntar igual por el tono.
  const etiquetaTerminacion = productSlug === "bases-metalicas" ? "Color" : "Terminación";

  // El nombre de la variante TAL COMO se eligió en pantalla: solo los ejes
  // visibles. El nombre que trae el catálogo incluye el eje de color oculto, y
  // el carrito y el resumen del pedido terminaban diciendo "… / Oxido de Cobre"
  // al lado de "Terminación: Cemento Natural", dos colores distintos para el
  // mismo macetero. El precio y el stock se siguen resolviendo con la variante
  // real (`selected`), esto es solo lo que se lee.
  const nombreVisible =
    axes
      .map((eje, i) => (eje.oculto ? null : seleccion[i]))
      .filter((v): v is string => !!v)
      .join(" / ") || null;

  // La compra, en un solo lugar: la llaman el botón de la ficha y la barra fija
  // de móvil. Si falta la terminación no agrega nada y marca el aviso, igual que
  // antes.
  function agregar() {
    if (!terminacion) {
      setFaltaTerminacion(true);
      return;
    }
    add(
      {
        productSlug,
        name: productName,
        variantId: selected?.id ?? null,
        variantName: nombreVisible,
        terminacion,
        unitPrice,
        image,
      },
      qty,
    );
    agregarAlCarro({
      item_id: productSlug,
      item_name: productName,
      item_variant: nombreVisible ?? undefined,
      price: unitPrice,
      quantity: qty,
    });
  }

  // Lo que se está mirando, para que el mensaje de WhatsApp llegue con contexto y
  // el vendedor no tenga que preguntar de qué macetero se trata.
  const contexto = {
    producto: productName,
    variante: nombreVisible,
    terminacion,
  };

  const ORIGEN = "ficha";

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "6px" }}>
        <span style={{ fontSize: "24px", fontWeight: 700 }}>{formatCLP(unitPrice * qty)}</span>
      </div>
      {/* Antes acá decía que el envío "se calcula en la pantalla de pago", que no
          es cierto: el sitio nunca cobra despacho. La regla real se dice completa
          bajo el botón y en el acordeón "Envío y retiro". */}
      <div style={{ fontSize: "12px", color: "#9b978f", marginBottom: "16px" }}>
        CLP · IVA incluido
      </div>

      <VentajasClave />

      {axes.map((eje, i) => eje.oculto ? null : (
        <div key={eje.nombre} style={{ marginBottom: "18px" }}>
          <div style={{ fontSize: "12.5px", fontWeight: 700, marginBottom: "9px" }}>{eje.nombre}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {eje.valores.map((valor) => {
              const on = seleccion[i] === valor;
              const ok = reachable(i, valor);
              const hex = hexFor(valor);
              return (
                <button
                  key={valor}
                  onClick={() => pick(i, valor)}
                  title={ok ? undefined : "Sin stock en esta combinación"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    cursor: "pointer",
                    border: on ? "1.5px solid #2a2925" : "1px solid #d8d5cf",
                    background: on ? "#2a2925" : "#fff",
                    color: on ? "#fff" : ok ? "#2a2925" : "#9b978f",
                    fontWeight: on ? 700 : 500,
                    textDecoration: ok ? "none" : "line-through",
                  }}
                >
                  {hex && (
                    <span
                      style={{
                        width: "13px",
                        height: "13px",
                        borderRadius: "50%",
                        background: hex,
                        border: "1px solid rgba(42,41,37,.28)",
                        display: "inline-block",
                        flex: "none",
                      }}
                    />
                  )}
                  {valor}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ marginBottom: "18px" }}>
        <div style={{ fontSize: "12.5px", fontWeight: 700, marginBottom: "9px" }}>
          {etiquetaTerminacion}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {[...TERMINACIONES, TERMINACION_PENDIENTE].map((valor) => {
            const on = terminacion === valor;
            const hex = HEX_TERMINACION[valor] ?? null;
            return (
              <button
                key={valor}
                onClick={() => {
                  setTerminacion(valor);
                  setFaltaTerminacion(false);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "9px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                  border: on ? "1.5px solid #2a2925" : "1px solid #d8d5cf",
                  background: on ? "#2a2925" : "#fff",
                  color: on ? "#fff" : "#2a2925",
                  fontWeight: on ? 700 : 500,
                }}
              >
                {hex && (
                  <span
                    style={{
                      width: "13px",
                      height: "13px",
                      borderRadius: "50%",
                      background: hex,
                      border: "1px solid rgba(42,41,37,.28)",
                      display: "inline-block",
                      flex: "none",
                    }}
                  />
                )}
                {valor}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: "12px", color: "#6f6c66", marginTop: "9px" }}>
          Si aún no lo decides, marca {TERMINACION_PENDIENTE} y lo confirmamos contigo antes de
          fabricar.
        </div>
        {faltaTerminacion && (
          <div style={{ fontSize: "12.5px", color: "#a5613f", fontWeight: 600, marginTop: "7px" }}>
            Elige una terminación
          </div>
        )}
      </div>

      {/* La duda que frena la compra aparece justo acá, al elegir medida y
          terminación, así que la ayuda se ofrece en este punto y no al final.
          Lleva al sistema de asesoramiento que ya existe (/asesoramiento), con el
          producto que se está mirando en la URL para que llegue en la solicitud. */}
      <div
        style={{
          background: "#f6f2ec",
          border: "1px solid #e9e2d6",
          borderRadius: "12px",
          padding: "14px 16px",
          marginBottom: "6px",
        }}
      >
        <div style={{ fontSize: "13.5px", fontWeight: 700, marginBottom: "3px" }}>
          ¿No estás seguro del tamaño o la terminación?
        </div>
        <div style={{ fontSize: "12.5px", color: "#6f6c66", lineHeight: 1.5, marginBottom: "11px" }}>
          Te ayudamos a elegir el macetero adecuado para tu planta y tu espacio.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "9px", alignItems: "center" }}>
          <Link
            href={`/asesoramiento?producto=${encodeURIComponent(productSlug)}`}
            onClick={() => {
              try {
                track("asesoria", { campo: ORIGEN });
                asesoriaIniciada(ORIGEN);
              } catch {
                // Métricas: nunca pueden impedir que pida ayuda.
              }
            }}
            style={{
              display: "inline-block",
              background: "#fff",
              border: "1px solid #d8d5cf",
              borderRadius: "8px",
              padding: "10px 15px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#2a2925",
            }}
          >
            Quiero que me asesoren
          </Link>
          <a
            href={linkWhatsapp({ ...contexto, pregunta: PREGUNTAS.asesoria })}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              try {
                track("whatsapp", { campo: ORIGEN });
                clicWhatsapp(ORIGEN);
              } catch {
                // Igual que arriba.
              }
            }}
            style={{ fontSize: "12.5px", fontWeight: 600, color: "#a5613f", textDecoration: "underline" }}
          >
            o pregúntanos por WhatsApp
          </a>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "stretch", margin: "24px 0 10px", flexWrap: "wrap" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            border: "1px solid #d8d5cf",
            borderRadius: "9px",
            background: "#fff",
          }}
        >
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Quitar una unidad"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "12px 16px",
              fontSize: "16px",
              color: "#2a2925",
            }}
          >
            −
          </button>
          <span style={{ fontSize: "15px", fontWeight: 600, minWidth: "26px", textAlign: "center" }}>{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            aria-label="Agregar una unidad"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "12px 16px",
              fontSize: "16px",
              color: "#2a2925",
            }}
          >
            +
          </button>
        </div>
        <button
          ref={botonRef}
          disabled={agotado}
          onClick={agregar}
          className={agotado ? undefined : "mm-btn-dark"}
          style={{
            flex: 1,
            minWidth: "220px",
            border: "none",
            borderRadius: "9px",
            padding: "14px 26px",
            fontSize: "14.5px",
            fontWeight: 700,
            cursor: agotado ? "not-allowed" : "pointer",
            background: agotado ? "#d8d5cf" : undefined,
            color: agotado ? "#6f6c66" : undefined,
          }}
        >
          {agotado ? "Sin stock en esta combinación" : "Agregar al carrito"}
        </button>
      </div>
      {/* Una línea corta y nada más: la regla completa, con las comunas nombradas
          una por una, está justo abajo en "Envío y retiro", que ahora viene
          abierto. Repetir la lista en los dos lugares solo alarga la ficha. */}
      <div style={{ fontSize: "12.5px", color: "#4c7a4c", fontWeight: 600, marginBottom: "24px" }}>
        ✓ Despacho gratis en el sector oriente · Retiro gratis en Quilicura
      </div>

      {/* Barra fija de compra, solo en teléfono y solo cuando el botón real salió
          de pantalla. El botón de acá llama a la misma función `agregar`. */}
      {!botonALaVista && !agotado && (
        <div className="mm-comprar-fijo">
          <div style={{ minWidth: 0 }}>
            {/* El nombre del producto, no el de la variante: el nombre de la
                variante trae el eje de color que la ficha esconde a propósito
                (la terminación se pregunta aparte), y aparecería acá diciendo
                "Oxido de Cobre" sin que nadie lo haya elegido. */}
            <div
              style={{
                fontSize: "12px",
                color: "#6f6c66",
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {productName}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.3 }}>
              {formatCLP(unitPrice * qty)}
            </div>
          </div>
          <button onClick={agregar} className="mm-btn-dark mm-comprar-fijo-boton">
            Agregar al carrito
          </button>
        </div>
      )}
    </>
  );
}
