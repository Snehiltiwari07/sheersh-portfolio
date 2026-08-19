import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import SecurityGuard from './components/SecurityGuard';
import InteractiveField from './components/InteractiveField';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServicesValueProp from './components/ServicesValueProp';
import TechStack from './components/TechStack';
import ArchitectureDiagram from './components/ArchitectureDiagram';
import Achievements from './components/Achievements';
import SkillOrbit from './components/SkillOrbit';
import BeyondTheCode from './components/BeyondTheCode';
import Playground from './components/Playground';
import ProjectStats from './components/ProjectStats';
import Reviews from './components/Reviews';
import ChatEngine from './components/ChatEngine';
import Footer from './components/Footer';
import HireDrawer, { FloatingHireButton } from './components/HireDrawer';

function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <SecurityGuard>
      <div className="relative min-h-screen text-ink">
        <CustomCursor />
        <InteractiveField />
        <div className="relative z-10">
          <Navbar />
          <Hero onOpenHireDrawer={() => setDrawerOpen(true)} />
          <ServicesValueProp />
          <TechStack />
          <ChatEngine />
          <ArchitectureDiagram />
          <Achievements />
          <SkillOrbit />
          <BeyondTheCode />
          <Playground />
          <ProjectStats />
          <Reviews />
          <Footer onOpenHireDrawer={() => setDrawerOpen(true)} />
        </div>

        <FloatingHireButton onClick={() => setDrawerOpen(true)} />
        <HireDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </SecurityGuard>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}