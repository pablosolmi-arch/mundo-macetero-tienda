import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BLOG } from "../../../content/site";
import { BLOG_IMGS } from "../../../content/images";

export function generateStaticParams() {
  return BLOG.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG.find((b) => b.slug === slug);
  if (!post) return { title: "Noticias" };
  return { title: post.titulo, description: post.extracto };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = BLOG.find((b) => b.slug === slug);
  if (!post) notFound();

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px 80px" }}>
      <div style={{ fontSize: "12.5px", color: "#9b978f", marginBottom: "16px" }}>
        <Link href="/blog" className="mm-link" style={{ color: "#9b978f" }}>
          Noticias
        </Link>{" "}
        / <span style={{ color: "#2a2925" }}>{post.fecha}</span>
      </div>
      <h1
        className="font-display"
        style={{
          fontSize: "clamp(24px,3.2vw,34px)",
          fontWeight: 700,
          margin: "0 0 22px",
          lineHeight: 1.2,
          textWrap: "pretty",
        }}
      >
        {post.titulo}
      </h1>
      <div
        style={{
          borderRadius: "14px",
          overflow: "hidden",
          aspectRatio: "16/9",
          background: "#e7e4df",
          marginBottom: "26px",
        }}
      >
        {BLOG_IMGS[post.imagen] && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={BLOG_IMGS[post.imagen]}
            alt={post.titulo}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
           loading="lazy" decoding="async" />
        )}
      </div>
      <div
        style={{
          fontSize: "15.5px",
          lineHeight: 1.75,
          color: "#4c4944",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {post.cuerpo.map((p, i) => (
          <p key={i} style={{ margin: 0, textWrap: "pretty" }}>
            {p}
          </p>
        ))}
      </div>
      <Link
        href="/blog"
        style={{ display: "inline-block", marginTop: "30px", fontSize: "13.5px", fontWeight: 600, color: "#a5613f" }}
      >
        ← Volver a noticias
      </Link>
    </div>
  );
}
