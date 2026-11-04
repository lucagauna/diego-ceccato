import type { APIRoute } from "astro";
import { PREVIEW, urlAbsoluta } from "../data/sitio";

const bots = [
  "Googlebot",
  "Google-Extended",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Applebot",
];

export const GET: APIRoute = () => {
  const lineas = PREVIEW
    ? ["# Provisional preview: not for indexing.", "User-agent: *", "Disallow: /"]
    : [
        "# Diego Ceccato: everyone is welcome to read this site, search engines and AI assistants alike.",
        "",
        "User-agent: *",
        "Allow: /",
        ...bots.flatMap((bot) => ["", `User-agent: ${bot}`, "Allow: /"]),
        "",
        `Sitemap: ${urlAbsoluta("/sitemap-index.xml")}`,
      ];
  return new Response(lineas.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
