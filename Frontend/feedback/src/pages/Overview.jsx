import { useStore } from '../store';
import { fmt, fmtMoneyCompact as fmtMoney, fmtDate } from '@shared/utils';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Icon from '@shared/Icon';
import EmptyState from '../components/EmptyState';

const KPI_DEFS = [
  { key: 'open_feedback', label: 'Open feedback', sub: 'Awaiting response', page: 'feedback',     icon: 'report' },
  { key: 'open_claims',   label: 'Open claims',   sub: 'In review',         page: 'feedback',     icon: 'gavel' },
  { key: 'resolved',      label: 'Resolved',      sub: 'Closed items',      page: 'feedback',     icon: 'task_alt' },
  { key: 'credit_notes',  label: 'Credit notes',  sub: 'Issued to you',     page: 'credit_notes', icon: 'request_quote' },
];

export default function Overview() {
  const { data, setPage, loadDetail } = useStore();
  const ov = data.overview;

  if (!ov) return <div className="loading">Loading</div>;
  if (ov.error) return <div className="alert alert-err"><Icon name="error" />{ov.error}</div>;

  return (
    <>
      <div className="kpis">
        {KPI_DEFS.map((d) => (
          <div className="kpi" key={d.key} onClick={() => setPage(d.page)}>
            <div className="kpi-lbl">{d.label}</div>
            <div className="kpi-val">{fmt(ov.kpis?.[d.key] || 0)}</div>
            <div className="kpi-sub">{d.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid g2">
        <Card
          title="Recent feedback"
          sub="Last 5"
          action={<a className="btn btn-secondary" onClick={() => setPage('feedback')}>View all <Icon name="arrow_forward" /></a>}
          flush
        >
          {ov.recent_feedback?.length ? (
            <table className="tbl">
              <thead><tr><th>Ref</th><th>Date</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {ov.recent_feedback.map((r) => (
                  <tr key={r.name} className="clickable" onClick={() => { setPage('feedback'); loadDetail(r.name); }}>
                    <td className="id">{r.name}</td>
                    <td className="id">{fmtDate(r.feedback_date)}</td>
                    <td>{r.feedback_type || '—'}</td>
                    <td><Badge value={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState icon="check_circle" title="No feedback yet" />}
        </Card>

        <Card
          title="Recent credit notes"
          sub="Last 5"
          action={<a className="btn btn-secondary" onClick={() => setPage('credit_notes')}>View all <Icon name="arrow_forward" /></a>}
          flush
        >
          {ov.recent_credit_notes?.length ? (
            <table className="tbl">
              <thead><tr><th>Credit note</th><th>Date</th><th>Status</th><th className="right">Amount</th></tr></thead>
              <tbody>
                {ov.recent_credit_notes.map((r) => (
                  <tr key={r.name} className="clickable" onClick={() => setPage('credit_notes')}>
                    <td className="id">{r.name}</td>
                    <td className="id">{fmtDate(r.posting_date)}</td>
                    <td><Badge value={r.status} /></td>
                    <td className="num">{fmtMoney(r.grand_total, r.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState icon="request_quote" title="No credit notes yet" />}
        </Card>
      </div>
    </>
  );
}
