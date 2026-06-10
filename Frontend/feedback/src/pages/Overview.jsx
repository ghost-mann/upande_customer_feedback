import { useStore } from '../store';
import { fmt, fmtMoneyCompact as fmtMoney, fmtDate } from '@shared/utils';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Icon from '@shared/Icon';
import EmptyState from '../components/EmptyState';
import { useT } from '../i18n';

const KPI_DEFS = [
  { key: 'open_feedback', label: 'Open feedback', sub: 'Awaiting response', page: 'feedback',     icon: 'report' },
  { key: 'open_claims',   label: 'Open claims',   sub: 'In review',         page: 'feedback',     icon: 'gavel' },
  { key: 'resolved',      label: 'Resolved',      sub: 'Closed items',      page: 'feedback',     icon: 'task_alt' },
  { key: 'credit_notes',  label: 'Credit notes',  sub: 'Issued to you',     page: 'credit_notes', icon: 'request_quote' },
];

export default function Overview() {
  const { data, setPage, loadDetail } = useStore();
  const t = useT();
  const ov = data.overview;

  if (!ov) return <div className="loading">{t('Loading')}</div>;
  if (ov.error) return <div className="alert alert-err"><Icon name="error" />{ov.error}</div>;

  return (
    <>
      <div className="kpis">
        {KPI_DEFS.map((d) => (
          <div className="kpi" key={d.key} onClick={() => setPage(d.page)}>
            <div className="kpi-lbl">{t(d.label)}</div>
            <div className="kpi-val">{fmt(ov.kpis?.[d.key] || 0)}</div>
            <div className="kpi-sub">{t(d.sub)}</div>
          </div>
        ))}
      </div>

      <div className="grid g2">
        <Card
          title={t('Recent feedback')}
          sub={t('Last 5')}
          action={<a className="btn btn-secondary" onClick={() => setPage('feedback')}>{t('View all')} <Icon name="arrow_forward" /></a>}
          flush
        >
          {ov.recent_feedback?.length ? (
            <table className="tbl">
              <thead><tr><th>{t('Ref')}</th><th>{t('Date')}</th><th>{t('Type')}</th><th>{t('Status')}</th></tr></thead>
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
          ) : <EmptyState icon="check_circle" title={t('No feedback yet')} />}
        </Card>

        <Card
          title={t('Recent credit notes')}
          sub={t('Last 5')}
          action={<a className="btn btn-secondary" onClick={() => setPage('credit_notes')}>{t('View all')} <Icon name="arrow_forward" /></a>}
          flush
        >
          {ov.recent_credit_notes?.length ? (
            <table className="tbl">
              <thead><tr><th>{t('Credit note')}</th><th>{t('Date')}</th><th>{t('Status')}</th><th className="right">{t('Amount')}</th></tr></thead>
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
          ) : <EmptyState icon="request_quote" title={t('No credit notes yet')} />}
        </Card>
      </div>
    </>
  );
}
