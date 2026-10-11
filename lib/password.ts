// One source of truth for password rules — used by signup and password reset.
// NOTE: client-side checks are UX only. The same rule must ALSO be set in
// Supabase (Authentication → Sign In / Providers → Email → Password requirements)
// or anyone can bypass this by calling the API directly.
export const PASSWORD_RULES = [
  { id: 'len',     label: '8+ characters',          test: (p: string) => p.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter',   test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'One lowercase letter',   test: (p: string) => /[a-z]/.test(p) },
  { id: 'digit',   label: 'One number',             test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character',  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function passwordValid(p: string): boolean {
  return PASSWORD_RULES.every(r => r.test(p));
}
