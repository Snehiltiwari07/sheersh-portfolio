/**
 * Single source of truth for the responsive image pipeline (T-001).
 *
 * Consumed by BOTH:
 *   - scripts/build-images.mjs            (build time: generates the candidate files)
 *   - src/components/ResponsivePhoto.jsx  (runtime: builds <picture>/srcset/sizes)
 *
 * Never hand-edit the generated files in public/img/ — re-run `npm run build:images`.
 */

/** Fallback (universally supported) raster width, in px. */
export const FALLBACK_WIDTH = 768;

const SHARED_WIDTHS = [480, 640, 1024, 1280, 1600, 2048];

export const PHOTOS = {
  headshot: {
    // master lives outside public/ so the 6 MB original is never deployed
    master: 'assets-src/profile-headshot.png',
    base: '/img/profile-headshot',
    fallback: '/img/profile-headshot-fallback.png',
    widths: SHARED_WIDTHS,
    intrinsic: { width: 2048, height: 2048 },
    alt: 'Sheersh Tiwari — Senior Software Engineer, full-stack and AI systems',
  },
  lifestyle: {
    master: 'assets-src/profile-lifestyle.png',
    base: '/img/profile-lifestyle',
    fallback: '/img/profile-lifestyle-fallback.png',
    widths: [480, 640, 1024, 1280, 1600],
    intrinsic: { width: 1600, height: 900 },
    alt: 'Sheersh Tiwari on the highway with his motorcycle — life beyond the code',
  },
};

/** Formats emitted for every width, in `<picture>` preference order. */
export const FORMATS = ['avif', 'webp'];

/** Hard ceiling for any single generated network asset. */
export const MAX_ASSET_BYTES = 200 * 1024;
