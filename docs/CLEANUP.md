# Repository cleanup

Updated 2026-10-23. Removed the following 26 retired source files after checking imports from retained source. All eight project records were extracted into src/data/projects.js before deleting the old renderer; all visible project fields and code examples remain. Only obsolete decorative banner JSX was discarded.

- src/components/Achievements.jsx
- src/components/ArchitectureDiagram.jsx
- src/components/BeyondTheCode.jsx
- src/components/CustomCursor.jsx
- src/components/FloatingHireButton.jsx
- src/components/Footer.jsx
- src/components/Hero.jsx
- src/components/InteractiveField.jsx
- src/components/LocalLLMRunner.jsx
- src/components/MotionRoot.jsx
- src/components/Navbar.jsx
- src/components/PhotoCard3D.jsx
- src/components/Playground.jsx
- src/components/Projects.jsx
- src/components/ProjectStats.jsx
- src/components/Reviews.jsx
- src/components/SecurityGuard.jsx
- src/components/ServicesValueProp.jsx
- src/components/SkillOrbit.jsx
- src/components/TechStack.jsx
- src/components/ThemeAdaptiveImage.jsx
- src/lib/jiya.js
- src/lib/monogram.js
- src/lib/useAfterFirstPaint.js
- src/styles/decorative.js
- src/data/caseStudies.js

The removed components were not mounted by App. The obsolete scripted Jiya responder was not used by the Groq chat flow. The retired case-study template was not rendered; active service/case content lives in searchPages.js.

Preserved personal images/masters, résumé, original project records, all reviews, icon licences, tests, integrations and historical evidence. Shared CSS layers and token utilities remain where the app or validation scripts reference them; a repeated selector alone does not prove dead code. Earlier documentation is retained as historical material under archive/.
