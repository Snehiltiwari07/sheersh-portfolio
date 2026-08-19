import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { chatChipSuggestions, classifyQuery, fallbackResponse, profile } from '../data/profile';

let idCounter = 0;
const nextId = () => ++idCounter;

function TypedText({ text }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, 10);
    return () => clearInterval(iv);
  }, [text]);
  return <>{shown}</>;
}

function ctaMailto(subject, body) {
  return `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function ChatEngine() {
  const [messages, setMessages] = useState([
    { id: nextId(), from: 'bot', text: "I can talk rates, availability, SQL optimization, or project scoping. Ask away!", cta: false },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const respond = (userText) => {
    setMessages((m) => [...m, { id: nextId(), from: 'user', text: userText }]);
    setTimeout(() => {
      const intent = classifyQuery(userText);
      const { text, cta } = intent || fallbackResponse;
      setMessages((m) => [...m, { id: nextId(), from: 'bot', text, cta }]);
    }, 350);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = input.trim();
    if (!val) return;
    respond(val);
    setInput('');
  };

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <p className="cmd-label justify-center flex">ask_sheersh.exe --intelligent</p>
      <h2 className="font-display font-bold text-2xl sm:text-3xl text-center mt-2 text-ink">
        Ask Me Anything — Hiring, Tech Stack, or Work
      </h2>

      <div ref={scrollRef} className="glass rounded-2xl mt-8 p-5 md:p-6 min-h-[220px] max-h-[440px] overflow-y-auto flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.from === 'user' ? 'justify-end' : ''}`}
            >
              {m.from === 'bot' && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-xs text-white grad-bg">S</div>
              )}
              <div className="max-w-[85%]">
                <div className={m.from === 'user' 
                  ? 'rounded-xl rounded-tr-none px-4 py-3 text-sm text-white grad-bg' 
                  : 'glass rounded-xl rounded-tl-none px-4 py-3 text-sm leading-relaxed text-ink border border-line'}>
                  {m.from === 'bot' ? <TypedText text={m.text} /> : m.text}
                </div>
                {m.from === 'bot' && m.cta && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <a href={ctaMailto('15-Min Strategy Call', "Hi Sheersh, I'd like to book a call to discuss a project.")} className="chip px-3 py-1.5 rounded-full text-[11px]">
                      📅 Book Strategy Call
                    </a>
                    <a href={ctaMailto('Project Inquiry', '')} className="chip px-3 py-1.5 rounded-full text-[11px]">
                      ✉️ Send Direct Email
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {chatChipSuggestions.map((label) => (
          <button key={label} onClick={() => respond(label)} className="chip px-3.5 py-2 rounded-full">
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          placeholder="e.g. Are you available for US clients? What is your tech stack?"
          className="flex-1 glass rounded-full px-5 py-3 text-sm outline-none text-ink placeholder:text-muted border border-line"
        />
        <button type="submit" className="px-6 py-3 rounded-full font-mono text-sm text-white shrink-0 grad-bg">Send</button>
      </form>
    </section>
  );
}