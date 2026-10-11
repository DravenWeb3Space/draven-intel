'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase-browser';

const OUTCOME_LABELS: Record<string,string> = {
  tge_success: 'TGE SUCCESS', still_active: 'STILL ACTIVE', delayed: 'DELAYED', rugged: 'RUGGED',
};

function isCorrectCall(tier: string, outcome: string): boolean | null {
  if (outcome === 'still_active' || outcome === 'delayed') return null;
  if (tier === 'Working') return outcome === 'tge_success';
  if (tier === 'Avoid') return outcome === 'rugged';
  return null;
}

function EmptyMsg({ text }: { text: string }) {
  return <div style={{ textAlign:'center', padding:'50px 20px', fontFamily:'var(--font-mono)', fontSize:'12px', color:'var(--text-tertiary)' }}>{text}</div>;
}

interface Props {
  user: any;
}

export default function ProofOfWorkPanel({ user }: Props) {
  const [history, setHistory] = useState<any[]>([]);
  const [tracked, setTracked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all'|'verified'>('all');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const sb = await getSupabase();
      if (!sb) { setLoading(false); return; }
      const [h, t] = await Promise.all([
        sb.from('eval_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        sb.from('tracked_projects').select('*').eq('user_id', user.id).not('tge_outcome', 'is', null).order('outcome_reported_at', { ascending: false }),
      ]);
      setHistory(h.data || []);
      setTracked(t.data || []);
      setLoading(false);
    })();
  }, [user]);

  const decisive = tracked.filter(p => isCorrectCall(p.tier, p.tge_outcome) !== null);
  const correctCount = decisive.filter(p => isCorrectCall(p.tier, p.tge_outcome) === true).length;
  const accuracy = decisive.length > 0 ? Math.round((correctCount / decisive.length) * 100) : 0;
  const accuracyReady = decisive.length >= 5;
  const accColor = accuracy >= 70 ? 'var(--working)' : accuracy >= 50 ? 'var(--watchlist)' : 'var(--avoid)';

  if (!user) return (
    <div style={{ padding:'32px' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:'26px', color:'var(--text-primary)' }}>PROOF OF WORK</div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-tertiary)', marginTop:'8px' }}>Sign in to view the accuracy ledger.</div>
    </div>
  );

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ marginBottom:'20px' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'26px', color:'var(--text-primary)' }}>PROOF OF WORK</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-tertiary)' }}>Timestamped verdicts and community-reported outcomes. Accuracy is computed only from decisive outcomes.</div>
      </div>

      <div style={{ padding:'8px 12px', background:'var(--brand-bg)', border:'1px solid var(--brand-border)', borderRadius:'4px', marginBottom:'16px', fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-secondary)', lineHeight:1.7 }}>
        SAMPLE-DATA MODE — verdicts come from the sample engine and outcomes are self-reported, so nothing here is a real track record yet. Verification and the public ledger arrive with the live engine.
      </div>

      <div className="panel" style={{ padding:'20px', marginBottom:'16px', textAlign:'center' }}>
        {accuracyReady ? (
          <>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'56px', color:accColor, lineHeight:1 }}>{accuracy}%</div>
            <div className="text-label" style={{ marginTop:'4px' }}>VERIFIED ACCURACY · {decisive.length} DECISIVE OUTCOMES</div>
          </>
        ) : (
          <>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'28px', color:'var(--text-tertiary)' }}>OUTCOME TRACKING ACTIVE</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-disabled)', marginTop:'8px' }}>{decisive.length}/5 verified outcomes reported — accuracy unlocks at 5</div>
          </>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'10px', marginTop:'18px' }}>
          {[
            { lbl:'TOTAL EVALS', val: history.length },
            { lbl:'WORKING→SUCCESS', val: tracked.filter(p=>p.tier==='Working'&&p.tge_outcome==='tge_success').length, col:'var(--working)' },
            { lbl:'AVOID→RUGGED', val: tracked.filter(p=>p.tier==='Avoid'&&p.tge_outcome==='rugged').length, col:'var(--working)' },
            { lbl:'PENDING', val: tracked.filter(p=>p.tge_outcome==='still_active'||p.tge_outcome==='delayed').length, col:'var(--watchlist)' },
          ].map(s => (
            <div key={s.lbl} style={{ background:'var(--bg-elevated)', borderRadius:'4px', padding:'10px' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'20px', color:s.col||'var(--text-primary)' }}>{s.val}</div>
              <div className="text-label" style={{ marginTop:'2px', fontSize:'8px' }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'8px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:'4px', marginBottom:'16px', fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-disabled)', lineHeight:1.6 }}>
        Scoring: Working+TGE Success = correct · Avoid+Rugged = correct · Watchlist and Still Active/Delayed outcomes are excluded as not yet decisive.
      </div>

      <div style={{ display:'flex', gap:'6px', marginBottom:'16px' }}>
        {(['all','verified'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ fontFamily:'var(--font-mono)', fontSize:'9px', padding:'5px 14px', borderRadius:'3px', border:'none', cursor:'pointer', textTransform:'uppercase', background: tab===t?'var(--brand-bg)':'var(--bg-elevated)', color: tab===t?'var(--brand)':'var(--text-tertiary)', borderBottom: tab===t?'2px solid var(--brand)':'2px solid transparent' }}>
            {t === 'all' ? 'All Verdicts' : 'Verified Outcomes'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton" style={{ height:'240px', borderRadius:'6px' }} />
      ) : tab === 'all' ? (
        history.length === 0 ? <EmptyMsg text="No evaluations logged yet." /> : (
          <div className="panel">
            <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead><tr><th>PROJECT</th><th>SCORE</th><th>VERDICT</th><th>CONFIDENCE</th><th>DATE</th></tr></thead>
                <tbody>
                  {history.map(row => (
                    <tr key={row.id}>
                      <td style={{ color:'var(--text-primary)', fontFamily:'var(--font-mono)' }}>{row.project_name}</td>
                      <td style={{ fontFamily:'var(--font-mono)', color:'var(--brand)' }}>{row.score}/6</td>
                      <td><span className={`verdict-badge verdict-${(row.tier||'').toLowerCase()}`}>{row.tier}</span></td>
                      <td style={{ fontFamily:'var(--font-mono)' }}>{row.confidence}%</td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:'10px' }}>{new Date(row.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        tracked.length === 0 ? <EmptyMsg text="No outcomes reported yet. Report one from a Portfolio card." /> : (
          <div className="panel">
            <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead><tr><th>PROJECT</th><th>VERDICT</th><th>SCORE</th><th>OUTCOME</th><th>AI CALL</th><th>DATE</th></tr></thead>
                <tbody>
                  {tracked.map(row => {
                    const correct = isCorrectCall(row.tier, row.tge_outcome);
                    return (
                      <tr key={row.id} style={{ borderLeft: correct===true?'3px solid var(--working)':correct===false?'3px solid var(--avoid)':'3px solid transparent' }}>
                        <td style={{ color:'var(--text-primary)', fontFamily:'var(--font-mono)' }}>{row.project_name}</td>
                        <td><span className={`verdict-badge verdict-${(row.tier||'').toLowerCase()}`}>{row.tier}</span></td>
                        <td style={{ fontFamily:'var(--font-mono)', color:'var(--brand)' }}>{row.score}/6</td>
                        <td style={{ fontFamily:'var(--font-mono)', fontSize:'10px' }}>{OUTCOME_LABELS[row.tge_outcome]||row.tge_outcome}</td>
                        <td style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color: correct===true?'var(--working)':correct===false?'var(--avoid)':'var(--text-disabled)' }}>
                          {correct===true?'CORRECT':correct===false?'INCORRECT':'—'}
                        </td>
                        <td style={{ fontFamily:'var(--font-mono)', fontSize:'10px' }}>{row.outcome_reported_at ? new Date(row.outcome_reported_at).toLocaleDateString('en-IN') : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
