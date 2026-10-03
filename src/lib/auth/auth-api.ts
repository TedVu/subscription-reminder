// Email-code sign-in (user-auth spec). Wraps Supabase Auth and turns its
// errors into messages the sign-in screen can show directly.

import type { AuthError } from '@supabase/supabase-js';
import { z } from 'zod';

import { supabase } from '../supabase/client';

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');
export const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code from the email');

export type AuthResult = { ok: true } | { ok: false; message: string };

export function authErrorMessage(error: Pick<AuthError, 'code' | 'status' | 'message'>): string {
  switch (error.code) {
    case 'otp_expired':
      return 'That code is wrong or has expired. Check it, or send a new code.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many codes requested. Wait a minute, then try again.';
    case 'email_address_invalid':
    case 'validation_failed':
      return 'Enter a valid email address';
  }
  if (!error.status) return "Can't reach the server. Check your connection and try again.";
  // Supabase reports SMTP failures as a 500 with "Error sending ... email".
  if (/error sending .*email/i.test(error.message)) {
    return "We couldn't send the code email right now. Please try again in a few minutes.";
  }
  return 'Something went wrong. Please try again.';
}

function failure(error: AuthError): AuthResult {
  if (__DEV__) console.warn('Supabase auth error', { status: error.status, code: error.code, message: error.message });
  return { ok: false, message: authErrorMessage(error) };
}

/** Sends a 6-digit code; creates the account on first sign-in. */
export async function requestCode(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  return error ? failure(error) : { ok: true };
}

export async function verifyCode(email: string, code: string): Promise<AuthResult> {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  return error ? failure(error) : { ok: true };
}
