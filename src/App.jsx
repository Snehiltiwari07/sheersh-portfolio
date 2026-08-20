import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TechStack from './components/TechStack';
import SkillOrbit from './components/SkillOrbit';
import LocalLLMRunner from './components/LocalLLMRunner';
import Playground from './components/Playground';
import Reviews from './components/Reviews';
import ChatEngine from './components/ChatEngine';
import HireDrawer, { FloatingHireButton } from './components/HireDrawer';

export default function App() {
  const [isHireDrawerOpen, setIsHireDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Top Fixed Navigation Bar */}
      <Navbar onOpenHireDrawer={() => setIsHireDrawerOpen(true)} />

      <main className="space-y-12">
        {/* Hero Section */}
        <Hero onOpenHireDrawer={() => setIsHireDrawerOpen(true)} />

        {/* Tech Stack Timeline & Skill Matrix */}
        <TechStack />
        <SkillOrbit />

        {/* Client-Side WebGPU AI Showcase */}
        <LocalLLMRunner />

        {/* Interactive Game Playground */}
        <Playground />

        {/* Client Recommendations */}
        <Reviews />
      </main>

      {/* Floating "Ask ST" AI Chat Assistant */}
      <ChatEngine />

      {/* Floating Project Cost Estimator Button */}
      <FloatingHireButton onClick={() => setIsHireDrawerOpen(true)} />

      {/* Interactive Scope & Cost Estimator Drawer */}
      <HireDrawer
        open={isHireDrawerOpen}
        onClose={() => setIsHireDrawerOpen(false)}
      />
    </div>
  );
}