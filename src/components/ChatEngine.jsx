import { useEffect, useRef, useState } from 'react';
import { profile } from '../data/profile';

const suggestions = ['What is कामCREW?', 'How can you help my business?', 'What do clients say about Sheersh?'];
const actions = { work: ['Explore the projects', '/#projects'], services: ['Explore services', '/#services'], about: ['Meet Sheersh', '/#about'], reviews: ['Read client reviews', '/#reviews'] };

export default function ChatEngine({ onOpenHireDrawer }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi, I’m Jiya. Ask me about Sheersh’s projects, client reviews, कामCREW, or how he could help with your next build.', mode: 'ai' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [retryQuestion, setRetryQuestion] = useState('');
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const logRef = useRef(null);
  const panelRef = useRef(null);
  const busyRef = useRef(false);
  const controllerRef = useRef(null);
  useEffect(() => () => controllerRef.current?.abort(), []);
  useEffect(() => { if (open) inputRef.current?.focus({ preventScroll: true }); }, [open]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [messages, loading, open]);
  function close() { setOpen(false); launcherRef.current?.focus(); }
  function handleKeyDown(event) {
    if (event.key === 'Escape') { event.stopPropagation(); close(); }
    if (event.key === 'Tab') {
      const nodes = [...panelRef.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled)')];
      const first = nodes[0], last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }
  async function respond(question) {
    if (!question.trim() || busyRef.current) return;
    busyRef.current = true;
    const clean = question.trim().slice(0, 1200);
    const isRetry = retryQuestion === clean && messages.at(-1)?.role === 'user' && messages.at(-1)?.content === clean;
    const history = [...messages.map(({ role, content }) => ({ role, content: content.slice(0, 1600) })), ...(isRetry ? [] : [{ role: 'user', content: clean }])].slice(-12);
    if (!isRetry) setMessages(m => [...m, { role: 'user', content: clean }]);
    setInput(''); setLoading(true); setNotice(''); setRetryQuestion('');
    let answer;
    controllerRef.current = new AbortController();
    const timer = setTimeout(() => controllerRef.current?.abort(), 12_000);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }), signal: controllerRef.current.signal });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || 'Jiya is unavailable just now. Please try again.');
      if (typeof data?.text !== 'string' || !data.text.trim()) throw new Error('Jiya received an empty reply. Please try again.');
      answer = data;
    } catch (error) {
      setNotice(error.name === 'AbortError' ? 'Groq is taking longer than expected. Please retry your question.' : error.message || 'Couldn’t connect to Jiya. Please try again.');
      setRetryQuestion(clean);
    } finally { clearTimeout(timer); }
    if (answer) setMessages(m => [...m, { role: 'assistant', content: answer.text, action: answer.action, mode: 'ai' }]);
    setLoading(false); busyRef.current = false; inputRef.current?.focus({ preventScroll: true });
  }
  return <div className="jiya">
    <button ref={launcherRef} className="jiya-launcher" aria-label={open ? 'Close Jiya' : 'Ask Jiya'} aria-expanded={open} aria-controls="jiya-panel" onClick={() => open ? close() : setOpen(true)}><img className="jiya-dog-avatar" src="/jiya-avatar.webp" alt="" width={40} height={40} /><span>{open ? 'Close' : 'Ask Jiya'}</span></button>
    {open && <section ref={panelRef} id="jiya-panel" className="jiya-panel" role="dialog" aria-modal="false" aria-labelledby="jiya-heading" onKeyDown={handleKeyDown}>
      <header className="jiya-header"><div className="jiya-identity"><img className="jiya-dog-avatar" src="/jiya-avatar.webp" alt="German Shepherd portrait for Jiya" width={44} height={44} /><div><h2 id="jiya-heading">A little help from Jiya.</h2><p>Powered by Groq · Sheersh’s AI assistant</p></div></div><button onClick={close} aria-label="Close Jiya conversation">×</button></header>
      <div ref={logRef} className="jiya-log" role="log" aria-live="polite" aria-relevant="additions" aria-busy={loading}>{messages.map((message, i) => <div key={i} className={`jiya-message ${message.role}`}><span className="jiya-speaker">{message.role === 'user' ? 'YOU' : 'JIYA'}</span><p>{message.content}</p>{message.role === 'assistant' && message.action === 'hire' && <button className="jiya-message-link" onClick={() => { close(); onOpenHireDrawer(); }}>Share a project brief ↗</button>}{message.role === 'assistant' && actions[message.action] && <a className="jiya-message-link" href={actions[message.action][1]} onClick={close}>{actions[message.action][0]} ↗</a>}</div>)}{loading && <p className="jiya-thinking" role="status">Thinking…</p>}</div>
      {notice && <div className="jiya-notice" role="status"><p>{notice}</p>{retryQuestion && <button className="jiya-message-link" disabled={loading} onClick={() => respond(retryQuestion)}>Retry question ↗</button>}</div>}
      <div className="jiya-suggestions">{suggestions.map(question => <button key={question} disabled={loading} onClick={() => respond(question)}>{question} ↗</button>)}</div>
      <form className="jiya-form" onSubmit={e => { e.preventDefault(); respond(input); }}><label className="sr-only" htmlFor="jiya-input">Your question for Jiya</label><input id="jiya-input" ref={inputRef} value={input} onChange={e => setInput(e.target.value)} maxLength={1200} placeholder="What would you like to know?" autoComplete="off" /><button type="submit" disabled={loading || !input.trim()} aria-label="Send question">↑</button></form>
      <p className="jiya-footnote">AI can make mistakes. Confirm scope directly with Sheersh. <a href={`mailto:${profile.email}`}>Email Sheersh ↗</a></p>
    </section>}
  </div>;
}
