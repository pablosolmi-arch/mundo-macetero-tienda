// app/robots.ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/seo";

// AI crawlers are allowed on purpose: the storefront wants to be quoted by
// ChatGPT, Claude, Perplexity and Google AI Overviews. They each get their own
// rule (instead of relying on the "*" one) because several of them ignore the
// wildcard block and only read the group that names them.
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "meta-externalagent",
];

// Nothing here is secret: /admin and /api are already protected server-side. They
// are excluded because they are per-session or non-content URLs with nothing to
// index, and crawling them only wastes crawl budget.
const DISALLOW = ["/admin", "/api/", "/carrito", "/checkout", "/confirmacion", "/retomar/", "/cuenta"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
