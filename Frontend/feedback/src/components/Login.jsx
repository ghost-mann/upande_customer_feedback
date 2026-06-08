import { useState } from 'react';
import { login } from '@shared/api';
import Logo from '@shared/Logo';
import Icon from '@shared/Icon';

// Standalone, portal-branded sign-in. Customers authenticate here without ever
// seeing the Frappe/ERP login page.
export default function Login() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function submit(e) {
    e?.preventDefault();
    if (!email.trim() || !pwd) { setErr('Enter your email and password.'); return; }
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ width: 'min(400px, 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 22 }}>
          <div className="brand-mark" style={{ width: 40, height: 40, fontSize: 15 }}><Logo /></div>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, lineHeight: 1.1 }}>Upande</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 2 }}>Feedback portal</div>
          </div>
        </div>

        <form className="card" onSubmit={submit} style={{ padding: 0 }}>
          <div className="card-hd">
            <div>
              <div className="card-title">Sign in</div>
              <div className="card-sub">Quality claims · feedback · credit notes</div>
            </div>
          </div>
          <div className="card-body">
            <div className="fg">
              <label className="fl">Email</label>
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
              <label className="fl">Password</label>
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
              <Icon name="login" />{busy ? 'Signing in…' : 'Sign in'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11.5, color: 'var(--text-3)' }}>
              Trouble signing in? Email <a href="mailto:support@upande.com" style={{ color: 'var(--accent)' }}>support@upande.com</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
