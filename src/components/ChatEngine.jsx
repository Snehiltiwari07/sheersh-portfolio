import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { chatChipSuggestions, profile } from '../data/profile';

const SYSTEM_PROMPT = `
You are Sheersh Tiwari's personal AI Assistant on his engineering portfolio website.

BEHAVIOR RULES:
1. OFF-TOPIC QUESTIONS (e.g., Bengal tigers, recipes, general trivia, weather, sports, movies):
   - ALWAYS answer the user's question accurately in 1 to 2 concise sentences first.
   - Immediately follow your answer with a blank line and this exact redirect statement:
     "\n\n*(As Sheersh's professional portfolio assistant, my main focus is on his software engineering, database optimizations, and project availability. How can I help with your technical or hiring needs?)*"

2. ON-TOPIC QUESTIONS (Sheersh's freelance rates, tech stack, experience, contact details, 200M+ SQL tuning):
   - Answer directly, professionally, and concisely in 2 to 3 sentences max.

SHEERSH'S PROFILE DATA:
- Role: Full-Stack & SQL Optimization Engineer (4+ years experience)
- Freelance Rate: $20–$25/hr USD | Fixed-price milestone billing | Monthly retainers (15–20 hrs/week)
- Availability: 15–20 hrs/week | Immediate start | US night shift (EST/PST), UK & IST overlap
- Core Tech Stack: Java (Spring Boot microservices), Python (FastAPI/ETL), React, JavaScript, Tailwind CSS, PostgreSQL, MySQL, AWS (EC2/RDS/S3), Docker, Apache Kafka
- Key Win: Reduced search query execution across a 200M+ record SQL dataset from 15 minutes down to 6 seconds (92% CPU load reduction via composite indexing and stored procedure refactoring)
- Recognition: Winner of "The Beacon — Employee of the Year 2024" executive award at CloudLIMS
- Integrations: Amex & Resy VIP booking sync, Google Sheets real-time DB data pipelines, QuickBooks financial sync
- Location: Indore, Madhya Pradesh, India (Available globally for remote work)
- Contact Info: Email (er.sheershtiwari@gmail.com) | Phone/WhatsApp (+91 7389323262)
`;

// Active Groq Production Models
const PRODUCTION_GROQ_MODELS = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'llama-3.1-8b-instant'
];

const nextId = () => `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

// Official-Style Groq Icon Component
function GroqLogo({ className = "w-4 h-4" }) {
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
  const [messages, setMessages] = useState([
    {
      id: nextId(),
      from: 'bot',
      text: "Hello! 👋 I'm Sheersh's AI Assistant running on ultra-fast Groq LPU inference. Ask me anything about his freelance rates, 200M+ SQL query speedups, tech stack, or project availability!",
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
  }, [messages, loading]);

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
          text: "Unable to connect to the Groq AI server right now. Please verify VITE_GROQ_API_KEY in your .env file or message Sheersh directly via WhatsApp or Email below!",
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
    <section id="ai-assistant" className="max-w-3xl mx-auto px-4 sm:px-6 py-16 relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header Bar */}
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-200 shadow-lg backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <GroqLogo className="w-4 h-4" />
          <span>Powered by <strong className="text-orange-400 font-semibold">Groq AI Engine</strong></span>
        </div>

        <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-100 tracking-tight">
          Interactive AI Portfolio Assistant
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
          Lightning-fast answers about Sheersh's freelance rates, 200M+ SQL tuning, tech stack, or booking a call.
        </p>
      </div>

      {/* Sleek Dark Chat Window */}
      <div className="rounded-3xl bg-slate-950/85 border border-slate-800/80 shadow-2xl overflow-hidden p-4 sm:p-6 backdrop-blur-xl relative">
        
        {/* Messages Container */}
        <div
          ref={scrollRef}
          className="min-h-[280px] max-h-[400px] overflow-y-auto flex flex-col gap-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800"
        >
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex gap-3 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.from === 'bot' && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-mono text-xs font-bold text-white bg-slate-800 border border-slate-700 shadow-md">
                    ST
                  </div>
                )}

                <div className="max-w-[85%] sm:max-w-[80%]">
                  <div
                    className={
                      m.from === 'user'
                        ? 'rounded-2xl rounded-tr-xs px-4 py-3 text-xs sm:text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md'
                        : 'rounded-2xl rounded-tl-xs px-4 py-3 text-xs sm:text-sm text-slate-200 bg-slate-900/90 border border-slate-800/90 shadow-inner leading-relaxed'
                    }
                  >
                    {m.from === 'bot' ? <TypedText text={m.text} /> : m.text}
                  </div>

                  {m.from === 'bot' && m.cta && (
                    <div className="flex gap-2 mt-2.5 flex-wrap">
                      <a
                        href={profile.whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-lg text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/50 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        💬 WhatsApp Sheersh
                      </a>
                      <a
                        href={`mailto:${profile.email}?subject=Project%20Inquiry`}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 hover:bg-cyan-900/50 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        ✉️ Send Email
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Groq LPU Thinking Indicator */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold text-white bg-slate-800 border border-slate-700">
                  ST
                </div>
                <div className="rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-400 bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
                  <GroqLogo className="w-3.5 h-3.5 animate-spin" />
                  <span className="font-mono text-[11px] text-slate-300">Groq LPU is generating response...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Chip Suggestions */}
        <div className="flex flex-wrap gap-1.5 mt-5 pt-3.5 border-t border-slate-800/80">
          {chatChipSuggestions.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => respond(label)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 hover:text-orange-400 hover:border-slate-700 transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 mt-3.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            type="text"
            placeholder="Ask Groq AI anything about Sheersh..."
            className="flex-1 bg-slate-900/90 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none text-slate-100 placeholder:text-slate-500 border border-slate-800 focus:border-orange-500/50 transition-colors shadow-inner"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-xl font-mono text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:opacity-90 transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? 'Thinking...' : 'Send ➔'}
          </button>
        </form>

      </div>
    </section>
  );
}