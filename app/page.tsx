'use client';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import PasswordChecklist from '@/components/PasswordChecklist';
import { passwordValid } from '@/lib/password';
import { getSupabase } from '@/lib/supabase-browser';

const PLANS = [
  { id:'free', label:'Free', price_inr:0, evals:3, tracking:2, note:'Static tracking' },
  { id:'monthly', label:'Monthly', price_inr:999, evals:20, tracking:8, note:'Monitoring when live' },
  { id:'3month', label:'3 Month', price_inr:2599, evals:50, tracking:20, note:'Monitoring when live' },
  { id:'6month', label:'6 Month', price_inr:4599, evals:100, tracking:40, note:'Monitoring when live' },
  { id:'annual', label:'Annual', price_inr:7999, evals:200, tracking:75, note:'Monitoring when live' },
];

const STEPS = [
  { n:'01', title:'Project Overview & Landscape', body:'What the project actually does, the problem it solves, and how it stands against named competitors.', src:['DeFiLlama','CoinGecko','Official docs'] },
  { n:'02', title:'Funding, Investors & Regulatory Risk', body:'Verified round size, investor tier, and KYC or geo-restriction flags that could block you from claiming.', src:['DeFiLlama raises','Announcements','Terms pages'] },
  { n:'03', title:'Airdrop Potential & Effort–Reward', body:'Is there an active campaign, what share goes to the community, and what a realistic daily time investment returns.', src:['Galxe','Layer3','Zealy'] },
  { n:'04', title:'Community & On-Chain Signals', body:'TVL trajectory, wallet counts, transaction volume and testnet participation — measured, not claimed.', src:['DeFiLlama','Blockscout / Etherscan','GitHub','Discord'] },
  { n:'05', title:'Team Transparency & Security', body:'Named audits with scores, open-source code quality, and verifiable team identities.', src:['Audit reports','GitHub','Team pages'] },
  { n:'06', title:'Risk Synthesis & Verdict', body:'Everything weighed into one score out of six. 5–6 is Working, 4 is Watchlist, 0–3 is Avoid.', src:['Rule-based score from steps 1–5'] },
];

const LAYERS = [
  { icon:'⚡', title:'EVALUATION ENGINE', status:'PREVIEW', body:'Paste a project URL or name. Six steps across fundamentals, on-chain data, security and live campaigns return a scored verdict with every claim tied to where it came from.' },
  { icon:'◈', title:'AUTONOMOUS MONITORING', status:'IN DEVELOPMENT', body:'Tracked projects re-enter the loop on a cadence — Working daily plus weekly full rescan, Watchlist weekly, Avoid bi-weekly to catch reversals. A project that changes tier moves, and you are told.' },
  { icon:'◉', title:'PROOF OF WORK LEDGER', status:'PREVIEW', body:'Every verdict is timestamped and logged. Report outcomes — TGE success, delayed, rugged — and accuracy is computed from reported results. The scoring method is shown on the page.' },
];

const SOURCE_GROUPS = [
  { group:'FREE STRUCTURED DATA', items:['DeFiLlama','CoinGecko','GitHub','Blockscout / Etherscan','Discord invites'] },
  { group:'WEB RESEARCH', items:['Galxe','Layer3','Zealy','Official announcements'] },
  { group:'SECURITY', items:['Published audit reports','Slowmist','PeckShield','CertiK public pages'] },
  { group:'AFTER TOKEN LAUNCH', items:['DexScreener','GoPlus token risk','Snapshot governance'] },
];

const COMPARE = [
  { manual:'Ten-plus tabs per project, re-checked by hand', dv:'One scored verdict with sources attached' },
  { manual:'Alpha groups with no accountability', dv:'Every verdict logged; accuracy from reported outcomes' },
  { manual:'Stale by the time you read it', dv:'Tracked projects re-scanned on a schedule' },
  { manual:'Effort versus reward is a guess', dv:'Effort and reward estimated per project' },
];

const ROADMAP = ['Live evaluation engine','Autonomous monitoring','Telegram alerts','Discovery agent — finds airdrops for you','Multi-currency payments'];

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) { try { localStorage.setItem('draven_ref_code', ref.trim().toUpperCase()); } catch {} }
  }, []);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Scroll-reveal: sections fade/rise into view as they enter the viewport.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'));
    if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const wrap: React.CSSProperties = { maxWidth:'980px', margin:'0 auto', padding:'0 24px' };

  return (
    <div style={{ minHeight:'100vh' }}>
      <noscript><style>{`.reveal{opacity:1!important;transform:none!important;}`}</style></noscript>
      <style>{`
        .lp-links { display:flex; }
        .lp-badge, .lp-time { display:inline-flex; }
        @media (max-width: 760px) { .lp-links { display:none !important; } }
        @media (max-width: 460px) { .lp-badge { display:none !important; } }
        @media (max-width: 400px) { .lp-time { display:none !important; } }
        @media (max-width: 350px) { .lp-signin { display:none !important; } }
        .lp-link { font-family:var(--font-mono); font-size:10px; color:var(--text-tertiary); text-decoration:none; letter-spacing:0.06em; transition:color .2s; }
        .lp-link:hover { color:var(--brand); }
      `}</style>

      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:40, background:'color-mix(in srgb, var(--bg-base) 88%, transparent)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)', borderBottom:'1px solid var(--border-default)', height:'50px' }}>
        <div style={{ ...wrap, height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth:0 }}>
            <div className="brand-text" style={{ fontFamily:'var(--font-display)', fontSize:'22px', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>DRAVEN INTEL</div>
            <span className="lp-badge" style={{ alignItems:'center', gap:'5px', background:'var(--brand-bg)', border:'1px solid var(--brand-border)', borderRadius:'10px', padding:'2px 9px', flexShrink:0 }}>
              <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'var(--brand)', boxShadow:'var(--brand-glow)', display:'inline-block', animation:'pulse 2s ease infinite' }}/>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--brand)', letterSpacing:'0.08em' }}>BETA</span>
            </span>
          </div>
          <div className="lp-links" style={{ alignItems:'center', gap:'22px' }}>
            <a className="lp-link" href="#framework">FRAMEWORK</a>
            <a className="lp-link" href="#sources">SOURCES</a>
            <a className="lp-link" href="#pricing">PRICING</a>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>
            <span className="lp-time" style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-tertiary)' }}>{time}</span>
            <ThemeToggle />
            <button className="btn-secondary lp-signin" style={{ padding:'5px 12px', fontSize:'10px' }} onClick={() => setAuthOpen(true)}>Sign In</button>
            <button className="btn-primary" style={{ padding:'6px 14px', fontSize:'10px' }} onClick={() => setAuthOpen(true)}>Start Free →</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ position:'relative', overflow:'hidden' }}>
        <div className="grid-bg" style={{ position:'absolute', inset:0, pointerEvents:'none' }} />
        <div className="glow-orb" style={{ width:'520px', height:'520px', top:'-160px', left:'50%', marginLeft:'-260px' }} />
        <div style={{ ...wrap, position:'relative', padding:'72px 24px 56px' }}>
          <div className="rise" style={{ display:'inline-flex', alignItems:'center', gap:'7px', background:'var(--brand-bg)', border:'1px solid var(--brand-border)', borderRadius:'3px', padding:'4px 12px', marginBottom:'22px' }}>
            <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'var(--brand)', boxShadow:'var(--brand-glow)', display:'inline-block', animation:'pulse 2s ease infinite' }}/>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--brand)', letterSpacing:'0.1em' }}>PRIVATE BETA · AES v5</span>
          </div>
          <h1 className="rise rise-d1" style={{ fontFamily:'var(--font-display)', fontSize:'clamp(46px,8vw,92px)', lineHeight:0.95, color:'var(--text-primary)', marginBottom:'20px' }}>
            INSTITUTIONAL<br/><span className="brand-text">AIRDROP</span><br/>INTELLIGENCE
          </h1>
          <p className="rise rise-d2" style={{ fontSize:'clamp(14px,2vw,17px)', color:'var(--text-secondary)', lineHeight:1.75, maxWidth:'560px', marginBottom:'30px' }}>
            Research any airdrop through a six-step, multi-source framework. Every claim cited. Every verdict logged. Every tracked project re-checked.
          </p>
          <div className="rise rise-d3" style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'30px' }}>
            <button className="btn-primary" style={{ padding:'14px 30px', fontSize:'11px' }} onClick={() => setAuthOpen(true)}>START FREE — 3 EVALUATIONS →</button>
            <a href="#framework" className="btn-secondary" style={{ padding:'14px 20px', textDecoration:'none' }}>HOW IT WORKS</a>
          </div>
          <div className="rise rise-d3" style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'18px', fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-secondary)' }}>
            <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'var(--watchlist)', display:'inline-block', animation:'pulse 2s ease infinite' }}/>
            Private beta — evaluations currently run on sample data while live connectors ship.
          </div>
          <div className="rise rise-d4" style={{ display:'flex', flexWrap:'wrap', gap:'18px', fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-tertiary)' }}>
            {['6-step framework','Multi-source evidence','Every claim cited','Timestamped verdict ledger'].map(f => (
              <span key={f} style={{ display:'flex', alignItems:'center', gap:'5px' }}><span style={{ color:'var(--brand)' }}>✓</span>{f}</span>
            ))}
          </div>
        </div>
      </header>

      {/* SAMPLE RESULT */}
      <section style={{ ...wrap, paddingBottom:'64px' }}>
        <div className="panel reveal" style={{ borderRadius:'8px' }}>
          <div style={{ background:'var(--bg-elevated)', borderBottom:'1px solid var(--border-subtle)', padding:'9px 14px', display:'flex', alignItems:'center', gap:'7px' }}>
            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'var(--avoid)', display:'inline-block' }}/>
            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'var(--watchlist)', display:'inline-block' }}/>
            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'var(--working)', display:'inline-block' }}/>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-tertiary)', marginLeft:'6px' }}>DRAVEN INTEL · EVALUATION ENGINE · SAMPLE RESULT</span>
          </div>
          <div style={{ padding:'18px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px', flexWrap:'wrap' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'24px', color:'var(--text-primary)' }}>LayerZero</div>
              <span className="verdict-badge verdict-working">WORKING</span>
              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'4px' }}>
                {[1,2,3,4,5,6].map(i => <span key={i} className={`score-dot ${i<=5?'score-dot-pass':'score-dot-fail'}`}/>)}
                <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-secondary)', marginLeft:'4px' }}>5/6</span>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'5px', marginBottom:'10px' }}>
              {[
                { name:'Project Overview', pass:true, src:'messari.io' },
                { name:'Funding & Investors', pass:true, src:'crunchbase.com' },
                { name:'Airdrop Campaign', pass:true, src:'galxe.com' },
                { name:'Community & On-Chain', pass:true, src:'defillama.com' },
                { name:'Team & Security', pass:true, src:'certik.com' },
                { name:'Risk Synthesis', pass:false, src:'' },
              ].map(s => (
                <div key={s.name} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'6px 9px', background:'var(--bg-elevated)', borderRadius:'3px', borderLeft:`2px solid ${s.pass?'var(--working)':'var(--avoid)'}` }}>
                  <span style={{ color:s.pass?'var(--working)':'var(--avoid)', fontSize:'9px', flexShrink:0 }}>{s.pass?'✓':'✗'}</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-secondary)', flex:1 }}>{s.name}</span>
                  {s.src && <span className="source-tag">{s.src}</span>}
                </div>
              ))}
            </div>
            <div style={{ padding:'9px 11px', background:'var(--brand-bg)', border:'1px solid var(--brand-border)', borderRadius:'3px' }}>
              <div className="text-label" style={{ marginBottom:'2px', color:'var(--brand)' }}>TODAY'S FARMING TASK</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-primary)' }}>Complete daily bridge task on Galxe campaign (est. 5 min)</div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE LAYERS */}
      <section id="engine" style={{ borderTop:'1px solid var(--border-subtle)', padding:'56px 0' }}>
        <div style={wrap}>
          <div className="text-label reveal" style={{ textAlign:'center', marginBottom:'10px' }}>THE PLATFORM</div>
          <h2 className="reveal reveal-d1" style={{ fontFamily:'var(--font-display)', fontSize:'clamp(28px,4.4vw,42px)', textAlign:'center', marginBottom:'12px' }}>THREE LAYERS OF INTELLIGENCE</h2>
          <p className="reveal reveal-d2" style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:'13px', lineHeight:1.8, maxWidth:'560px', margin:'0 auto 36px' }}>
            Farming a serious airdrop means research, then monitoring, then proof you were right. Draven Intel is built around that loop.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:'14px' }}>
            {LAYERS.map((f, i) => (
              <div key={f.title} className={`panel hover-lift reveal reveal-d${i+1}`} style={{ padding:'22px', borderRadius:'6px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
                  <span style={{ fontSize:'24px', color:'var(--brand)' }}>{f.icon}</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'8px', letterSpacing:'0.1em', padding:'2px 7px', borderRadius:'2px', background:'var(--brand-bg)', border:'1px solid var(--brand-border)', color:'var(--brand)' }}>{f.status}</span>
                </div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'18px', color:'var(--text-primary)', marginBottom:'9px' }}>{f.title}</div>
                <p style={{ fontSize:'12px', color:'var(--text-secondary)', lineHeight:1.85 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIX-STEP FRAMEWORK */}
      <section id="framework" style={{ borderTop:'1px solid var(--border-subtle)', padding:'56px 0' }}>
        <div style={wrap}>
          <div className="text-label reveal" style={{ textAlign:'center', marginBottom:'10px' }}>THE FRAMEWORK</div>
          <h2 className="reveal reveal-d1" style={{ fontFamily:'var(--font-display)', fontSize:'clamp(28px,4.4vw,42px)', textAlign:'center', marginBottom:'12px' }}>SIX STEPS. EVERY TIME.</h2>
          <p className="reveal reveal-d2" style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:'13px', lineHeight:1.8, maxWidth:'580px', margin:'0 auto 36px' }}>
            The same checklist runs on every project, so verdicts are comparable and nothing is skipped because a project looked exciting.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))', gap:'12px' }}>
            {STEPS.map((s, i) => (
              <div key={s.n} className={`panel hover-lift reveal reveal-d${(i%3)+1}`} style={{ padding:'18px 18px 16px', borderRadius:'6px' }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:'10px', marginBottom:'8px' }}>
                  <span className="brand-text" style={{ fontFamily:'var(--font-display)', fontSize:'26px', lineHeight:1 }}>{s.n}</span>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:'16px', color:'var(--text-primary)', lineHeight:1.15 }}>{s.title}</span>
                </div>
                <p style={{ fontSize:'12px', color:'var(--text-secondary)', lineHeight:1.75, marginBottom:'12px' }}>{s.body}</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                  {s.src.map(x => <span key={x} style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-tertiary)', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', padding:'2px 7px', borderRadius:'2px' }}>{x}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section style={{ borderTop:'1px solid var(--border-subtle)', padding:'56px 0' }}>
        <div style={wrap}>
          <div className="text-label reveal" style={{ textAlign:'center', marginBottom:'10px' }}>WHAT IT REPLACES</div>
          <h2 className="reveal reveal-d1" style={{ fontFamily:'var(--font-display)', fontSize:'clamp(28px,4.4vw,42px)', textAlign:'center', marginBottom:'32px' }}>THE MANUAL RESEARCH LOOP</h2>
          <div className="panel reveal reveal-d2" style={{ borderRadius:'6px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', background:'var(--bg-elevated)', borderBottom:'1px solid var(--border-subtle)' }}>
              <div className="text-label" style={{ padding:'10px 16px' }}>DOING IT BY HAND</div>
              <div className="text-label" style={{ padding:'10px 16px', color:'var(--brand)' }}>WITH DRAVEN INTEL</div>
            </div>
            {COMPARE.map((c, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom: i < COMPARE.length-1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ padding:'13px 16px', fontSize:'12px', color:'var(--text-tertiary)', lineHeight:1.6 }}>{c.manual}</div>
                <div style={{ padding:'13px 16px', fontSize:'12px', color:'var(--text-primary)', lineHeight:1.6, borderLeft:'1px solid var(--border-subtle)' }}>{c.dv}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOURCES */}
      <section id="sources" style={{ borderTop:'1px solid var(--border-subtle)', padding:'56px 0' }}>
        <div style={wrap}>
          <div className="text-label reveal" style={{ textAlign:'center', marginBottom:'10px' }}>SOURCE MAP</div>
          <h2 className="reveal reveal-d1" style={{ fontFamily:'var(--font-display)', fontSize:'clamp(28px,4.4vw,42px)', textAlign:'center', marginBottom:'12px' }}>FOUR ANGLES, CROSS-CHECKED</h2>
          <p className="reveal reveal-d2" style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:'13px', lineHeight:1.8, maxWidth:'560px', margin:'0 auto 32px' }}>
            Public data only — no paid terminals. Fundamentals, on-chain behaviour, security and live campaigns are cross-checked against each other. Connectors ship in stages.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'12px' }}>
            {SOURCE_GROUPS.map((g, i) => (
              <div key={g.group} className={`panel reveal reveal-d${(i%3)+1}`} style={{ padding:'16px', borderRadius:'6px' }}>
                <div className="text-label" style={{ color:'var(--brand)', marginBottom:'12px' }}>{g.group}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                  {g.items.map(x => (
                    <div key={x} style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-secondary)' }}>
                      <span style={{ width:'4px', height:'4px', background:'var(--brand)', borderRadius:'50%', flexShrink:0 }}/>{x}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section style={{ borderTop:'1px solid var(--border-subtle)', padding:'44px 0' }}>
        <div style={wrap}>
          <div className="reveal" style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:'10px 14px', justifyContent:'center' }}>
            <span className="text-label" style={{ color:'var(--brand)' }}>IN THE PIPELINE</span>
            {ROADMAP.map(r => (
              <span key={r} style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-secondary)', border:'1px solid var(--border-default)', borderRadius:'3px', padding:'4px 10px' }}>{r}</span>
            ))}
          </div>
          <p className="reveal reveal-d1" style={{ textAlign:'center', fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-disabled)', marginTop:'12px' }}>Roadmap — subject to change.</p>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ borderTop:'1px solid var(--border-subtle)', padding:'56px 0 80px' }}>
        <div style={wrap}>
          <div className="text-label reveal" style={{ textAlign:'center', marginBottom:'10px' }}>PRICING</div>
          <h2 className="reveal reveal-d1" style={{ fontFamily:'var(--font-display)', fontSize:'clamp(28px,4.4vw,42px)', textAlign:'center', marginBottom:'6px' }}>SCALE WITH YOUR FARMING.</h2>
          <p className="reveal reveal-d2" style={{ textAlign:'center', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)', fontSize:'10px', marginBottom:'32px' }}>All prices in INR. No hidden fees. Cancel anytime.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'10px' }}>
            {PLANS.map((p, i) => (
              <div key={p.id} className={`hover-lift reveal reveal-d${(i%3)+1}`} style={{ background:p.id==='6month'?'var(--brand-bg)':'var(--bg-panel)', border:`1px solid ${p.id==='6month'?'var(--brand-border)':'var(--border-default)'}`, borderRadius:'6px', padding:'18px 16px', position:'relative', boxShadow:'var(--shadow-card)' }}>
                {p.id==='6month' && <div style={{ position:'absolute', top:'-9px', left:'50%', transform:'translateX(-50%)', background:'var(--brand-grad)', color:'var(--on-brand)', fontFamily:'var(--font-mono)', fontSize:'8px', fontWeight:700, padding:'2px 9px', borderRadius:'2px', whiteSpace:'nowrap' }}>BEST VALUE</div>}
                <div style={{ fontFamily:'var(--font-display)', fontSize:'16px', color:'var(--text-primary)', marginBottom:'5px' }}>{p.label.toUpperCase()}</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'26px', marginBottom:'10px' }} className={p.id==='6month'?'brand-text':''}>{p.price_inr===0?'FREE':'₹'+p.price_inr.toLocaleString('en-IN')}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--brand)', marginBottom:'4px' }}>{p.evals} evals · {p.tracking} tracked</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-tertiary)', marginBottom:'14px' }}>{p.note}</div>
                <button className={p.id==='6month'?'btn-primary':'btn-secondary'} style={{ width:'100%', fontSize:'9px', padding:'8px' }} onClick={() => setAuthOpen(true)}>
                  {p.id==='free'?'START FREE':'GET STARTED'} →
                </button>
              </div>
            ))}
          </div>
          <p className="reveal" style={{ textAlign:'center', fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-disabled)', marginTop:'16px' }}>Payments and autonomous monitoring open after private beta. Every account starts on Free.</p>
        </div>
      </section>

      <footer style={{ borderTop:'1px solid var(--border-subtle)', padding:'26px 0' }}>
        <div style={{ ...wrap, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <div className="brand-text" style={{ fontFamily:'var(--font-display)', fontSize:'18px', marginBottom:'4px' }}>DRAVEN INTEL</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:'8px', color:'var(--text-disabled)' }}>© 2026 Draven Intel · Institutional Airdrop Intelligence</div>
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'8px', color:'var(--text-disabled)', maxWidth:'420px', lineHeight:1.7 }}>
            Verdicts are research, not financial advice or a guarantee of any airdrop. Crypto assets carry significant risk.
          </div>
        </div>
      </footer>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}

type AuthView = 'signup' | 'signin' | 'forgot';

function AuthModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<AuthView>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [signedUp, setSignedUp] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [refCode, setRefCode] = useState('');

  useEffect(() => {
    try { setRefCode(localStorage.getItem('draven_ref_code') || ''); } catch {}
  }, []);

  function switchView(v: AuthView) { setView(v); setErr(''); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (view === 'signup' && !passwordValid(password)) { setErr('Password does not meet all the requirements below.'); return; }
    setLoading(true);
    try {
      const sb = await getSupabase();
      if (!sb) throw new Error('Platform is initialising. Try again shortly.');
      const origin = window.location.origin;
      if (view === 'signup') {
        const { error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${origin}/auth/callback` } });
        if (error) throw error;
        setSignedUp(true);
      } else if (view === 'signin') {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/evaluate';
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/reset` });
        if (error) throw error;
        setResetSent(true);
      }
    } catch (e: any) { setErr(e.message || 'Something went wrong.'); }
    setLoading(false);
  }

  async function google() {
    setErr('');
    try {
      const sb = await getSupabase();
      if (!sb) throw new Error('Platform is initialising. Try again shortly.');
      const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw error;
    } catch (e: any) { setErr(e.message || 'Google sign-in is unavailable right now.'); }
  }

  const title = signedUp ? 'CHECK YOUR EMAIL' : resetSent ? 'RESET LINK SENT' : view === 'signup' ? 'CREATE ACCOUNT' : view === 'signin' ? 'SIGN IN' : 'RESET PASSWORD';
  const done = signedUp || resetSent;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn-ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          {done ? (
            <div style={{ textAlign:'center', padding:'16px 0 4px' }}>
              <svg width="52" height="52" viewBox="0 0 52 52" style={{ margin:'0 auto 16px', display:'block' }}>
                <circle cx="26" cy="26" r="24" fill="none" stroke="var(--working)" strokeWidth="2"/>
                <polyline points="14,26 22,34 38,18" fill="none" stroke="var(--working)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <p style={{ color:'var(--text-secondary)', fontSize:'12px', lineHeight:1.8 }}>
                {signedUp
                  ? <>We sent a confirmation link to<br/><strong style={{ color:'var(--text-primary)' }}>{email}</strong><br/>Open it to activate your account, then sign in.</>
                  : <>If an account exists for<br/><strong style={{ color:'var(--text-primary)' }}>{email}</strong><br/>a password reset link is on its way. It opens a secure page to set a new password.</>}
              </p>
              <button className="btn-secondary" style={{ marginTop:'18px', width:'100%' }} onClick={() => { setSignedUp(false); setResetSent(false); switchView('signin'); }}>BACK TO SIGN IN</button>
            </div>
          ) : (
            <>
              {view !== 'forgot' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px', background:'var(--bg-elevated)', borderRadius:'4px', padding:'3px', marginBottom:'18px' }}>
                  {(['signup','signin'] as const).map(t => (
                    <button key={t} onClick={() => switchView(t)} style={{ padding:'7px', borderRadius:'3px', border:'none', cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:'10px', background:view===t?'var(--bg-panel)':'transparent', color:view===t?'var(--brand)':'var(--text-tertiary)', borderBottom:view===t?'2px solid var(--brand)':'2px solid transparent' }}>
                      {t==='signup'?'CREATE ACCOUNT':'SIGN IN'}
                    </button>
                  ))}
                </div>
              )}

              {view === 'forgot' && (
                <p style={{ color:'var(--text-secondary)', fontSize:'12px', lineHeight:1.7, marginBottom:'16px' }}>
                  Enter your account email. We will send a secure link to set a new password.
                </p>
              )}

              {view !== 'forgot' && (
                <>
                  <button type="button" onClick={google} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'10px', borderRadius:'4px', border:'1px solid var(--border-strong)', background:'var(--bg-elevated)', color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontSize:'11px', cursor:'pointer', transition:'border-color .2s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand-border)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google
                  </button>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', margin:'14px 0' }}>
                    <div style={{ flex:1, height:'1px', background:'var(--border-subtle)' }}/>
                    <span className="text-label">OR EMAIL</span>
                    <div style={{ flex:1, height:'1px', background:'var(--border-subtle)' }}/>
                  </div>
                </>
              )}

              <form onSubmit={submit}>
                <div style={{ marginBottom:'12px' }}>
                  <label className="text-label" style={{ display:'block', marginBottom:'5px' }}>EMAIL</label>
                  <input type="email" required className="input-primary" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </div>

                {view !== 'forgot' && (
                  <div style={{ marginBottom: view === 'signup' ? '6px' : '10px' }}>
                    <label className="text-label" style={{ display:'block', marginBottom:'5px' }}>PASSWORD</label>
                    <div style={{ position:'relative' }}>
                      <input type={showPw ? 'text' : 'password'} required className="input-primary" value={password} onChange={e => setPassword(e.target.value)} placeholder={view==='signup' ? 'Create a strong password' : 'Your password'} autoComplete={view==='signup' ? 'new-password' : 'current-password'} style={{ paddingRight:'56px' }} />
                      <button type="button" onClick={() => setShowPw(s => !s)} style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-tertiary)' }}>{showPw ? 'HIDE' : 'SHOW'}</button>
                    </div>
                    {view === 'signup' && <PasswordChecklist password={password} />}
                  </div>
                )}

                {view === 'signin' && (
                  <div style={{ textAlign:'right', marginBottom:'12px' }}>
                    <button type="button" onClick={() => switchView('forgot')} style={{ background:'transparent', border:'none', cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--brand)' }}>Forgot password?</button>
                  </div>
                )}

                {view === 'signup' && refCode && (
                  <div style={{ margin:'12px 0', padding:'7px 10px', background:'var(--brand-bg)', border:'1px solid var(--brand-border)', borderRadius:'3px', fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--brand)' }}>
                    Referral code {refCode} will be applied after you sign in.
                  </div>
                )}

                {err && <div style={{ color:'var(--avoid)', fontFamily:'var(--font-mono)', fontSize:'11px', margin:'10px 0', lineHeight:1.6 }}>{err}</div>}

                <button type="submit" className="btn-primary" style={{ width:'100%', marginTop: view==='signup' ? '12px' : '4px' }} disabled={loading || (view==='signup' && !passwordValid(password))}>
                  {loading ? 'PLEASE WAIT...' : view==='signup' ? 'CREATE ACCOUNT →' : view==='signin' ? 'SIGN IN →' : 'SEND RESET LINK →'}
                </button>

                {view === 'forgot' && (
                  <button type="button" className="btn-ghost" onClick={() => switchView('signin')} style={{ width:'100%', marginTop:'10px', fontFamily:'var(--font-mono)', fontSize:'10px' }}>← Back to sign in</button>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
