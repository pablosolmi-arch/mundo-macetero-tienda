import sanitizeHtmlLib from "sanitize-html";

// Sanitizes Shopify's `Body (HTML)` product description before it's rendered via
// dangerouslySetInnerHTML. Keeps safe formatting (bold, paragraphs, lists,
// headings, links, images) but strips scripts, event-handler attributes, and
// javascript: URLs (XSS).
//
// Uses sanitize-html (htmlparser2-based, pure Node) rather than DOMPurify:
// isomorphic-dompurify pulls in jsdom, which crashes on Vercel's serverless
// runtime with ERR_REQUIRE_ESM (a jsdom dependency is ESM loaded via require).
export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    // h1/h2 are already in sanitize-html's defaults; img is the only real
    // addition (Shopify descriptions embed product photos).
    allowedTags: sanitizeHtmlLib.defaults.allowedTags.concat(["img"]),
    allowedAttributes: {
      ...sanitizeHtmlLib.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height", "loading"],
    },
    // allowedSchemes defaults to http/https/ftp/mailto/tel — javascript: is not
    // allowed, so javascript: URLs in href/src are dropped.
  });
}
