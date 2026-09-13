// =============================================================================
// Positioning — the single source of truth for who Sheersh is and what he does.
//
// The concept (already decided — do not re-litigate):
//   "The site performs the way he makes systems perform."
// Instantly fast, ruthlessly efficient, restrained — because that is the service
// being sold. Every user-facing statement must support this one idea.
//
// The site previously shipped FOUR different statements (profile.js, Hero,
// navbar logo, meta description). This file locks ONE headline, ONE tagline,
// ONE meta description, and lists every file that must change to make the site
// consistent. Components import these fields — no positioning copy is
// hardcoded in components.
// =============================================================================

// Strings are hoisted to module-level consts so the `filesToChange` list below
// can reference them without hitting the temporal dead zone (a `const` is
// unreadable inside its own object literal's initializer). This module must
// evaluate cleanly on import — T-004 consumes it as its first importer.
// =============================================================================

export const CONCEPT = 'The site performs the way he makes systems perform.';

// Hero H1 value proposition — the single idea made literal.
export const HEADLINE = 'I make slow systems fast.';

// The proof line rendered directly under the headline (PRD §4.3 UVP).
export const PROOF_LINE = '200M records: 15 minutes → 6 seconds, 92% less CPU.';

// The ONE role descriptor used everywhere a title/tagline appears.
export const TAGLINE = 'Full-Stack Engineer · Database Performance Specialist';

// <title> and OG/social title.
export const TITLE_TAG =
  'Sheersh Tiwari — Full-Stack Engineer & Database Performance Specialist';

// <meta name="description"> — answer-first, ~155 chars, keyword-rich for SEO.
export const META_DESCRIPTION =
  'Sheersh Tiwari — full-stack engineer who makes slow enterprise databases fast: 200M records from 15 min to 6 sec, 92% less CPU. 18+ contracts, 4.85★.';

// Availability badge (Hero + Footer share one line).
export const AVAILABILITY =
  'Available for Full-Stack & Database Performance Contracts';

export const positioning = {
  concept: CONCEPT,
  headline: HEADLINE,
  proofLine: PROOF_LINE,
  tagline: TAGLINE,
  titleTag: TITLE_TAG,
  metaDescription: META_DESCRIPTION,
  availability: AVAILABILITY,

  // ===========================================================================
  // Consistency change list — every file that currently ships a divergent (or
  // missing) statement. `current` is the exact string on disk today; `replace`
  // is what it must become. This is the grep-verifiable target for the
  // "1 statement sitewide" acceptance criterion.
  // ===========================================================================
  filesToChange: [
    {
      file: 'src/data/profile.js',
      location: 'profile.title (line 3)',
      current: 'Full-Stack Developer & SQL Optimization Specialist',
      replace: TAGLINE,
      note: 'Primary source of truth for the tagline.',
    },
    {
      file: 'src/data/profile.js',
      location: 'profile.summary (line 16)',
      current:
        'Full-Stack Engineer with 4+ years of experience engineering high-throughput backend services, React frontends, and ultra-low latency SQL query architectures across 200M+ record datasets.',
      replace:
        'Full-stack engineer who makes slow enterprise systems fast — 200M+ record datasets from 15 minutes to 6 seconds, 92% less CPU, across high-throughput backend services and React frontends.',
      note: 'Align summary voice to the outcome (speed), not the stack list.',
    },
    {
      file: 'src/components/Hero.jsx',
      location: 'role sub-line (line 49)',
      current: 'Senior Software Engineer • Full-Stack & AI Specialist',
      replace: TAGLINE,
      note: 'The Hero is one of the four conflicting statements.',
    },
    {
      file: 'src/components/Hero.jsx',
      location: 'availability badge (line 35)',
      current: 'Available for Full-Stack & AI Systems Contracts',
      replace: AVAILABILITY,
      note: 'Keep the badge, align the words.',
    },
    {
      file: 'src/components/Navbar.jsx',
      location: 'logo sub-line (line 40)',
      current: 'SQL & AI Architect',
      replace: TAGLINE,
      note: 'One of the four conflicting statements.',
    },
    {
      file: 'index.html',
      location: '<title> (line 44)',
      current: 'Portfolio | Sheersh.dev',
      replace: TITLE_TAG,
      note: 'Currently states nothing about who he is or what he does.',
    },
    {
      file: 'index.html',
      location: 'meta description (line 56)',
      current:
        'Official portfolio of Sheersh Tiwari — Full-Stack Architect & SQL Performance Engineer.',
      replace: META_DESCRIPTION,
      note: 'One of the four conflicting statements.',
    },
    {
      file: 'src/components/Footer.jsx',
      location: 'brand paragraph (line 24)',
      current:
        'Full-Stack & SQL Architect specializing in 200M+ database performance tuning, Spring Boot microservices, and client-side AI systems.',
      replace:
        'Full-stack engineer who makes slow enterprise systems fast — 200M+ record performance tuning, Spring Boot microservices, and client-side AI.',
      note: 'Fifth divergent descriptor found in the footer.',
    },
    {
      file: 'src/components/ChatEngine.jsx',
      location: 'SYSTEM_PROMPT persona line (line 33)',
      current:
        'Sheersh Tiwari: Full-Stack Architect & SQL Performance Specialist based in Indore, MP, India (Global Remote; overlaps with US EST/PST, UK, IST).',
      replace:
        'Sheersh Tiwari: Full-Stack Engineer & Database Performance Specialist based in Indore, MP, India (Global Remote; overlaps with US EST/PST, UK, IST).',
      note: 'ChatEngine is out of scope for the frontend pass; update this one persona line to match the tagline.',
    },
    {
      file: 'src/components/PhotoCard3D.jsx',
      location: 'card subtitle (line 60)',
      current: 'Full-Stack & Systems Engineer',
      replace: '(file deleted — see restraint spec)',
      note: 'Dead code (not imported). Restraint spec deletes the file entirely.',
    },
  ],
};

export default positioning;
