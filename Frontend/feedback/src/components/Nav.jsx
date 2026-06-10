import { initials, shortUser } from '@shared/utils';
import Logo from '@shared/Logo';
import { api } from '@shared/api';
import { useT } from '../i18n';
import LanguageSelect from './LanguageSelect';

export default function Nav({ ctx }) {
  const t = useT();
  async function onLogout() {
    try { await api('logout', {}); } catch (e) {}
    // Back to the portal's own login screen — never the ERP login.
    window.location.href = '/customer-feedback';
  }
  return (
    <nav className="nav">
      <a href="/customer-feedback" className="brand">
        <div className="brand-mark"><Logo /></div>
        <b>Upande</b>
      </a>
      <div className="brand-sub">{t('Feedback portal')}</div>
      <div className="nav-right">
        <LanguageSelect />
        {ctx?.user && (
          <div className="user-chip" title={ctx.user}>
            <div className="av">{initials(ctx.full_name || ctx.user)}</div>
            <span>{ctx.full_name || shortUser(ctx.user)}</span>
            <span className="logout" onClick={onLogout}>{t('Sign out')}</span>
          </div>
        )}
      </div>
    </nav>
  );
}
