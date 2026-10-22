import { useEffect } from 'react';

const clamp = value => Math.max(0, Math.min(1, value));
const layoutTop = element => {
  let top = 0;
  for (let node = element; node; node = node.offsetParent) top += node.offsetTop;
  return top;
};

// One scroll listener, one scheduled frame, and cached geometry for the entire page.
// We animate children, so the section measurements don't change as they move.
export function usePageMotion(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let sections = [], items = [], hero = null, story = null, journey = null, frame = 0, needsMeasure = true;
    const desktop = matchMedia('(min-width: 850px)');
    const measure = () => {
      const scroll = window.scrollY;
      sections = [...root.querySelectorAll('main > section:not(.stellar-story)')].map(element => {
        const rect = element.getBoundingClientRect();
        element.dataset.choreography = '';
        const groups = element.querySelectorAll('.project-grid, .service-list, .process-list, .track-record, .crew-feature');
        groups.forEach(group => [...group.children].forEach((child, i) => child.style.setProperty('--motion-order', String(Math.min(i, 4)))));
        return { element, top: rect.top + scroll, height: rect.height };
      });
      items = [...root.querySelectorAll('.work-card, .service-row, .process-list > div, .review-stage, .crew-feature, .about-photo, .archive-group, .explorations-section article, .track-record > div, .engineering-journey:not(.is-pinned) .year-story')].map(element => {
        element.dataset.motionItem = '';
        return { element, top: layoutTop(element) };
      });
      const h = root.querySelector('.hero-chapter');
      if (h) { const rect = h.getBoundingClientRect(); hero = { top: rect.top + scroll, height: rect.height }; }
      const scene = root.querySelector('.stellar-story');
      if (scene) { const rect = scene.getBoundingClientRect(); story = { top: rect.top + scroll, height: rect.height }; }
      const timeline = root.querySelector('.engineering-journey');
      if (timeline) { const rect = timeline.getBoundingClientRect(); journey = { top: rect.top + scroll, height: rect.height }; }
      needsMeasure = false;
    };
    const paint = () => {
      frame = 0;
      if (needsMeasure) measure();
      const scroll = window.scrollY, height = window.innerHeight;
      root.classList.toggle('page-motion-enabled', !reduced.matches);
      for (const section of sections) {
        const relative = section.top - scroll;
        const enter = reduced.matches ? 1 : clamp((height * .96 - relative) / (height * .5));
        const exit = reduced.matches ? 0 : clamp((-relative - section.height * .25) / Math.max(height, section.height * .75));
        section.element.style.setProperty('--section-enter', enter.toFixed(4));
        section.element.style.setProperty('--section-exit', exit.toFixed(4));
        section.element.style.setProperty('--chapter-travel', (reduced.matches ? 0 : clamp((height - relative) / (height + section.height))).toFixed(4));
      }
      for (const item of items) {
        const order = Number(item.element.style.getPropertyValue('--motion-order') || 0);
        const enter = reduced.matches ? 1 : clamp((height * .98 - (item.top - scroll) - order * 18) / (height * .55));
        item.element.style.setProperty('--motion-enter', enter.toFixed(4));
      }
      const pinned = desktop.matches;
      const out = !reduced.matches && hero ? clamp((scroll - hero.top) / Math.max(pinned ? hero.height - height : hero.height, 1)) : 0;
      root.style.setProperty('--hero-out', out.toFixed(4));
      root.style.setProperty('--page-progress', clamp(scroll / Math.max(1, document.documentElement.scrollHeight - height)).toFixed(4));
      const sceneProgress = reduced.matches ? .5 : story ? (pinned
        ? clamp((scroll - story.top) / Math.max(1, story.height - height))
        : clamp((scroll - story.top + height * .7) / Math.max(1, story.height + height * .4))) : 0;
      const journeyProgress = journey ? clamp((scroll - journey.top) / Math.max(1, journey.height - height)) : 0;
      root.dispatchEvent(new CustomEvent('portfolio:scroll', { detail: { sceneProgress, journeyProgress } }));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const resize = () => { needsMeasure = true; schedule(); };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    const mutationObserver = new MutationObserver(resize);
    mutationObserver.observe(root.querySelector('main'), { childList: true, subtree: true });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    reduced.addEventListener('change', schedule);
    paint();
    return () => {
      cancelAnimationFrame(frame); resizeObserver.disconnect(); mutationObserver.disconnect();
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', resize);
      reduced.removeEventListener('change', schedule);
    };
  }, [rootRef]);
}
