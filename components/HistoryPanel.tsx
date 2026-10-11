'use client';
import { useState, useEffect, Fragment } from 'react';
import { getSupabase } from '@/lib/supabase-browser';
import { setEvalStatus, errorMessage } from '@/lib/api';

type SortKey = 'project_name'|'score'|'tier'|'confidence'|'created_at';

interface Props {
  user: any;
  addToast: (msg: string, type?: string) => void;
}

export default function HistoryPanel({ user, addToast }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'working'|'watchlist'|'avoid'|'trash'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string|null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const sb = await getSupabase();
      if (!sb) { setLoading(false); return; }
      const { data } = await sb.from('eval_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setRows(data || []);
      setLoading(false);
    })();
  }, [user]);

  const active = rows.filter(r => r.status !== 'trashed');
  const trashed = rows.filter(r => r.status === 'trashed');
  const workingCount = active.filter(r => r.tier === 'Working').length;
  const watchlistCount = active.filter(r => r.tier === 'Watchlist').length;
  const avoidCount = active.filter(r => r.tier === 'Avoid').length;

  let filtered = filter === 'all' ? active : filter === 'trash' ? trashed : active.filter(r => (r.tier||'').toLowerCase() === filter);
  filtered = [...filtered].sort((a,b) => {
    let av: any = a[sortKey], bv: any = b[sortKey];
    if (sortKey === 'created_at') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  async function toggleTrash(row: any) {
    const newStatus = row.status === 'trashed' ? 'active' : 'trashed';
    const res = await setEvalStatus(row.id, newStatus);
    if (!res.ok) { addToast(errorMessage(res.error), 'error'); return; }
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: newStatus } : r));
    addToast(newStatus === 'trashed' ? 'Moved to trash' : 'Restored');
  }

  if (!user) return (
    <div style={{ padding:'32px' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:'26px', color:'var(--text-primary)' }}>EVAL HISTORY</div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-tertiary)', marginTop:'8px' }}>Sign in to view your evaluation history.</div>
    </div>
  );

  const COLS: [SortKey, string][] = [
    ['project_name','PROJECT'], ['score','SCORE'], ['tier','VERDICT'], ['confidence','CONFIDENCE'], ['created_at','DATE'],
  ];

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ marginBottom:'20px' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'26px', color:'var(--text-primary)' }}>EVAL HISTORY</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-tertiary)' }}>Every evaluation you've run, permanently logged</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:'10px', marginBottom:'16px' }}>
        {[
          { lbl:'TOTAL', val: active.length, col:'var(--brand)' },
          { lbl:'WORKING', val: workingCount, col:'var(--working)' },
          { lbl:'WATCHLIST', val: watchlistCount, col:'var(--watchlist)' },
          { lbl:'AVOID', val: avoidCount, col:'var(--avoid)' },
        ].map(s => (
          <div key={s.lbl} className="panel" style={{ padding:'12px' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'24px', color:s.col }}>{s.val}</div>
            <div className="text-label" style={{ marginTop:'2px' }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:'6px', marginBottom:'16px', flexWrap:'wrap' }}>
        {(['all','working','watchlist','avoid','trash'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ fontFamily:'var(--font-mono)', fontSize:'9px', padding:'5px 12px', borderRadius:'3px', border:'none', cursor:'pointer', textTransform:'uppercase', background: filter===f?'var(--brand-bg)':'var(--bg-elevated)', color: filter===f?'var(--brand)':'var(--text-tertiary)', borderBottom: filter===f?'2px solid var(--brand)':'2px solid transparent' }}>
            {f}{f==='trash' && trashed.length>0 ? ` (${trashed.length})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton" style={{ height:'240px', borderRadius:'6px' }} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'12px', color:'var(--text-tertiary)' }}>
            {filter === 'trash' ? 'Nothing in trash.' : 'No evaluations yet.'}
          </div>
          {filter !== 'trash' && <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-disabled)', marginTop:'6px' }}>Every evaluation you run from the Evaluate tab appears here automatically.</div>}
        </div>
      ) : (
        <div className="panel">
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {COLS.map(([key,label]) => (
                    <th key={key} onClick={() => toggleSort(key)} style={{ cursor:'pointer', userSelect:'none' }}>
                      {label}{sortKey===key ? (sortDir==='asc'?' ↑':' ↓') : ''}
                    </th>
                  ))}
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <Fragment key={row.id}>
                    <tr style={{ cursor:'pointer' }} onClick={() => setExpandedId(expandedId===row.id?null:row.id)}>
                      <td style={{ color:'var(--text-primary)', fontFamily:'var(--font-mono)' }}>{row.project_name}</td>
                      <td style={{ fontFamily:'var(--font-mono)', color:'var(--brand)' }}>{row.score}/6</td>
                      <td><span className={`verdict-badge verdict-${(row.tier||'').toLowerCase()}`}>{row.tier}</span></td>
                      <td style={{ fontFamily:'var(--font-mono)' }}>{row.confidence}%</td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:'10px' }}>{new Date(row.created_at).toLocaleDateString('en-IN')}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="btn-secondary" style={{ padding:'3px 8px', fontSize:'9px' }} onClick={() => toggleTrash(row)}>{row.status==='trashed'?'RESTORE':'TRASH'}</button>
                      </td>
                    </tr>
                    {expandedId === row.id && (
                      <tr>
                        <td colSpan={6} style={{ background:'var(--bg-elevated)', padding:'14px' }}>
                          <div style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-secondary)', lineHeight:1.8, marginBottom:'10px' }}>{row.summary}</div>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'8px' }}>
                            {(row.steps||[]).map((s:any,i:number) => (
                              <div key={i} style={{ padding:'8px 10px', background:'var(--bg-panel)', borderRadius:'4px', borderLeft:`2px solid ${s.pass?'var(--working)':'var(--avoid)'}` }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
                                  <span style={{ color:s.pass?'var(--working)':'var(--avoid)', fontSize:'9px' }}>{s.pass?'✓':'✗'}</span>
                                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-primary)' }}>{s.name}</span>
                                </div>
                                <div style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-tertiary)', paddingLeft:'15px' }}>{s.verdict}</div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
