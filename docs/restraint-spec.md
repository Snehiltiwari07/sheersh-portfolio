# Motion and interaction contract

Updated 2026-10-23. Filename retained for existing references. This describes website interaction, not a video composition.

## Shared scroll clock

src/lib/usePageMotion.js schedules one animation frame from a passive scroll listener, caches geometry and remeasures on resize/content changes. CSS consumes --hero-out, --section-enter, --section-exit, --motion-enter, --chapter-travel and --page-progress. The portfolio:scroll event carries sceneProgress and journeyProgress. Keep features on this shared clock.

## Hero

At desktop widths of at least 850px the chapter is 165svh with a sticky 100svh stage. The portrait remains in its right grid column, lifts slightly, settles its rotation and shrinks a little. The image does not scale independently over its name caption. Original text fades/moves away; closing copy appears in the left column. Orbit/backplate motion stays bounded. The former -40vw portrait translation crossed the text and has been removed.

Below 850px the hero flows in a single column with a small portrait lift/rotation. Reduced motion removes pinning/transforms. Always review intermediate and reverse scroll states, not just the first frame.

## Journey and AI scene

EngineeringJourney presents 2018–2026, local technology icons, year buttons and arrow/Home/End keys. Pinning requires desktop width >=850px and height >=700px, or phone width <850px and height >=800px. Short viewports use individually flowing chapters. Reduced motion avoids pinning. All text must remain reachable.

The 2026 chapter distinguishes built Hermes/agent-harness work from exploration chips (DeepSeek, RAG, vector databases, MCP, agent evaluations). Earlier web tooling remains in earlier chapters. Names remain readable without icons.

ScrollStory morphs an illustrative particle field. Desktop uses a pinned scene with 960 points; phones use a flowing scene with 420 points and a 30fps cap. Drawing stops offscreen or in a hidden document. Reduced motion is static. This is a visual illustration, not a live AI session.

## Lower sections and review

Project/service/process/review/about entrances use shared progress and shorter phone travel. Disclosure changes trigger remeasurement; focused content stays visible. Avoid hiding essential content behind opacity or offscreen animations.

Review both themes, desktop, tall/short phones, reduced motion, resize and direct hash navigation. Check portrait/caption containment, text overlap, year controls, horizontal overflow and floating-contact collisions. Emulation checks layout behaviour; physical-device smoothness needs a real device.
