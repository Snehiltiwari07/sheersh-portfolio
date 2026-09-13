/**
 * src/data/leadForm.js — the hire enquiry form's content model.
 *
 * Two things live here, both single-source-of-truth:
 *
 *   1. The two enum id lists. These ids are the HTTP contract
 *      (docs/api-lead-contract.md §2) and are validated server-side in
 *      api/lead.js — the client may never free-type or invent one. The labels
 *      are the English strings the visitor reads.
 *   2. The estimator's service table and every user-facing string in the
 *      drawer, following the T-002/T-004 convention (components read copy,
 *      they do not inline it).
 *
 * `npm run check:leadform` asserts these ids are still identical to the arrays
 * in api/lead.js, so the client cannot drift into a 400 the visitor cannot fix.
 */

/** GA4 form identifier. Never change without changing docs/api-lead-contract.md §5. */
export const HIRE_FORM_ID = 'hire_form';

/**
 * Message limits. The server accepts 10-2000 chars; the client stops the
 * visitor at MESSAGE_MAX and the estimate block below is appended on top, so
 * the body that leaves the browser always stays inside the server's ceiling.
 */
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 1400;

/** The estimator table. `projectType` is the contract enum a service maps onto. */
export const ESTIMATOR_SERVICES = [
  {
    id: 'sql',
    label: 'Database & SQL Rescue',
    minCost: 400,
    maxCost: 900,
    minDays: 2,
    maxDays: 5,
    icon: '⚡',
    projectType: 'sql-performance'
  },
  {
    id: 'backend',
    label: 'Spring Boot / Python API',
    minCost: 700,
    maxCost: 1600,
    minDays: 5,
    maxDays: 10,
    icon: '🛡️',
    projectType: 'api-backend'
  },
  {
    id: 'frontend',
    label: 'React Frontend & Dashboard',
    minCost: 600,
    maxCost: 1400,
    minDays: 4,
    maxDays: 8,
    icon: '🎨',
    projectType: 'react-frontend'
  },
  {
    id: 'integrations',
    label: 'API Integration (Amex/Resy/Google/QuickBooks)',
    minCost: 400,
    maxCost: 800,
    minDays: 3,
    maxDays: 6,
    icon: '🔌',
    projectType: 'integration'
  },
  {
    id: 'fullstack',
    label: 'Full-Stack Application (End-to-End)',
    minCost: 1800,
    maxCost: 4200,
    minDays: 12,
    maxDays: 25,
    icon: '🚀',
    projectType: 'full-stack'
  }
];

/** Contract §2 — exact ids, in contract order. */
export const PROJECT_TYPES = [
  { id: 'sql-performance', label: 'Database & SQL Performance Rescue' },
  { id: 'api-backend', label: 'Backend / API Engineering' },
  { id: 'react-frontend', label: 'React Frontend & Dashboard' },
  { id: 'full-stack', label: 'Full-Stack Application (end-to-end)' },
  { id: 'ai-integration', label: 'AI / LLM Integration' },
  { id: 'integration', label: 'Third-Party API Integration' },
  { id: 'consulting', label: 'Architecture Audit / Consulting' },
  { id: 'other', label: 'Something else' }
];

/** Contract §2 — exact ids, in contract order. */
export const BUDGET_BANDS = [
  { id: 'under-5k', label: 'Under $5,000' },
  { id: '5k-15k', label: '$5,000 – $15,000' },
  { id: '15k-50k', label: '$15,000 – $50,000' },
  { id: '50k-plus', label: '$50,000+' },
  { id: 'not-sure', label: 'Not sure yet — advise me' }
];

export const PROJECT_TYPE_IDS = PROJECT_TYPES.map((option) => option.id);
export const BUDGET_BAND_IDS = BUDGET_BANDS.map((option) => option.id);

/** The two empty `<select>` values, kept in one place so they cannot disagree. */
export const SELECT_PLACEHOLDER = { projectType: 'Select a project type', budgetBand: 'Select a budget band' };

/**
 * Every string the visitor reads in the drawer, keyed by the role it plays.
 * `errors.*` are the client-side (UX sugar) messages; the server's own strings
 * are shown verbatim next to the field whenever they arrive, because the
 * server is the authority.
 */
export const HIRE_COPY = {
  chip: 'Interactive Scope & Estimator',
  title: 'Scope Your Project',

  servicesLabel: '1. Select Required Services (Multi-Select):',
  expressTitle: 'Express Speed Priority',
  expressHint: '50% faster delivery (+25% rush pricing)',
  estimateBudgetLabel: 'Estimated Budget Range',
  estimateTimelineLabel: 'Estimated Timeline',
  estimateCurrency: 'USD',
  estimateDays: 'Days',
  estimateFootnote:
    '*Includes full code delivery, automated deployment setup, and post-launch support.',

  briefLabel: '2. Project Brief / Specific Requirements',
  briefPlaceholder:
    'Share any details (e.g. database row count, API endpoints, deadline)...',
  briefCounter: (used, max) => `${used} / ${max} characters`,

  contactLegend: '3. Your Details',
  nameLabel: 'Name',
  namePlaceholder: 'Priya Raman',
  emailLabel: 'Email',
  emailPlaceholder: 'you@company.com',
  companyLabel: 'Company (optional)',
  companyPlaceholder: 'Acme Corp',
  projectTypeLabel: 'Project type',
  budgetBandLabel: 'Budget band',

  submitIdle: 'Send Project Enquiry',
  submitSending: 'Sending…',
  submitRetry: (seconds) => `Try again in ${seconds}s`,

  successTitle: 'Thanks — your enquiry is in.',
  successBody:
    'I have your brief and I will reply personally, usually within one business day. It landed in my inbox with a copy of your estimate.',
  successAgain: 'Send another enquiry',
  successClose: 'Close',

  whatsapp: '💬 Chat on WhatsApp with Estimate',
  emailFallback: 'Prefer email? Write to me directly',

  errorSummaryTitle: (count) =>
    count === 1 ? '1 field needs your attention' : `${count} fields need your attention`,

  errors: {
    name: 'Please tell me your name (at least 2 characters).',
    email: 'Enter a valid email address so I can reply.',
    company: 'Company name is too long (160 characters max).',
    projectType: 'Choose the kind of project you have in mind.',
    budgetBand: 'Choose a budget band — "Not sure yet" is a fine answer.',
    message: `Tell me a little more — at least ${MESSAGE_MIN} characters.`,
    form: 'Something went wrong sending that. Please try again, or email me directly.'
  }
};
