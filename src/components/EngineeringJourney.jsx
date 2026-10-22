import { useEffect, useRef, useState } from 'react';
import { engineeringJourney as years } from '../data/engineeringJourney';
import JourneyTechIcon from './JourneyTechIcon';

export default function EngineeringJourney() {
  const root = useRef(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const current = years[active];

  useEffect(() => {
    const section = root.current;
    const clock = section.closest('.editorial');
    const tall = matchMedia('(min-width: 850px) and (min-height: 700px), (max-width: 849px) and (min-height: 800px)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const configure = () => setPinned(tall.matches && !reduced.matches);
    const update = event => {
      if (!tall.matches || reduced.matches) {
        const stories = [...section.querySelectorAll('.year-story')];
        const next = stories.findIndex(story => story.getBoundingClientRect().bottom >= window.innerHeight * .35);
        const index = next < 0 ? years.length - 1 : next;
        setActive(index);
        section.style.setProperty('--year-progress', String(index / (years.length - 1)));
        return;
      }
      setActive(Math.round(event.detail.journeyProgress * (years.length - 1)));
      section.style.setProperty('--year-progress', event.detail.journeyProgress.toFixed(4));
    };
    configure();
    clock.addEventListener('portfolio:scroll', update);
    tall.addEventListener('change', configure);
    reduced.addEventListener('change', configure);
    return () => {
      clock.removeEventListener('portfolio:scroll', update);
      tall.removeEventListener('change', configure);
      reduced.removeEventListener('change', configure);
    };
  }, []);

  const selectYear = index => {
    const section = root.current;
    setActive(index);
    const top = window.scrollY + section.getBoundingClientRect().top;
    const destination = pinned
      ? top + (section.offsetHeight - window.innerHeight) * index / (years.length - 1)
      : window.scrollY + section.querySelector(`#journey-${years[index].year}`).getBoundingClientRect().top - 32;
    window.scrollTo({ top: destination, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  const navigateYears = event => {
    const index = Number(event.target.dataset.yearIndex);
    if (!Number.isInteger(index)) return;
    const next = event.key === 'ArrowRight' ? Math.min(index + 1, years.length - 1) : event.key === 'ArrowLeft' ? Math.max(index - 1, 0) : event.key === 'Home' ? 0 : event.key === 'End' ? years.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    event.currentTarget.querySelectorAll('button')[next].focus({ preventScroll: true });
    selectYear(next);
  };

  return <section id="journey" ref={root} className={`engineering-journey${pinned ? ' is-pinned' : ''}`} aria-labelledby="journey-title">
    <div className="engineering-stage">
      <header className="journey-heading"><div><p className="eyebrow">THE ENGINEERING JOURNEY / 2018—NOW</p><h2 id="journey-title">Built one layer<br />{' '}<em>at a time.</em></h2></div><p>Foundations. Systems. Scale. Intelligence.<br />Scroll through the years, or choose one below.</p></header>
      <div className="year-scene">
        <div className="year-art" aria-hidden="true">
          <svg viewBox="0 0 500 250" fill="none"><path className="year-path-base" d="M0 200C90 200 65 40 155 40S240 210 330 210 410 45 500 45" pathLength="1"/><path className="year-path-fill" d="M0 200C90 200 65 40 155 40S240 210 330 210 410 45 500 45" pathLength="1"/></svg>
          <span className="year-numeral" key={current.year}>{current.year}</span>
          <div className="year-layers">{['Foundations', 'Systems', 'Scale', 'Intelligence'].map((layer, i) => <span key={layer} className={`${i <= current.layer ? 'is-built' : ''} ${i === current.layer ? 'is-current' : ''}`}>{layer}</span>)}</div>
        </div>
        <div className="year-stories">{years.map((year, i) => <article id={`journey-${year.year}`} key={year.year} className={`year-story${active === i ? ' is-active' : ''}`} aria-hidden={pinned && active !== i ? true : undefined}>
          <p className="eyebrow">{year.phase}</p><h3><span className="year-mobile-label">{year.year} / </span>{year.title}</h3><p className="year-description">{year.text}</p>
          <ul className="year-techs" aria-label={`Technologies in the ${year.year} chapter`}>{year.techs.map((tech, index) => <li key={tech} className={year.exploring?.includes(tech) ? 'is-exploration' : ''} style={{ '--tech-order': index }} title={year.exploring?.includes(tech) ? `${tech} — exploring` : tech}><JourneyTechIcon name={tech} /><span>{tech}{year.exploring?.includes(tech) && <span className="sr-only"> (exploring)</span>}</span></li>)}</ul>
          {year.exploring && <p className="year-tool-legend">Solid: in the build <span aria-hidden="true">·</span> Dashed: exploring</p>}
          <p className="year-outcome"><span aria-hidden="true">↗</span>{year.outcome}</p>
        </article>)}</div>
      </div>
      <nav className="year-navigation" aria-label="Explore engineering journey by year" onKeyDown={navigateYears}><div className="year-track" aria-hidden="true"><span /></div>{years.map((year, i) => <button key={year.year} data-year-index={i} className={i <= active ? 'is-reached' : ''} title={`${year.year} — ${year.title}`} aria-label={`Explore ${year.year}`} aria-current={active === i ? 'step' : undefined} aria-controls={`journey-${year.year}`} onClick={() => selectYear(i)}><span className="year-dot" aria-hidden="true"/>{year.year}</button>)}</nav>
      <div className="journey-footnote"><span>{String(active + 1).padStart(2, '0')} / 09 — A PRACTICE THAT KEEPS EVOLVING</span><a href="#projects">See what it led to <span aria-hidden="true">↗</span></a></div>
    </div>
  </section>;
}
