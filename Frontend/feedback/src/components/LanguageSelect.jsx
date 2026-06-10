import { LANGS, useLangStore, useT } from '../i18n';

// Compact language switcher used in the nav bar and on the login screen.
// Persists the choice (via the store) and re-renders the whole app on change.
export default function LanguageSelect({ style }) {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  return (
    <select
      className="lang-select"
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      title={t('Language')}
      aria-label={t('Language')}
      style={{
        fontFamily: 'var(--mono)', fontSize: 11, padding: '5px 26px 5px 9px',
        border: '1px solid var(--border)', borderRadius: 999, background: 'var(--surface)',
        color: 'var(--text-2)', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%238e8b80' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 9px center',
        ...style,
      }}
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>{l.short} · {l.label}</option>
      ))}
    </select>
  );
}
