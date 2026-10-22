import { useEffect, useState } from 'react';
import { profile } from '../data/profile';
export default function WhatsAppButton({ placement = 'floating' }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (placement !== 'floating') return;
    const header = document.querySelector('.site-header');
    if (!header) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting));
    observer.observe(header);
    return () => observer.disconnect();
  }, [placement]);
  const floating = placement === 'floating';
  return <a className={floating ? `whatsapp-contact whatsapp-orb${visible ? ' is-visible' : ''}` : 'header-whatsapp'} href={profile.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Connect with Sheersh on WhatsApp (opens in a new tab)" aria-hidden={floating && !visible ? true : undefined} tabIndex={floating && !visible ? -1 : undefined}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M20.5 11.8a8.5 8.5 0 01-12.6 7.5L3 20.8l1.5-4.7A8.5 8.5 0 1120.5 11.8z"/><path d="M8.2 7.6c.3-.2.7-.1.9.2l1 1.5c.1.3.1.5-.1.7l-.6.7c.7 1.3 1.6 2.2 3 2.9l.7-.7c.2-.2.5-.2.7-.1l1.6.9c.3.2.4.6.2.9-.6 1.1-1.4 1.4-2.5 1-3.3-1.1-5.3-3.1-6.2-6.2-.3-.9.3-1.5 1.3-1.8z"/></svg>
    {floating ? <span className="whatsapp-tooltip">Message Sheersh <span aria-hidden="true">↗</span></span> : <><span>WhatsApp</span><span className="whatsapp-arrow" aria-hidden="true">↗</span></>}
  </a>;
}
