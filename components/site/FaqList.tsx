import type { Faq } from "../../content/geo";

// Acordeón de preguntas frecuentes con <details> nativos: sin JavaScript, la
// respuesta viaja en el HTML aunque esté colapsada, que es lo que necesitan los
// buscadores y los modelos de lenguaje para citarla. Los estilos viven en
// .mm-faq (app/globals.css) y se comparten con la portada y las guías.
export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="mm-faq">
      {faqs.map((f) => (
        <details key={f.q}>
          <summary className="font-display">{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
