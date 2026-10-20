import { build } from "vite";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createTranslator } from "../src/i18n/core.js";
import { publicCatalogs } from "../src/i18n/publicCatalogs.js";
import { PUBLIC_ORIGIN, PUBLIC_LOCALES, publicPages, publicPath, publicPageFile, publicRoute } from "../src/publicSeo.js";
import { publicArticles } from "../src/publicArticles.js";
import { publicStructuredData } from './public-structured-data.mjs';

const escape = value => String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

export async function prerenderPublic(template) {
  const icon = /rel="apple-touch-icon"[^>]*href="([^"]+)"/.exec(template)?.[1];
  if (!icon?.startsWith("/assets/")) throw new Error("Public share image is missing");
  const logoURL = PUBLIC_ORIGIN + icon;
  const entry = resolve("src/public-render.jsx");
  const serverDirectory = resolve(".local/public-render");
  await build({ mode: "public", build: { ssr: entry, outDir: serverDirectory, emptyOutDir: true,
    rollupOptions: { input: entry, output: { entryFileNames: "render.mjs", chunkFileNames: "[name]-[hash].mjs" } } } });
  const { renderPublicPage } = await import(pathToFileURL(resolve(serverDirectory, "render.mjs")));
  const homeBody = await renderPublicPage('/', 'en');
  const shareImage = /src="(\/assets\/hero-still-life-[A-Za-z0-9_-]+\.webp)"/.exec(homeBody)?.[1];
  if (!shareImage) throw new Error('Approved public sharing image is missing');
  const imageURL = PUBLIC_ORIGIN + shareImage;
  const pages = [];
  for (const locale of PUBLIC_LOCALES) {
    const t = createTranslator(locale, publicCatalogs);
    for (const [path, metadata] of Object.entries(publicPages)) {
      const url = PUBLIC_ORIGIN + publicPath(path, locale);
      const title = t(metadata.title), description = t(metadata.description);
      const alternates = PUBLIC_LOCALES.map(language => `<link rel="alternate" hreflang="${language}" href="${PUBLIC_ORIGIN}${publicPath(path, language)}" />`).join("\n");
      const article = publicArticles[path];
      const structured = publicStructuredData(path, locale, t, { title, description, logoURL });
      const head = `<link rel="canonical" href="${url}" />\n${alternates}\n<link rel="alternate" hreflang="x-default" href="${PUBLIC_ORIGIN}${publicPath(path, "en")}" />
<meta property="og:type" content="${article ? 'article' : 'website'}" /><meta property="og:site_name" content="Rillora" />
<meta property="og:title" content="${escape(title)}" /><meta property="og:description" content="${escape(description)}" />
<meta property="og:url" content="${url}" /><meta property="og:locale" content="${locale === "en" ? "en_US" : "zh_CN"}" />
<meta property="og:image" content="${imageURL}" /><meta property="og:image:alt" content="Rillora" />
<meta property="og:image:width" content="1600" /><meta property="og:image:height" content="1067" />
<meta name="twitter:card" content="summary_large_image" />
${article ? `<meta property="article:published_time" content="${article.published}" /><meta property="article:modified_time" content="${article.modified}" />` : ''}
<script type="application/ld+json">${JSON.stringify(structured).replaceAll("<", "\\u003c")}</script>`;
      const body = path === '/' && locale === 'en' ? homeBody : await renderPublicPage(path, locale);
      if (!body.includes('<main id="lp-main"') || !body.includes("<h1")) throw new Error(`Empty public render: ${path} ${locale}`);
      if (/<script\b| style="/.test(body)) throw new Error(`Public render would require blocked inline execution or styles: ${path} ${locale}`);
      const html = template.replace('<html lang="en"', `<html lang="${locale}"`)
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)}</title>`)
        .replace(/<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/, `<meta name="description" content="${escape(description)}" />`)
        .replace("</head>", `${head}\n</head>`)
        .replace('<div id="root"></div>', `<div id="root" data-prerendered="true">${body}</div>`);
      const file = publicPageFile(path, locale);
      await mkdir(dirname(resolve("dist-public", file)), { recursive: true });
      await writeFile(resolve("dist-public", file), html);
      pages.push({ path: publicPath(path, locale), file, locale, canonical: url });
    }
  }
  // Keep the legacy entry object for existing artifact verification and bookmarks.
  const index = await readFile(resolve("dist-public", publicPageFile("/", "en")), "utf8");
  await writeFile("dist-public/index.html", index);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${pages.map(page => {
    const article = publicArticles[publicRoute(page.path).path];
    return `<url><loc>${page.canonical}</loc>${article ? `<lastmod>${article.modified}</lastmod>` : ''}${PUBLIC_LOCALES.map(locale => `<xhtml:link rel="alternate" hreflang="${locale}" href="${PUBLIC_ORIGIN}${publicPath(page.path, locale)}"/>`).join("")}</url>`;
  }).join("\n")}\n</urlset>\n`;
  await writeFile("dist-public/sitemap.xml", sitemap);
  // Keep the original flat map for existing submissions. The index gives each language
  // an independently fetchable, minimal XML document and a stable diagnostic address.
  for (const locale of PUBLIC_LOCALES) {
    const entries = pages.filter(page => page.locale === locale).map(page => {
      const article = publicArticles[publicRoute(page.path).path];
      return `<url><loc>${page.canonical}</loc>${article ? `<lastmod>${article.modified}</lastmod>` : ''}</url>`;
    }).join("\n");
    await writeFile(`dist-public/sitemap-${locale}.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`);
  }
  await writeFile('dist-public/sitemap-index.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PUBLIC_LOCALES.map(locale => `<sitemap><loc>${PUBLIC_ORIGIN}/sitemap-${locale}.xml</loc></sitemap>`).join('\n')}\n</sitemapindex>\n`);
  // Exact approved PNG bytes, without resizing or replacing the existing head icon.
  await writeFile('dist-public/favicon.png', await readFile(resolve('dist-public', icon.slice(1))));
  await writeFile("dist-public/robots.txt", `User-agent: *\nAllow: /\nSitemap: ${PUBLIC_ORIGIN}/sitemap-index.xml\n`);
  return { pages, index };
}
