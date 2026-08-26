import { RestablecerForm } from "../../../components/admin/RestablecerForm";

// Fuera del grupo (panel): esta página se abre justamente cuando no hay sesión,
// así que no puede pasar por el guardia que redirige a /admin/login.
export const dynamic = "force-dynamic";

export default async function AdminRestablecerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  // El token viaja en la URL del correo. Se lee aquí y baja al formulario como
  // prop: no se guarda en ninguna parte ni se anota en la bitácora.
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <div style={{ maxWidth: "420px", margin: "0 auto", padding: "80px 24px" }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e9e6e1",
          borderRadius: "16px",
          padding: "32px",
        }}
      >
        <h1 className="font-display" style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px" }}>
          Clave nueva
        </h1>
        <p style={{ fontSize: "13.5px", color: "#6f6c66", margin: "0 0 22px" }}>
          Elige una clave de al menos 12 caracteres para entrar al panel.
        </p>
        <RestablecerForm token={token} />
      </div>
    </div>
  );
}
