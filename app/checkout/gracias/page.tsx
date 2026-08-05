import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "¡Gracias por tu compra!" };

export default function GraciasPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-24 text-center">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">¡Gracias por tu compra!</h1>
      <p className="mt-4 text-muted">
        Recibimos tu pedido. Te contactaremos para coordinar el envío o retiro.
      </p>
      <Link href="/tienda" className="mt-8 inline-block rounded-md bg-ink px-6 py-3 text-sm text-white">
        Seguir comprando
      </Link>
    </main>
  );
}
