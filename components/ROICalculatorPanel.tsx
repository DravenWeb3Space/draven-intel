'use client';
import { useState } from 'react';

// Assumed hit-rate: share of evaluated projects that reach Working tier.
// This is a stated assumption for illustration, not measured platform
// statistics (no real usage data exists yet in mock mode). Shown in the
// disclaimer below so it stays auditable.
const HIT_RATE = 0.35;

export default function ROICalculatorPanel() {
  const [projectsPerMonth, setProjectsPerMonth] = useState(20);
  const [allocation, setAllocation] = useState(150);
  const [multiplier, setMultiplier] = useState(8);

  const workingProjects = Math.round(projectsPerMonth * HIT_RATE);
  const capitalDeployed = projectsPerMonth * allocation;
  const projectedReturn = workingProjects * allocation * multiplier;
  const roi = capitalDeployed > 0 ? Math.round(((projectedReturn - capitalDeployed) / capitalDeployed) * 100) : 0;

  const sliders = [
    { lbl:'PROJECTS EVALUATED PER MONTH', val:projectsPerMonth, set:setProjectsPerMonth, min:5, max:100, step:1, suffix:'' },
    { lbl:'ALLOCATION PER PROJECT (USD)', val:allocation, set:setAllocation, min:50, max:500, step:10, suffix:'' },
    { lbl:'EXPECTED MULTIPLIER ON WORKING PROJECTS', val:multiplier, set:setMultiplier, min:2, max:50, step:1, suffix:'x' },
  ];

  const results = [
    { lbl:'PROJECTED RETURN', val:`$${projectedReturn.toLocaleString()}`, cls:'brand-text' },
    { lbl:'ROI', val:`${roi>=0?'+':''}${roi}%`, col: roi>=0?'var(--working)':'var(--avoid)' },
    { lbl:'CAPITAL DEPLOYED', val:`$${capitalDeployed.toLocaleString()}`, col:'var(--text-primary)' },
    { lbl:'WORKING PROJECTS', val: String(workingProjects), col:'var(--cyan)' },
  ];

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ marginBottom:'20px' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'26px', color:'var(--text-primary)' }}>ROI CALCULATOR</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-tertiary)' }}>Project your airdrop farming returns</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'12px', marginBottom:'24px' }}>
        {results.map(s => (
          <div key={s.lbl} className="panel" style={{ padding:'16px' }}>
            <div className={s.cls} style={{ fontFamily:'var(--font-display)', fontSize:'24px', color:s.col }}>{s.val}</div>
            <div className="text-label" style={{ marginTop:'4px' }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ padding:'20px' }}>
        {sliders.map(slider => (
          <div key={slider.lbl} style={{ marginBottom:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px', flexWrap:'wrap', gap:'4px' }}>
              <span className="text-label">{slider.lbl}</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'12px', color:'var(--brand)' }}>{slider.val}{slider.suffix}</span>
            </div>
            <input type="range" min={slider.min} max={slider.max} step={slider.step} value={slider.val}
              onChange={e => slider.set(Number(e.target.value))}
              style={{ width:'100%', accentColor:'#c9a06a' }}/>
          </div>
        ))}
      </div>

      <div style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-disabled)', marginTop:'14px', lineHeight:1.7 }}>
        Illustrative estimate only — assumes {Math.round(HIT_RATE*100)}% of evaluated projects reach Working tier, a stated assumption not yet backed by real platform usage data. Not a guarantee of returns. Crypto markets carry significant risk.
      </div>
    </div>
  );
}
