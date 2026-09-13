/**
 * Branded monogram avatars — pure, local, zero network.
 *
 * Replaces the stock-photo / third-party-avatar fallbacks (Unsplash faces,
 * api.dicebear.com) that used to appear when a profile photo failed to load.
 * A generic stock stranger standing in for Sheersh's headshot is a
 * credibility problem, so the fallback is now his own monogram.
 */

const TONES = {
  brand: { from: '#7c3aed', to: '#0891b2', ink: '#f8fafc' },
  amber: { from: '#b45309', to: '#7c3aed', ink: '#fffbeb' },
  slate: { from: '#1e293b', to: '#334155', ink: '#cbd5e1' },
};

/**
 * @param {object} opts
 * @param {string} opts.initials  1–2 characters rendered large (e.g. "ST", "J", "Y")
 * @param {'brand'|'amber'|'slate'} [opts.tone]
 * @param {number} [opts.size]    intrinsic px of the generated vector
 * @returns {string} data: URI suitable for an image src
 */
export function monogramDataUri({ initials = 'ST', tone = 'brand', size = 96 } = {}) {
  const { from, to, ink } = TONES[tone] || TONES.brand;
  const label = String(initials).slice(0, 2).toUpperCase();
  const fontSize = label.length > 1 ? size * 0.38 : size * 0.5;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img">`,
    '<defs>',
    `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>`,
    '</linearGradient>',
    '</defs>',
    `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#g)"/>`,
    `<text x="50%" y="50%" dy="${fontSize * 0.35}" text-anchor="middle" fill="${ink}"`,
    ` font-family="Inter,Segoe UI,Arial,sans-serif" font-size="${fontSize}" font-weight="700">${label}</text>`,
    '</svg>',
  ].join('');
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Sheersh's own monogram — the hero photo fallback. */
export const MONOGRAM_OWNER = monogramDataUri({ initials: 'ST', tone: 'brand' });
/** "Ask Jiya" concierge avatar. */
export const MONOGRAM_BOT = monogramDataUri({ initials: 'J', tone: 'amber' });
/** Neutral visitor avatar in the chat thread. */
export const MONOGRAM_GUEST = monogramDataUri({ initials: 'Y', tone: 'slate' });

/** "Oracle" -> "OR", "Prompt Engineering" -> "PE", "React.js" -> "R" */
export function initialsOf(label = '', max = 2) {
  const words = String(label)
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return 'ST';
  if (words.length === 1) return words[0].slice(0, max).toUpperCase();
  return words.slice(0, max).map((w) => w[0]).join('').toUpperCase();
}

/**
 * Deterministic local monogram for any label — used as the onError fallback
 * for the third-party tech/skill icon URLs in src/data/profile.js.
 */
export function monogramFor(label, tone = 'brand') {
  return monogramDataUri({ initials: initialsOf(label), tone });
}

