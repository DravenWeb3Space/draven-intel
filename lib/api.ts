import { getSupabase } from './supabase-browser';

// One place for every server-side action. Screens call these, never the tables directly.
// When the real engine ships, only the implementations here change — not the screens.
export interface ApiResult { ok: boolean; error?: string; [k: string]: any }

const ERRORS: Record<string, string> = {
  unauthenticated: 'Your session expired — sign in again',
  no_credits: 'No evaluations left on your plan',
  no_slots: 'No tracking slots left — upgrade or remove a tracked project',
  already_tracked: 'Already in your portfolio',
  not_found: 'Item not found',
  invalid_payload: 'That request was not valid',
  invalid_project: 'Project name is missing',
  invalid_tier: 'Verdict data was not valid',
  invalid_outcome: 'Unknown outcome',
  invalid_status: 'Unknown status',
  empty_code: 'Enter a referral code',
  already_referred: 'You already used a referral code',
  self_referral: "You can't refer yourself",
  code_not_found: 'Referral code not found',
  email_not_verified: 'Verify your email first',
  no_profile: 'Profile not ready — refresh and try again',
  offline: 'Could not reach the server — check your connection',
  rpc_failed: 'Could not reach the server — try again',
};

export function errorMessage(code?: string): string {
  return (code && ERRORS[code]) || 'Something went wrong — try again';
}

async function rpc(name: string, args: Record<string, unknown>): Promise<ApiResult> {
  const sb = await getSupabase();
  if (!sb) return { ok: false, error: 'offline' };
  const { data, error } = await sb.rpc(name, args);
  if (error) return { ok: false, error: 'rpc_failed', detail: error.message };
  return (data ?? { ok: false, error: 'empty_response' }) as ApiResult;
}

export const recordEval = (p: object) => rpc('record_eval', { p });
export const trackProject = (p: object) => rpc('track_project', { p });
export const untrackProject = (id: string) => rpc('untrack_project', { p_id: id });
export const reportOutcome = (id: string, outcome: string) => rpc('report_outcome', { p_id: id, p_outcome: outcome });
export const setEvalStatus = (id: string, status: 'active' | 'trashed') => rpc('set_eval_status', { p_id: id, p_status: status });
export const redeemReferral = (code: string) => rpc('redeem_referral', { p_code: code });
