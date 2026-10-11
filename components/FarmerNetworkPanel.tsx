'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase-browser';
import { redeemReferralCode } from '@/lib/referrals';

function getRank(count: number) {
  if (count >= 25) return { rank:'LEGEND', color:'var(--gold)', next: null as string|null, toNext: 0 };
  if (count >= 10) return { rank:'ALPHA', color:'var(--brand)', next:'LEGEND', toNext: 25-count };
  if (count >= 3) return { rank:'SCOUT', color:'var(--watchlist)', next:'ALPHA', toNext: 10-count };
  return { rank:'SEED', color:'var(--text-tertiary)', next:'SCOUT', toNext: 3-count };
}

function maskEmail(email?: string) {
  if (!email) return '—';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  return `${name.slice(0,3)}***@${domain}`;
}

interface Props {
  user: any;
  userData: any;
  setUserData: (d: any) => void;
  addToast: (msg: string, type?: string) => void;
}

export default function FarmerNetworkPanel({ user, userData, setUserData, addToast }: Props) {
  const [codeInput, setCodeInput] = useState('');
  const [applying, setApplying] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const referralCount = userData?.referral_count ?? 0;
  const rankInfo = getRank(referralCount);
  const referralCode = userData?.referral_code || '—';
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${referralCode}` : '';

  useEffect(() => {
    if (!user) { setLoadingRefs(false); return; }
    (async () => {
      const sb = await getSupabase();
      if (!sb) { setLoadingRefs(false); return; }
      const { data } = await sb.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false });
      setReferrals(data || []);
      setLoadingRefs(false);
    })();
  }, [user]);

  async function handleApply() {
    if (!user || !userData || applying) return;
    setApplying(true);
    const result = await redeemReferralCode(user.id, userData.referral_code, codeInput);
    if (result.success) {
      addToast(result.message, 'success');
      setUserData({ ...userData, referred_by: codeInput.trim().toUpperCase(), eval_credits: result.newEvalCredits ?? userData.eval_credits });
      setCodeInput('');
    } else {
      addToast(result.message, 'warn');
    }
    setApplying(false);
  }

  function copyLink() {
    navigator.clipboard?.writeText(referralLink);
    addToast('Referral link copied');
  }

  if (!user) return (
    <div style={{ padding:'32px' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:'26px', color:'var(--text-primary)' }}>FARMER NETWORK</div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-tertiary)', marginTop:'8px' }}>Sign in to view your referral network.</div>
    </div>
  );

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ marginBottom:'20px' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'26px', color:'var(--text-primary)' }}>FARMER NETWORK</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-tertiary)' }}>Refer farmers, earn evaluations and tracking slots</div>
      </div>

      <div className="panel" style={{ padding:'20px', marginBottom:'16px', textAlign:'center' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'40px', color: rankInfo.color, letterSpacing:'0.05em' }}>{rankInfo.rank}</div>
        {rankInfo.next ? (
          <>
            <div style={{ height:'6px', background:'var(--bg-elevated)', borderRadius:'3px', margin:'12px auto', maxWidth:'320px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min(100, (referralCount / (referralCount+rankInfo.toNext || 1)) * 100)}%`, background: rankInfo.color, borderRadius:'3px' }}/>
            </div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-tertiary)' }}>{rankInfo.toNext} more referral{rankInfo.toNext===1?'':'s'} to {rankInfo.next}</div>
          </>
        ) : (
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-tertiary)', marginTop:'8px' }}>Maximum rank reached</div>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:'10px', marginBottom:'16px' }}>
        {[
          { lbl:'REFERRALS', val: referralCount },
          { lbl:'EVALS EARNED', val: referrals.filter(r => r.status==='active').reduce((n:number,r:any)=>n+(r.evals_granted||0),0) },
          { lbl:'PENDING', val: referrals.filter(r => r.status==='pending').length },
          { lbl:'RANK', val: rankInfo.rank },
        ].map(s => (
          <div key={s.lbl} className="panel" style={{ padding:'12px' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'18px', color:'var(--brand)' }}>{s.val}</div>
            <div className="text-label" style={{ marginTop:'2px' }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ padding:'16px', marginBottom:'16px' }}>
        <div className="text-label" style={{ marginBottom:'8px' }}>YOUR REFERRAL CODE</div>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'16px', color:'var(--brand)', background:'var(--bg-elevated)', padding:'8px 14px', borderRadius:'4px', border:'1px solid var(--brand-border)' }}>{referralCode}</div>
          <button className="btn-secondary" style={{ padding:'8px 14px', fontSize:'10px' }} onClick={copyLink}>COPY LINK</button>
        </div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-disabled)', marginTop:'8px', wordBreak:'break-all' }}>{referralLink}</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-tertiary)', marginTop:'10px' }}>
          You earn +3 evaluations and +1 tracking slot when someone you referred completes their first evaluation (their account must be 24 hours old; max 5 rewards per day). They get +2 evaluations when they apply your code.
        </div>
      </div>

      {!userData?.referred_by && (
        <div className="panel" style={{ padding:'16px', marginBottom:'16px' }}>
          <div className="text-label" style={{ marginBottom:'8px' }}>APPLY A REFERRAL CODE</div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            <input type="text" className="input-primary" placeholder="e.g. DRV-A1B2C3D4" value={codeInput} onChange={e => setCodeInput(e.target.value)} style={{ flex:1, minWidth:'160px' }}/>
            <button className="btn-primary" onClick={handleApply} disabled={applying||!codeInput.trim()} style={{ padding:'10px 16px', fontSize:'10px' }}>{applying?'APPLYING...':'APPLY →'}</button>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header"><div className="panel-title" style={{ fontSize:'18px' }}>REFERRAL HISTORY</div></div>
        <div className="panel-body">
          {loadingRefs ? (
            <div className="skeleton" style={{ height:'80px', borderRadius:'4px' }} />
          ) : referrals.length === 0 ? (
            <div style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-disabled)' }}>No referrals yet. Share your code above to start earning.</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead><tr><th>DATE</th><th>FRIEND</th><th>REWARD</th><th>STATUS</th></tr></thead>
                <tbody>
                  {referrals.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:'10px' }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-primary)' }}>{maskEmail(r.referred_email)}</td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:r.status==='active'?'var(--brand)':'var(--text-tertiary)' }}>{r.status==='active' ? `+${r.evals_granted} evals, +${r.tracking_granted} slot` : 'awaiting their first evaluation'}</td>
                      <td><span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:r.status==='active'?'var(--working)':'var(--watchlist)', background:r.status==='active'?'var(--working-bg)':'var(--watchlist-bg)', border:`1px solid ${r.status==='active'?'var(--working-border)':'var(--watchlist-border)'}`, padding:'1px 6px', borderRadius:'2px' }}>{(r.status||'pending').toUpperCase()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
