import { useRef } from 'react';
import { usePageMotion } from '../lib/usePageMotion';
import { profile } from '../data/profile';
import { getSearchPage } from '../data/searchPages';
import BrandMark from './BrandMark';
import ThemeToggle from './ThemeToggle';
import WhatsAppButton from './WhatsAppButton';
import '../styles/search-content.css';

export default function SearchContentPage({ page, onOpenHireDrawer }) {
  const root = useRef(null);
  usePageMotion(root);
  return <div className="editorial content-page" ref={root}>
    <a className="editorial-skip" href="#main">Skip to content</a>
    <div className="page-reading-line" aria-hidden="true" />
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="Sheersh Tiwari, home"><BrandMark /><span className="brand-name">Sheersh<span>AI &amp; Software</span></span></a>
      <nav className="content-nav" aria-label="Main navigation"><a href="/#projects">Work</a><a href="/#services">Services</a></nav>
      <ThemeToggle /><WhatsAppButton placement="header" />
    </header>
    <main id="main" tabIndex={-1}>
      <section className="content-introduction">
        <nav className="content-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href={page.kind === 'service' ? '/#services' : '/#projects'}>{page.kind === 'service' ? 'Services' : 'Work'}</a><span aria-hidden="true">/</span><span aria-current="page">{page.label}</span></nav>
        <p className="eyebrow">{page.kind === 'service' ? 'WORK WITH SHEERSH TIWARI' : 'A CASE STUDY BY SHEERSH TIWARI'}</p>
        <h1>{page.heading}</h1><p className="content-summary">{page.summary}</p>
        <div className="content-facts">{page.facts.map(fact => <span key={fact}>{fact}</span>)}</div>
        <button className="ink-button" onClick={onOpenHireDrawer}>Discuss your project <span aria-hidden="true">↗</span></button>
      </section>
      <section className="content-body" aria-label={page.kind === 'service' ? 'Service scope and approach' : 'Project details'}>
        <aside className="content-index"><p className="eyebrow">ON THIS PAGE</p><nav aria-label="On this page">{page.sections.map((section, i) => <a key={section.title} href={`#detail-${i + 1}`}><span>0{i + 1}</span>{section.title}</a>)}<a href="#questions"><span>↳</span>Common questions</a></nav><div className="content-author"><strong>Sheersh Tiwari</strong><p>Independent engineer<br />Indore, India / Remote</p><a href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></div></aside>
        <div className="content-sections">{page.sections.map((section, i) => <article className="content-detail" id={`detail-${i + 1}`} key={section.title}><p className="eyebrow">0{i + 1}</p><h2>{section.title}</h2>{section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{section.items && <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul>}{section.link && <a className="text-link" href={section.link}>{section.linkLabel} <span aria-hidden="true">↗</span></a>}</article>)}
          <section id="questions" className="content-questions" aria-labelledby="questions-title"><p className="eyebrow">BEFORE WE START</p><h2 id="questions-title">Common questions.</h2>{page.faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</section>
        </div>
      </section>
      <section className="content-related" aria-labelledby="related-title"><p className="eyebrow">KEEP EXPLORING</p><h2 id="related-title">More of the work.</h2><div>{page.related.map(path => { const related = getSearchPage(path); return <a key={path} href={path}><span>{related.kind === 'service' ? 'SERVICE' : 'CASE STUDY'}</span><strong>{related.heading}</strong><span aria-hidden="true">↗</span></a>; })}</div></section>
      <section className="content-enquiry"><p className="eyebrow">A USEFUL FIRST STEP</p><h2>Tell me what needs<br /><em>to work better.</em></h2><p>Share the task, the systems involved, and the outcome you need. We can start with a focused conversation.</p><button className="ink-button" onClick={onOpenHireDrawer}>Start a project brief <span aria-hidden="true">↗</span></button><a className="text-link" href={`mailto:${profile.email}`}>{profile.email}</a></section>
    </main>
    <footer className="editorial-footer"><a href="/">← Back to the portfolio</a><span>Sheersh Tiwari · Independent engineering</span><a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a></footer>
  </div>;
}

export function NotFoundPage() {
  return <div className="editorial content-page"><main className="content-not-found"><p className="eyebrow">404 / PAGE NOT FOUND</p><h1>Let’s find<br />your way back.</h1><p>This address does not match a page in the portfolio.</p><a className="ink-button" href="/">Explore the portfolio <span aria-hidden="true">↗</span></a></main></div>;
}
