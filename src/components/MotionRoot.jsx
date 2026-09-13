import { MotionConfig } from 'framer-motion';

/**
 * Single reduced-motion switch for every framer-motion animation on the site.
 *
 * `reducedMotion="user"` makes framer-motion skip transform/layout animation
 * when the OS asks for reduced motion; the CSS layer in src/styles/system.css
 * collapses durations as well, and the pointer-driven effects
 * (src/styles/decorative.js) never start at all.
 *
 * This component is loaded lazily from App.jsx: importing framer-motion here
 * must not drag it onto the critical path.
 */
export default function MotionRoot({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
