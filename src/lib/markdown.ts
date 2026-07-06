import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: false,
});

marked.use({
  renderer: {
    image({ href, title, text }) {
      const alt = text ?? "";
      const titleAttr = title ? ` title="${title}"` : "";
      return `<figure class="news-figure"><img src="${href}" alt="${alt}"${titleAttr} loading="lazy" /><figcaption>${alt}</figcaption></figure>`;
    },
    link({ href, title, text }) {
      const titleAttr = title ? ` title="${title}"` : "";
      const external = href?.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${href}"${titleAttr}${external}>${text}</a>`;
    },
  },
});

export function renderNewsMarkdown(md: string): string {
  return marked.parse(md) as string;
}
