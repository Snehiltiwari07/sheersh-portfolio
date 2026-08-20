import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { profile } from '../data/profile';

const BOT_NAME = "Ask ST";
const BOT_AVATAR = "https://api.dicebear.com/7.x/bottts/svg?seed=SheershST&backgroundColor=0f172a";
const USER_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=UserGuest&backgroundColor=334155";

const DESI_SUGGESTIONS = [
  "Namaste! Sheersh ka tech stack kya hai? 💻",
  "Freelance hourly rate batao 💸",
  "200M+ SQL Query speedup kaise kiya? ⚡",
  "How to book a call with Sheersh? 📅"
];

const SYSTEM_PROMPT = `
You are "Ask ST", the official intelligent virtual assistant custom-engineered by Sheersh Tiwari exclusively for his personal portfolio website.

LANGUAGE & TONE INSTRUCTIONS:
- You understand English, Hindi, and Hinglish queries seamlessly.
- Respond in polite, concise Hinglish/English with a warm, friendly Desi touch (e.g., using "Namaste!", "Bilkul!", "Aap").
- Keep answers professional, crisp, and under 3 sentences.

BEHAVIOR RULES:
1. OFF-TOPIC QUESTIONS (general trivia, recipes, tigers, sports, weather, movies):
   - Answer the question accurately in 1 short sentence first.
   - Follow immediately with this exact redirect line:
     "\n\n*(Waise main Sheersh ka virtual assistant hoon! Sheersh ki software engineering, SQL optimization, ya freelance projects ke baare me poochhein?)*"

2. ON-TOPIC QUESTIONS (Sheersh's freelance rates, tech stack, experience, contact details, 200M+ SQL tuning):
   - Answer directly and professionally in 2 to 3 sentences max.

SHEERSH'S PROFILE DATA:
- Role: Full-Stack & SQL Optimization Engineer (4+ years experience)
- Freelance Rate: $20–$25/hr USD | Fixed-price milestone billing | Monthly retainers (15–20 hrs/week)
- Availability: 15–20 hrs/week | Immediate start | US night shift (EST/PST), UK & IST overlap
- Core Tech Stack: Java (Spring Boot microservices), Python (FastAPI/ETL), React, JavaScript, Tailwind CSS, PostgreSQL, MySQL, AWS (EC2/RDS/S3), Docker, Apache Kafka
- Key Win: Reduced search query execution across a 200M+ record SQL dataset from 15 minutes down to 6 seconds (92% CPU load reduction via composite indexing and stored procedure refactoring)
- Recognition: Winner of "The Beacon — Employee of the Year 2024" executive award at CloudLIMS
- Location: Indore, Madhya Pradesh, India (Available globally for remote work)
- Contact Info: Email (er.sheershtiwari@gmail.com) | Phone/WhatsApp (+91 7389323262)
`;

const PRODUCTION_GROQ_MODELS = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'llama-3.1-8b-instant'
];

const nextId = () => `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

function GroqLogo({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

export default function ChatEngine() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: nextId(),
      from: 'bot',
      text: `Namaste! 🙏 Main hoon ${BOT_NAME}, Sheersh Tiwari ka custom AI assistant built with Groq LPU engine.\n\nAap Sheersh ke freelance rates, 200M+ SQL optimizations, tech stack, ya booking ke baare me kuch bhi pooch sakte hain!`,
      cta: false
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

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
        setMessages((m) => [
          ...m,
          { id: nextId(), from: 'bot', text: responseText, cta: true }
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
          text: "Aray! Groq AI server connect nahi ho pa raha hai. Aap direct Sheersh se WhatsApp ya Email pe baat kar sakte hain!",
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

  return (
    <>
      {/* FLOATING LAUNCHER BUTTON */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/95 border border-slate-700/80 text-slate-100 text-xs font-mono shadow-2xl backdrop-blur-md cursor-pointer hover:border-orange-500/60 transition-all group"
            onClick={() => setIsOpen(true)}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="group-hover:text-orange-400 transition-colors">Poochho <strong>Ask ST</strong> 🤖</span>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-violet-600 p-[2px] shadow-2xl cursor-pointer focus:outline-none"
        >
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white hover:bg-slate-900 transition-colors relative overflow-hidden">
            {isOpen ? (
              <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <div className="relative flex items-center justify-center">
                <img src={BOT_AVATAR} alt="Ask ST AI Avatar" className="w-9 h-9 rounded-lg" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
              </div>
            )}
          </div>
        </motion.button>
      </div>

      {/* VIEWPORT-SAFE FLOATING POPUP WINDOW */}
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
                : 'bottom-22 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[calc(100vh-6.5rem)] h-[520px] rounded-3xl'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/90 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={BOT_AVATAR} alt="Ask ST" className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 p-0.5 shadow-md" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5 animate-pulse" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-slate-100 text-sm tracking-wide">{BOT_NAME}</h3>
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-[9px] font-mono text-orange-400">
                      Built By Sheersh 🇮🇳
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px] flex items-center gap-1.5 mt-0.5">
                    <span>Virtual AI Assistant</span>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
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

            {/* Scrollable Chat Body */}
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
                      <img src={BOT_AVATAR} alt="Bot" className="w-7 h-7 rounded-lg border border-slate-700 bg-slate-900 shrink-0 self-end mb-1" />
                    )}

                    <div className="max-w-[85%]">
                      <div
                        className={
                          m.from === 'user'
                            ? 'rounded-2xl rounded-tr-xs px-3.5 py-2.5 text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md'
                            : 'rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-xs text-slate-200 bg-slate-900/90 border border-slate-800/90 leading-relaxed shadow-sm'
                        }
                      >
                        {m.from === 'bot' ? <TypedText text={m.text} /> : m.text}
                      </div>

                      {m.from === 'bot' && m.cta && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          <a
                            href={profile.whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-md text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/50 transition-colors"
                          >
                            💬 WhatsApp Sheersh
                          </a>
                          <a
                            href={`mailto:${profile.email}?subject=Project%20Inquiry`}
                            className="px-2.5 py-1 rounded-md text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 hover:bg-cyan-900/50 transition-colors"
                          >
                            ✉️ Email Him
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
                    <img src={BOT_AVATAR} alt="Thinking" className="w-7 h-7 rounded-lg border border-slate-700 bg-slate-900 shrink-0" />
                    <div className="rounded-xl px-3 py-1.5 text-xs text-slate-400 bg-slate-900/90 border border-slate-800 flex items-center gap-2">
                      <GroqLogo />
                      <span className="font-mono text-[10px] text-slate-300">Ask ST soch raha hai...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-1 px-3 py-2 border-t border-slate-800/80 bg-slate-950/80 shrink-0">
              {DESI_SUGGESTIONS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => respond(label)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 hover:text-orange-400 hover:border-slate-700 transition-colors cursor-pointer"
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
                placeholder="Ask ST anything (English ya Hinglish)..."
                className="flex-1 bg-slate-900 rounded-xl px-3.5 py-2.5 text-xs outline-none text-slate-100 placeholder:text-slate-500 border border-slate-800 focus:border-orange-500/50 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-xl font-mono text-xs font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-md"
              >
                Send ➔
              </button>
            </form>

            {/* Watermark */}
            <div className="text-center py-1 bg-slate-950 text-[9px] font-mono text-slate-500 border-t border-slate-900/80 shrink-0">
              Dil Se Engineered by Sheersh Tiwari • Portfolio AI 🇮🇳
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}