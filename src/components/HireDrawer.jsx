import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { profile } from '../data/profile';

const ESTIMATOR_SERVICES = [
  {
    id: 'sql',
    label: 'Database & SQL Rescue',
    minCost: 400,
    maxCost: 900,
    minDays: 2,
    maxDays: 5,
    icon: '⚡'
  },
  {
    id: 'backend',
    label: 'Spring Boot / Python API',
    minCost: 700,
    maxCost: 1600,
    minDays: 5,
    maxDays: 10,
    icon: '🛡️'
  },
  {
    id: 'frontend',
    label: 'React Frontend & Dashboard',
    minCost: 600,
    maxCost: 1400,
    minDays: 4,
    maxDays: 8,
    icon: '🎨'
  },
  {
    id: 'integrations',
    label: 'API Integration (Amex/Resy/Google/QuickBooks)',
    minCost: 400,
    maxCost: 800,
    minDays: 3,
    maxDays: 6,
    icon: '🔌'
  },
  {
    id: 'fullstack',
    label: 'Full-Stack Application (End-to-End)',
    minCost: 1800,
    maxCost: 4200,
    minDays: 12,
    maxDays: 25,
    icon: '🚀'
  }
];

export default function HireDrawer({ open, onClose }) {
  const [selectedServices, setSelectedServices] = useState(['sql']);
  const [isExpress, setIsExpress] = useState(false);
  const [notes, setNotes] = useState('');

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

  // Message Builders
  const buildSummaryBody = () => {
    return `Hi Sheersh,\n\nI calculated an estimated project scope on your portfolio:\n\n- Selected Services: ${selectedLabels}\n- Delivery Speed: ${isExpress ? 'Express Delivery (+25% speed priority)' : 'Standard Timeline'}\n- Estimated Budget: $${estMinCost} - $${estMaxCost} USD\n- Estimated Timeline: ${estMinDays} - ${estMaxDays} Business Days\n\nProject Notes:\n${notes || '(none provided)'}\n\nLooking forward to discussing this!`;
  };

  const handleEmailSubmit = () => {
    const subject = `Project Inquiry — ${selectedServices.length} Selected Services`;
    const body = buildSummaryBody();
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleWhatsAppSubmit = () => {
    const text = encodeURIComponent(buildSummaryBody());
    window.open(`https://wa.me/917389323262?text=${text}`, '_blank');
  };

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
            className="fixed top-0 right-0 h-full w-full max-w-lg z-50 glass p-6 overflow-y-auto border-l border-line"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="chip px-2.5 py-0.5 rounded text-[10px] text-cyan font-mono">
                  Interactive Scope & Estimator
                </span>
                <h3 className="font-display font-bold text-xl text-ink mt-1">
                  Scope Your Project
                </h3>
              </div>
              <button onClick={onClose} className="chip w-8 h-8 rounded-full">✕</button>
            </div>

            {/* Estimator Step 1: Services Selection */}
            <div className="space-y-4 my-6">
              <label className="font-mono text-xs text-muted block">
                1. Select Required Services (Multi-Select):
              </label>
              <div className="space-y-2">
                {ESTIMATOR_SERVICES.map((s) => {
                  const isSelected = selectedServices.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'glass border-cyan bg-violet/10 text-ink shadow-sm'
                          : 'glass border-line text-muted hover:border-violet/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{s.icon}</span>
                        <span className="font-mono text-xs font-semibold">{s.label}</span>
                      </div>
                      <span className="font-mono text-[11px] text-violet font-bold">
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
                <p className="font-mono text-xs font-semibold text-ink">Express Speed Priority</p>
                <p className="font-mono text-[10px] text-muted">50% faster delivery (+25% rush pricing)</p>
              </div>
              <button
                type="button"
                onClick={() => setIsExpress(!isExpress)}
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
                  <p className="font-mono text-[10px] text-muted uppercase">Estimated Budget Range</p>
                  <p className="font-display font-extrabold text-2xl grad-text">
                    ${estMinCost} - ${estMaxCost} <span className="text-xs font-mono font-normal text-muted">USD</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] text-muted uppercase">Estimated Timeline</p>
                  <p className="font-display font-bold text-lg text-ink">
                    {estMinDays}-{estMaxDays} <span className="text-xs font-mono font-normal text-muted">Days</span>
                  </p>
                </div>
              </div>
              <p className="font-mono text-[10px] text-muted">
                *Includes full code delivery, automated deployment setup, and post-launch support.
              </p>
            </div>

            {/* Step 3: Project Notes */}
            <div className="mb-6">
              <label className="font-mono text-xs text-muted block mb-1">
                2. Project Notes / Specific Requirements (Optional):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full glass rounded-xl px-4 py-2.5 text-xs outline-none text-ink border border-line placeholder:text-muted"
                placeholder="Share any details (e.g. database row count, API endpoints, deadline)..."
              />
            </div>

            {/* Call to Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleWhatsAppSubmit}
                className="w-full py-3 rounded-full font-mono text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                💬 Chat on WhatsApp with Estimate
              </button>
              <button
                type="button"
                onClick={handleEmailSubmit}
                className="w-full py-3 rounded-full font-mono text-xs font-bold text-white grad-bg transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                ✉️ Send Estimated Scope via Email
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function FloatingHireButton({ onClick }) {
  return (
    <div className="fixed bottom-6 left-6 z-40">
      <button
        onClick={onClick}
        className="relative group flex items-center gap-2.5 px-4 py-3 rounded-full font-mono text-xs font-bold text-white bg-slate-950/90 border border-violet-500/40 hover:border-violet-400 shadow-2xl backdrop-blur-xl hover:scale-105 active:scale-95 transition-all cursor-pointer overflow-hidden"
      >
        {/* Glow Aura */}
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 to-orange-500 opacity-30 blur-md group-hover:opacity-70 transition-opacity" />

        {/* Live Indicator */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>

        {/* Text */}
        <span className="relative z-10 text-slate-100 group-hover:text-violet-300 transition-colors">
          💼 Estimate Project Cost
        </span>
      </button>
    </div>
  );
}