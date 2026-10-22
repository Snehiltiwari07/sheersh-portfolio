import { useEffect, useRef, useState } from 'react';
import { profile } from '../data/profile';
import { PROJECT_TYPES, BUDGET_BANDS, HIRE_COPY, MESSAGE_MAX } from '../data/leadForm';
import { EMPTY_LEAD, submitLead, validateLead } from '../lib/lead';

export default function HireDrawer({ open, onClose }) {
  const [values, setValues] = useState({ ...EMPTY_LEAD, budgetBand: 'not-sure' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [retry, setRetry] = useState(0);
  const panelRef = useRef(null);
  const summaryRef = useRef(null);
  const busy = useRef(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const scroll = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const keyboard = event => {
      if (event.key === 'Escape' && !busy.current) closeRef.current();
      if (event.key === 'Tab') {
        const elements = [...panelRef.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
        const first = elements[0], last = elements.at(-1);
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panelRef.current)) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = scroll; document.removeEventListener('keydown', keyboard); previous?.focus(); };
  }, [open]);
  useEffect(() => { if (retry > 0) { const timer = setTimeout(() => setRetry(s => s - 1), 1000); return () => clearTimeout(timer); } }, [retry]);
  useEffect(() => { if (status === 'success') summaryRef.current?.focus(); }, [status]);
  function update(field, value) { setValues(v => ({ ...v, [field]: value })); setErrors({}); }
  async function send(event) {
    event.preventDefault();
    if (busy.current || retry > 0) return;
    const validation = validateLead(values);
    if (Object.keys(validation).length) { setErrors(validation); requestAnimationFrame(() => summaryRef.current?.focus()); return; }
    busy.current = true; setStatus('sending'); setErrors({});
    try {
      const result = await submitLead(values);
      if (result.ok) { setStatus('success'); }
      else { setErrors(result.errors || { form: 'Could not send your brief. Please email Sheersh directly.' }); setStatus('idle'); setRetry(result.retryAfterSeconds || 0); requestAnimationFrame(() => summaryRef.current?.focus()); }
    } catch { setErrors({ form: 'Could not send your brief. Please email Sheersh directly.' }); setStatus('idle'); }
    finally { busy.current = false; }
  }
  const aria = field => ({ 'aria-invalid': Boolean(errors[field]), 'aria-describedby': errors[field] ? `hire-${field}-error` : undefined });
  const error = field => errors[field] && <span className="enquiry-error" id={`hire-${field}-error`}>{errors[field]}</span>;
  if (!open) return null;
  return <div className="enquiry-overlay" onClick={e => { if (e.target === e.currentTarget && !busy.current) onClose(); }}>
    <aside className="enquiry-panel" role="dialog" aria-modal="true" aria-labelledby="hire-title" tabIndex={-1} ref={panelRef}>
      <header><div><p className="eyebrow">{HIRE_COPY.chip}</p><h2 id="hire-title">{HIRE_COPY.title}</h2></div><button type="button" onClick={onClose} disabled={status === 'sending'} aria-label="Close the project enquiry drawer">×</button></header>
      {status === 'success' ? <div ref={summaryRef} tabIndex={-1} className="enquiry-success" role="status"><h3>Thanks. Your brief is in.</h3><p>Sheersh will review it and reply personally. You can also reach him directly by email.</p><button className="ink-button" onClick={onClose}>Back to the portfolio ↗</button></div> : <>
        <p className="enquiry-intro">A few details are enough to start. Scope, timing, and a quote follow a conversation about your needs.</p>
        {Object.keys(errors).length > 0 && <div ref={summaryRef} className="enquiry-error-summary" tabIndex={-1} role="alert"><strong>Please check your brief.</strong>{Object.entries(errors).map(([key, text]) => <p key={key}>{text}</p>)}</div>}
        <form id="hire-form" noValidate onSubmit={send}>
          <fieldset disabled={status === 'sending'}><legend className="sr-only">Your project and contact details</legend>
            <label htmlFor="hire-projectType">What do you need help with?</label><select id="hire-projectType" value={values.projectType} onChange={e => update('projectType', e.target.value)} required {...aria('projectType')}><option value="">Choose a service</option>{PROJECT_TYPES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>{error('projectType')}
            <label htmlFor="hire-message">What are you building or trying to improve?</label><textarea id="hire-message" rows={4} maxLength={MESSAGE_MAX} required value={values.message} onChange={e => update('message', e.target.value)} placeholder="The workflow, the tools you use, and what a useful result would look like…" {...aria('message')} />{error('message')}
            <div className="enquiry-fields"><div><label htmlFor="hire-name">Your name</label><input id="hire-name" autoComplete="name" required maxLength={120} value={values.name} onChange={e => update('name', e.target.value)} {...aria('name')} />{error('name')}</div><div><label htmlFor="hire-email">Email</label><input id="hire-email" type="email" autoComplete="email" required maxLength={254} value={values.email} onChange={e => update('email', e.target.value)} {...aria('email')} />{error('email')}</div></div>
            <label htmlFor="hire-company">Company <span>(optional)</span></label><input id="hire-company" autoComplete="organization" maxLength={160} value={values.company} onChange={e => update('company', e.target.value)} {...aria('company')} />{error('company')}
            <label htmlFor="hire-budgetBand">Budget range</label><select id="hire-budgetBand" required value={values.budgetBand} onChange={e => update('budgetBand', e.target.value)} {...aria('budgetBand')}>{BUDGET_BANDS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>{error('budgetBand')}
            <button className="ink-button enquiry-submit" type="submit" disabled={status === 'sending' || retry > 0}>{status === 'sending' ? 'Sending your brief…' : retry > 0 ? `Try again in ${retry}s` : 'Send project brief ↗'}</button>
          </fieldset>
        </form>
      </>}
      <footer><a href={`mailto:${profile.email}`}>Prefer email? {profile.email} ↗</a><a href={profile.whatsappUrl} target="_blank" rel="noreferrer">Or start on WhatsApp ↗</a></footer>
    </aside>
  </div>;
}
