import DOMPurify from "isomorphic-dompurify";

// Sanitizes Shopify's `Body (HTML)` product description before it's rendered
// via dangerouslySetInnerHTML. We want to keep the formatting (bold,
// paragraphs, lists) but strip anything that could execute script (XSS).
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
