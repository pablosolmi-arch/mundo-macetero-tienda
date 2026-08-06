"use client";

// Small client island so the footer itself can stay a server component.
export function ScrollTopButton() {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
      className="mm-footer-top"
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        border: "1px solid #44413c",
        background: "none",
        color: "#cfccc5",
        fontSize: "16px",
        cursor: "pointer",
        transition: "border-color .2s,color .2s,transform .25s",
      }}
    >
      ↑
    </button>
  );
}
