import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { profile } from '../data/profile';
import {
  BUDGET_BANDS,
  ESTIMATOR_SERVICES,
  HIRE_COPY,
  MESSAGE_MAX,
  PROJECT_TYPES,
  SELECT_PLACEHOLDER
} from '../data/leadForm';
import { EMPTY_LEAD, submitLead, validateLead } from '../lib/lead';

/**
 * Interactive Scope & Estimator — the site's single conversion surface.
 *
 * The estimator (services, express toggle, live estimate) is unchanged: it is
 * part of the pitch and the estimate now travels with the enquiry instead of
 * inside a `mailto:` body. What changed is the hand-off — the drawer posts to
 * POST /api/lead (docs/api-lead-contract.md) and fires the GA4 `generate_lead`
 * conversion on `200` only.
 *
 * Client validation is UX sugar; the server is authoritative and its
 * `errors.<field>` strings are rendered verbatim next to the matching input.
 */

const INPUT_CLASS =
  'w-full glass rounded-xl px-4 py-2.5 text-xs outline-none text-ink border border-line placeholder:text-muted';
const INPUT_INVALID_CLASS =
  'w-full glass rounded-xl px-4 py-2.5 text-xs outline-none text-ink border border-red-500/70 placeholder:text-muted';
const LABEL_CLASS = 'font-mono text-micro text-muted uppercase block mb-1';
const PRIMARY_BUTTON_CLASS =
  'w-full py-3 rounded-full font-mono text-xs font-bold text-white grad-bg transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

/**
 * Wires a control to its error/hint text for screen readers
 * (WCAG 3.3.1 Error Identification / 1.3.1 Info and Relationships).
 */
const describedBy = (id, error, hint) =>
  [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined;

const ariaFor = (id, error, hint) => ({
  'aria-invalid': error ? 'true' : undefined,
  'aria-describedby': describedBy(id, error, hint)
});

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="font-mono text-micro text-muted mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="font-mono text-micro text-red-300 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default function HireDrawer({ open, onClose }) {
  const [selectedServices, setSelectedServices] = useState(['sql']);
  const [isExpress, setIsExpress] = useState(false);
  const [brief, setBrief] = useState('');
  const [values, setValues] = useState(EMPTY_LEAD);
  const [touchedProjectType, setTouchedProjectType] = useState(false);

  const [status, setStatus] = useState('idle'); // idle | submitting | success
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [requestId, setRequestId] = useState('');
  const [retrySeconds, setRetrySeconds] = useState(0);

  const drawerRef = useRef(null);
  const summaryRef = useRef(null);
  const confirmationRef = useRef(null);
  const submittingRef = useRef(false);

  // Toggle Service Selection
  const toggleService = (id) => {
    if (selectedServices.includes(id)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter((s) => s !== id));
      }
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  // Calculation Engine
  const baseMetrics = selectedServices.reduce(
    (acc, id) => {
      const s = ESTIMATOR_SERVICES.find((item) => item.id === id);
      if (!s) return acc;
      return {
        minCost: acc.minCost + s.minCost,
        maxCost: acc.maxCost + s.maxCost,
        minDays: acc.minDays + s.minDays,
        maxDays: acc.maxDays + s.maxDays,
      };
    },
    { minCost: 0, maxCost: 0, minDays: 0, maxDays: 0 }
  );

  const multiplier = isExpress ? 1.25 : 1.0;
  const estMinCost = Math.round(baseMetrics.minCost * multiplier);
  const estMaxCost = Math.round(baseMetrics.maxCost * multiplier);

  const estMinDays = isExpress ? Math.max(1, Math.round(baseMetrics.minDays * 0.6)) : baseMetrics.minDays;
  const estMaxDays = isExpress ? Math.max(2, Math.round(baseMetrics.maxDays * 0.6)) : baseMetrics.maxDays;

  const selectedLabels = selectedServices
    .map((id) => ESTIMATOR_SERVICES.find((s) => s.id === id)?.label)
    .filter(Boolean)
    .join(', ');

  /**
   * The estimate the visitor can see, in the shape lib/lead.js appends to the
   * message. This is the T-008 replacement for the removed `mailto:` body.
   */
  const estimate = useMemo(
    () => ({
      services: selectedLabels,
      speed: isExpress ? 'Express Speed Priority (+25% rush pricing)' : 'Standard Timeline',
      minCost: estMinCost,
      maxCost: estMaxCost,
      minDays: estMinDays,
      maxDays: estMaxDays,
    }),
    [selectedLabels, isExpress, estMinCost, estMaxCost, estMinDays, estMaxDays]
  );

  /**
   * The estimator already knows what the visitor needs; it pre-fills the
   * project type until the visitor picks one themselves.
   */
  const suggestedProjectType =
    ESTIMATOR_SERVICES.find((s) => s.id === selectedServices[0])?.projectType || '';
  const projectType = touchedProjectType ? values.projectType : suggestedProjectType;

  const buildSummaryBody = () => {
    return `Hi Sheersh,\n\nI calculated an estimated project scope on your portfolio:\n\n- Selected Services: ${selectedLabels}\n- Delivery Speed: ${isExpress ? 'Express Delivery (+25% speed priority)' : 'Standard Timeline'}\n- Estimated Budget: $${estMinCost} - $${estMaxCost} USD\n- Estimated Timeline: ${estMinDays} - ${estMaxDays} Business Days\n\nProject Notes:\n${brief || '(none provided)'}\n\nLooking forward to discussing this!`;
  };

  const handleWhatsAppSubmit = () => {
    const text = encodeURIComponent(buildSummaryBody());
    window.open(`${profile.whatsappUrl.split('?')[0]}?text=${text}`, '_blank');
  };

  // The drawer is the focus destination when it opens — otherwise a
  // keyboard-only visitor has to tab through the whole page to reach the form.
  useEffect(() => {
    if (open) drawerRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Success: move focus to the confirmation so it is announced and the next Tab
  // continues from there (WCAG 3.3.1 / 2.4.3).
  useEffect(() => {
    if (status === 'success') confirmationRef.current?.focus();
  }, [status]);

  // 429: hold the submit button for Retry-After seconds (contract §3.3).
  useEffect(() => {
    if (retrySeconds <= 0) return undefined;
    const timer = setTimeout(() => setRetrySeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [retrySeconds]);

  const clearErrors = () => {
    setFieldErrors({});
    setFormError('');
  };

  const update = (field) => (value) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (fieldErrors[field] || formError) clearErrors();
  };

  const focusField = (field) => {
    const el = drawerRef.current?.querySelector(`#hire-${field}`);
    el?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current || retrySeconds > 0) return;

    const candidate = { ...values, projectType, message: brief };
    const clientErrors = validateLead(candidate);

    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      setFormError('');
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    submittingRef.current = true;
    setStatus('submitting');
    clearErrors();

    const result = await submitLead(candidate, estimate);
    submittingRef.current = false;

    if (result.ok) {
      setRequestId(result.requestId || '');
      setStatus('success');
      return;
    }

    setStatus('idle');
    const { form, ...fields } = result.errors || {};
    // A pure validation 400 carries no `errors.form`, and inventing a
    // "something went wrong" banner next to the inline errors would be a lie —
    // but a field the form does not render must not vanish silently either.
    const known = ['name', 'email', 'company', 'projectType', 'budgetBand', 'message'];
    const mapped = {};
    const unmapped = [];
    for (const [field, message] of Object.entries(fields)) {
      if (known.includes(field)) mapped[field] = message;
      else unmapped.push(`${field}: ${message}`);
    }
    setFieldErrors(mapped);
    setFormError(form || (unmapped.length ? unmapped.join(' ') : ''));
    if (result.retryAfterSeconds) setRetrySeconds(result.retryAfterSeconds);
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  const resetAfterSuccess = () => {
    setValues(EMPTY_LEAD);
    setBrief('');
    setStatus('idle');
    clearErrors();
    setRequestId('');
    setTouchedProjectType(false);
  };

  const errorEntries = Object.entries(fieldErrors);
  const hasErrorSummary = errorEntries.length > 0 || Boolean(formError);
  const submitting = status === 'submitting';
  const submitDisabled = submitting || retrySeconds > 0;

  const mailtoFallback = `mailto:${profile.email}?subject=${encodeURIComponent('Project Inquiry')}`;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            ref={drawerRef}
            tabIndex={-1}
            role="dialog"
            aria-labelledby="hire-title"
            className="fixed top-0 right-0 h-full w-full max-w-lg z-50 glass p-6 overflow-y-auto border-l border-line outline-none"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="chip px-2.5 py-0.5 rounded text-micro text-cyan font-mono">
                  {HIRE_COPY.chip}
                </span>
                <h3 id="hire-title" className="font-display font-bold text-xl text-ink mt-1">
                  {HIRE_COPY.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close the project enquiry drawer"
                className="chip w-8 h-8 rounded-full target-24"
              >
                ✕
              </button>
            </div>

            {status === 'success' ? (
              <motion.div
                ref={confirmationRef}
                tabIndex={-1}
                role="status"
                data-request-id={requestId}
                className="card p-5 rounded-2xl glass border-2 border-emerald-500/40 bg-emerald-500/5 outline-none"
              >
                <p className="font-display font-bold text-lg text-ink">{HIRE_COPY.successTitle}</p>
                <p className="font-mono text-xs text-muted mt-2 leading-relaxed">
                  {HIRE_COPY.successBody}
                </p>
                <div className="flex flex-wrap gap-2.5 mt-4">
                  <button
                    type="button"
                    onClick={resetAfterSuccess}
                    className="px-4 py-2 rounded-full font-mono text-xs font-bold text-white grad-bg cursor-pointer"
                  >
                    {HIRE_COPY.successAgain}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="chip px-4 py-2 rounded-full font-mono text-xs target-24"
                  >
                    {HIRE_COPY.successClose}
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Estimator Step 1: Services Selection */}
                <div className="space-y-4 my-6">
                  <label className="font-mono text-xs text-muted block">
                    {HIRE_COPY.servicesLabel}
                  </label>
                  <div className="space-y-2">
                    {ESTIMATOR_SERVICES.map((s) => {
                      const isSelected = selectedServices.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleService(s.id)}
                          aria-pressed={isSelected}
                          className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'glass border-cyan bg-violet/10 text-ink shadow-sm'
                              : 'glass border-line text-muted hover:border-violet/30'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg" aria-hidden="true">
                              {s.icon}
                            </span>
                            <span className="font-mono text-xs font-semibold">{s.label}</span>
                          </div>
                          <span className="font-mono text-mini text-violet-400 font-bold">
                            ${s.minCost}-${s.maxCost}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Estimator Step 2: Velocity Toggle */}
                <div className="p-3.5 rounded-xl glass border border-line mb-6 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs font-semibold text-ink">{HIRE_COPY.expressTitle}</p>
                    <p className="font-mono text-micro text-muted">{HIRE_COPY.expressHint}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExpress(!isExpress)}
                    aria-pressed={isExpress}
                    aria-label={HIRE_COPY.expressTitle}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      isExpress ? 'grad-bg' : 'bg-line'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        isExpress ? 'transform translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Live Calculation Output Card */}
                <div className="card p-4 rounded-2xl glass border-2 border-violet/40 mb-6 space-y-3 bg-violet/5">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <div>
                      <p className="font-mono text-micro text-muted uppercase">
                        {HIRE_COPY.estimateBudgetLabel}
                      </p>
                      <p className="font-display font-extrabold text-2xl grad-text">
                        ${estMinCost} - ${estMaxCost}{' '}
                        <span className="text-xs font-mono font-normal text-muted">
                          {HIRE_COPY.estimateCurrency}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-micro text-muted uppercase">
                        {HIRE_COPY.estimateTimelineLabel}
                      </p>
                      <p className="font-display font-bold text-lg text-ink">
                        {estMinDays}-{estMaxDays}{' '}
                        <span className="text-xs font-mono font-normal text-muted">
                          {HIRE_COPY.estimateDays}
                        </span>
                      </p>
                    </div>
                  </div>
                  <p className="font-mono text-micro text-muted">{HIRE_COPY.estimateFootnote}</p>
                </div>

                <form id="hire-form" noValidate onSubmit={handleSubmit} className="space-y-4">
                  {/* Step 3: brief (the estimator's notes field, now the message) */}
                  <Field
                    id="hire-message"
                    label={HIRE_COPY.briefLabel}
                    error={fieldErrors.message}
                    hint={HIRE_COPY.briefCounter(brief.length, MESSAGE_MAX)}
                  >
                    <textarea
                      id="hire-message"
                      name="message"
                      rows={3}
                      required
                      maxLength={MESSAGE_MAX}
                      value={brief}
                      onChange={(e) => {
                        setBrief(e.target.value);
                        if (fieldErrors.message || formError) clearErrors();
                      }}
                      placeholder={HIRE_COPY.briefPlaceholder}
                      className={fieldErrors.message ? INPUT_INVALID_CLASS : INPUT_CLASS}
                      {...ariaFor('hire-message', fieldErrors.message, true)}
                    />
                  </Field>

                  <fieldset className="space-y-4 border-0 p-0 m-0">
                    <legend className="font-mono text-xs text-muted mb-2">
                      {HIRE_COPY.contactLegend}
                    </legend>

                    <Field id="hire-name" label={HIRE_COPY.nameLabel} error={fieldErrors.name}>
                      <input
                        id="hire-name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        maxLength={120}
                        value={values.name}
                        onChange={(e) => update('name')(e.target.value)}
                        placeholder={HIRE_COPY.namePlaceholder}
                        className={fieldErrors.name ? INPUT_INVALID_CLASS : INPUT_CLASS}
                        {...ariaFor('hire-name', fieldErrors.name)}
                      />
                    </Field>

                    <Field id="hire-email" label={HIRE_COPY.emailLabel} error={fieldErrors.email}>
                      <input
                        id="hire-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        maxLength={254}
                        value={values.email}
                        onChange={(e) => update('email')(e.target.value)}
                        placeholder={HIRE_COPY.emailPlaceholder}
                        className={fieldErrors.email ? INPUT_INVALID_CLASS : INPUT_CLASS}
                        {...ariaFor('hire-email', fieldErrors.email)}
                      />
                    </Field>

                    <Field
                      id="hire-company"
                      label={HIRE_COPY.companyLabel}
                      error={fieldErrors.company}
                    >
                      <input
                        id="hire-company"
                        name="company"
                        type="text"
                        autoComplete="organization"
                        maxLength={160}
                        value={values.company}
                        onChange={(e) => update('company')(e.target.value)}
                        placeholder={HIRE_COPY.companyPlaceholder}
                        className={fieldErrors.company ? INPUT_INVALID_CLASS : INPUT_CLASS}
                        {...ariaFor('hire-company', fieldErrors.company)}
                      />
                    </Field>

                    <Field
                      id="hire-projectType"
                      label={HIRE_COPY.projectTypeLabel}
                      error={fieldErrors.projectType}
                    >
                      <select
                        id="hire-projectType"
                        name="projectType"
                        required
                        value={projectType}
                        onChange={(e) => {
                          setTouchedProjectType(true);
                          update('projectType')(e.target.value);
                        }}
                        className={fieldErrors.projectType ? INPUT_INVALID_CLASS : INPUT_CLASS}
                        {...ariaFor('hire-projectType', fieldErrors.projectType)}
                      >
                        <option value="">{SELECT_PLACEHOLDER.projectType}</option>
                        {PROJECT_TYPES.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field
                      id="hire-budgetBand"
                      label={HIRE_COPY.budgetBandLabel}
                      error={fieldErrors.budgetBand}
                    >
                      <select
                        id="hire-budgetBand"
                        name="budgetBand"
                        required
                        value={values.budgetBand}
                        onChange={(e) => update('budgetBand')(e.target.value)}
                        className={fieldErrors.budgetBand ? INPUT_INVALID_CLASS : INPUT_CLASS}
                        {...ariaFor('hire-budgetBand', fieldErrors.budgetBand)}
                      >
                        <option value="">{SELECT_PLACEHOLDER.budgetBand}</option>
                        {BUDGET_BANDS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </fieldset>

                  {/* Honeypot — contract §6.1. Empty, out of the tab order, out
                      of the accessibility tree, and never populated from state.
                      The hide geometry is tokenised (check-tokens gate). */}
                  <input
                    type="text"
                    name="honeypot"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value=""
                    onChange={() => {}}
                    style={{
                      position: 'absolute',
                      left: 'var(--honeypot-offset)',
                      width: 'var(--hairline)',
                      height: 'var(--hairline)',
                      opacity: 0,
                      pointerEvents: 'none'
                    }}
                  />

                  {/* Error summary — announced, focused, and each entry jumps to
                      the field it belongs to (WCAG 3.3.1 / 3.3.3). */}
                  {hasErrorSummary && (
                    <div
                      ref={summaryRef}
                      tabIndex={-1}
                      role="alert"
                      className="rounded-xl glass border border-red-500/70 bg-red-500/5 px-3 py-2.5 outline-none"
                    >
                      {errorEntries.length > 0 && (
                        <p className="font-mono text-mini font-bold text-red-300">
                          {HIRE_COPY.errorSummaryTitle(errorEntries.length)}
                        </p>
                      )}
                      <ul className="mt-1.5 space-y-1">
                        {errorEntries.map(([field, message]) => (
                          <li key={field}>
                            <button
                              type="button"
                              onClick={() => focusField(field)}
                              className="font-mono text-micro text-red-300 underline text-left cursor-pointer"
                            >
                              {message}
                            </button>
                          </li>
                        ))}
                        {/* The form-level message is the server's own text (429,
                            502, 403, network) — the wait it names is also
                            reflected in the disabled button's countdown. */}
                        {formError && (
                          <li className="font-mono text-micro text-red-300">{formError}</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <button type="submit" disabled={submitDisabled} className={PRIMARY_BUTTON_CLASS}>
                      {submitting
                        ? HIRE_COPY.submitSending
                        : retrySeconds > 0
                        ? HIRE_COPY.submitRetry(retrySeconds)
                        : HIRE_COPY.submitIdle}
                    </button>
                    <button
                      type="button"
                      onClick={handleWhatsAppSubmit}
                      className="w-full py-3 rounded-full font-mono text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {HIRE_COPY.whatsapp}
                    </button>
                    {/* The escape hatch stays reachable in every failure state —
                        a genuine buyer is never trapped behind a broken form. */}
                    <p className="font-mono text-micro text-muted text-center">
                      {HIRE_COPY.emailFallback}{' '}
                      <a className="underline text-accent" href={mailtoFallback}>
                        {profile.email}
                      </a>
                    </p>
                  </div>
                </form>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// The floating CTA moved to ./FloatingHireButton so App.jsx can import it
// eagerly without pulling this module (and framer-motion) onto the critical
// path. Re-exported here so existing importers keep working.
export { FloatingHireButton } from './FloatingHireButton';
