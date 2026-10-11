import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/common";
import { Marked, type RendererObject, type Tokens } from "marked";
import { createSlugger } from "./analyze";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainText(tokens: Tokens.Generic[]) {
  return tokens
    .map((token) => ("text" in token && typeof token.text === "string" ? token.text : token.raw ?? ""))
    .join("")
    .replace(/[*_`~[\]()#]/g, "")
    .trim();
}

function buildRenderer(slug: (value: string) => string): RendererObject {
  return {
    code(token: Tokens.Code) {
      const rawLang = (token.lang ?? "").trim();
      const lang = rawLang.split(/\s+/)[0] ?? "";
      const known = Boolean(lang) && hljs.getLanguage(lang);
      const body = known
        ? hljs.highlight(token.text, { language: lang, ignoreIllegals: true }).value
        : hljs.highlightAuto(token.text).value;

      return [
        '<div class="vellum-code">',
        '<div class="vellum-code__bar">',
        `<span class="vellum-code__lang">${escapeHtml(rawLang || "text")}</span>`,
        '<button type="button" class="vellum-code__copy" data-copy-code>Copy</button>',
        "</div>",
        `<pre><code class="hljs${known ? ` language-${escapeHtml(lang)}` : ""}">${body}</code></pre>`,
        "</div>",
      ].join("");
    },
    heading(token: Tokens.Heading) {
      const text = this.parser.parseInline(token.tokens);
      const id = slug(plainText(token.tokens));
      return `<h${token.depth} id="${id}">${text}</h${token.depth}>`;
    },
    link(token: Tokens.Link) {
      const text = this.parser.parseInline(token.tokens);
      const href = token.href ?? "#";
      const external = /^(https?:)?\/\//i.test(href);
      const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${escapeHtml(href)}"${attrs}>${text}</a>`;
    },
    html() {
      // Raw HTML inside a note is dropped on purpose — notes stay plain Markdown.
      return "";
    },
  };
}

/** Markdown → sanitised HTML with highlighted fenced code and anchorable headings. */
export function renderMarkdown(source: string): string {
  const marked = new Marked({
    renderer: buildRenderer(createSlugger()),
    gfm: true,
    breaks: false,
    pedantic: false,
  });
  const html = marked.parse(source, { async: false }) as string;
  return DOMPurify.sanitize(html, { ADD_ATTR: ["data-copy-code", "target", "rel", "id"] });
}
