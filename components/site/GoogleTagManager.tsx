import { GTM_ID } from "../../lib/gtm";

// Contenedor de Google Tag Manager. Se monta solo en la tienda, nunca en /admin:
// el panel es interno y no tiene por qué alimentar las estadísticas ni las
// conversiones de las campañas.
//
// Va como <script> en el HTML servido, no con next/script: con `afterInteractive`
// la etiqueta se inyecta recién después de hidratar, y entonces el evento de
// compra de la página de confirmación puede dispararse antes de que GTM exista.
// El fragmento es la plantilla oficial de Google, con el identificador fijo en el
// código: no hay entrada de usuario que sanear.
const SNIPPET = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`;

export function GoogleTagManager() {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: SNIPPET }} />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
