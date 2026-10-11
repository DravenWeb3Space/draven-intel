import { redeemReferral, errorMessage } from './api';

export interface RedeemResult {
  success: boolean;
  message: string;
  newEvalCredits?: number;
  retryable?: boolean;
}

// All referral rules (who gets what, when, daily caps) live in the database function
// `redeem_referral` and the trigger that rewards the referrer. Nothing is decided here.
export async function redeemReferralCode(_userId: string, _ownCode: string | null, entered: string): Promise<RedeemResult> {
  const code = entered.trim().toUpperCase();
  if (!code) return { success: false, message: errorMessage('empty_code') };
  const r = await redeemReferral(code);
  if (!r.ok) {
    return { success: false, message: errorMessage(r.error), retryable: ['offline', 'rpc_failed', 'no_profile'].includes(r.error || '') };
  }
  return {
    success: true,
    message: `Referral applied — +${r.invitee_bonus} evaluations added. Your referrer is rewarded after you complete an evaluation.`,
    newEvalCredits: r.credits_left,
  };
}
