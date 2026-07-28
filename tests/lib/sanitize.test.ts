import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "../../lib/sanitize";

describe("sanitizeHtml", () => {
  it("strips <script> tags while preserving safe formatting", () => {
    const result = sanitizeHtml("<p>Hola</p><script>alert(1)</script>");
    expect(result).toContain("Hola");
    expect(result).toContain("<p>");
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("alert");
  });

  it("preserves safe inline formatting tags", () => {
    const result = sanitizeHtml("<p>Macetero de <strong>terracota</strong> hecho a mano.</p>");
    expect(result).toContain("<strong>");
    expect(result).toContain("terracota");
  });

  it("preserves lists", () => {
    const result = sanitizeHtml("<ul><li>Chico</li><li>Grande</li></ul>");
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>");
    expect(result).toContain("Chico");
  });

  it("strips inline event handler attributes", () => {
    const result = sanitizeHtml('<img src="x" onerror="alert(1)">');
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("alert");
  });

  it("drops javascript: URLs in links", () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain("javascript:");
    expect(result).not.toContain("alert");
    expect(result).toContain("click");
  });

  it("preserves safe images and headings (allowed tags)", () => {
    const result = sanitizeHtml('<h1>Título</h1><img src="https://cdn.example/p.jpg" alt="foto">');
    expect(result).toContain("<h1>");
    expect(result).toContain('src="https://cdn.example/p.jpg"');
    expect(result).toContain('alt="foto"');
  });
});
