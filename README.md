# Sheersh Tiwari — Portfolio v3 (Phase 2 Interactive Edition)

## Running it
```bash
cd frontend
npm install
npm run dev
```
Runs on **http://localhost:5173**.

## What's new vs Phase 1

| Feature | Component |
|---|---|
| Full-page interactive particle field (mouse velocity, click ripples, scroll drift) | `InteractiveField.jsx` |
| 3D holographic tilt photo card (spotlight tracking, glassmorphism, hologram/glitch toggle) | `PhotoCard3D.jsx` |
| Interactive SQL before/after slider (200M-record optimization story) | `SqlSlider.jsx` |
| 3D CSS skill orbit — click a node for real project impact | `SkillOrbit.jsx` |
| Intelligent chat engine — weighted keyword matching across 5 intents, open-ended fallback with CTA buttons | `ChatEngine.jsx`, intent matrix in `data/profile.js` |
| Freelance conversion hub — floating CTA + scope builder drawer that drafts a `mailto:` with project details | `HireDrawer.jsx` |
| Dark/light theme toggle | `ThemeContext.jsx`, `ThemeToggle.jsx` |

## Implementation notes / honest tradeoffs

- **Chat engine** is weighted-keyword matching, not an LLM — it's fast, has zero backend cost, and covers the 5 intents you specified (hire, SQL story, career/awards, stack, contact) plus a graceful fallback with CTA buttons. If you want it to handle truly open-ended questions well, the natural next step is routing the fallback case to a real LLM API call (e.g. a small serverless function proxying to Claude or GPT) — happy to wire that in as Phase 3.
- **Skill orbit** uses CSS 3D transforms (`rotateY` + `translateZ`) rather than a full R3F/WebGL scene — same visual effect (a rotating ring in 3D space), far lighter weight, and no GPU/WebGL context needed. If you want particle trails or lighting on the orbit itself, that's where R3F would earn its cost.
- **Sound effects toggle** was marked optional in your brief and isn't included yet — flag if you want it and I'll add a Web Audio API hover/click chime with a mute toggle.
- **Photo card** still uses a placeholder circle — swap in a real `<img>` in `PhotoCard3D.jsx` (the 3D tilt/spotlight/hologram effects apply to whatever's inside).

## Wiring up the backend

- Resume button (`Navbar.jsx`) points at `/api/v1/resume/download` — connect it to the Spring Boot backend from the earlier build, or any static file host.
- The Hire Drawer and chat CTAs currently use `mailto:` links (zero backend required, works immediately). If you'd rather capture leads in a database, swap those for a `POST` to a `/api/v1/leads` endpoint.
