import { useStore } from '../store';
import Card from '../components/Card';
import Icon from '@shared/Icon';
import { avatarBg, initials } from '@shared/utils';
import { useT } from '../i18n';

export default function Account() {
  const { ctx } = useStore();
  const t = useT();
  if (!ctx) return <div className="loading">{t('Loading account')}</div>;

  return (
    <div className="grid g21">
      <Card title={t('Company')} sub={t('Your customer account')}>
        <div className="summary-row"><span className="sr-label">{t('Customer')}</span><span className="sr-value">{ctx.customer_name}</span></div>
        <div className="summary-row"><span className="sr-label">{t('Customer ID')}</span><span className="sr-value mono">{ctx.customer}</span></div>
        <div className="summary-row"><span className="sr-label">{t('Type')}</span><span className="sr-value">{ctx.customer_type || '—'}</span></div>
        <div className="summary-row"><span className="sr-label">{t('Group')}</span><span className="sr-value">{ctx.customer_group || '—'}</span></div>
        <div className="summary-row"><span className="sr-label">{t('Territory')}</span><span className="sr-value">{ctx.territory || '—'}</span></div>
        <div className="summary-row"><span className="sr-label">{t('Currency')}</span><span className="sr-value">{ctx.currency}</span></div>
        <div className="summary-row"><span className="sr-label">{t('Payment terms')}</span><span className="sr-value">{ctx.payment_terms || '—'}</span></div>
        <div className="divider" />
        <div className="action-row" style={{ marginTop: 0, paddingTop: 0, border: 'none' }}>
          <a className="btn btn-secondary" href="mailto:support@upande.com">
            <Icon name="support" /> {t('Contact Upande support')}
          </a>
        </div>
      </Card>

      <div>
        <Card title={t('Your account manager')}>
          {ctx.manager ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: avatarBg(ctx.manager.name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 18 }}>
                {initials(ctx.manager.name)}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{ctx.manager.name}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>{ctx.manager.email}</div>
                <a className="btn btn-primary" style={{ marginTop: 10 }} href={`mailto:${ctx.manager.email}`}>
                  <Icon name="mail" /> {t('Email them')}
                </a>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
              {t('No account manager assigned yet. Reach us at')} <a href="mailto:sales@upande.com" style={{ color: 'var(--accent)' }}>sales@upande.com</a>.
            </div>
          )}
        </Card>

        <Card title={t('Signed in as')}>
          <div className="summary-row"><span className="sr-label">{t('User')}</span><span className="sr-value mono">{ctx.user}</span></div>
          <div className="summary-row"><span className="sr-label">{t('Name')}</span><span className="sr-value">{ctx.full_name}</span></div>
        </Card>
      </div>
    </div>
  );
}
