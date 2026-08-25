"use client";

// Único trozo de cliente de la hoja de impresión: window.print() solo existe en
// el navegador. La regla @media print de globals.css lo esconde en el papel.
export function BotonImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="mm-no-print"
      style={{
        padding: "9px 16px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        border: "none",
        background: "#2a2925",
        color: "#fff",
      }}
    >
      Imprimir
    </button>
  );
}
