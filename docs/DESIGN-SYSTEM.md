# Design system

Updated 2026-10-23. The active site is the full-bleed editorial portfolio.

## Colour and typography

| Theme | Supplied palette |
| --- | --- |
| Light | #3D52A0, #7091E6, #8697C4, #ADBBDA, #EDE8F5 |
| Dark | #141414, #273DB4, #C50900, #F95CA4, #ED7845 |

src/styles/tokens.css maps these to semantic paper, ink, accent, hero and portrait variables, with derived surfaces/foregrounds for readability. Use the foreground chosen for each surface; dark red is not suitable for every text pairing. Run check-editorial-contrast.mjs after palette edits.

Editorial text uses Segoe UI/Arial, Georgia/Times for selected emphasis, and Courier New for labels. Inter/JetBrains and font-body tokens remain in shared base/form styling. ThemeContext persists portfolio-theme. The early head script applies saved/system preference while hydration starts from stable markup.

## CSS ownership

src/index.css loads tokens.css, system.css and Tailwind/base utilities. Portfolio imports editorial.css, enhanced.css, refinements.css, optimistic-motion.css, immersive-journey.css, engineering-journey.css and whatsapp.css in that order. ScrollStory imports scroll-story.css; SearchContentPage adds search-content.css.

Layers are cumulative. A repeated selector can be an intentional override; do not delete it based on filename alone. immersive-journey.css owns the final full-bleed/hero geometry. Prefer changing the owner to introducing another blanket override.

## Layout and interaction

Sections fill the viewport width. --scene-inset uses clamp(1.4rem, 5vw, 6rem) for internal spacing; there is no outer card around the whole site. Header/footer and content share the inset. Copy remains readable and columns collapse on phones.

Use the local BrandMark/brand-mark.svg, readable labels and semantic buttons. The portrait caption presents the full name and existing LinkedIn URL. Projects/reviews expose detail with native disclosures; review navigation is manual. Keep floating controls clear of phone content.

## Accessibility and assets

Preserve heading order, photo descriptions, labels, skip link, keyboard focus and contrast. Essential content must not depend on canvas, hover or motion. Reduced motion removes decorative transforms/pinning. The portrait must not cross the copy column or grow over its caption.

ResponsivePhoto uses image-manifest.js. Preserve masters and résumé. Jiya's avatar is generated illustration, not an actual pet photograph. Keep technology icon notices/licences beside their assets.
