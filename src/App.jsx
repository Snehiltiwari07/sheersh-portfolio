import { useState, Suspense, lazy } from 'react';

// Core layout, background canvas & cursor (Loaded immediately for zero lag)
import SecurityGuard from './components/SecurityGuard';
import CustomCursor from './components/CustomCursor';
import InteractiveField from './components/InteractiveField';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import { FloatingHireButton } from './components/FloatingHireButton';
import { useAfterFirstPaint } from './lib/useAfterFirstPaint';

// Below-the-fold sections (Code-split for fast initial page load)
const Projects = lazy(() => import('./components/Projects'));
const ProjectStats = lazy(() => import('./components/ProjectStats'));
const ServicesValueProp = lazy(() => import('./components/ServicesValueProp'));
const Achievements = lazy(() => import('./components/Achievements'));
const ArchitectureDiagram = lazy(() => import('./components/ArchitectureDiagram'));
const TechStack = lazy(() => import('./components/TechStack'));
const SkillOrbit = lazy(() => import('./components/SkillOrbit'));
const LocalLLMRunner = lazy(() => import('./components/LocalLLMRunner'));
const Playground = lazy(() => import('./components/Playground'));
const BeyondTheCode = lazy(() => import('./components/BeyondTheCode'));
const Reviews = lazy(() => import('./components/Reviews'));
const Footer = lazy(() => import('./components/Footer'));
const ChatEngine = lazy(() => import('./components/ChatEngine'));
const HireDrawer = lazy(() => import('./components/HireDrawer'));
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react"

// Reduced-motion switch for every framer-motion animation in the lazy
// sections. Loaded lazily with the sections themselves so framer-motion stays
// out of the initial bundle (it is the single biggest script on the page).
const MotionRoot = lazy(() => import('./components/MotionRoot'));

const SectionLoader = () => (
  <div className="w-full h-32 flex items-center justify-center font-mono text-xs text-slate-400">
    <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping mr-2" />
    Loading section...
  </div>
);

export default function App() {
  const [isHireDrawerOpen, setIsHireDrawerOpen] = useState(false);

  // The below-the-fold sections are ~90% of the DOM and their style/layout
  // pass was the single largest main-thread cost (styleLayout 4.3 s of 7.0 s
  // main-thread work on the measured mobile run). They are not needed for the
  // first paint, so they mount once the browser has painted and gone idle.
  // Everything interactive (nav, hero, CTA, drawer, chat) stays immediate.
  const belowFoldReady = useAfterFirstPaint({ timeout: 600 });

  return (
    <SecurityGuard>
      {/* First tab stop on the page (WCAG 2.4.1 Bypass Blocks) */}
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white flex flex-col justify-between relative overflow-x-hidden font-sans">

        {/* Render Background Field & Cursor Immediately */}
        <CustomCursor />
        <InteractiveField />

        {/* Top Fixed Navigation */}
        <Navbar onOpenHireDrawer={() => setIsHireDrawerOpen(true)} />

        {/* Storytelling Main Sequence */}
        <main id="main" tabIndex={-1} className="space-y-16 sm:space-y-24 relative z-content pb-12 outline-none">
          <Hero onOpenHireDrawer={() => setIsHireDrawerOpen(true)} />

          {belowFoldReady && (
            <Suspense fallback={<SectionLoader />}>
              <MotionRoot>
                <Projects onOpenHireDrawer={() => setIsHireDrawerOpen(true)} />
                <ProjectStats />
                <ServicesValueProp onOpenHireDrawer={() => setIsHireDrawerOpen(true)} />
                <Achievements />
                <ArchitectureDiagram />
                <TechStack />
                <SkillOrbit />
                <LocalLLMRunner />
                <Playground />
                <BeyondTheCode />
                <Reviews />
              </MotionRoot>
            </Suspense>
          )}
        </main>

        <Suspense fallback={<SectionLoader />}>
          <MotionRoot>
            <Footer onOpenHireDrawer={() => setIsHireDrawerOpen(true)} />
            <ChatEngine />
            <HireDrawer
              open={isHireDrawerOpen}
              onClose={() => setIsHireDrawerOpen(false)}
            />
          </MotionRoot>
        </Suspense>

        <FloatingHireButton onClick={() => setIsHireDrawerOpen(true)} />
      </div>
      <SpeedInsights />
      <Analytics />
    </SecurityGuard>
  );
}
