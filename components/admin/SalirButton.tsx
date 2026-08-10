"use client";

import { useRouter } from "next/navigation";

export function SalirButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
      style={{
        background: "none",
        border: "1px solid #44413c",
        color: "#cfccc5",
        borderRadius: "7px",
        padding: "5px 12px",
        fontSize: "12.5px",
        cursor: "pointer",
      }}
    >
      Salir
    </button>
  );
}
