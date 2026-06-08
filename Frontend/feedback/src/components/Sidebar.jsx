import { useStore } from '../store';
import Icon from '@shared/Icon';
import { fmt } from '@shared/utils';

const NAV = [
  { group: 'Workspace', items: [
    { key: 'overview', label: 'Overview', icon: 'dashboard' },
  ]},
  { group: 'Feedback', items: [
    { key: 'feedback',    label: 'Feedback & claims', icon: 'report',   countKey: 'open_feedback' },
    { key: 'suggestions', label: 'Suggestions',       icon: 'lightbulb' },
  ]},
  { group: 'Resolutions', items: [
    { key: 'credit_notes', label: 'Credit notes', icon: 'request_quote', countKey: 'credit_notes' },
  ]},
  { group: 'Profile', items: [
    { key: 'account', label: 'Account', icon: 'badge' },
  ]},
];

export default function Sidebar() {
  const { page, setPage, data } = useStore();
  const k = data.overview?.kpis || {};

  return (
    <aside className="side">
      {NAV.map((g) => (
        <div key={g.group}>
          <div className="side-label">{g.group}</div>
          <div className="side-grp">
            {g.items.map((it) => {
              const count = it.countKey ? k[it.countKey] : null;
              return (
                <div
                  key={it.key}
                  className={`nav-item${page === it.key ? ' active' : ''}`}
                  onClick={() => setPage(it.key)}
                >
                  <Icon name={it.icon} />
                  <span>{it.label}</span>
                  {count != null && count > 0 && <span className="nav-cnt">{fmt(count)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="side-foot">Live</div>
    </aside>
  );
}
