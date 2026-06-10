import { useState } from 'react';
import { login, requestPasswordReset } from '@shared/api';
import Logo from '@shared/Logo';
import Icon from '@shared/Icon';
import { useT } from '../i18n';
import LanguageSelect from './LanguageSelect';

// Standalone, portal-branded sign-in. Customers authenticate here without ever
// seeing the Frappe/ERP login page. Includes a self-service "forgot password"
// flow that calls Frappe's guest reset endpoint.
export default function Login() {
  const t = useT();
  const [view, setView] = useState('signin'); // signin | forgot | sent
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  function go(next) { setErr(null); setView(next); }

  async function submit(e) {
    e?.preventDefault();
    if (!email.trim() || !pwd) { setErr(t('Enter your email and password.')); return; }
    setBusy(true); setErr(null);
    try {
      await login(email.trim(), pwd);
      // Re-boot the page authenticated → the SPA loads the portal.
      window.location.href = '/customer-feedback';
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  async function sendReset(e) {
    e?.preventDefault();
    if (!email.trim()) { setErr(t('Enter your email and password.')); return; }
    setBusy(true); setErr(null);
    try {
      await requestPasswordReset(email.trim());
      setView('sent'); // generic confirmation — never reveals whether the account exists
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ position: 'absolute', top: 18, right: 18 }}>
        <LanguageSelect />
      </div>
      <div style={{ width: 'min(400px, 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 22 }}>
          <div className="brand-mark" style={{ width: 40, height: 40, fontSize: 15 }}><Logo /></div>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, lineHeight: 1.1 }}>Upande</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 2 }}>{t('Feedback portal')}</div>
          </div>
        </div>

        {view === 'signin' && (
          <form className="card" onSubmit={submit} style={{ padding: 0 }}>
            <div className="card-hd">
              <div>
                <div className="card-title">{t('Sign in')}</div>
                <div className="card-sub">{t('Quality claims · feedback · credit notes')}</div>
              </div>
            </div>
            <div className="card-body">
              <div className="fg">
                <label className="fl">{t('Email')}</label>
                <input
                  className="fc"
                  type="email"
                  autoFocus
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourcompany.com"
                />
              </div>
              <div className="fg">
                <label className="fl">{t('Password')}</label>
                <input
                  className="fc"
                  type="password"
                  autoComplete="current-password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {err && <div className="alert alert-err"><Icon name="error" />{err}</div>}

              <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>
                <Icon name="login" />{busy ? t('Signing in…') : t('Sign in')}
              </button>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <a className="nav-link" style={{ color: 'var(--accent)', cursor: 'pointer', fontSize: 12.5 }} onClick={() => go('forgot')}>
                  {t('Forgot password?')}
                </a>
              </div>

              <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11.5, color: 'var(--text-3)' }}>
                {t('Trouble signing in? Email')} <a href="mailto:support@upande.com" style={{ color: 'var(--accent)' }}>support@upande.com</a>
              </div>
            </div>
          </form>
        )}

        {view === 'forgot' && (
          <form className="card" onSubmit={sendReset} style={{ padding: 0 }}>
            <div className="card-hd">
              <div>
                <div className="card-title">{t('Reset your password')}</div>
                <div className="card-sub">{t("Enter your email and we'll send you a reset link.")}</div>
              </div>
            </div>
            <div className="card-body">
              <div className="fg">
                <label className="fl">{t('Email')}</label>
                <input
                  className="fc"
                  type="email"
                  autoFocus
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourcompany.com"
                />
              </div>

              {err && <div className="alert alert-err"><Icon name="error" />{err}</div>}

              <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>
                <Icon name="mail" />{busy ? t('Sending…') : t('Send reset link')}
              </button>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <a className="nav-link" style={{ color: 'var(--accent)', cursor: 'pointer', fontSize: 12.5 }} onClick={() => go('signin')}>
                  <Icon name="arrow_back" style={{ fontSize: 13, verticalAlign: '-2px' }} /> {t('Back to sign in')}
                </a>
              </div>
            </div>
          </form>
        )}

        {view === 'sent' && (
          <div className="card" style={{ padding: 0 }}>
            <div className="card-body">
              <div className="success-wrap" style={{ padding: '32px 20px' }}>
                <div className="success-mark"><Icon name="mark_email_read" /></div>
                <div className="success-title">{t('Check your email')}</div>
                <div className="success-text">{t('If an account exists for that email, a reset link is on its way.')}</div>
                <button className="btn btn-secondary" onClick={() => go('signin')}>
                  <Icon name="arrow_back" /> {t('Back to sign in')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
