import "server-only";
import * as cheerio from "cheerio";
import { fetchPublic, truncate } from "./net";

const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Google-Extended", "CCBot"];

async function probe(url: string) {
  try {
    const page = await fetchPublic(url, { timeoutMs: 8000, maxBytes: 300_000 });
    return { status: page.status, body: page.body };
  } catch {
    return { status: 0, body: "" };
  }
}

function blockedBots(robots: string) {
  // Grobe Auswertung: welche KI-Crawler haben ein komplettes "Disallow: /"?
  const blocked: string[] = [];
  const groups = robots.split(/\n(?=\s*user-agent)/i);
  for (const g of groups) {
    const agents = [...g.matchAll(/user-agent:\s*(.+)/gi)].map((m) => m[1].trim());
    const disallowAll = /disallow:\s*\/\s*$/im.test(g);
    if (!disallowAll) continue;
    for (const bot of AI_BOTS) {
      if (agents.some((a) => a.toLowerCase() === bot.toLowerCase())) blocked.push(bot);
    }
    if (agents.includes("*")) blocked.push("* (alle Crawler)");
  }
  return [...new Set(blocked)];
}

/** Technischer und inhaltlicher SEO-Basischeck einer einzelnen Seite. */
export async function seoCheck(rawUrl: string) {
  const page = await fetchPublic(rawUrl);
  const $ = cheerio.load(page.body);
  const origin = new URL(page.finalUrl).origin;
  const host = new URL(page.finalUrl).hostname;

  const title = $("title").first().text().trim();
  const description = $('meta[name="description"]').attr("content")?.trim() ?? "";
  const h1 = $("h1").map((_, el) => $(el).text().replace(/\s+/g, " ").trim()).get();
  const h2 = $("h2").map((_, el) => $(el).text().replace(/\s+/g, " ").trim()).get();
  const images = $("img");
  const imagesWithoutAlt = images.filter((_, el) => !($(el).attr("alt") ?? "").trim()).length;

  let internalLinks = 0;
  let externalLinks = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const u = new URL(href, page.finalUrl);
      if (u.hostname === host) internalLinks++;
      else externalLinks++;
    } catch {
      /* ignorieren */
    }
  });
  const linkTexts = $("a").map((_, el) => $(el).text().toLowerCase()).get().join(" ");

  const jsonLdTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).contents().text());
      const collect = (node: unknown) => {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) return node.forEach(collect);
        const t = (node as Record<string, unknown>)["@type"];
        if (t) jsonLdTypes.push(...(Array.isArray(t) ? t.map(String) : [String(t)]));
        const graph = (node as Record<string, unknown>)["@graph"];
        if (graph) collect(graph);
      };
      collect(data);
    } catch {
      jsonLdTypes.push("(ungültiges JSON-LD)");
    }
  });

  $("script, style, noscript, svg").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const html = page.body;

  const [robots, sitemap, llms] = await Promise.all([
    probe(`${origin}/robots.txt`),
    probe(`${origin}/sitemap.xml`),
    probe(`${origin}/llms.txt`),
  ]);

  return {
    url: page.url,
    finalUrl: page.finalUrl,
    status: page.status,
    weiterleitungen: page.redirects,
    ladezeitMs: page.ms,
    https: page.finalUrl.startsWith("https://"),
    xRobotsTag: page.headers.get("x-robots-tag"),
    title: { text: title, zeichen: title.length },
    metaDescription: { text: description, zeichen: description.length },
    canonical: $('link[rel="canonical"]').attr("href") ?? null,
    robotsMeta: $('meta[name="robots"]').attr("content") ?? null,
    lang: $("html").attr("lang") ?? null,
    viewport: Boolean($('meta[name="viewport"]').length),
    h1,
    h2: h2.slice(0, 15),
    h2Anzahl: h2.length,
    woerter: bodyText ? bodyText.split(" ").length : 0,
    textAuszug: truncate(bodyText, 1500),
    bilder: { gesamt: images.length, ohneAlt: imagesWithoutAlt },
    links: { intern: internalLinks, extern: externalLinks },
    telefonLinks: $('a[href^="tel:"]').length,
    mailLinks: $('a[href^="mailto:"]').length,
    formulare: $("form").length,
    strukturierteDaten: [...new Set(jsonLdTypes)],
    openGraph: {
      titel: $('meta[property="og:title"]').attr("content") ?? null,
      bild: $('meta[property="og:image"]').attr("content") ?? null,
    },
    hreflang: $('link[rel="alternate"][hreflang]').length,
    impressumLink: linkTexts.includes("impressum"),
    datenschutzLink: linkTexts.includes("datenschutz"),
    dsgvoHinweise: {
      googleFontsExtern: /fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html),
      googleMapsEingebettet: /google\.[a-z.]+\/maps\/embed|maps\.google\.[a-z.]+\/maps\?.*output=embed/.test(html),
      youtubeEingebettet: /youtube(-nocookie)?\.com\/embed/.test(html),
      googleAnalytics: /googletagmanager\.com|google-analytics\.com/.test(html),
      metaPixel: /connect\.facebook\.net\/.*fbevents/.test(html),
    },
    robotsTxt: robots.status === 200 ? { vorhanden: true, gesperrteKiCrawler: blockedBots(robots.body), auszug: truncate(robots.body, 800) } : { vorhanden: false },
    sitemapXml: sitemap.status === 200 && /<(urlset|sitemapindex)/.test(sitemap.body),
    llmsTxt: llms.status === 200 && llms.body.length > 0 && !/<html/i.test(llms.body),
  };
}
