/** Safe, actionable Firebase Auth messages without exposing account existence. */
export function getEmailAuthError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? '';
  if (code.includes('invalid-email')) return 'Enter a valid email address.';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found') || code.includes('user-disabled')) {
    return 'Unable to sign in. Check your email and password, or use Forgot Password.';
  }
  if (code.includes('operation-not-allowed')) return 'Email/Password sign-in is not enabled in Firebase Authentication. An administrator must enable it in Sign-in method.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Please try again later or reset your password.';
  if (code.includes('network-request-failed')) return 'Network connection failed. Check your internet and try again.';
  if (code.includes('weak-password')) return 'Choose a stronger password (at least 8 characters).';
  if (code.includes('email-already-in-use')) return 'This email is already registered. Sign in or use Forgot Password instead.';
  if (code.includes('requires-recent-login')) return 'For your security, sign out and sign in again before continuing.';
  if (code.includes('unauthorized-domain')) return 'Site domain not authorized in Firebase. Add this GitHub Pages domain under Authentication > Settings > Authorized domains.';
  return 'Could not complete authentication. Verify Firebase settings and try again.';
}
