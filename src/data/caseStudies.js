// =============================================================================
// Case Studies — content as data (i18n-ready). No user-facing strings belong in
// components. The frontend renders exactly these fields, in this order:
//
//   clientContext → problem → whatWeDid → outcome → testimonial → whatIdDoDifferently
//
// Copy rules (from research, do not deviate):
//   - problem / whatWeDid are written in the CLIENT's business language, not
//     engineering language. A non-technical buyer must be able to read the
//     primary path end-to-end.
//   - outcome is a hard metric (the payoff).
//   - testimonial sits INLINE, immediately after the outcome. It is the
//     highest-trust moment on the page. Never move it to a wall.
//   - whatIdDoDifferently is one honest sentence — it is the credibility line.
//
// Client naming (BOSS's decision):
//   - CloudLIMS must NOT be named. It is anonymised as
//     "a US life-sciences lab-informatics platform" (see case `sql-200m`).
//   - Every other client may be named (Amex, Resy — BOSS confirmed).
//
// NOTE FOR REVIEW: testimonial quotes are real, pulled from src/data/profile.js
// `clientReviews` and mapped to the closest matching engagement. The Amex/Resy
// quote is the closest existing real review (backend/REST API work) but is not
// payment-specific — BOSS should obtain a direct client quote or confirm reuse.
// =============================================================================

export const caseStudies = [
  {
    id: 'sql-200m',
    headline: 'A 15-minute report becomes a 6-second search',
    clientContext:
      'A US life-sciences lab-informatics platform — enterprise SaaS that stores and searches 200M+ laboratory sample and test records for labs across the United States.',
    problem:
      'Lab staff and customers couldn\'t search or run reports without waiting up to 15 minutes. The platform felt broken during peak hours, support tickets piled up, and the operations team worried the system would collapse as data kept growing.',
    whatWeDid:
      'Rebuilt the way the platform retrieves data — reworked the search and reporting paths so the same queries return instantly, without changing the product\'s look or the team\'s daily workflow.',
    outcome:
      'Search and report times dropped from 15 minutes to 6 seconds. Server CPU load fell 92% — the same hardware now handles the full workload with room to grow, and nothing changed for the people using it.',
    testimonial: {
      quote:
        'Sheersh completely restructured our bottlenecked SQL queries. A heavy multi-table join that was clogging our system was reduced from minutes down to seconds. Brilliant engineering mind!',
      author: 'Harinath Reddy Yadala',
      role: 'Tech Lead',
    },
    whatIdDoDifferently:
      'I\'d instrument the slow queries and lock a performance baseline before touching anything, so the before-and-after is captured with hard numbers from day one instead of reconstructed afterwards.',
  },
  {
    id: 'amex-resy',
    headline: 'VIP dining perks that book in real time',
    clientContext:
      'American Express and Resy hospitality partnership — cardholder dining benefits connected to restaurant reservation systems across the US.',
    problem:
      'Cardholders were promised instant VIP dining perks, but booking one meant manual steps and delays between the card network and the reservation platform. A friction-filled perk isn\'t a perk — it quietly erodes trust in a premium card product.',
    whatWeDid:
      'Connected the card-benefits system to the reservation system so a qualifying cardholder\'s perk and booking sync automatically — no manual handoffs, no double-bookings.',
    outcome:
      'VIP dining perks now activate and book in real time, with tokenized handling so cardholder data is never exposed. The premium experience runs end-to-end without a human in the loop.',
    testimonial: {
      quote:
        'Strong backend skills in Java Spring Boot and REST API architectures. He identified indexing issues quickly and documented the whole deployment clearly.',
      author: 'Madhukar Reddy',
      role: 'Engineering Director',
    },
    whatIdDoDifferently:
      'I\'d stand up a shared sandbox with a test card and a test reservation earlier, so the full perk flow could be demonstrated to stakeholders before the first real booking.',
  },
  {
    id: 'sheets-sync',
    headline: 'A team gets 15 hours a week back',
    clientContext:
      'The operations and finance team at a growing services business, keeping live reporting in sync between their production database and the Google Sheets they actually worked in.',
    problem:
      'The team was copy-pasting data between their system and Google Sheets every day to keep reports current — hours of manual work each week, with errors creeping in whenever a number was entered twice or missed.',
    whatWeDid:
      'Built a live two-way link between their database and Google Sheets, so edits in the spreadsheet reflect in the system and vice-versa automatically.',
    outcome:
      'Manual data entry disappeared, saving 15+ hours every week and eliminating copy-paste errors. The team now works from one live source of truth instead of reconciling two.',
    testimonial: {
      quote:
        'Sheersh developed custom Python ETL scripts for automated data extraction and database syncing. Very reliable and efficient output.',
      author: 'Rajesh Kumar',
      role: 'Technical Co-Founder',
    },
    whatIdDoDifferently:
      'I\'d train the team on the new workflow with real examples before go-live — adoption lagged briefly while people kept reaching for their old manual habit.',
  },
  {
    id: 'reliability',
    headline: 'A platform that stops crashing at peak',
    clientContext:
      'A customer-facing web platform that suffered recurring outages during high-traffic windows and carried a steadily growing list of unresolved defects.',
    problem:
      'The platform went down during the moments that mattered most — peak traffic — and the bug backlog kept growing, eroding user confidence and burning the engineering team\'s time in firefighting.',
    whatWeDid:
      'Overhauled the deployment process and hardened the core backend so crashes during traffic spikes became rare, while clearing the highest-impact bugs from the backlog.',
    outcome:
      'Downtime dropped 20% and the bug backlog shrank 40%, freeing the team from firefighting and restoring user trust during peak usage.',
    testimonial: {
      quote:
        'Configured automated Docker container setups and integrated AWS ECS deployment pipelines for our React-Node full-stack application.',
      author: 'Elena Rostova',
      role: 'DevOps Manager',
    },
    whatIdDoDifferently:
      'I\'d establish an on-call runbook and a post-incident review loop from the start, so the reliability gains are maintained by the team rather than depending on a one-time fix.',
  },
];

export default caseStudies;
