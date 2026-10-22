import { metadataForPath, OG_IMAGE_URL, OG_IMAGE_ALT } from '../src/data/seo.js';

export const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
export const safeJson = value => JSON.stringify(value).replaceAll('<', '\\u003c');

export function applyMetadata(html, path) {
  const meta = metadataForPath(path);
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(/<link rel="canonical"[^>]*>/, meta.canonical ? `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />` : '')
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapeHtml(meta.description)}" />`)
    .replace(/<meta name="robots"[^>]*>/, `<meta name="robots" content="${meta.robots}" />`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, meta.schema ? `<script type="application/ld+json">${safeJson(meta.schema)}</script>` : '');
  const tags = { 'og:type': meta.type, 'og:title': meta.title, 'og:description': meta.description, 'og:url': meta.canonical, 'og:image': OG_IMAGE_URL, 'og:image:alt': OG_IMAGE_ALT, 'twitter:title': meta.title, 'twitter:description': meta.description };
  for (const [key, value] of Object.entries(tags)) {
    const attribute = key.startsWith('og:') ? 'property' : 'name';
    out = out.replace(new RegExp(`<meta ${attribute}="${key}"[^>]*>`), value ? `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />` : '');
  }
  return out;
}
