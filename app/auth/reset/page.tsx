'use client';
import { useEffect, useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import PasswordChecklist from '@/components/PasswordChecklist';
import { passwordValid } from '@/lib/password';
import { getSupabase } from '@/lib/supabase-browser';

type State = 'checking' | 'ready' | 'invalid' | 'done';

export default function ResetPasswordPage() {
  const [state, setState] = useState<State>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const sb = await getSupabase();
      if (!sb) { setState('invalid'); return; }
      const { data: sub } = sb.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setState('ready');
      });
      unsub = () => sub.subscription.unsubscribe();
      // getSession() waits for any automatic ?code= exchange to finish first,
      // so we only call it "invalid" after the exchange has really failed.
      const { data: { session } } = await sb.auth.getSession();
      if (session) { setState('ready'); return; }
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(code);
        setState(error ? 'invalid' : 'ready');
      } else {
        setState('invalid');
      }
    })();
    return () => { unsub?.(); };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!passwordValid(password)) { setErr('Password does not meet all the requirements below.'); return; }
    if (password !== confirm) { setErr('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const sb = await getSupabase();
      if (!sb) throw new Error('Platform is initialising. Try again shortly.');
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      setState('done');
      setTimeout(() => { window.location.href = '/evaluate'; }, 1800);
    } catch (e: any) { setErr(e.message || 'Could not update password.'); }
    setLoading(false);
  }

  return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', position:'relative' }}>
      <div style={{ position:'absolute', top:'16px', right:'16px' }}><ThemeToggle /></div>
      <div className="modal" style={{ animation:'riseIn .5s ease both' }}>
        <div className="modal-header">
          <div>
            <div className="brand-text" style={{ fontFamily:'var(--font-display)', fontSize:'16px', letterSpacing:'0.06em' }}>DRAVEN INTEL</div>
            <div className="modal-title">
              {state === 'done' ? 'PASSWORD UPDATED' : state === 'invalid' ? 'LINK EXPIRED' : 'SET NEW PASSWORD'}
            </div>
          </div>
        </div>
        <div className="modal-body">
          {state === 'checking' && (
            <div style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-tertiary)', textAlign:'center', padding:'20px 0', animation:'pulse 1.5s ease infinite' }}>VERIFYING SECURE LINK...</div>
          )}

          {state === 'invalid' && (
            <div style={{ textAlign:'center' }}>
              <p style={{ color:'var(--text-secondary)', fontSize:'12px', lineHeight:1.8, marginBottom:'16px' }}>
                This reset link is invalid or has expired. Reset links work once, and only in the same browser you requested them from. Request a fresh one.
              </p>
              <a href="/" className="btn-primary" style={{ textDecoration:'none', width:'100%' }}>BACK TO SIGN IN →</a>
            </div>
          )}

          {state === 'done' && (
            <div style={{ textAlign:'center', padding:'8px 0' }}>
              <svg width="52" height="52" viewBox="0 0 52 52" style={{ margin:'0 auto 14px', display:'block' }}>
                <circle cx="26" cy="26" r="24" fill="none" stroke="var(--working)" strokeWidth="2"/>
                <polyline points="14,26 22,34 38,18" fill="none" stroke="var(--working)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <p style={{ color:'var(--text-secondary)', fontSize:'12px', lineHeight:1.8 }}>Your password was changed. Taking you to the platform...</p>
            </div>
          )}

          {state === 'ready' && (
            <form onSubmit={submit}>
              <div style={{ marginBottom:'6px' }}>
                <label className="text-label" style={{ display:'block', marginBottom:'5px' }}>NEW PASSWORD</label>
                <div style={{ position:'relative' }}>
                  <input type={showPw ? 'text' : 'password'} required className="input-primary" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a strong password" autoComplete="new-password" style={{ paddingRight:'56px' }} />
                  <button type="button" onClick={() => setShowPw(s => !s)} style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-tertiary)' }}>{showPw ? 'HIDE' : 'SHOW'}</button>
                </div>
                <PasswordChecklist password={password} />
              </div>
              <div style={{ margin:'14px 0 6px' }}>
                <label className="text-label" style={{ display:'block', marginBottom:'5px' }}>CONFIRM PASSWORD</label>
                <input type={showPw ? 'text' : 'password'} required className="input-primary" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
              </div>
              {err && <div style={{ color:'var(--avoid)', fontFamily:'var(--font-mono)', fontSize:'11px', margin:'10px 0', lineHeight:1.6 }}>{err}</div>}
              <button type="submit" className="btn-primary" style={{ width:'100%', marginTop:'14px' }} disabled={loading || !passwordValid(password) || password !== confirm}>
                {loading ? 'UPDATING...' : 'UPDATE PASSWORD →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
