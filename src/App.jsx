import React, { useState, Suspense, lazy } from 'react';

// Core layout, background canvas & cursor (Loaded immediately for zero lag)
import SecurityGuard from './components/SecurityGuard';
import CustomCursor from './components/CustomCursor';
import InteractiveField from './components/InteractiveField';
import Navbar from './components/Navbar';
import Hero from './components/Hero';

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
import { FloatingHireButton } from './components/HireDrawer';

const SectionLoader = () => (
  <div className="w-full h-32 flex items-center justify-center font-mono text-xs text-slate-500">
    <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping mr-2" />
    Loading section...
  </div>
);

export default function App() {
  const [isHireDrawerOpen, setIsHireDrawerOpen] = useState(false);

  return (
    <SecurityGuard>
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white flex flex-col justify-between relative overflow-x-hidden font-sans">
        
        {/* Render Background Field & Cursor Immediately */}
        <CustomCursor />
        <InteractiveField />

        {/* Top Fixed Navigation */}
        <Navbar onOpenHireDrawer={() => setIsHireDrawerOpen(true)} />

        {/* Storytelling Main Sequence */}
        <main className="space-y-16 sm:space-y-24 relative z-10 pb-12">
          <Hero onOpenHireDrawer={() => setIsHireDrawerOpen(true)} />

          <Suspense fallback={<SectionLoader />}>
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
          </Suspense>
        </main>

        <Suspense fallback={<SectionLoader />}>
          <Footer onOpenHireDrawer={() => setIsHireDrawerOpen(true)} />
          <ChatEngine />
          <HireDrawer
            open={isHireDrawerOpen}
            onClose={() => setIsHireDrawerOpen(false)}
          />
        </Suspense>

        <FloatingHireButton onClick={() => setIsHireDrawerOpen(true)} />
      </div>
    </SecurityGuard>
  );
}