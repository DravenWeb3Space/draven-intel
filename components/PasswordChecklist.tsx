'use client';
import { PASSWORD_RULES } from '@/lib/password';

export default function PasswordChecklist({ password }: { password: string }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 10px', marginTop:'8px' }}>
      {PASSWORD_RULES.map(r => {
        const ok = r.test(password);
        return (
          <div key={r.id} style={{ display:'flex', alignItems:'center', gap:'6px', fontFamily:'var(--font-mono)', fontSize:'9px', color: ok ? 'var(--working)' : 'var(--text-tertiary)', transition:'color .2s' }}>
            <span style={{ width:'10px', textAlign:'center' }}>{ok ? '✓' : '○'}</span>
            <span>{r.label}</span>
          </div>
        );
      })}
    </div>
  );
}
