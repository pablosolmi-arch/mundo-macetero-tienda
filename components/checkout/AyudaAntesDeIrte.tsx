"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TIENDA } from "../../content/site";
import {
  CLAVE_DUDA,
  ETIQUETAS_DUDA,
  MOTIVOS_DUDA,
  type MotivoDuda,
} from "../../lib/eventos-checkout";
import {
  clicLlamar,
  clicWhatsapp,
  llamadaPedida,
  modalAbandonoVisto,
  motivoAbandono,
} from "../../lib/gtm";
import { track } from "../../lib/track";
import { PREGUNTAS, linkWhatsapp, type ContextoWhatsapp } from "../../lib/whatsapp";

// Ayuda para quien se traba en el checkout.
//
// De cada diez sesiones que llegan al pago, ocho aprietan pagar y ninguna deja
// un pedido: en algún punto hay una duda que nadie está resolviendo. Esto la
// pregunta UNA vez, ofrece las tres salidas (WhatsApp, que lo llamemos, seguir
// comprando) y registra la razón, que es el dato que hoy no existe.
//
// Reglas de no invasión, en este orden:
//  - Nunca antes de los primeros segundos en la página.
//  - Nunca si la persona ya apretó pagar (`activo` en false).
//  - Una sola vez, y queda anotado en el navegador para no repetirlo.
//  - En escritorio, solo cuando el mouse sale por arriba de la ventana, que es
//    el gesto de irse. En teléfono no existe ese gesto: se usa inactividad
//    larga, porque alguien que sigue escribiendo o desplazando está avanzando.

// Segundos antes de armar la detección: quien pasa rápido por el checkout no lo
// ve nunca.
const GRACIA_MS = 15_000;
// Inactividad en teléfono. Cuarenta y cinco segundos sin tocar nada en una
// pantalla de pago no es alguien leyendo, es alguien detenido.
const INACTIVIDAD_MS = 45_000;
const CLAVE_MOSTRADO = "mm_ayuda_checkout";

type Paso = "oculto" | "motivo" | "acciones" | "telefono" | "listo";

interface Props {
  // Lo que la persona ya escribió en el formulario: si dejó su teléfono no se le
  // pide otra vez.
  contacto: { nombre: string; email: string; telefono: string };
  // El producto del carrito, para que el mensaje de WhatsApp y la solicitud de
  // llamada lleguen con contexto.
  contexto: ContextoWhatsapp;
  // False mientras se está yendo a pagar: ahí no se interrumpe.
  activo: boolean;
  // El pago falló del lado del servidor o de la pasarela. Es la señal de
  // abandono más clara que existe (apretó pagar y no pudo), así que salta la
  // espera: la ayuda aparece de inmediato. Los errores de validación del propio
  // formulario NO cuentan, ahí solo faltan campos.
  fallo?: boolean;
}

function yaSeMostro(): boolean {
  try {
    return localStorage.getItem(CLAVE_MOSTRADO) === "1";
  } catch {
    // Almacenamiento bloqueado: se prefiere no molestar.
    return true;
  }
}

function anotarMostrado(): void {
  try {
    localStorage.setItem(CLAVE_MOSTRADO, "1");
  } catch {
    // Sin almacenamiento el modal podría reaparecer en otra visita. Es
    // preferible a no poder ofrecer ayuda nunca.
  }
}

export function AyudaAntesDeIrte({ contacto, contexto, activo, fallo = false }: Props) {
  const [paso, setPaso] = useState<Paso>("oculto");
  const [motivo, setMotivo] = useState<MotivoDuda | null>(null);
  const [telefono, setTelefono] = useState(contacto.telefono);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const abierto = paso !== "oculto";

  // En refs para que el efecto de detección no se vuelva a montar cada vez que
  // cambia el paso: los escuchadores se ponen una sola vez y leen el valor de
  // ahora. Se sincronizan en un efecto y no durante el render, y este efecto va
  // PRIMERO para que los de abajo lean valores ya al día.
  const abiertoRef = useRef(abierto);
  const activoRef = useRef(activo);

  useEffect(() => {
    abiertoRef.current = abierto;
    activoRef.current = activo;
  }, [abierto, activo]);

  const mostrar = useCallback(() => {
    if (abiertoRef.current || !activoRef.current || yaSeMostro()) return;

    anotarMostrado();
    setPaso("motivo");
    try {
      track("abandono_visto");
      modalAbandonoVisto();
    } catch {
      // Métricas: nunca pueden impedir que se ofrezca la ayuda.
    }
  }, []);

  useEffect(() => {
    if (fallo) mostrar();
  }, [fallo, mostrar]);

  useEffect(() => {
    if (yaSeMostro()) return;

    let armadoEn: ReturnType<typeof setTimeout> | null = null;
    let inactividad: ReturnType<typeof setTimeout> | null = null;
    let armado = false;

    // El mouse sale por el borde de arriba y no hacia otro elemento: se va a la
    // barra de direcciones o a cerrar la pestaña.
    const alSalir = (e: MouseEvent) => {
      if (!armado) return;
      if (e.clientY <= 0 && !e.relatedTarget) mostrar();
    };

    const enTelefono =
      typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;

    const reiniciarInactividad = () => {
      if (inactividad) clearTimeout(inactividad);
      if (!armado) return;
      inactividad = setTimeout(mostrar, INACTIVIDAD_MS);
    };

    armadoEn = setTimeout(() => {
      armado = true;
      if (enTelefono) reiniciarInactividad();
    }, GRACIA_MS);

    document.addEventListener("mouseout", alSalir);
    const eventos = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    if (enTelefono) {
      for (const evento of eventos) {
        window.addEventListener(evento, reiniciarInactividad, { passive: true });
      }
    }

    return () => {
      if (armadoEn) clearTimeout(armadoEn);
      if (inactividad) clearTimeout(inactividad);
      document.removeEventListener("mouseout", alSalir);
      if (enTelefono) {
        for (const evento of eventos) window.removeEventListener(evento, reiniciarInactividad);
      }
    };
  }, [mostrar]);

  // Escape cierra, como cualquier diálogo.
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPaso("oculto");
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  function elegirMotivo(elegido: MotivoDuda) {
    setMotivo(elegido);
    setPaso("acciones");
    try {
      // La razón queda registrada en el momento de elegirla, aunque después la
      // persona siga comprando sola: ese es el aprendizaje del embudo.
      track("abandono_motivo", { campo: elegido });
      motivoAbandono(elegido);
    } catch {
      // Igual que arriba.
    }
  }

  const preguntaWa = motivo ? PREGUNTAS[CLAVE_DUDA[motivo]] : PREGUNTAS.otra;

  async function pedirLlamada() {
    setError("");
    if ((telefono.match(/\d/g) ?? []).length < 8) {
      setError("Escribe un teléfono con el que podamos llamarte.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Misma tabla `leads` que el resto de las solicitudes de contacto.
          tipo: "llamada",
          nombre: contacto.nombre,
          email: contacto.email,
          telefono,
          detalle: [
            "Pidió que lo llamemos desde el checkout.",
            motivo ? `Duda: ${ETIQUETAS_DUDA[motivo]}` : null,
            contexto.producto ? `Producto: ${contexto.producto}` : null,
            contexto.variante ? `Variante: ${contexto.variante}` : null,
            contexto.terminacion ? `Terminación: ${contexto.terminacion}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "No pudimos registrar tu solicitud.");
        return;
      }
      setPaso("listo");
      try {
        track("llamada_pedida", { campo: "modal" });
        llamadaPedida("modal");
      } catch {
        // Métricas.
      }
    } catch {
      setError(`No pudimos conectar. Llámanos al ${TIENDA.telefonoVentasTexto}.`);
    } finally {
      setEnviando(false);
    }
  }

  if (!abierto) return null;

  return (
    <div className="mm-ayuda-fondo" onClick={() => setPaso("oculto")}>
      <div
        className="mm-ayuda"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mm-ayuda-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setPaso("oculto")}
          aria-label="Cerrar"
          className="mm-ayuda-cerrar"
          type="button"
        >
          ✕
        </button>

        {paso === "listo" ? (
          <>
            <div className="mm-ayuda-ok">✓</div>
            <h2 id="mm-ayuda-titulo" className="font-display mm-ayuda-titulo">
              Te llamamos nosotros
            </h2>
            <p className="mm-ayuda-texto">
              Recibimos tu número. Te llamamos en horario de tienda ({TIENDA.horario}) para resolver tu duda.
            </p>
            <button type="button" onClick={() => setPaso("oculto")} className="mm-btn-dark mm-ayuda-boton">
              Volver a mi compra
            </button>
          </>
        ) : (
          <>
            <h2 id="mm-ayuda-titulo" className="font-display mm-ayuda-titulo">
              ¿Tienes alguna duda antes de completar tu compra?
            </h2>
            <p className="mm-ayuda-texto">Estamos aquí para ayudarte.</p>

            {paso === "motivo" && (
              <>
                <div className="mm-ayuda-pregunta">¿Qué te falta saber para decidir tu compra?</div>
                <div className="mm-ayuda-opciones">
                  {MOTIVOS_DUDA.map((m) => (
                    <button key={m} type="button" onClick={() => elegirMotivo(m)} className="mm-ayuda-opcion">
                      {ETIQUETAS_DUDA[m]}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setPaso("oculto")} className="mm-ayuda-seguir">
                  Seguir con la compra
                </button>
              </>
            )}

            {paso === "acciones" && (
              <>
                <div className="mm-ayuda-pregunta">¿Cómo prefieres que te ayudemos?</div>
                <div className="mm-ayuda-acciones">
                  <a
                    href={linkWhatsapp({ ...contexto, pregunta: preguntaWa })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mm-ayuda-accion mm-ayuda-accion-wa"
                    onClick={() => {
                      try {
                        track("whatsapp", { campo: "modal" });
                        clicWhatsapp("modal");
                      } catch {
                        // Métricas.
                      }
                    }}
                  >
                    Hablar por WhatsApp
                  </a>
                  <button
                    type="button"
                    className="mm-ayuda-accion"
                    onClick={() => {
                      try {
                        track("llamar", { campo: "modal" });
                        clicLlamar("modal");
                      } catch {
                        // Métricas.
                      }
                      setPaso("telefono");
                    }}
                  >
                    Llámenme
                  </button>
                </div>
                <button type="button" onClick={() => setPaso("oculto")} className="mm-ayuda-seguir">
                  Seguir con la compra
                </button>
              </>
            )}

            {paso === "telefono" && (
              <>
                <div className="mm-ayuda-pregunta">
                  {contacto.telefono
                    ? "¿Te llamamos a este número?"
                    : "Déjanos tu teléfono y te llamamos nosotros"}
                </div>
                <input
                  value={telefono}
                  onChange={(e) => {
                    setTelefono(e.target.value);
                    setError("");
                  }}
                  placeholder="+56 9…"
                  type="tel"
                  aria-label="Teléfono"
                  className="mm-ayuda-input"
                />
                {error && <div className="mm-ayuda-error">{error}</div>}
                <button
                  type="button"
                  onClick={pedirLlamada}
                  disabled={enviando}
                  className="mm-btn-dark mm-ayuda-boton"
                >
                  {enviando ? "Enviando…" : "Que me llamen"}
                </button>
                <div className="mm-ayuda-nota">
                  O llámanos ahora al{" "}
                  <a
                    href={`tel:${TIENDA.telefonoVentas}`}
                    onClick={() => {
                      try {
                        track("llamar", { campo: "modal" });
                        clicLlamar("modal");
                      } catch {
                        // Métricas.
                      }
                    }}
                  >
                    {TIENDA.telefonoVentasTexto}
                  </a>
                  , {TIENDA.horario}.
                </div>
                <button type="button" onClick={() => setPaso("oculto")} className="mm-ayuda-seguir">
                  Seguir con la compra
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
