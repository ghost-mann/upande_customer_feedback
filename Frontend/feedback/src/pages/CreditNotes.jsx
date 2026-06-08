import { useEffect } from 'react';
import { useStore } from '../store';
import { fmtDate, fmtMoneyCompact as fmtMoney } from '@shared/utils';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Icon from '@shared/Icon';
import EmptyState from '../components/EmptyState';

export default function CreditNotes() {
  const { data, loadList } = useStore();
  useEffect(() => { if (data.credit_notes.rows == null) loadList('credit_notes'); }, []);
  const { rows, err } = data.credit_notes;

  if (rows == null) return <div className="loading">Loading credit notes</div>;
  if (err) return <div className="alert alert-err"><Icon name="error" />{err}</div>;

  return (
    <Card
      title="Credit notes"
      sub={`${rows.length} credit note${rows.length === 1 ? '' : 's'} on file`}
      flush
    >
      {rows.length ? (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Credit note</th>
                <th>Date</th>
                <th>Against invoice</th>
                <th>PO</th>
                <th>Status</th>
                <th className="right">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td className="id">{r.name}</td>
                  <td className="id">{fmtDate(r.posting_date)}</td>
                  <td className="id">{r.return_against || '—'}</td>
                  <td className="id">{r.po_no || '—'}</td>
                  <td><Badge value={r.status} /></td>
                  <td className="num">{fmtMoney(r.grand_total, r.currency)}</td>
                  <td className="right">
                    <a
                      className="btn btn-secondary"
                      style={{ height: 26, padding: '0 10px', fontSize: 11.5 }}
                      href={`/api/method/frappe.utils.print_format.download_pdf?doctype=Sales+Invoice&name=${encodeURIComponent(r.name)}&format=Standard&no_letterhead=0`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon name="download" /> PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon="request_quote"
          title="No credit notes yet"
          hint="Credit notes issued to resolve your claims will appear here."
        />
      )}
    </Card>
  );
}
