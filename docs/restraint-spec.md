# Restraint Spec — "Engineered Speed" (T-002)

**Owner**: product-manager · **Consumes**: `src/data/positioning.js`, `src/data/caseStudies.js`
**Audience**: frontend-engineer (T-004) + qa-reality-checker. This spec is the authority on
what motion stays, what goes, and how the Lab tab works. It is specific enough to implement
without follow-up questions.

**Concept (locked, do not re-litigate):** *The site performs the way he makes systems perform.*
Instantly fast, ruthlessly efficient, restrained — because that is the service being sold.

---

## 1. Effect inventory — what actually runs today

| # | Effect | Component | Status | Decision |
|---|---|---|---|---|
| 1 | Background "particle" grid + cursor-follow spotlight + ambient glow orbs | `InteractiveField.jsx` | Rendered (App.jsx:45) | **KEEP, simplify** (see §2) |
| 2 | Custom trailing cursor (dot + ring) | `CustomCursor.jsx` | Rendered (App.jsx:44, desktop only) | **REMOVE** |
| 3 | 3D tilt photo card | `PhotoCard3D.jsx` | **Dead code** (not imported anywhere) | **DELETE FILE** |
| 4 | Hologram toggle | `PhotoCard3D.jsx` | **Dead code** | **DELETE FILE** |
| 5 | Glitch toggle | `PhotoCard3D.jsx` | **Dead code** | **DELETE FILE** |
| 6 | Skill "orbit" grid + ambient glow orb | `SkillOrbit.jsx` | Rendered (App.jsx:61) | **KEEP** (content, not effect — see §2) |
| 7 | Flappy Deploy game | `Playground.jsx` | Rendered (App.jsx:63) | **RELOCATE → Lab** |
| 8 | In-browser Local LLM demo | `LocalLLMRunner.jsx` | Rendered (App.jsx:62) | **RELOCATE → Lab** |
| — | Hero glow ring / shimmer / `animate-pulse` accents | `Hero.jsx` | Rendered | **REDUCE** (see §2) |

Note: 3 of the 7 named effects (tilt, hologram, glitch) are already dead code — they render
nothing and only exist as a future landmine. The remaining four competing effects are the
background field, the custom cursor, the skill orbit, and the two "engineering flex" sections.

---

## 2. What stays, what goes, and why

### STAY (one strong idea: restrained speed)
- **`InteractiveField` → simplify to a static ambient layer.** Keep the subtle tech grid and
  ONE static gradient glow. **Remove the cursor-tracking radial spotlight** (the `--mouse-x/--mouse-y`
  pointer-follow block and its `pointermove` rAF loop). It is an always-on pointer-driven effect
  that competes with any cursor treatment and is a direct INP risk.
- **`SkillOrbit` → keep as a static content grid.** It is already a grid, not an orbit; no change
  beyond removing its ambient glow orb (`bg-violet-600/10 blur-[140px]`) so there is exactly one
  background treatment site-wide. It is a *content* section, not a *motion* concept.
- **One scroll-driven narrative** (the case-study/proof reveal) is the single signature motion,
  spring-eased, per PRD §5 P0 #4.

### REMOVE
- **`CustomCursor`** — delete the component and its render in App.jsx:44. A custom cursor overrides
  a native OS affordance, hurts accessibility (WCAG focus-visible), and runs an always-on rAF loop.
  Native cursor + visible focus states is the restraint-correct choice. This is the single biggest
  "restraint reads as confidence" cut available.
- **`PhotoCard3D.jsx`** — delete the file (3D tilt + hologram + glitch, all dead). Also delete its
  only support import `ThemeAdaptiveImage.jsx` *unless* another component still uses it
  (`BeyondTheCode.jsx` does — so keep `ThemeAdaptiveImage`). Verify before deleting.
- **Hero `animate-pulse` glow ring behind the photo** (Hero.jsx:135) and the **shimmer sweep**
  (Hero.jsx:176) — remove both. Keep the photo card static with the existing gradient border.

### RELOCATE (kept, but stop competing with the pitch)
The **Flappy Deploy game** and the **in-browser Local LLM demo** move behind a single **"Lab"** tab.

---

## 3. The "Lab" tab — implementation contract

BOSS's decision: keep both, but behind one affordance. Rules:

1. **One nav item.** Remove `Local AI` (`#local-llm`) and `Playground` (`#playground`) from the
   navbar (both desktop and mobile link arrays in `Navbar.jsx`). Add a single **`Lab`** link
   (`#lab`). Footer quick-links (Footer.jsx:57-60) update the same way.
2. **One section, two panels.** `#lab` renders a single section with two tabs (or stacked panels):
   *Flappy Deploy* and *Local LLM Engine*. Reuse the existing `Playground.jsx` and
   `LocalLLMRunner.jsx` internals; do not rewrite them.
3. **Lazy + off by default.** The Lab section is `React.lazy` and mounts its content only when the
   user opens the tab. The WebGPU init (`navigator.gpu.requestAdapter()` in `LocalLLMRunner`) and
   the game's rAF loop must NOT run while the Lab is closed — zero LCP/INP cost to the main page.
4. **Keyboard + mobile.** Tab switching must be keyboard-operable (arrow keys / tab + enter) and
   usable on mobile (touch). The game already has touch handlers; keep them.
5. **Remove from the main scroll.** Delete `<LocalLLMRunner />` and `<Playground />` from
   App.jsx (lines 62-63) and drop the `#local-llm` / `#playground` anchors from the page flow.
6. **`prefers-reduced-motion`** applies to any Lab entrance animation like everything else.

---

## 4. Net effect — from ~7 competing ideas to 1

| Before | After |
|---|---|
| Grid + cursor spotlight + orbs + custom cursor + tilt + hologram + glitch + orbit + game + LLM demo | One static ambient layer + one scroll-driven proof reveal + one **Lab** affordance (game + LLM, opt-in) |

The pitch above the fold is: headline + proof line + one named testimonial + one Hire CTA
(proof architecture, T-004). Everything else is either a content section or an opt-in flex.

---

## 5. Open item for BOSS (not a blocker)

- **"The Beacon — Employee of the Year 2024" award name** (profile.js:224, and the
  `Beacon Award Winner` badge in Projects.jsx:220, ChatEngine.jsx:38). "The Beacon" is the
  anonymised client's internal award brand and can re-identify the client the same way the
  company name does. **Recommendation:** rename to "Employee of the Year 2024 — Executive Award"
  and drop the "Beacon Award Winner" badges. BOSS to confirm; the literal `CloudLIMS` string has
  already been removed (§6 below).
