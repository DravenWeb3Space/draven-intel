'use client';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import PortfolioPanel from '@/components/PortfolioPanel';
import HistoryPanel from '@/components/HistoryPanel';
import ProofOfWorkPanel from '@/components/ProofOfWorkPanel';
import FarmerNetworkPanel from '@/components/FarmerNetworkPanel';
import ROICalculatorPanel from '@/components/ROICalculatorPanel';
import { getSupabase } from '@/lib/supabase-browser';
import { redeemReferralCode } from '@/lib/referrals';
import { recordEval, trackProject, errorMessage } from '@/lib/api';

const PLANS = [
  { id:'free', label:'Free', price_inr:0, evals:3, tracking:2 },
  { id:'monthly', label:'Monthly', price_inr:999, evals:20, tracking:8 },
  { id:'3month', label:'3 Month', price_inr:2599, evals:50, tracking:20 },
  { id:'6month', label:'6 Month', price_inr:4599, evals:100, tracking:40 },
  { id:'annual', label:'Annual', price_inr:7999, evals:200, tracking:75 },
];

const NAV_MAIN = [
  { id:'evaluate', label:'Evaluate', icon:'⚡' },
  { id:'portfolio', label:'Portfolio', icon:'◈' },
  { id:'history', label:'Eval History', icon:'≡' },
  { id:'proof', label:'Proof of Work', icon:'◉' },
];
const NAV_MORE = [
  { id:'network', label:'Farmer Network', icon:'⊕' },
  { id:'calculator', label:'ROI Calculator', icon:'◎' },
  { id:'guide', label:'How to Use', icon:'?' },
  { id:'support', label:'Support', icon:'◌' },
];
const SHORTCUT_KEYS: Record<string,string> = { evaluate:'E', portfolio:'P', history:'H', proof:'W', network:'N', calculator:'R' };
const PALETTE_ALIASES: Record<string,string> = {
  evaluate:'eval e', portfolio:'pf portfolio p', history:'hist history h', proof:'pow proof w',
  network:'net network referral n', calculator:'roi calc calculator r', guide:'guide help', support:'support help',
};

type PaletteEntry = { id: string; label: string; icon: string; hint: string; run: () => void };

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('evaluate');
  const [time, setTime] = useState('');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdIndex, setCmdIndex] = useState(0);
  const [evalPrefill, setEvalPrefill] = useState<{ text: string; n: number } | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [toasts, setToasts] = useState<{id:string,msg:string,type:string}[]>([]);

  function addToast(msg: string, type = 'info') {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) { setLoading(false); return; }
    import('@supabase/ssr').then(({ createBrowserClient }) => {
      const sb = createBrowserClient(url, key);

      async function loadAndMaybeRedeem(sessionUser: any) {
        setUser(sessionUser);
        const { data } = await sb.from('users').select('*').eq('id', sessionUser.id).single();
        const current = data;
        setUserData(current);

        // A referral link visited before sign-up is applied once, after the first sign-in.
        if (typeof window !== 'undefined' && current && !current.referred_by) {
          const storedCode = localStorage.getItem('draven_ref_code');
          if (storedCode) {
            const result = await redeemReferralCode(sessionUser.id, current.referral_code, storedCode);
            if (!result.retryable) localStorage.removeItem('draven_ref_code');
            if (result.success) {
              setUserData({ ...current, referred_by: storedCode, eval_credits: result.newEvalCredits ?? current.eval_credits });
              addToast(result.message, 'success');
            }
          }
        }
      }

      sb.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) await loadAndMaybeRedeem(session.user);
        setLoading(false);
      });

      sb.auth.onAuthStateChange(async (_e, session) => {
        if (session?.user) await loadAndMaybeRedeem(session.user);
        else { setUser(null); setUserData(null); }
      });
    });
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const typing = ['INPUT','TEXTAREA'].includes((document.activeElement as any)?.tagName || '');
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openPalette(); return; }
      if (e.key === 'Escape') { closePalette(); setUpgradeOpen(false); setMoreOpen(false); return; }
      if (typing) return;
      if (e.key === '/') { e.preventDefault(); openPalette(); return; }
      const map: Record<string,string> = { e:'evaluate', p:'portfolio', h:'history', w:'proof', n:'network', r:'calculator' };
      if (map[e.key]) { e.preventDefault(); setActive(map[e.key]); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  function openPalette() { setCmdQuery(''); setCmdIndex(0); setCmdOpen(true); }
  function closePalette() { setCmdOpen(false); setCmdQuery(''); setCmdIndex(0); }

  const paletteEntries: PaletteEntry[] = (() => {
    const q = cmdQuery.trim();
    const ql = q.toLowerCase();
    const out: PaletteEntry[] = [];
    const m = q.match(/^eval(?:uate)?\s+(.+)$/i);
    if (m) {
      out.push({ id:'eval-run', label:`Evaluate: ${m[1]}`, icon:'⚡', hint:'EVAL', run: () => { setEvalPrefill({ text: m[1], n: Date.now() }); setActive('evaluate'); } });
    }
    for (const item of [...NAV_MAIN, ...NAV_MORE]) {
      const hay = `${item.label} ${PALETTE_ALIASES[item.id] || ''}`.toLowerCase();
      if (!ql || hay.includes(ql)) out.push({ id:item.id, label:`Go to ${item.label}`, icon:item.icon, hint:SHORTCUT_KEYS[item.id] || '', run: () => setActive(item.id) });
    }
    return out;
  })();

  function runPalette(entry?: PaletteEntry) {
    if (!entry) return;
    entry.run();
    closePalette();
  }

  const paid = userData?.plan_tier && userData.plan_tier !== 'free' && userData.plan_expires_at && new Date(userData.plan_expires_at) > new Date();
  const credits = userData?.eval_credits ?? 0;
  const tracking = userData?.tracking_credits ?? 0;
  const isLow = credits <= 1;
  const planLabel: Record<string,string> = { free:'FREE', monthly:'MONTHLY', '3month':'3-MONTH', '6month':'6-MONTH', annual:'ANNUAL' };

  function renderPage() {
    switch(active) {
      case 'evaluate': return <EvaluatePage addToast={addToast} user={user} userData={userData} setUserData={setUserData} openUpgrade={() => setUpgradeOpen(true)} prefill={evalPrefill} />;
      case 'portfolio': return <PortfolioPanel user={user} userData={userData} setUserData={setUserData} addToast={addToast} />;
      case 'history': return <HistoryPanel user={user} addToast={addToast} />;
      case 'proof': return <ProofOfWorkPanel user={user} />;
      case 'network': return <FarmerNetworkPanel user={user} userData={userData} setUserData={setUserData} addToast={addToast} />;
      case 'calculator': return <ROICalculatorPanel />;
      case 'guide': return <PlaceholderPage title="HOW TO USE" sub="Guides arrive with the live evaluation engine." />;
      case 'support': return <PlaceholderPage title="SUPPORT" sub="Support arrives with the public launch." />;
      default: return <EvaluatePage addToast={addToast} user={user} userData={userData} setUserData={setUserData} openUpgrade={() => setUpgradeOpen(true)} prefill={evalPrefill} />;
    }
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:'12px'}}>
      <div className="brand-text" style={{fontFamily:'var(--font-display)',fontSize:'28px',letterSpacing:'0.1em'}}>DRAVEN INTEL</div>
      <div style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-tertiary)',letterSpacing:'0.15em',animation:'pulse 1.5s ease infinite'}}>LOADING WORKSPACE...</div>
    </div>
  );

  return (
    <div className="app-shell">
      <header style={{gridArea:'topbar',background:'var(--bg-surface)',borderBottom:'1px solid var(--border-default)',display:'flex',alignItems:'center',padding:'0 16px',gap:'12px',zIndex:40}}>
        <div className="brand-text" style={{fontFamily:'var(--font-display)',fontSize:'20px',letterSpacing:'0.05em',cursor:'pointer',minWidth:'148px',whiteSpace:'nowrap'}} onClick={() => setActive('evaluate')}>
          DRAVEN INTEL <span style={{fontFamily:'var(--font-mono)',fontSize:'9px',color:'var(--text-tertiary)',marginLeft:'5px',WebkitTextFillColor:'var(--text-tertiary)'}}>v5</span>
        </div>
        <div style={{flex:1,maxWidth:'300px'}} className="desktop-only">
          <input readOnly type="text" placeholder="Search or type a command…  ( / or Ctrl+K )" onFocus={openPalette}
            className="input-primary" style={{fontSize:'11px',padding:'5px 12px',height:'30px',cursor:'pointer'}}/>
        </div>
        <div className="desktop-only" style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-tertiary)',flex:1,textAlign:'center',letterSpacing:'0.1em'}}>
          {active.toUpperCase().replace(/-/g,' ')}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginLeft:'auto'}}>
          <span className="desktop-only" style={{fontFamily:'var(--font-mono)',fontSize:'11px',color:'var(--text-tertiary)'}}>{time}</span>
          <span className="desktop-only" style={{display:'flex',alignItems:'center',gap:'4px'}}>
            <span style={{width:'5px',height:'5px',borderRadius:'50%',background:isLow?'var(--watchlist)':'var(--working)',boxShadow:`0 0 5px ${isLow?'var(--watchlist)':'var(--working)'}`,display:'inline-block'}}/>
            <span style={{fontFamily:'var(--font-mono)',fontSize:'9px',color:isLow?'var(--watchlist)':'var(--working)',letterSpacing:'0.06em'}}>{isLow?'LOW CREDITS':'READY'}</span>
          </span>
          <ThemeToggle />
          {user && (
            <>
              <button onClick={() => !paid && setUpgradeOpen(true)} style={{fontFamily:'var(--font-mono)',fontSize:'9px',padding:'3px 8px',borderRadius:'2px',background:paid?'var(--brand-bg)':'var(--bg-elevated)',color:paid?'var(--brand)':'var(--text-tertiary)',border:`1px solid ${paid?'var(--brand-border)':'var(--border-default)'}`,cursor:paid?'default':'pointer'}}>
                {planLabel[userData?.plan_tier||'free']||'FREE'}
              </button>
              <div title={user.email} style={{width:'28px',height:'28px',borderRadius:'50%',background:'var(--bg-elevated)',border:'1px solid var(--border-strong)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-mono)',fontSize:'11px',color:'var(--brand)',flexShrink:0}}>
                {user.email?.[0]?.toUpperCase()||'D'}
              </div>
            </>
          )}
        </div>
      </header>

      <aside className="desktop-only" style={{gridArea:'sidebar',background:'var(--bg-surface)',borderRight:'1px solid var(--border-default)',display:'flex',flexDirection:'column',overflowY:'auto'}}>
        <div style={{padding:'14px 0 8px'}}>
          <div className="text-label" style={{padding:'0 16px 8px'}}>Workspace</div>
          {NAV_MAIN.map(item => <NavItem key={item.id} item={item} active={active} onClick={() => setActive(item.id)} />)}
        </div>
        <div style={{height:'1px',background:'var(--border-subtle)'}}/>
        <div style={{padding:'8px 0'}}>
          <div className="text-label" style={{padding:'6px 16px'}}>More</div>
          {NAV_MORE.map(item => <NavItem key={item.id} item={item} active={active} onClick={() => setActive(item.id)} />)}
        </div>
        <div style={{marginTop:'auto',borderTop:'1px solid var(--border-subtle)',padding:'12px 14px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
          <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:'3px',padding:'8px 10px'}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:'20px',color:credits<=0?'var(--avoid)':'var(--brand)',lineHeight:1}}>{credits}</div>
            <div className="text-label" style={{marginTop:'3px'}}>Evals Left</div>
          </div>
          <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:'3px',padding:'8px 10px'}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:'20px',color:'var(--text-secondary)',lineHeight:1}}>{user?tracking:'-'}</div>
            <div className="text-label" style={{marginTop:'3px'}}>Slots Left</div>
          </div>
        </div>
      </aside>

      <main className="app-main" style={{gridArea:'main',overflowY:'auto',overflowX:'hidden'}}>{renderPage()}</main>

      <footer className="desktop-only" style={{gridArea:'statusbar',background:'var(--bg-surface)',borderTop:'1px solid var(--border-subtle)',display:'flex',alignItems:'center',padding:'0 16px',overflow:'hidden'}}>
        {[
          {lbl:'SESSION',val:user?'SIGNED IN':'—',col:user?'var(--working)':undefined},
          {lbl:'CREDITS',val:user?(credits+' evals · '+tracking+' slots'):'—'},
          {lbl:'PLAN',val:planLabel[userData?.plan_tier||'free']||'FREE',col:paid?'var(--brand)':undefined},
          {lbl:'DATA',val:'SAMPLE MODE',col:'var(--cyan)'},
        ].map((s,i) => (
          <span key={s.lbl} style={{display:'flex',alignItems:'center'}}>
            {i>0 && <span style={{width:'1px',height:'14px',background:'var(--border-subtle)',margin:'0 12px',display:'inline-block'}}/>}
            <span style={{display:'flex',alignItems:'center',gap:'6px'}}>
              <span style={{fontFamily:'var(--font-mono)',fontSize:'8px',color:'var(--text-disabled)',textTransform:'uppercase',letterSpacing:'0.08em',whiteSpace:'nowrap'}}>{s.lbl}</span>
              <span style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:s.col||'var(--text-tertiary)',whiteSpace:'nowrap'}}>{s.val}</span>
            </span>
          </span>
        ))}
      </footer>

      <div className="mobile-only" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:40,background:'var(--bg-surface)',borderTop:'1px solid var(--border-default)',height:'56px',alignItems:'center'}}>
        {NAV_MAIN.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',background:'none',border:'none',cursor:'pointer',padding:'0',color:active===item.id?'var(--brand)':'var(--text-tertiary)',flex:1,transition:'color 0.15s'}}>
            <span style={{fontSize:'18px'}}>{item.icon}</span>
            <span style={{fontFamily:'var(--font-mono)',fontSize:'8px'}}>{item.label.split(' ')[0]}</span>
          </button>
        ))}
        <button onClick={() => setMoreOpen(true)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',background:'none',border:'none',cursor:'pointer',padding:'0',color:NAV_MORE.some(n=>n.id===active)?'var(--brand)':'var(--text-tertiary)',flex:1}}>
          <span style={{fontSize:'18px'}}>···</span>
          <span style={{fontFamily:'var(--font-mono)',fontSize:'8px'}}>More</span>
        </button>
      </div>

      {moreOpen && (
        <div style={{position:'fixed',inset:0,zIndex:60,background:'rgba(3,5,10,0.85)',backdropFilter:'blur(6px)'}} onClick={() => setMoreOpen(false)}>
          <div style={{position:'absolute',bottom:0,left:0,right:0,background:'var(--bg-panel)',borderTop:'1px solid var(--border-strong)',borderRadius:'12px 12px 0 0',padding:'16px 0 40px',animation:'slideUp 0.2s ease'}} onClick={e => e.stopPropagation()}>
            <div style={{width:'32px',height:'3px',background:'var(--border-strong)',borderRadius:'2px',margin:'0 auto 20px'}}/>
            <div className="text-label" style={{padding:'0 20px 12px'}}>MORE SECTIONS</div>
            {NAV_MORE.map(item => (
              <div key={item.id} onClick={() => { setActive(item.id); setMoreOpen(false); }} style={{display:'flex',alignItems:'center',gap:'14px',padding:'14px 20px',cursor:'pointer',borderLeft:`3px solid ${active===item.id?'var(--brand)':'transparent'}`}}>
                <span style={{fontSize:'20px'}}>{item.icon}</span>
                <span style={{fontFamily:'var(--font-mono)',fontSize:'13px',color:active===item.id?'var(--brand)':'var(--text-primary)'}}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cmdOpen && (
        <div className="overlay" onClick={closePalette} style={{alignItems:'flex-start',paddingTop:'80px'}}>
          <div style={{background:'var(--bg-panel)',border:'1px solid var(--border-strong)',borderRadius:'8px',width:'100%',maxWidth:'520px',margin:'16px',overflow:'hidden',animation:'slideDown 0.15s ease'}} onClick={e => e.stopPropagation()}>
            <input autoFocus className="input-primary" value={cmdQuery}
              placeholder="Type a command or search…   e.g.  eval arbitrum.io   ·   pf   ·   roi"
              style={{border:'none',borderBottom:'1px solid var(--border-default)',borderRadius:'8px 8px 0 0',padding:'14px 16px',fontSize:'13px'}}
              onChange={e => { setCmdQuery(e.target.value); setCmdIndex(0); }}
              onKeyDown={e => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setCmdIndex(i => paletteEntries.length ? (i + 1) % paletteEntries.length : 0); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setCmdIndex(i => paletteEntries.length ? (i - 1 + paletteEntries.length) % paletteEntries.length : 0); }
                else if (e.key === 'Enter') { e.preventDefault(); runPalette(paletteEntries[cmdIndex]); }
                else if (e.key === 'Escape') closePalette();
              }}/>
            <div style={{padding:'8px 0',maxHeight:'320px',overflowY:'auto'}}>
              <div className="text-label" style={{padding:'6px 14px'}}>{cmdQuery.trim() ? 'RESULTS' : 'NAVIGATE'}</div>
              {paletteEntries.length === 0 && <div style={{padding:'10px 14px',fontFamily:'var(--font-mono)',fontSize:'11px',color:'var(--text-disabled)'}}>No match. Try “eval &lt;project&gt;”.</div>}
              {paletteEntries.map((en, i) => (
                <div key={en.id} onClick={() => runPalette(en)} onMouseEnter={() => setCmdIndex(i)}
                  style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 14px',cursor:'pointer',fontSize:'12px',color:i===cmdIndex?'var(--brand)':'var(--text-secondary)',background:i===cmdIndex?'var(--brand-bg)':'transparent',transition:'background 0.1s'}}>
                  <span style={{fontSize:'13px',minWidth:'16px'}}>{en.icon}</span>
                  <span style={{fontFamily:'var(--font-mono)'}}>{en.label}</span>
                  {en.hint && <span style={{marginLeft:'auto',fontFamily:'var(--font-mono)',fontSize:'9px',color:'var(--text-disabled)',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',padding:'1px 5px',borderRadius:'2px'}}>{en.hint}</span>}
                </div>
              ))}
            </div>
            <div style={{padding:'8px 14px',borderTop:'1px solid var(--border-subtle)',fontFamily:'var(--font-mono)',fontSize:'9px',color:'var(--text-disabled)'}}>↑↓ move · ↵ run · esc close</div>
          </div>
        </div>
      )}

      {upgradeOpen && (
        <div className="overlay" onClick={() => setUpgradeOpen(false)}>
          <div style={{background:'var(--bg-panel)',border:'1px solid var(--border-strong)',borderRadius:'8px',width:'100%',maxWidth:'600px',margin:'16px',maxHeight:'90vh',overflow:'auto',animation:'slideDown 0.2s ease'}} onClick={e => e.stopPropagation()}>
            <div style={{padding:'18px 20px',borderBottom:'1px solid var(--border-subtle)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div className="brand-text" style={{fontFamily:'var(--font-display)',fontSize:'24px'}}>PLANS</div>
              <button className="btn-ghost" onClick={() => setUpgradeOpen(false)}>✕</button>
            </div>
            <div style={{padding:'12px 20px 0',fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-tertiary)',lineHeight:1.7}}>
              Payments open after private beta. These are the plans that will be available.
            </div>
            <div style={{padding:'16px 20px 20px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'12px'}}>
              {PLANS.filter(p => p.id !== 'free').map(p => (
                <div key={p.id} style={{background:p.id==='6month'?'var(--brand-bg)':'var(--bg-elevated)',border:`1px solid ${p.id==='6month'?'var(--brand-border)':'var(--border-default)'}`,borderRadius:'5px',padding:'16px'}}>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'18px',marginBottom:'4px'}}>{p.label.toUpperCase()}</div>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'28px',color:p.id==='6month'?'var(--brand)':'var(--text-primary)',marginBottom:'12px'}}>₹{p.price_inr.toLocaleString('en-IN')}</div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--brand)',marginBottom:'10px'}}>{p.evals} evals · {p.tracking} tracked</div>
                  <button className="btn-secondary" style={{width:'100%'}} onClick={() => addToast('Payments are not open yet — private beta','info')}>OPENS AFTER BETA</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}
      </div>
    </div>
  );
}

function NavItem({ item, active, onClick }: { item:{id:string,label:string,icon:string}, active:string, onClick:()=>void }) {
  const isActive = active === item.id;
  return (
    <div onClick={onClick} style={{display:'flex',alignItems:'center',gap:'9px',padding:'8px 16px',cursor:'pointer',fontFamily:'var(--font-mono)',fontSize:'11px',color:isActive?'var(--brand)':'var(--text-tertiary)',borderLeft:`2px solid ${isActive?'var(--brand)':'transparent'}`,background:isActive?'var(--brand-bg)':'transparent',transition:'all 0.15s'}}
      onMouseEnter={e => { if(!isActive){ e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.background='var(--bg-elevated)'; }}}
      onMouseLeave={e => { if(!isActive){ e.currentTarget.style.color='var(--text-tertiary)'; e.currentTarget.style.background='transparent'; }}}>
      <span style={{fontSize:'12px',minWidth:'14px',textAlign:'center'}}>{item.icon}</span>
      <span>{item.label}</span>
    </div>
  );
}

function PlaceholderPage({ title, sub }: { title:string, sub:string }) {
  return (
    <div style={{padding:'32px'}}>
      <div className="brand-text" style={{fontFamily:'var(--font-display)',fontSize:'32px',marginBottom:'8px'}}>{title}</div>
      <div style={{fontFamily:'var(--font-mono)',fontSize:'11px',color:'var(--text-tertiary)'}}>{sub}</div>
    </div>
  );
}

// ───────────── Sample-data engine (replaced by the real engine in the next phase) ─────────────
// Deterministic per project name: the same project always gets the same sample verdict.
const STEP_TEMPLATES = [
  { name:'Project Overview', pass:'Clear differentiated use case', fail:'Differentiation vs competitors is unclear', src:['coingecko.com','defillama.com'] },
  { name:'Funding & Investors', pass:'Credible backers, no geo-restriction found', fail:'No verifiable funding or restrictive terms', src:['defillama.com','announcements'] },
  { name:'Airdrop Campaign', pass:'Active campaign with a community allocation', fail:'No active campaign found', src:['galxe.com','layer3.xyz'] },
  { name:'Community & On-Chain', pass:'Growing activity metrics', fail:'Weak or declining activity', src:['defillama.com','github.com'] },
  { name:'Team & Security', pass:'Named audit and identifiable team', fail:'No audit found or anonymous team', src:['audit report','github.com'] },
  { name:'Risk Synthesis', pass:'Acceptable overall risk', fail:'Elevated overall risk', src:[] as string[] },
];

function hashStr(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function deriveName(input: string) {
  const t = input.trim();
  try {
    const host = new URL(/^https?:\/\//i.test(t) ? t : 'https://' + t).hostname.replace(/^www\./, '');
    if (host.includes('.')) { const parts = host.split('.'); const label = parts[Math.max(0, parts.length - 2)]; return label.charAt(0).toUpperCase() + label.slice(1); }
  } catch {}
  const name = t.slice(0, 40);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function mockVerdict(name: string, target: string) {
  const h = hashStr(name.toLowerCase());
  const score = [2, 3, 4, 5, 5, 6][h % 6];
  const tier = score >= 5 ? 'Working' : score === 4 ? 'Watchlist' : 'Avoid';
  const confidence = 55 + ((h >> 3) % 36);
  const steps = STEP_TEMPLATES.map((t, i) => ({
    name: t.name, pass: i < score, verdict: i < score ? t.pass : t.fail,
    sources: i < score ? t.src : [],
  }));
  const farming_tasks = tier === 'Working'
    ? ['Complete the daily task on the official campaign page (est. 5 min)', 'Make at least 3 testnet transactions this week', 'Join the community channel and complete verification tasks', 'Engage with 3 official posts this week']
    : tier === 'Watchlist' ? ['Check the official announcements weekly', 'Do not commit capital until a campaign is confirmed'] : ['Do not allocate time or capital; revisit only after a major update'];
  const risks = tier === 'Working'
    ? { high: [], medium: ['Token launch date not announced'], low: ['Competitive category'] }
    : tier === 'Watchlist' ? { high: [], medium: ['Campaign not confirmed', 'Limited verifiable activity'], low: [] }
    : { high: ['No verifiable audit or funding'], medium: ['Unclear team'], low: [] };
  return {
    project_name: name, project_url: target.slice(0, 500), tier, score, confidence,
    summary: `${name}: sample ${tier.toLowerCase()} verdict (${score}/6). In live mode this paragraph is written from fetched evidence, with every claim linked to its source.`,
    steps, risks, farming_tasks,
    effort_estimate: tier === 'Working' ? '15–20 min/day' : tier === 'Watchlist' ? '5 min/week' : '—',
    reward_potential: tier === 'Working' ? 'High' : tier === 'Watchlist' ? 'Medium' : 'Low',
    category: 'Sample',
  };
}

const LOADING_STEPS = [
  'Scanning project + competitive landscape...',
  'Verifying funding + investor quality...',
  'Analysing airdrop campaign + allocation...',
  'Measuring on-chain + community signals...',
  'Checking team transparency + security audits...',
  'Computing risk synthesis + final verdict...',
];

function EvaluatePage({ addToast, user, userData, setUserData, openUpgrade, prefill }: { addToast: (msg:string, type?:string) => void, user: any, userData: any, setUserData: (d:any) => void, openUpgrade: () => void, prefill: { text: string; n: number } | null }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(-1);
  const [result, setResult] = useState<any>(null);
  const [revealedDots, setRevealedDots] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);
  const [totalEvals, setTotalEvals] = useState<number | null>(null);

  useEffect(() => { if (prefill?.text) setInput(prefill.text); }, [prefill?.n]);

  async function loadActivity() {
    if (!user) return;
    const sb = await getSupabase();
    if (!sb) return;
    const [r, c] = await Promise.all([
      sb.from('eval_history').select('id,project_name,tier,score,created_at').eq('user_id', user.id).neq('status', 'trashed').order('created_at', { ascending: false }).limit(5),
      sb.from('eval_history').select('id', { count: 'exact', head: true }).eq('user_id', user.id).neq('status', 'trashed'),
    ]);
    setRecent(r.data || []);
    setTotalEvals(c.count ?? 0);
  }
  useEffect(() => { loadActivity(); }, [user?.id]);

  async function runEval() {
    const target = input.trim();
    if (!target || loading) return;
    if ((userData?.eval_credits ?? 0) <= 0) { addToast(errorMessage('no_credits') + ' — plans open after private beta', 'warn'); openUpgrade(); return; }
    setLoading(true); setResult(null); setLoadStep(0); setRevealedDots(0); setAdded(false);
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < LOADING_STEPS.length; i++) { setLoadStep(i); await delay(520); }
    const verdict = mockVerdict(deriveName(target), target);
    // The server charges one credit and records the verdict in one atomic step.
    // The result is only shown if the server accepted it — no charge, no verdict.
    const res = await recordEval(verdict);
    setLoading(false);
    if (!res.ok) {
      addToast(errorMessage(res.error), res.error === 'no_credits' ? 'warn' : 'error');
      if (res.error === 'no_credits') openUpgrade();
      return;
    }
    setUserData({ ...userData, eval_credits: res.credits_left });
    setResult(verdict);
    for (let i = 1; i <= verdict.score; i++) { await delay(150); setRevealedDots(i); }
    loadActivity();
  }

  async function handleAddToPortfolio() {
    if (!user || !result || adding || added) return;
    setAdding(true);
    const res = await trackProject(result);
    setAdding(false);
    if (!res.ok) {
      if (res.error === 'already_tracked') setAdded(true);
      if (res.error === 'no_slots') openUpgrade();
      addToast(errorMessage(res.error), res.error === 'already_tracked' ? 'info' : 'warn');
      return;
    }
    setUserData({ ...userData, tracking_credits: res.tracking_left });
    setAdded(true);
    addToast('Added to your portfolio', 'success');
  }

  const tierColor = result?.tier==='Working'?'var(--working)':result?.tier==='Watchlist'?'var(--watchlist)':'var(--avoid)';

  return (
    <div style={{padding:'24px'}}>
      <div style={{marginBottom:'20px'}}>
        <div style={{fontFamily:'var(--font-display)',fontSize:'26px',color:'var(--text-primary)',marginBottom:'3px'}}>EVALUATE <span className="brand-text">PROJECT</span></div>
        <div style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-tertiary)'}}>6-step framework · sample data during private beta · score /6</div>
      </div>

      <div className="eval-grid" style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:'20px',alignItems:'start'}}>

        <div>
          <div className="panel" style={{padding:'16px',marginBottom:'14px'}}>
            <div className="text-label" style={{marginBottom:'8px'}}>PROJECT URL OR NAME</div>
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
              <input type="text" className="input-primary" placeholder="Paste a project URL or type a name…"
                value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && !loading && runEval()} disabled={loading} style={{flex:1,minWidth:'200px'}}/>
              <button className="btn-primary" onClick={runEval} disabled={loading||!input.trim()} style={{padding:'10px 20px',whiteSpace:'nowrap'}}>
                {loading?'RESEARCHING...':'ANALYSE →'}
              </button>
            </div>
            <div style={{marginTop:'10px',fontFamily:'var(--font-mono)',fontSize:'9px',color:'var(--text-disabled)',lineHeight:1.7}}>
              Each evaluation costs 1 credit. Tip: press <span style={{color:'var(--text-tertiary)'}}>/</span> anywhere and type <span style={{color:'var(--text-tertiary)'}}>eval &lt;project&gt;</span>.
            </div>
          </div>

          {loading && (
            <div className="panel" style={{padding:'16px',marginBottom:'14px'}}>
              <div className="text-label" style={{marginBottom:'12px'}}>EVALUATION RUNNING</div>
              {LOADING_STEPS.map((step,i) => (
                <div key={i} className={`step-row ${i<loadStep?'done':i===loadStep?'running':''}`}>
                  <div className={`step-dot ${i<loadStep?'done':i===loadStep?'running':''}`}/>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}

          {result && !loading && (
            <div className="panel-in">
              <div className="panel" style={{padding:'18px',marginBottom:'12px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap',marginBottom:'14px'}}>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'26px',color:'var(--text-primary)'}}>{result.project_name}</div>
                  <span className={`verdict-badge verdict-${result.tier.toLowerCase()}`}>{result.tier}</span>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:'9px',color:'var(--cyan)',background:'rgba(110,201,212,0.08)',border:'1px solid rgba(110,201,212,0.2)',padding:'2px 7px',borderRadius:'2px'}}>SAMPLE DATA</span>
                  <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'4px'}}>
                    {[1,2,3,4,5,6].map(i => <span key={i} className={`score-dot ${i<=revealedDots?'score-dot-pass':'score-dot-fail'}`}/>)}
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'12px',color:tierColor,marginLeft:'6px',fontWeight:'600'}}>{result.score}/6</span>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px'}}>
                  <div className="text-label">CONFIDENCE</div>
                  <div className="conf-track"><div className="conf-fill" style={{width:`${result.confidence}%`}}/></div>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--cyan)',flexShrink:0}}>{result.confidence}%</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:'8px'}}>
                  {[{lbl:'EFFORT',val:result.effort_estimate},{lbl:'REWARD',val:result.reward_potential},{lbl:'CATEGORY',val:result.category},{lbl:'SCORE',val:result.score+'/6'}].map(m => (
                    <div key={m.lbl} style={{background:'var(--bg-elevated)',borderRadius:'3px',padding:'8px 10px'}}>
                      <div className="text-label" style={{marginBottom:'3px'}}>{m.lbl}</div>
                      <div style={{fontFamily:'var(--font-mono)',fontSize:'11px',color:'var(--text-primary)'}}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel" style={{borderLeft:`3px solid ${tierColor}`,padding:'14px 16px',marginBottom:'12px',fontFamily:'var(--font-mono)',fontSize:'11px',color:'var(--text-secondary)',lineHeight:1.8}}>{result.summary}</div>

              <div className="panel" style={{padding:'16px',marginBottom:'12px'}}>
                <div className="text-label" style={{marginBottom:'4px'}}>6-STEP EVALUATION</div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:'9px',color:'var(--text-disabled)',marginBottom:'12px'}}>Sample findings and source tags shown for layout. Live connectors replace them with fetched, cited evidence.</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'8px'}}>
                  {result.steps.map((s:any,i:number) => (
                    <div key={i} style={{padding:'10px 12px',background:'var(--bg-elevated)',borderRadius:'4px',borderLeft:`2px solid ${s.pass?'var(--working)':'var(--avoid)'}`}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                        <span style={{fontFamily:'var(--font-mono)',fontSize:'9px',color:'var(--text-disabled)',minWidth:'18px'}}>0{i+1}</span>
                        <span style={{color:s.pass?'var(--working)':'var(--avoid)',fontSize:'10px'}}>{s.pass?'✓':'✗'}</span>
                        <span style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-primary)',fontWeight:'500'}}>{s.name}</span>
                        <span style={{marginLeft:'auto',fontFamily:'var(--font-mono)',fontSize:'9px',color:s.pass?'var(--working)':'var(--avoid)',background:s.pass?'var(--working-bg)':'var(--avoid-bg)',padding:'1px 5px',borderRadius:'2px'}}>{s.pass?'PASS':'FAIL'}</span>
                      </div>
                      <div style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-tertiary)',lineHeight:1.7,paddingLeft:'26px'}}>{s.verdict}</div>
                      <div style={{paddingLeft:'26px',marginTop:'4px',display:'flex',flexWrap:'wrap',gap:'2px'}}>
                        {s.sources.map((src:string) => <span key={src} className="source-tag">{src}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel" style={{padding:'16px',marginBottom:'12px'}}>
                <div className="text-label" style={{marginBottom:'10px'}}>FARMING TASKS</div>
                {result.farming_tasks.map((t:string,i:number) => (
                  <div key={i} style={{display:'flex',gap:'10px',padding:'7px 0',borderBottom:i<result.farming_tasks.length-1?'1px solid var(--border-subtle)':'none'}}>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'9px',color:'var(--brand)',background:'var(--brand-bg)',border:'1px solid var(--brand-border)',borderRadius:'2px',padding:'1px 5px',flexShrink:0,height:'fit-content',marginTop:'1px'}}>{String(i+1).padStart(2,'0')}</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'11px',color:'var(--text-secondary)',lineHeight:1.7}}>{t}</span>
                  </div>
                ))}
              </div>

              <div className="panel" style={{padding:'16px',marginBottom:'12px'}}>
                <div className="text-label" style={{marginBottom:'10px'}}>RISK BREAKDOWN</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'12px'}}>
                  {[{lbl:'HIGH RISK',items:result.risks.high,col:'var(--avoid)'},{lbl:'MEDIUM RISK',items:result.risks.medium,col:'var(--watchlist)'},{lbl:'LOW RISK',items:result.risks.low,col:'var(--working)'}].map(r => (
                    <div key={r.lbl}>
                      <div style={{fontFamily:'var(--font-mono)',fontSize:'9px',color:r.col,marginBottom:'6px',letterSpacing:'0.08em'}}>{r.lbl}</div>
                      {r.items.length===0 ? <div style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-disabled)'}}>None</div> :
                        r.items.map((item:string) => <div key={item} style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-tertiary)',lineHeight:1.7,marginBottom:'3px'}}>· {item}</div>)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel" style={{padding:'12px 16px',marginBottom:'12px',display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}}>
                <button className="btn-primary" style={{padding:'8px 16px',fontSize:'10px'}} onClick={handleAddToPortfolio} disabled={adding||added}>{added?'✓ IN PORTFOLIO':adding?'ADDING...':'+ ADD TO PORTFOLIO'}</button>
                <button className="btn-secondary" style={{padding:'8px 12px',fontSize:'10px'}} onClick={() => { navigator.clipboard?.writeText(JSON.stringify(result,null,2)); addToast('Verdict copied to clipboard'); }}>COPY VERDICT</button>
                <button className="btn-secondary" style={{padding:'8px 12px',fontSize:'10px'}} onClick={() => { setInput(''); setResult(null); setRevealedDots(0); setAdded(false); }}>NEW EVAL</button>
              </div>
            </div>
          )}
        </div>

        <div className="desktop-only" style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <div className="panel" style={{padding:'14px'}}>
            <div className="text-label" style={{marginBottom:'10px'}}>YOUR ACTIVITY</div>
            {[
              { lbl:'Evaluations run', val: totalEvals === null ? '—' : String(totalEvals) },
              { lbl:'Evals left', val: String(userData?.eval_credits ?? 0) },
              { lbl:'Tracking slots left', val: String(userData?.tracking_credits ?? 0) },
            ].map(s => (
              <div key={s.lbl} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',padding:'5px 0',borderBottom:'1px solid var(--border-subtle)'}}>
                <span style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-tertiary)'}}>{s.lbl}</span>
                <span className="brand-text" style={{fontFamily:'var(--font-display)',fontSize:'18px'}}>{s.val}</span>
              </div>
            ))}
          </div>
          <div className="panel" style={{padding:'14px'}}>
            <div className="text-label" style={{marginBottom:'8px'}}>YOUR RECENT VERDICTS</div>
            {recent.length === 0 ? (
              <div style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-disabled)',lineHeight:1.7}}>Nothing yet. Run an evaluation and it appears here.</div>
            ) : recent.map(v => (
              <div key={v.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'5px 0',borderBottom:'1px solid var(--border-subtle)'}}>
                <span style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-secondary)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v.project_name}</span>
                <span className={`verdict-badge verdict-${(v.tier||'').toLowerCase()}`} style={{fontSize:'8px',padding:'2px 5px'}}>{v.tier}</span>
                <span style={{fontFamily:'var(--font-mono)',fontSize:'9px',color:'var(--text-tertiary)'}}>{v.score}/6</span>
              </div>
            ))}
          </div>
          <div className="panel" style={{padding:'14px'}}>
            <div className="text-label" style={{marginBottom:'8px'}}>DATA MODE</div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text-tertiary)',lineHeight:1.8}}>
              Sample data. Verdicts are generated from the project name so the whole workflow can be tested end to end. The live engine (DeFiLlama, GitHub, CoinGecko, on-chain explorers, web research) replaces this next.
            </div>
          </div>
        </div>

      </div>
      <style>{`@media(max-width:768px){.eval-grid{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
