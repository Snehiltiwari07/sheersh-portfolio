import { lazy, Suspense, useState } from 'react';
import Portfolio from './components/Portfolio';
import ChatEngine from './components/ChatEngine';
import WhatsAppButton from './components/WhatsAppButton';
import SearchContentPage, { NotFoundPage } from './components/SearchContentPage';
import { getSearchPage, normalizePath } from './data/searchPages';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
const HireDrawer = lazy(() => import('./components/HireDrawer'));

export default function App({ path = typeof window === 'undefined' ? '/' : window.location.pathname }) {
  const [hireOpen, setHireOpen] = useState(false);
  const [hireRequested, setHireRequested] = useState(false);
  const openHire = () => { setHireRequested(true); setHireOpen(true); };
  const page = getSearchPage(path);
  if (normalizePath(path) !== '/' && !page) return <NotFoundPage />;
  return <>
    {page ? <SearchContentPage page={page} onOpenHireDrawer={openHire} /> : <Portfolio onOpenHireDrawer={openHire} />}
    <ChatEngine onOpenHireDrawer={openHire} />
    <WhatsAppButton />
    {hireRequested && <Suspense fallback={<div className="enquiry-loading" role="status">Opening your project brief…</div>}>
      <HireDrawer open={hireOpen} onClose={() => setHireOpen(false)} />
    </Suspense>}
    <SpeedInsights /><Analytics />
  </>;
}
