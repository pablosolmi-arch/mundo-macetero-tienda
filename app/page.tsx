// app/page.tsx
import Link from "next/link";
import { getAllCategories } from "../queries/catalog";

export const revalidate = 3600;

export default async function HomePage() {
  const categories = await getAllCategories();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Mundo Macetero</h1>
      <ul className="flex flex-wrap gap-4">
        {categories.map((c) => (
          <li key={c.id}>
            <Link href={`/${c.slug}`} className="rounded border px-4 py-2 hover:bg-gray-50">
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
