"use client";

import { useState } from "react";

// Newsletter block. The design marked success in local state only; that is kept
// here deliberately, so the UI never claims a subscription was stored until a
// real list/CRM endpoint exists. El fondo lo pone la <Banda> que la envuelve.
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto", textAlign: "center" }}>
      <h3
        className="font-display"
        style={{ fontSize: "clamp(20px,2.4vw,26px)", fontWeight: 600, margin: "0 0 8px" }}
      >
        Regístrate para estar más cerca
      </h3>
      <p style={{ fontSize: "14px", color: "#6f6c66", margin: "0 0 20px" }}>
        Conoce las nuevas colecciones y las ofertas exclusivas antes que nadie.
      </p>
      {ok ? (
        <div
          style={{
            display: "inline-block",
            background: "#fff",
            borderRadius: "9px",
            padding: "13px 22px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#4c7a4c",
          }}
        >
          ✓ ¡Listo! Te avisaremos de las novedades.
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.includes("@")) setOk(true);
          }}
          style={{
            display: "flex",
            gap: "10px",
            maxWidth: "440px",
            margin: "0 auto",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            type="email"
            required
            style={{
              flex: 1,
              minWidth: "220px",
              padding: "13px 16px",
              border: "1px solid #d8cec4",
              borderRadius: "9px",
              fontSize: "14px",
              background: "#fff",
              color: "#2a2925",
              outline: "none",
            }}
          />
          <button
            type="submit"
            className="mm-btn-dark"
            style={{
              border: "none",
              padding: "13px 24px",
              borderRadius: "9px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Suscribirme
          </button>
        </form>
      )}
    </div>
  );
}
