import { useEffect } from 'react';
import { useStore } from './store';
import { getBoot } from '@shared/api';
import { useT } from './i18n';
import Nav from './components/Nav';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Icon from '@shared/Icon';

import Overview from './pages/Overview';
import Feedback from './pages/Feedback';
import Suggestions from './pages/Suggestions';
import CreditNotes from './pages/CreditNotes';
import Account from './pages/Account';

const PAGE_META = {
  overview:     { title: 'Overview',     sub: 'AT A GLANCE · YOUR FEEDBACK' },
  feedback:     { title: 'Feedback',     sub: 'CLAIMS · QUALITY · STATUS' },
  suggestions:  { title: 'Suggestions',  sub: 'IDEAS · COMPLIMENTS · FEEDBACK' },
  credit_notes: { title: 'Credit Notes', sub: 'RETURNS · RESOLUTIONS · PDF' },
  account:      { title: 'Account',      sub: 'COMPANY · MANAGER · SETTINGS' },
};

const PAGES = {
  overview: Overview,
  feedback: Feedback,
  suggestions: Suggestions,
  credit_notes: CreditNotes,
  account: Account,
};

export default function App() {
  const { page, ctx, loading, loadError, bootstrap } = useStore();
  const t = useT();
  const isGuest = getBoot().isGuest;

  useEffect(() => { if (!isGuest) bootstrap(); }, []);

  // Not signed in → the portal's own login screen (never the ERP /login).
  if (isGuest) return <Login />;

  if (loading) {
    return (
      <>
        <Nav ctx={null} />
        <div style={{ height: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading">{t('Loading your portal')}</div>
        </div>
      </>
    );
  }
  if (loadError) {
    return (
      <>
        <Nav ctx={null} />
        <div style={{ height: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 460, textAlign: 'center' }}>
            <Icon name="block" style={{ fontSize: 38, color: 'var(--text-3)' }} />
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginTop: 12, marginBottom: 8 }}>{t("Can't reach your customer record")}</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 18 }}>{loadError}</div>
            <a className="btn btn-primary" href="/login">
              <Icon name="arrow_back" /> {t('Sign in again')}
            </a>
          </div>
        </div>
      </>
    );
  }

  const meta = PAGE_META[page] || PAGE_META.overview;
  const Page = PAGES[page] || Overview;

  return (
    <>
      <Nav ctx={ctx} />
      <div className="app" style={{ height: 'calc(100vh - 56px)' }}>
        <Sidebar />
        <main className="main">
          <div className="main-hd">
            <div>
              <div className="main-title">{t(meta.title)}</div>
              <div className="main-sub">{t(meta.sub)}</div>
            </div>
            {ctx?.customer_name && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{ctx.customer_name}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {ctx.customer}
                </div>
              </div>
            )}
          </div>
          <div className="main-body">
            <Page />
          </div>
        </main>
      </div>
    </>
  );
}
