import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { fmt, fmtDate, fmtMoneyCompact as fmtMoney, fmtRelative, initials, avatarBg } from '@shared/utils';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Icon from '@shared/Icon';
import EmptyState from '../components/EmptyState';
import Drawer from '../components/Drawer';
import { useT } from '../i18n';

// NOTE: claim-taxonomy *values* (claim-type keys, reason categories, reasons,
// location options) stay in English — they are submitted to the backend and
// must match the Customer Feedback / Customer Feedback Item Select options.
const CLAIM_TYPES = [
  { key: 'Claimed',                label: 'Formal claim (credit or replacement requested)' },
  { key: 'Returns',                label: 'Return of goods' },
  { key: 'Rejected (Out of Spec)', label: 'Rejected at inspection (out of spec)' },
  { key: 'Information Only',       label: 'For information only — no credit requested' },
];

const REASONS = {
  'Quality / Disease': ['Botrytis','Dehydration','Petal blackening / falling','Advanced cut stage','Tight cut stage','Small head size','Powdery mildew','Other disease / disorder'],
  'Physical Damage':   ['Bruises / pressure damage','Broken / bent stems','Leaf blackening or yellowing','Broken heads'],
  'Wrong Specification':['Wrong variety','Wrong length','Wrong mix / product','Missing or fewer stems','Wrong sleeve / mislabelled','Wrong bunch rate'],
  'Supply & Delivery': ['Late delivery','Over supply','Order cancellation','Wrong drop point'],
  'Invoice / Commercial':['Wrong pricing','Invoice error or missing'],
  'Pest / Regulatory': ['Live pest found','KEPHIS / PHYTO rejection'],
};

const LENGTHS = ['40','42','50','52','60','62','70','72','80'];
const STEPS = ['Shipment','Affected varieties','Notes','Review & submit'];
const DEFAULT_LINE = () => ({ id: Date.now() + Math.random(), variety:'', length:'', recv:'', claimed:'', price:'', category:'', reason:'', detail:'' });

export default function Feedback() {
  const t = useT();
  const [view, setView] = useState('list'); // list | new
  const [step, setStep] = useState(0);
  const [shipment, setShipment] = useState({ invoice:'', consignment:'', shipdate:'', po:'', location:'', claimtype:'' });
  const [lines, setLines] = useState([DEFAULT_LINE()]);
  const [notes, setNotes] = useState('');
  const [submitErr, setSubmitErr] = useState(null);
  const [submitOk, setSubmitOk] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { ctx, data, loadList, loadDetail, detail, setDetail, submitClaim, loadOverview } = useStore();

  useEffect(() => { if (data.feedback.rows == null) loadList('feedback'); }, []);

  function totalStems(){ return lines.reduce((a,l)=>a+(parseInt(l.claimed)||0),0); }
  function totalCost(){ return lines.reduce((a,l)=>a+((parseFloat(l.claimed)||0)*(parseFloat(l.price)||0)),0); }

  function startNew(){ setView('new'); setStep(0); setShipment({ invoice:'', consignment:'', shipdate:'', po:'', location:'', claimtype:'' }); setLines([DEFAULT_LINE()]); setNotes(''); setSubmitErr(null); setSubmitOk(null); }

  function validateShipment(){
    if (!shipment.invoice || !shipment.shipdate || !shipment.location || !shipment.claimtype) return t('Please complete invoice, shipment date, location, and claim type.');
    return null;
  }
  function validateLines(){
    for (const l of lines) {
      if (!l.variety || !l.length || !l.claimed || !l.category || !l.reason) return t('Each variety row needs variety, length, claimed stems, category, and reason.');
    }
    return null;
  }

  function next(){
    setSubmitErr(null);
    if (step === 0) { const e = validateShipment(); if (e) return setSubmitErr(e); }
    if (step === 1) { const e = validateLines(); if (e) return setSubmitErr(e); }
    setStep(step + 1);
  }
  function back(){ setStep(Math.max(0, step - 1)); setSubmitErr(null); }

  async function submit(){
    setSubmitting(true); setSubmitErr(null);
    try {
      const payload = {
        invoice_number: shipment.invoice,
        consignment_number: shipment.consignment,
        po_number: shipment.po,
        shipment_date: shipment.shipdate,
        control_point: shipment.location,
        claim_type: shipment.claimtype,
        total_stems_claimed: totalStems(),
        total_claim_cost: totalCost(),
        currency: ctx?.currency || 'USD',
        additional_description: notes,
        contact_name: ctx?.full_name,
        contact_email: ctx?.user,
        claim_items: lines.map((l) => ({
          variety: l.variety,
          stem_length: l.length,
          stems_received: parseInt(l.recv) || 0,
          stems_claimed: parseInt(l.claimed) || 0,
          price_per_stem: parseFloat(l.price) || 0,
          claim_cost: (parseFloat(l.claimed)||0) * (parseFloat(l.price)||0),
          reason_category: l.category,
          reason: l.reason,
          description: l.detail,
        })),
      };
      const r = await submitClaim(payload);
      setSubmitOk({ name: r?.name || 'CF-—', status: r?.status || 'Submitted' });
      loadList('feedback');
      loadOverview();
    } catch (e) {
      setSubmitErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function updateLine(id, field, value){
    setLines(lines.map((l) => l.id === id ? { ...l, [field]: value } : l));
  }

  if (submitOk) return (
    <Card>
      <div className="success-wrap">
        <div className="success-mark"><Icon name="check" /></div>
        <div className="success-title">{t('Your claim has been received')}</div>
        <div className="success-text">
          {t("We've logged your claim and our team will respond within one business day. Track the status here in your portal at any time.")}
        </div>
        <div className="ref-box">
          <div className="ref-label">{t('Reference')}</div>
          <div className="ref-number">{submitOk.name}</div>
          <div className="ref-hint">{t('Quote in all follow-up')}</div>
        </div>
        <div className="action-row" style={{ justifyContent:'center', borderTop:'none' }}>
          <button className="btn btn-secondary" onClick={() => { setSubmitOk(null); setView('list'); }}>
            <Icon name="list" /> {t('Back to feedback')}
          </button>
          <button className="btn btn-primary" onClick={() => { setSubmitOk(null); startNew(); }}>
            <Icon name="add" /> {t('File another')}
          </button>
        </div>
      </div>
    </Card>
  );

  if (view === 'list') return <FeedbackList rows={data.feedback.rows} err={data.feedback.err} onNew={startNew} loadDetail={loadDetail} detail={detail} setDetail={setDetail} />;

  // Wizard view
  return (
    <>
      <div className="step-nav">
        {STEPS.map((label, i) => (
          <div key={i} className="sn-step">
            <div className={`sn-circle ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <div className={`sn-label ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>{t(label)}</div>
            {i < STEPS.length - 1 && <div className="sn-line" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card title={t('Shipment details')} sub={t('Tell us about the consignment')}>
          <div className="grid2">
            <div className="fg"><label className="fl">{t('Invoice / consignment ref')}<span className="req">*</span></label>
              <input className="fc" placeholder="e.g. PO 187016" value={shipment.invoice} onChange={(e) => setShipment({...shipment, invoice: e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('Consignment number')}</label>
              <input className="fc" placeholder="e.g. 54721" value={shipment.consignment} onChange={(e) => setShipment({...shipment, consignment: e.target.value})} /></div>
          </div>
          <div className="grid2">
            <div className="fg"><label className="fl">{t('Shipment date')}<span className="req">*</span></label>
              <input className="fc" type="date" value={shipment.shipdate} onChange={(e) => setShipment({...shipment, shipdate: e.target.value})} /></div>
            <div className="fg"><label className="fl">{t('Your PO number')}</label>
              <input className="fc" placeholder={t('Optional')} value={shipment.po} onChange={(e) => setShipment({...shipment, po: e.target.value})} /></div>
          </div>
          <div className="grid2">
            <div className="fg"><label className="fl">{t('Where was the issue found')}<span className="req">*</span></label>
              <select className="fc" value={shipment.location} onChange={(e) => setShipment({...shipment, location: e.target.value})}>
                <option value="">{t('Select…')}</option>
                <option>Airport</option><option>Market</option><option>KEPHIS</option><option>Other</option>
              </select></div>
            <div className="fg"><label className="fl">{t('Claim type')}<span className="req">*</span></label>
              <select className="fc" value={shipment.claimtype} onChange={(e) => setShipment({...shipment, claimtype: e.target.value})}>
                <option value="">{t('Select…')}</option>
                {CLAIM_TYPES.map((ct) => <option key={ct.key} value={ct.key}>{ct.label}</option>)}
              </select></div>
          </div>
          {submitErr && <div className="alert alert-err"><Icon name="error" />{submitErr}</div>}
          <div className="action-row">
            <button className="btn btn-secondary" onClick={() => setView('list')}><Icon name="arrow_back" /> {t('Cancel')}</button>
            <div className="spacer" />
            <button className="btn btn-primary" onClick={next}>{t('Continue')} <Icon name="arrow_forward" /></button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card title={t('Affected varieties')} sub={t('One row per variety')}>
          {lines.map((l, i) => (
            <div className="claim-line" key={l.id}>
              <div className="cl-head">
                <span className="cl-badge">{t('Variety')} {i+1}</span>
                {lines.length > 1 && <button className="cl-remove" onClick={() => setLines(lines.filter((x) => x.id !== l.id))}><Icon name="close" /></button>}
              </div>
              <div className="grid2">
                <div className="fg"><label className="fl">{t('Variety name')}<span className="req">*</span></label>
                  <input className="fc" placeholder="e.g. Julieta Cerise" value={l.variety} onChange={(e) => updateLine(l.id, 'variety', e.target.value)} /></div>
                <div className="fg"><label className="fl">{t('Stem length')}<span className="req">*</span></label>
                  <select className="fc" value={l.length} onChange={(e) => updateLine(l.id, 'length', e.target.value)}>
                    <option value="">{t('Select…')}</option>
                    {LENGTHS.map((x) => <option key={x} value={x}>{x} cm</option>)}
                  </select></div>
              </div>
              <div className="grid3">
                <div className="fg"><label className="fl">{t('Stems received')}</label>
                  <input className="fc" type="number" min={0} value={l.recv} onChange={(e) => updateLine(l.id, 'recv', e.target.value)} /></div>
                <div className="fg"><label className="fl">{t('Stems claimed')}<span className="req">*</span></label>
                  <input className="fc" type="number" min={0} value={l.claimed} onChange={(e) => updateLine(l.id, 'claimed', e.target.value)} /></div>
                <div className="fg"><label className="fl">{t('Price per stem')}</label>
                  <input className="fc" type="number" step="0.001" min={0} value={l.price} onChange={(e) => updateLine(l.id, 'price', e.target.value)} /></div>
              </div>
              <div className="grid2">
                <div className="fg"><label className="fl">{t('Reason category')}<span className="req">*</span></label>
                  <select className="fc" value={l.category} onChange={(e) => { updateLine(l.id, 'category', e.target.value); updateLine(l.id, 'reason', ''); }}>
                    <option value="">{t('Select category…')}</option>
                    {Object.keys(REASONS).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                <div className="fg"><label className="fl">{t('Specific reason')}<span className="req">*</span></label>
                  <select className="fc" value={l.reason} onChange={(e) => updateLine(l.id, 'reason', e.target.value)} disabled={!l.category}>
                    <option value="">{t('Select reason…')}</option>
                    {(REASONS[l.category] || []).map((r) => <option key={r} value={r}>{r}</option>)}
                  </select></div>
              </div>
              <div className="fg"><label className="fl">{t('Additional detail')}</label>
                <input className="fc" placeholder={t('Optional')} value={l.detail} onChange={(e) => updateLine(l.id, 'detail', e.target.value)} /></div>
            </div>
          ))}
          <button className="add-line-btn" onClick={() => setLines([...lines, DEFAULT_LINE()])}>
            <Icon name="add" /> {t('Add another variety')}
          </button>
          {submitErr && <div className="alert alert-err"><Icon name="error" />{submitErr}</div>}
          <div className="action-row">
            <button className="btn btn-secondary" onClick={back}><Icon name="arrow_back" /> {t('Back')}</button>
            <div className="spacer" />
            <span className="help">{lines.length} {lines.length === 1 ? t('row') : t('rows')} · {totalStems()} {t('stems')} · {fmtMoney(totalCost(), ctx?.currency)}</span>
            <button className="btn btn-primary" onClick={next}>{t('Continue')} <Icon name="arrow_forward" /></button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card title={t('Notes')} sub={t('Anything else we should know? (optional)')}>
          <div className="fg">
            <label className="fl">{t('Description')}</label>
            <textarea className="fc" rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('Tell us more…')} />
            <div className="fg-help">{t('You can add more detail after submission by posting a message on the claim.')}</div>
          </div>
          <div className="action-row">
            <button className="btn btn-secondary" onClick={back}><Icon name="arrow_back" /> {t('Back')}</button>
            <div className="spacer" />
            <button className="btn btn-primary" onClick={next}>{t('Review')} <Icon name="arrow_forward" /></button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card title={t('Review & submit')} sub={t('Make sure everything looks right')}>
          <div className="summary-row"><span className="sr-label">{t('Invoice')}</span><span className="sr-value mono">{shipment.invoice}</span></div>
          {shipment.consignment && <div className="summary-row"><span className="sr-label">{t('Consignment')}</span><span className="sr-value mono">{shipment.consignment}</span></div>}
          <div className="summary-row"><span className="sr-label">{t('Shipment date')}</span><span className="sr-value">{shipment.shipdate}</span></div>
          {shipment.po && <div className="summary-row"><span className="sr-label">{t('Your PO')}</span><span className="sr-value mono">{shipment.po}</span></div>}
          <div className="summary-row"><span className="sr-label">{t('Where found')}</span><span className="sr-value">{shipment.location}</span></div>
          <div className="summary-row"><span className="sr-label">{t('Claim type')}</span><span className="sr-value">{CLAIM_TYPES.find((ct) => ct.key === shipment.claimtype)?.label}</span></div>

          <div className="divider" />
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{t('Varieties')} ({lines.length})</div>
          {lines.map((l) => (
            <div className="summary-row" key={l.id}>
              <span className="sr-label" style={{ minWidth: 200, fontFamily:'inherit', textTransform:'none', letterSpacing:0, fontSize: 13 }}>
                {l.variety} · {l.length}cm
                <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{l.reason}{l.detail ? ` — ${l.detail}` : ''}</div>
              </span>
              <span className="sr-value">{l.claimed} {t('stems')} · {fmtMoney((parseFloat(l.claimed)||0)*(parseFloat(l.price)||0), ctx?.currency)}</span>
            </div>
          ))}
          <div className="summary-row" style={{ borderTop: '1.5px solid var(--text)', paddingTop: 10, marginTop: 4 }}>
            <span className="sr-label" style={{ fontWeight: 600, color: 'var(--text)' }}>{t('Total')}</span>
            <span className="sr-value" style={{ fontSize: 15 }}>{totalStems()} {t('stems')} · {fmtMoney(totalCost(), ctx?.currency)}</span>
          </div>
          {notes && <><div className="divider" /><div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: 'var(--text-2)' }}>{notes}</div></>}
          {submitErr && <div className="alert alert-err"><Icon name="error" />{submitErr}</div>}
          <div className="action-row">
            <button className="btn btn-secondary" onClick={back}><Icon name="arrow_back" /> {t('Edit')}</button>
            <div className="spacer" />
            <button className="btn btn-primary" onClick={submit} disabled={submitting}>
              <Icon name="send" />{submitting ? t('Submitting…') : t('Submit claim')}
            </button>
          </div>
        </Card>
      )}
    </>
  );
}

function FeedbackList({ rows, err, onNew, loadDetail, detail, setDetail }) {
  const t = useT();
  if (rows == null) return <div className="loading">{t('Loading feedback')}</div>;
  if (err) return <div className="alert alert-err"><Icon name="error" />{err}</div>;

  return (
    <>
      <Card
        title={t('Your feedback')}
        sub={`${rows.length} ${rows.length === 1 ? t('record') : t('records')}`}
        action={<button className="btn btn-primary" onClick={onNew}><Icon name="add" /> {t('File a claim')}</button>}
        flush
      >
        {rows.length ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>{t('Ref')}</th><th>{t('Date')}</th><th>{t('Type')}</th><th>{t('Invoice')}</th><th>{t('Status')}</th><th className="right">{t('Stems')}</th><th className="right">{t('Cost')}</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} className="clickable" onClick={() => loadDetail(r.name)}>
                    <td className="id">{r.name}</td>
                    <td className="id">{fmtDate(r.feedback_date)}</td>
                    <td>{r.feedback_type || '—'}</td>
                    <td className="id">{r.invoice_number || '—'}</td>
                    <td><Badge value={r.status} /></td>
                    <td className="num">{fmt(r.total_stems_claimed)}</td>
                    <td className="num">{r.total_claim_cost ? fmtMoney(r.total_claim_cost, r.currency) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="check_circle" title={t('No feedback on file')} hint={t("If something went wrong with a shipment, file a claim above and we'll respond within 24 hours.")} />
        )}
      </Card>

      <Drawer open={!!detail} title={detail?.name} sub={t('Feedback')} onClose={() => setDetail(null)}>
        {detail?.loading && <div className="loading">{t('Loading')}</div>}
        {detail?.err && <div className="alert alert-err"><Icon name="error" />{detail.err}</div>}
        {detail?.doc && <FeedbackDoc d={detail.doc} messages={detail.messages} name={detail.name} />}
      </Drawer>
    </>
  );
}

function FeedbackDoc({ d, messages, name }) {
  const t = useT();
  return (
    <>
      <div className="summary-row"><span className="sr-label">{t('Status')}</span><span className="sr-value"><Badge value={d.status} /></span></div>
      <div className="summary-row"><span className="sr-label">{t('Type')}</span><span className="sr-value">{d.feedback_type}</span></div>
      <div className="summary-row"><span className="sr-label">{t('Filed')}</span><span className="sr-value">{fmtDate(d.feedback_date)}</span></div>
      {d.invoice_number && <div className="summary-row"><span className="sr-label">{t('Invoice ref')}</span><span className="sr-value mono">{d.invoice_number}</span></div>}
      {d.sales_invoice && <div className="summary-row"><span className="sr-label">{t('Sales invoice')}</span><span className="sr-value mono">{d.sales_invoice}</span></div>}
      {d.consignment_number && <div className="summary-row"><span className="sr-label">{t('Consignment')}</span><span className="sr-value mono">{d.consignment_number}</span></div>}
      {d.claim_type && <div className="summary-row"><span className="sr-label">{t('Claim type')}</span><span className="sr-value">{d.claim_type}</span></div>}
      {d.total_stems_claimed ? <div className="summary-row"><span className="sr-label">{t('Stems')}</span><span className="sr-value">{fmt(d.total_stems_claimed)}</span></div> : null}
      {d.total_claim_cost ? <div className="summary-row"><span className="sr-label">{t('Claim cost')}</span><span className="sr-value">{fmtMoney(d.total_claim_cost, d.currency)}</span></div> : null}
      {d.credit_note && <div className="summary-row"><span className="sr-label">{t('Credit note')}</span><span className="sr-value mono">{d.credit_note}</span></div>}
      {d.rating ? <div className="summary-row"><span className="sr-label">{t('Rating')}</span><span className="sr-value">{d.rating} / 5</span></div> : null}

      {Array.isArray(d.claim_items) && d.claim_items.length > 0 && (
        <>
          <div className="divider" />
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>{t('Varieties')}</div>
          {d.claim_items.map((it, i) => (
            <div className="claim-line" key={i} style={{ background: 'var(--surface)' }}>
              <div className="cl-head">
                <span className="cl-badge">{it.variety} · {it.stem_length}cm</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
                <strong>{fmt(it.stems_claimed)}</strong> {t('claimed of')} <strong>{fmt(it.stems_received)}</strong> {t('received')} — {it.reason || '—'}
              </div>
              {it.description && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>{it.description}</div>}
            </div>
          ))}
        </>
      )}

      {d.feedback_text && (
        <>
          <div className="divider" />
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: 'var(--text-2)' }}>{d.feedback_text}</div>
        </>
      )}
      {d.additional_description && (
        <>
          <div className="divider" />
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: 'var(--text-2)' }}>{d.additional_description}</div>
        </>
      )}

      <div className="divider" />
      <Thread messages={messages} name={name} />
    </>
  );
}

function Thread({ messages, name }) {
  const { ctx, postMessage } = useStore();
  const t = useT();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState(null);

  async function send() {
    if (!body.trim()) { setErr(t('Please write a message before sending.')); return; }
    setSending(true); setErr(null);
    try {
      await postMessage(name, body);
      setBody('');
    } catch (e) { setErr(e.message); }
    finally { setSending(false); }
  }

  return (
    <>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
        {t('Conversation')}
      </div>
      {messages == null ? (
        <div className="loading">{t('Loading')}</div>
      ) : messages.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 12 }}>{t('No messages yet. Add a note below and our team will be notified.')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {messages.map((m) => {
            const who = m.sender_full_name || m.sender || 'Upande';
            return (
              <div key={m.name} style={{ display: 'flex', gap: 10 }}>
                <div className="msg-av" style={{ background: avatarBg(who), flexShrink: 0 }}>{initials(who)}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                    {who} <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 6 }}>{fmtRelative(m.communication_date)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)' }} dangerouslySetInnerHTML={{ __html: m.content || '' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="fg">
        <textarea className="fc" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t('Add a message to your feedback…')} />
      </div>
      {err && <div className="alert alert-err"><Icon name="error" />{err}</div>}
      <div className="action-row" style={{ marginTop: 0, paddingTop: 0, border: 'none' }}>
        <span className="help">{t('From:')} {ctx?.full_name}</span>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={send} disabled={sending}>
          <Icon name="send" />{sending ? t('Sending…') : t('Post message')}
        </button>
      </div>
    </>
  );
}
