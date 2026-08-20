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
import Footer from './components/Footer'; // Import Footer

export default function App() {
  const [isHireDrawerOpen, setIsHireDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white flex flex-col justify-between">
      {/* Top Navigation */}
      <Navbar onOpenHireDrawer={() => setIsHireDrawerOpen(true)} />

      <main className="space-y-12">
        <Hero onOpenHireDrawer={() => setIsHireDrawerOpen(true)} />
        <TechStack />
        <SkillOrbit />
        <LocalLLMRunner />
        <Playground />
        <Reviews />
      </main>

      {/* Enhanced Footer */}
      <Footer onOpenHireDrawer={() => setIsHireDrawerOpen(true)} />

      {/* Floating Utilities */}
      <ChatEngine />
      <FloatingHireButton onClick={() => setIsHireDrawerOpen(true)} />

      {/* Drawers */}
      <HireDrawer
        open={isHireDrawerOpen}
        onClose={() => setIsHireDrawerOpen(false)}
      />
    </div>
  );
}