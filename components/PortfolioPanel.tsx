'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase-browser';
import { untrackProject, reportOutcome, errorMessage } from '@/lib/api';

function tierColor(tier?: string) {
  if (tier === 'Working') return 'var(--working)';
  if (tier === 'Watchlist') return 'var(--watchlist)';
  if (tier === 'Avoid') return 'var(--avoid)';
  return 'var(--border-strong)';
}

function relTime(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

const OUTCOME_LABELS: Record<string,string> = {
  tge_success: 'TGE SUCCESS',
  still_active: 'STILL ACTIVE',
  delayed: 'DELAYED',
  rugged: 'RUGGED',
};

interface Props {
  user: any;
  userData: any;
  setUserData: (d: any) => void;
  addToast: (msg: string, type?: string) => void;
}

export default function PortfolioPanel({ user, userData, setUserData, addToast }: Props) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'working'|'watchlist'|'avoid'|'trash'>('all');
  const [removingId, setRemovingId] = useState<string|null>(null);
  const [outcomeOpenId, setOutcomeOpenId] = useState<string|null>(null);
  const [busyId, setBusyId] = useState<string|null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const sb = await getSupabase();
      if (!sb) { setLoading(false); return; }
      const { data } = await sb.from('tracked_projects').select('*').eq('user_id', user.id).order('added_at', { ascending: false });
      setProjects(data || []);
      setLoading(false);
    })();
  }, [user]);

  const active = projects.filter(p => p.status === 'active');
  const trashed = projects.filter(p => p.status === 'trashed');
  const workingCount = active.filter(p => p.tier === 'Working').length;
  const watchlistCount = active.filter(p => p.tier === 'Watchlist').length;
  const avoidCount = active.filter(p => p.tier === 'Avoid').length;

  const filtered = filter === 'all' ? active
    : filter === 'trash' ? trashed
    : active.filter(p => (p.tier || '').toLowerCase() === filter);

  async function handleRemoveConfirm(project: any) {
    setBusyId(project.id);
    const res = await untrackProject(project.id);
    setBusyId(null);
    if (!res.ok) { addToast(errorMessage(res.error), 'error'); return; }
    setUserData({ ...userData, tracking_credits: res.tracking_left });
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: 'trashed' } : p));
    setRemovingId(null);
    addToast('Removed — tracking slot freed');
  }

  async function handleOutcome(project: any, outcome: string) {
    setBusyId(project.id);
    const res = await reportOutcome(project.id, outcome);
    setBusyId(null);
    if (!res.ok) { addToast(errorMessage(res.error), 'error'); return; }
    const now = new Date().toISOString();
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, tge_outcome: outcome, outcome_reported_at: now } : p));
    setOutcomeOpenId(null);
    addToast('Outcome recorded — it feeds Proof of Work');
  }

  if (!user) return (
    <div style={{ padding:'32px' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:'26px', color:'var(--text-primary)' }}>PORTFOLIO</div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-tertiary)', marginTop:'8px' }}>Sign in to view your tracked projects.</div>
    </div>
  );

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ marginBottom:'20px' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'26px', color:'var(--text-primary)' }}>PORTFOLIO</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-tertiary)' }}>Projects you chose to track. Each card is the verdict as it was when you added it.</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:'10px', marginBottom:'14px' }}>
        {[
          { lbl:'TRACKED', val: active.length, col: 'var(--brand)' },
          { lbl:'WORKING', val: workingCount, col: 'var(--working)' },
          { lbl:'WATCHLIST', val: watchlistCount, col: 'var(--watchlist)' },
          { lbl:'AVOID', val: avoidCount, col: 'var(--avoid)' },
        ].map(s => (
          <div key={s.lbl} className="panel" style={{ padding:'12px' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'24px', color: s.col }}>{s.val}</div>
            <div className="text-label" style={{ marginTop:'2px' }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      <div style={{ padding:'8px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:'4px', marginBottom:'16px', fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-tertiary)', lineHeight:1.7 }}>
        ◈ Automatic re-checking is not live yet. When it ships, tracked projects are re-scanned on a schedule and any tier change is flagged here.
      </div>

      <div style={{ display:'flex', gap:'6px', marginBottom:'16px', flexWrap:'wrap' }}>
        {(['all','working','watchlist','avoid','trash'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ fontFamily:'var(--font-mono)', fontSize:'9px', padding:'5px 12px', borderRadius:'3px', border:'none', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.05em', background: filter===f ? 'var(--brand-bg)' : 'var(--bg-elevated)', color: filter===f ? 'var(--brand)' : 'var(--text-tertiary)', borderBottom: filter===f ? '2px solid var(--brand)' : '2px solid transparent' }}>
            {f}{f==='trash' && trashed.length>0 ? ` (${trashed.length})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'12px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:'180px', borderRadius:'6px' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'12px', color:'var(--text-tertiary)', marginBottom:'6px' }}>
            {filter === 'trash' ? 'Nothing removed.' : 'No projects tracked yet.'}
          </div>
          {filter !== 'trash' && <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-disabled)' }}>Run an evaluation and choose “Add to Portfolio”.</div>}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'12px' }}>
          {filtered.map(project => (
            <div key={project.id} className="panel hover-lift" style={{ overflow:'hidden' }}>
              <div style={{ height:'3px', background: tierColor(project.tier) }} />
              <div style={{ padding:'14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', flexWrap:'wrap' }}>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:'18px', color:'var(--text-primary)' }}>{project.project_name}</div>
                  <span className={`verdict-badge verdict-${(project.tier||'watchlist').toLowerCase()}`}>{project.tier}</span>
                  {project.tge_outcome && (
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:'8px', color:'var(--cyan)', background:'rgba(110,201,212,0.08)', border:'1px solid rgba(110,201,212,0.2)', padding:'1px 6px', borderRadius:'2px' }}>
                      {OUTCOME_LABELS[project.tge_outcome] || project.tge_outcome}
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'3px', marginBottom:'8px' }}>
                  {[1,2,3,4,5,6].map(i => <span key={i} className={`score-dot ${i<=(project.score||0)?'score-dot-pass':'score-dot-fail'}`}/>)}
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-tertiary)', marginLeft:'4px' }}>{project.score}/6</span>
                </div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-tertiary)', lineHeight:1.6, marginBottom:'10px', maxHeight:'52px', overflow:'hidden' }}>
                  {project.summary}
                </div>
                {project.tier === 'Working' && project.farming_tasks?.[0] && (
                  <div style={{ padding:'8px 10px', background:'var(--brand-bg)', border:'1px solid var(--brand-border)', borderRadius:'3px', marginBottom:'10px' }}>
                    <div className="text-label" style={{ color:'var(--brand)', marginBottom:'3px' }}>FIRST TASK</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-primary)' }}>{project.farming_tasks[0]}</div>
                  </div>
                )}
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-disabled)', marginBottom:'10px' }}>
                  Added {relTime(project.added_at)}
                </div>

                {project.status === 'trashed' ? (
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-disabled)' }}>Removed from your portfolio</div>
                ) : removingId === project.id ? (
                  <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--avoid)' }}>Remove this project?</span>
                    <button className="btn-primary" disabled={busyId===project.id} style={{ padding:'5px 10px', fontSize:'9px', background:'var(--avoid)' }} onClick={() => handleRemoveConfirm(project)}>YES, REMOVE</button>
                    <button className="btn-secondary" style={{ padding:'5px 10px', fontSize:'9px' }} onClick={() => setRemovingId(null)}>CANCEL</button>
                  </div>
                ) : outcomeOpenId === project.id ? (
                  <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' }}>
                    {(['tge_success','still_active','delayed','rugged'] as const).map(o => (
                      <button key={o} className="btn-secondary" disabled={busyId===project.id} style={{ padding:'5px 8px', fontSize:'9px' }} onClick={() => handleOutcome(project, o)}>{OUTCOME_LABELS[o]}</button>
                    ))}
                    <button className="btn-ghost" onClick={() => setOutcomeOpenId(null)}>✕</button>
                  </div>
                ) : (
                  <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                    <button className="btn-secondary" style={{ padding:'5px 10px', fontSize:'9px' }} onClick={() => setOutcomeOpenId(project.id)}>REPORT OUTCOME</button>
                    <button className="btn-secondary" style={{ padding:'5px 10px', fontSize:'9px' }} onClick={() => setRemovingId(project.id)}>REMOVE</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
