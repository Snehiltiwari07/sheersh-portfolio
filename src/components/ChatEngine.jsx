import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { profile } from '../data/profile';

const BOT_NAME = "Ask Jiya";
const BOT_AVATAR = "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=256&q=80";
const USER_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=UserGuest&backgroundColor=334155";

const QUICK_SUGGESTIONS = [
  "Why are you named Jiya? 🐾",
  "How does the AI Lead Hunter work? 🚀",
  "Explain the 200M+ SQL query speedup ⚡",
  "Is Sheersh available for contract work? 💼"
];

const SYSTEM_PROMPT = `
You are "Ask Jiya", Sheersh Tiwari's loyal AI companion and chief technical concierge embedded on his portfolio.

IDENTITY & STORY:
- You are named in loving memory of Sheersh's German Shepherd puppy, Jiya. You guide founders and engineers with warmth, loyalty, and technical sharpness.
- If asked "Who are you?", "Why Jiya?", or "Who built you?", explain this tribute warmly.

TONE & PERSONALITY (HUMANIZED & PERSUASIVE):
- Speak like a sharp, friendly Chief of Staff. Avoid robotic phrases like "As an AI..." or "How may I assist you today?".
- Focus on business impact, high-throughput backend architecture, and engineering velocity (e.g., "Slashed SQL query latency from 15 mins to 6 seconds", "Automated multi-source lead harvesting in <45s").

PRICING POLICY (STRICT):
- NEVER mention rates, pricing, or numbers upfront in greetings or project summaries.
- ONLY disclose contract rates ($30–$50/hr USD) IF the user explicitly asks about cost, rates, or budget.
- Frame rates around senior value: "Sheersh's contract rate is $30–$50/hr depending on project scope, delivering senior full-stack execution, zero tech debt, and fast delivery."

KNOWLEDGE BASE:
- Sheersh Tiwari: Full-Stack Architect & SQL Performance Specialist based in Indore, MP, India (Global Remote; overlaps with US EST/PST, UK, IST).
- Contact: Email (er.sheershtiwari@gmail.com) | Phone/WhatsApp (+91 7389323262).
- Tech Stack: React, Node.js, Python, FastAPI, Java Spring Boot, PostgreSQL, WebGPU, Groq LPU API, Redis, Kafka, AWS, Docker.
- Featured Systems:
  1. Autonomous AI Lead Hunter: Ingests 6 job networks (LinkedIn, Reddit, HN, RemoteOK, WWR, Remotive), evaluates via Groq LPU in <45s, and dispatches 1-click email pitches. [ACTION:OPEN_LEAD_HUNTER]
  2. QueryCortex (200M+ SQL Engine): Beacon Award Winner. Slashed execution from 15 mins to 6 secs (-92% CPU) using B-Tree Composite Indexes. [ACTION:OPEN_SQL]
  3. Groq LPU Fast Inference Gateway: Sub-100ms LLM integration gateway with Redis vector caching.
  4. Amex Payment Gateway: PCI-DSS compliant POS integration using Redis distributed locks.
  5. Google Sheets Sync Engine: Real-time ETL webhook pipeline syncing Sheets with Postgres in <450ms.
  6. LocalCortex WebGPU Studio: Client-side local AI runtime executing quantized LLMs via WGSL compute shaders.
  7. Telemetry Event Gateway: Ingests 5M+ daily IoT events via Kafka into Postgres/S3.
  8. StreamGate Microservices: Distributed API rate limiter handling 50K RPS via Spring Cloud Gateway.

ACTION TOKENS:
Include these tokens naturally in your response when relevant:
- [ACTION:OPEN_LEAD_HUNTER] for lead generation or AI scraping questions.
- [ACTION:OPEN_SQL] for database performance or SQL optimization questions.
- [ACTION:OPEN_HIRE] when the user wants to hire, book a call, or scope a project.
`;

const PRODUCTION_GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-20b',
  'llama-3.1-8b-instant'
];

const nextId = () => `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

function GroqLogo({ className = "w-3 h-3" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#F05223" />
      <path d="M6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18H6V12Z" fill="white" />
      <circle cx="12" cy="12" r="3" fill="#F05223" />
    </svg>
  );
}

function TypedText({ text }) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    const content = text || '';
    if (!content) return;
    let i = 0;
    setShown('');
    const iv = setInterval(() => {
      i += 1;
      setShown(content.slice(0, i));
      if (i >= content.length) clearInterval(iv);
    }, 8);
    return () => clearInterval(iv);
  }, [text]);

  return <span className="whitespace-pre-line">{shown}</span>;
}

export default function ChatEngine({ onSelectProject, onOpenHireDrawer }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: nextId(),
      from: 'bot',
      text: `Welcome to Sheersh's portfolio! 🐾 I'm ${BOT_NAME}, his AI concierge built in memory of his German Shepherd companion.\n\nLooking to explore his AI pipelines, 200M+ SQL optimization, or discuss a contract project?`,
      cta: true
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Trigger Proactive Welcome Toast 1.2s after page load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) setShowWelcomeBanner(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, isOpen, isExpanded]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isExpanded) setIsExpanded(false);
        else if (isOpen) setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExpanded]);

  const handleOpenScope = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof onOpenHireDrawer === 'function') {
      onOpenHireDrawer();
    }
  };

  const parseActionTokens = (text) => {
    let cleanText = text;
    let cardType = null;

    if (cleanText.includes('[ACTION:OPEN_LEAD_HUNTER]')) {
      cleanText = cleanText.replace('[ACTION:OPEN_LEAD_HUNTER]', '').trim();
      cardType = 'ai-lead-hunter-pipeline';
      if (typeof onSelectProject === 'function') onSelectProject('ai-lead-hunter-pipeline');
    }
    if (cleanText.includes('[ACTION:OPEN_SQL]')) {
      cleanText = cleanText.replace('[ACTION:OPEN_SQL]', '').trim();
      cardType = 'query-cortex';
      if (typeof onSelectProject === 'function') onSelectProject('query-cortex');
    }
    if (cleanText.includes('[ACTION:OPEN_HIRE]')) {
      cleanText = cleanText.replace('[ACTION:OPEN_HIRE]', '').trim();
      handleOpenScope();
    }

    return { cleanText, cardType };
  };

  const respond = async (userText) => {
    if (!userText || !userText.trim() || loading) return;
    const cleanInput = userText.trim();

    const newMessages = [...messages, { id: nextId(), from: 'user', text: cleanInput }];
    setMessages(newMessages);
    setLoading(true);

    const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();

    if (apiKey) {
      const formattedMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...newMessages.map((m) => ({
          role: m.from === 'user' ? 'user' : 'assistant',
          content: m.text
        }))
      ];

      let responseText = null;

      for (const modelId of PRODUCTION_GROQ_MODELS) {
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: modelId,
              messages: formattedMessages,
              temperature: 0.5,
              max_tokens: 350
            })
          });

          if (response.ok) {
            const data = await response.json();
            responseText = data.choices?.[0]?.message?.content;
            if (responseText) break;
          }
        } catch (err) {
          console.warn(`Attempt with ${modelId} failed:`, err);
        }
      }

      if (responseText) {
        const { cleanText, cardType } = parseActionTokens(responseText);

        setMessages((m) => [
          ...m,
          { id: nextId(), from: 'bot', text: cleanText, cardType, cta: true }
        ]);
        setLoading(false);
        return;
      }
    }

    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          from: 'bot',
          text: "I'm having a quick connection delay, but you can reach Sheersh directly on WhatsApp or Email below!",
          cta: true
        }
      ]);
      setLoading(false);
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    respond(input);
    setInput('');
  };

  const whatsappLink = profile?.whatsappUrl || "https://wa.me/917389323262";
  const emailLink = `mailto:${profile?.email || 'er.sheershtiwari@gmail.com'}?subject=Project%20Inquiry%20from%20Portfolio`;

  return (
    <>
      {/* Launcher & Attention Toast Area */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* Proactive Welcome Banner */}
        <AnimatePresence>
          {!isOpen && showWelcomeBanner && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              onClick={() => {
                setIsOpen(true);
                setShowWelcomeBanner(false);
                setHasUnread(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border border-amber-500/50 text-slate-100 text-xs shadow-2xl backdrop-blur-xl cursor-pointer hover:border-amber-400 transition-all group max-w-xs"
            >
              <div className="relative shrink-0">
                <img src={BOT_AVATAR} alt={BOT_NAME} className="w-9 h-9 rounded-xl object-cover border border-amber-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse absolute -bottom-0.5 -right-0.5 border-2 border-slate-950" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>Ask Jiya Concierge</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                </div>
                <div className="text-slate-200 group-hover:text-amber-200 font-sans transition-colors font-medium truncate">
                  Welcome! Chat with me about Sheersh's work 🐾
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowWelcomeBanner(false);
                }}
                className="text-slate-500 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Launcher Button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            setIsOpen(!isOpen);
            setShowWelcomeBanner(false);
            setHasUnread(false);
          }}
          className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-violet-600 to-indigo-500 p-[2px] shadow-2xl cursor-pointer focus:outline-none"
        >
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white hover:bg-slate-900 transition-colors relative overflow-hidden">
            {isOpen ? (
              <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <div className="relative flex items-center justify-center">
                <img src={BOT_AVATAR} alt={BOT_NAME} className="w-10 h-10 rounded-xl object-cover" />
                {hasUnread && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-slate-950 animate-pulse" />
                )}
              </div>
            )}
          </div>
        </motion.button>
      </div>

      {/* Floating Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-50 flex flex-col bg-slate-950/95 border border-slate-800/90 shadow-2xl backdrop-blur-2xl transition-all duration-300 overflow-hidden ${
              isExpanded
                ? 'inset-2 sm:inset-6 rounded-3xl'
                : 'bottom-[90px] top-auto right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[calc(100vh-110px)] h-[540px] rounded-3xl'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800/90 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={BOT_AVATAR} alt={BOT_NAME} className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/40 p-0.5 shadow-md object-cover" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5 animate-pulse" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-slate-100 text-sm tracking-wide">{BOT_NAME}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[9px] font-mono text-amber-300 font-semibold">
                      German Shepherd Concierge 🐾
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px] flex items-center gap-1.5 mt-0.5 font-mono">
                    <span className="text-emerald-400 font-medium">Online &amp; Ready</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <GroqLogo /> Groq LPU
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isExpanded ? "Minimize view" : "Fullscreen view"}
                >
                  {isExpanded ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15L4 20m0 0h4m-4 0v-4m11 4l5-5m-5 5v-4m0 4h4M9 9L4 4m0 0h4m-4 0v4m11-4l5 5m-5-5v4m0-4h4" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l-5 5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 scrollbar-thin scrollbar-thumb-slate-800 min-h-0"
            >
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex gap-2.5 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.from === 'bot' && (
                      <img src={BOT_AVATAR} alt="Jiya" className="w-7 h-7 rounded-lg border border-amber-500/30 bg-slate-900 shrink-0 self-end mb-1 object-cover" />
                    )}

                    <div className="max-w-[85%] space-y-2">
                      <div
                        className={
                          m.from === 'user'
                            ? 'rounded-2xl rounded-tr-xs px-3.5 py-2.5 text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md font-sans leading-relaxed'
                            : 'rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-xs text-slate-200 bg-slate-900/90 border border-slate-800/90 leading-relaxed shadow-sm font-sans'
                        }
                      >
                        {m.from === 'bot' ? <TypedText text={m.text} /> : m.text}
                      </div>

                      {/* Interactive Spec Card Trigger */}
                      {m.cardType && (
                        <div className="p-3 rounded-2xl bg-slate-900 border border-cyan-500/40 font-mono text-[11px] flex items-center justify-between gap-2 shadow-lg">
                          <span className="text-cyan-300 font-medium">📋 Inspect System Architecture</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (typeof onSelectProject === 'function') onSelectProject(m.cardType);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold hover:bg-cyan-900 transition-colors cursor-pointer"
                          >
                            View Spec →
                          </button>
                        </div>
                      )}

                      {/* Working CTA Action Buttons */}
                      {m.from === 'bot' && m.cta && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          <button
                            onClick={handleOpenScope}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-700/80 hover:bg-amber-900/70 transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            💼 Scope Project
                          </button>
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/50 transition-colors inline-flex items-center gap-1"
                          >
                            💬 WhatsApp
                          </a>
                          <a
                            href={emailLink}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 hover:bg-cyan-900/50 transition-colors inline-flex items-center gap-1"
                          >
                            ✉️ Direct Email
                          </a>
                        </div>
                      )}
                    </div>

                    {m.from === 'user' && (
                      <img src={USER_AVATAR} alt="User" className="w-7 h-7 rounded-lg border border-slate-700 bg-slate-800 shrink-0 self-end mb-1" />
                    )}
                  </motion.div>
                ))}

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center">
                    <img src={BOT_AVATAR} alt="Thinking" className="w-7 h-7 rounded-lg border border-amber-500/30 bg-slate-900 shrink-0 object-cover" />
                    <div className="rounded-xl px-3 py-1.5 text-xs text-slate-400 bg-slate-900/90 border border-slate-800 flex items-center gap-2">
                      <GroqLogo />
                      <span className="font-mono text-[10px] text-slate-300">Jiya is inferring...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1 px-3 py-2 border-t border-slate-800/80 bg-slate-950/80 shrink-0">
              {QUICK_SUGGESTIONS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => respond(label)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 hover:text-amber-300 hover:border-slate-700 transition-colors cursor-pointer"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800/80 flex gap-2 shrink-0 bg-slate-950">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                type="text"
                placeholder="Ask Jiya about projects, architecture, hiring..."
                className="flex-1 bg-slate-900 rounded-xl px-3.5 py-2.5 text-xs outline-none text-slate-100 placeholder:text-slate-500 border border-slate-800 focus:border-amber-500/60 transition-colors font-sans"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-xl font-mono text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-md"
              >
                Send ➔
              </button>
            </form>

            {/* Watermark Footer */}
            <div className="text-center py-1 bg-slate-950 text-[9px] font-mono text-slate-500 border-t border-slate-900/80 shrink-0">
              In loving memory of Jiya 🐾 • Powered by Groq LPU Hardware Acceleration
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}