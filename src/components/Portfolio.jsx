import { useRef, useState } from 'react';
import { usePageMotion } from '../lib/usePageMotion';
import ResponsivePhoto from './ResponsivePhoto';
import ScrollStory from './ScrollStory';
import ThemeToggle from './ThemeToggle';
import BrandMark from './BrandMark';
import EngineeringJourney from './EngineeringJourney';
import WhatsAppButton from './WhatsAppButton';
import { profile, clientReviews, keyAchievements, projectStats, careerRoadmap, techCategories } from '../data/profile';
import { PROJECT_CAROUSEL } from './Projects';
import { brand, crew, services, process, explorations } from '../data/portfolio';
import { searchPages } from '../data/searchPages';
import '../styles/editorial.css';
import '../styles/enhanced.css';
import '../styles/refinements.css';
import '../styles/optimistic-motion.css';
import '../styles/immersive-journey.css';
import '../styles/engineering-journey.css';
import '../styles/whatsapp.css';

const Arrow = () => <span aria-hidden="true">↗</span>;
const category = project => /query|sql/.test(project.id) ? 'Databases' : /ai|groq|local/.test(project.id) ? 'AI & automation' : 'Software & APIs';

function CrewDiagram() {
  return <div className="crew-diagram" aria-label="Illustration of the कामCREW architecture, built on Hermes">
    <div className="diagram-caption"><span>ONE WORKSPACE. A WHOLE TEAM.</span><span>2026</span></div>
    <div className="diagram-center"><span className="crew-wordmark">काम<span>CREW</span></span><p>Your AI team, within reach.</p></div>
    <div className="diagram-branches" aria-hidden="true"><span>↓</span><span>↓</span><span>↓</span></div>
    <div className="diagram-nodes"><div><span aria-hidden="true">↗</span> Tasks<small>Follow the work</small></div><div><span aria-hidden="true">↔</span> Conversations<small>Keep the context</small></div><div><span aria-hidden="true">✓</span> Review<small>Make the call</small></div></div>
    <div className="diagram-foundation">Next.js + TypeScript <span>Built on Hermes</span></div>
    <p className="diagram-footnote">Architecture illustration</p>
  </div>;
}

export default function Portfolio({ onOpenHireDrawer }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState('All work');
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const root = useRef(null);
  const nav = [['Journey', '#journey'], ['Work', '#projects'], ['Services', '#services'], ['Reviews', '#reviews'], ['About', '#about']];
  usePageMotion(root);
  const selectedIds = ['ai-lead-hunter-pipeline', 'query-cortex', 'sheets-sync-engine', 'local-cortex'];
  const visibleProjects = PROJECT_CAROUSEL.filter(project => filter === 'All work' ? showAllProjects || selectedIds.includes(project.id) : category(project) === filter);
  const review = clientReviews[reviewIndex];
  return <div className="editorial" ref={root}>
    <div className="page-reading-line" aria-hidden="true" />
    <div className="journey-rail" aria-hidden="true"><span /></div>
    <a className="editorial-skip" href="#main">Skip to content</a>
    <header className="site-header">
      <a className="wordmark" href="#" aria-label="Sheersh Tiwari, home"><BrandMark /><span className="brand-name">Sheersh<span>AI &amp; Software</span></span></a>
      <nav className="site-nav" aria-label="Main navigation">{nav.map(([name, href]) => <a key={href} href={href}>{name}</a>)}</nav>
      <ThemeToggle />
      <WhatsAppButton placement="header" />
      <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="mobile-nav" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close' : 'Menu'}</button>
      <div id="mobile-nav" className="mobile-nav" hidden={!menuOpen}>{nav.map(([name, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{name}</a>)}</div>
    </header>
    <main id="main" tabIndex={-1}>
      <section className="hero-chapter" aria-label="Introduction"><div className="editorial-hero">
        <div className="hero-copy"><p className="eyebrow">SHEERSH TIWARI / INDEPENDENT SOFTWARE ENGINEER</p><h1>{brand.headline.map((line, i) => <span key={line} className={i === 1 ? 'serif-line' : ''}>{line}</span>)}</h1><p className="hero-intro">AI workflows. Custom software. Faster systems.<br />I turn the complicated parts of your business into tools that make the work easier.</p><div className="hero-actions"><button className="ink-button" onClick={onOpenHireDrawer}>Let’s talk about your project <Arrow /></button><a className="text-link" href="#projects">See my work <span aria-hidden="true">↓</span></a></div><span className="availability"><span aria-hidden="true">●</span> {brand.note} · India / Remote</span></div>
        <div className="hero-visual"><span className="portrait-orbit" aria-hidden="true"/><span className="portrait-spark spark-one" aria-hidden="true">✳</span><span className="portrait-spark spark-two" aria-hidden="true">+</span><div className="portrait-label"><span>A PERSON BEHIND THE CODE</span><span>01 / ST</span></div><ResponsivePhoto photo="headshot" sizes="(max-width: 700px) 90vw, 480px" priority alt="Sheersh Tiwari, independent software engineer" /><a className="portrait-signature portrait-profile-link" href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Connect with Sheersh Tiwari on LinkedIn (opens in a new tab)"><span className="portrait-full-name"><strong>Sheersh Tiwari</strong><small>Independent engineer · Applied AI</small></span><span className="portrait-link-label">LinkedIn <Arrow /></span></a><div className="photo-note">Built with care.<br /><em>By someone who cares.</em></div></div>
        <div className="hero-handoff" aria-hidden="true"><span>THE IDEA IS ONLY THE BEGINNING</span><p>Let’s make<br />it work.</p></div>
        <a className="hero-scroll-cue" href="#journey"><span>Scroll to follow the journey</span><span aria-hidden="true">↓</span></a>
      </div></section>
      <EngineeringJourney />
      <div className="specialty-strip"><span>AI that does useful work</span><span aria-hidden="true">✳</span><span>Software shaped around people</span><span aria-hidden="true">✳</span><span>Engineering that goes deeper</span></div>
      <section className="track-record reveal" aria-label="Engineering track record">{projectStats.filter((_, i) => [0, 3, 5].includes(i)).map(stat => <div key={stat.id}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</section>

      <ScrollStory />

      <section id="projects" className="work-section section-space">
        <div className="section-heading reveal"><div><p className="eyebrow">THE WORK / 2026 & BEYOND</p><h2>Ideas made <em>real.</em></h2></div><p>Independent builds, client systems,<br />and the engineering behind them.</p></div>
        <article className="crew-feature reveal"><div className="feature-copy"><span className="feature-tag">NEW HIGHLIGHT · INDEPENDENT BUILD · 2026</span><h2 className="crew-title">काम<span>CREW</span></h2><h3>{crew.subtitle}</h3><p>{crew.description}</p><details className="crew-build-notes"><summary>Inside the build <span aria-hidden="true">+</span></summary>{crew.details.map(item => <div key={item.title}><h4>{item.title}</h4><p>{item.body}</p></div>)}</details><a className="text-link service-detail-link" href="/work/kaamcrew">Read the full case study <Arrow /></a><div className="project-tools">Next.js · TypeScript · Hermes · SQLite · SSE</div></div><CrewDiagram /></article>
        <div className="work-toolbar"><p>More from my workbench <span>08 PROJECTS</span></p><div className="work-filters" aria-label="Filter projects">{['All work', 'AI & automation', 'Software & APIs', 'Databases'].map(item => <button key={item} aria-pressed={filter === item} onClick={() => { setFilter(item); setShowAllProjects(false); }}>{item}</button>)}</div></div>
        <div id="project-gallery" className="project-grid">{visibleProjects.map((project, i) => <article key={project.id} className={`work-card tone-${i % 3}`}><div className="work-card-top"><span>{category(project)}</span><span aria-hidden="true">↗</span></div><h3>{project.id === 'query-cortex' ? <a href="/work/sql-performance">{project.title}</a> : project.title}</h3><p className="work-card-description">{project.description}</p><div className="work-stack">{project.techStack.slice(0, 3).join(' · ')}</div><details><summary>Project notes <span aria-hidden="true">+</span></summary><div className="project-detail"><p>{project.deepExplanation}</p><dl>{project.metrics.map(metric => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl><p className="architecture-flow">{project.architectureFlow}</p><p>{project.techStack.join(' · ')}</p><details className="code-example"><summary>Code example</summary><pre><code>{project.codeSnippet}</code></pre></details><button className="text-link" onClick={onOpenHireDrawer}>Discuss a similar project <Arrow /></button></div></details></article>)}</div>
        {filter === 'All work' && <div className="gallery-more"><span>{visibleProjects.length} of {PROJECT_CAROUSEL.length} projects</span><button className="text-link" aria-expanded={showAllProjects} aria-controls="project-gallery" onClick={() => setShowAllProjects(!showAllProjects)}>{showAllProjects ? 'Show selected work' : `Explore all ${PROJECT_CAROUSEL.length} projects`} <span aria-hidden="true">{showAllProjects ? '−' : '+'}</span></button></div>}
      </section>

      <section id="services" className="services-section section-space"><div className="section-heading reveal"><div><p className="eyebrow">WORK WITH ME</p><h2>Good software starts<br />with <em>your problem.</em></h2></div><p>Three ways I can help.<br />One person accountable for the details.</p></div><div className="service-list">{services.map(service => <article key={service.id} className="service-row reveal"><span className="service-number">{service.id}</span><div><p className="eyebrow">{service.name}</p><h3>{service.title}</h3></div><div><p>{service.problem}</p><details><summary>What’s included <span aria-hidden="true">+</span></summary><p>{service.deliverables}</p><span className="service-examples">{service.examples}</span></details><a className="text-link service-detail-link" href={searchPages.find(page => page.serviceId === service.id).path}>Explore this service <Arrow /></a><button className="text-link" onClick={onOpenHireDrawer}>Let’s discuss it <Arrow /></button></div></article>)}</div></section>

      <section id="reviews" className="reviews-section section-space reveal"><div className="section-heading"><div><p className="eyebrow">THE PEOPLE I’VE WORKED WITH</p><h2>In their <em>words.</em></h2></div><p>{clientReviews.length} client reviews<br />Engineering teams. Founders. Real work.</p></div><div className="review-stage"><span className="quote-mark" aria-hidden="true">“</span><div className="review-content" key={review.id}><div className="review-stars" aria-label={`${review.rating} out of 5`}>★ <span>{review.rating.toFixed(1)} / 5</span></div><blockquote>{review.comment}</blockquote><div className="review-person"><div className="review-avatar" aria-hidden="true">{review.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div><div><strong>{review.name}</strong><span>{review.role} · {review.year}</span></div></div><span className="review-service">{review.service}</span></div><div className="review-controls"><span>{String(reviewIndex + 1).padStart(2, '0')} / {clientReviews.length}</span><div><button aria-label="Previous review" onClick={() => setReviewIndex((reviewIndex - 1 + clientReviews.length) % clientReviews.length)}>←</button><button aria-label="Next review" onClick={() => setReviewIndex((reviewIndex + 1) % clientReviews.length)}>→</button></div></div></div><details className="all-reviews"><summary>Read all {clientReviews.length} reviews <span aria-hidden="true">+</span></summary><div className="all-reviews-grid">{clientReviews.map(item => <article key={item.id}><span className="review-stars">★ {item.rating.toFixed(1)}</span><p>“{item.comment}”</p><strong>{item.name}</strong><span>{item.role} · {item.service} · {item.year}</span></article>)}</div></details></section>

      <section className="achievements-section section-space reveal"><details className="archive-group"><summary><span>Recognition & integrations</span><span>Explore achievements +</span></summary><div className="section-heading"><div><p className="eyebrow">INTEGRATIONS & RECOGNITION</p><h2>The details <em>add up.</em></h2></div></div><div className="achievement-list">{keyAchievements.map(item => <details key={item.id}><summary><span>{item.category}</span><strong>{item.title}</strong><span>{item.metric} ↗</span></summary><p>{item.description}</p><p className="service-examples">{item.subtext} · {item.techs.join(' · ')}</p></details>)}</div></details></section>

      <section id="approach" className="approach-section section-space reveal"><div className="section-heading"><div><p className="eyebrow">HOW WE GET THERE</p><h2>Clear steps.<br /><em>Room to think.</em></h2></div></div><div className="process-list">{process.map(([title, text], i) => <div key={title}><span className="note-index">0{i + 1}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section>

      <section id="about" className="about-section section-space reveal"><div className="about-photo"><ResponsivePhoto photo="lifestyle" sizes="(max-width: 700px) 90vw, 560px" alt="Sheersh Tiwari on the open road with his motorcycle" /><span>AWAY FROM THE KEYBOARD / OPEN ROADS, CLEAR HEAD</span></div><div><p className="eyebrow">A LITTLE ABOUT ME</p><h2>Curious by nature.<br /><em>Engineer by practice.</em></h2><p>I’m Sheersh Tiwari, based in Indore, India. I work across Java, Python, React, and databases—and increasingly, AI tools that help people get things done.</p><p>My work ranges from optimizing queries across 200M+ records to building कामCREW, my own workspace for managing an AI team. I enjoy understanding how the whole system fits together.</p><p>Outside work, it’s motorcycles, long roads, and time with my pet companion. The best ideas don’t always happen at a desk.</p><div className="about-links"><a href={profile.github} target="_blank" rel="noreferrer">GitHub <Arrow /></a><a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn <Arrow /></a><a href={profile.resumeUrl}>Download résumé <Arrow /></a></div></div></section>

      <section id="tech-stack" className="experience-section section-space reveal"><details className="archive-group"><summary><span>Experience & technical toolkit</span><span>2018—2026 +</span></summary><div className="section-heading"><div><p className="eyebrow">THE ENGINEERING JOURNEY</p><h2>Always <em>building.</em></h2></div><p>From the foundations to AI systems.<br />A growing practice, since 2018.</p></div><div className="full-track-record">{projectStats.map(stat => <div key={stat.id}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div><div className="career-list">{careerRoadmap.map(item => <details key={item.era}><summary><span>{item.era}</span><strong>{item.title}</strong><span aria-hidden="true">+</span></summary><div><p className="eyebrow">{item.role}</p><h3>{item.highlight}</h3>{item.paragraphs.map(text => <p key={text}>{text}</p>)}<div className="technology-names">{item.techs.map(tech => <span key={tech.name}>{tech.name}</span>)}</div></div></details>)}</div><details className="stack-details"><summary>Explore my full technology stack <span aria-hidden="true">+</span></summary><div className="stack-grid">{techCategories.map(group => <div key={group.title}><h3>{group.title}</h3>{group.techs.map(tech => <p key={tech.name}>{tech.name} <span>{tech.level}</span></p>)}</div>)}</div></details></details></section>

      <section className="explorations-section reveal"><div><p className="eyebrow">ON THE DESK / 2026</p><h2>Next up?<br /><em>Useful questions.</em></h2><p>Ideas I’m exploring—not completed products.</p></div><div>{explorations.map(item => <article key={item.title}><span className="exploration-status">EXPLORATION</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
      <section id="contact" className="contact-section reveal"><p className="eyebrow">YOUR NEXT IDEA STARTS HERE</p><h2>What could we<br /><em>build together?</em></h2><div><p>A workflow that needs simplifying. An idea worth testing. A system that should be faster. Let’s find a useful first step.</p><button className="ink-button" onClick={onOpenHireDrawer}>Tell me about it <Arrow /></button><a className="contact-email" href={`mailto:${profile.email}`}>{profile.email} <Arrow /></a></div></section>
    </main><footer className="editorial-footer"><a className="wordmark" href="#" aria-label="Sheersh Tiwari, home"><BrandMark /><span className="brand-name">Sheersh<span>AI &amp; Software</span></span></a><span>Built with curiosity. Backed by engineering.</span><span>© {new Date().getFullYear()}</span></footer>
  </div>;
}

