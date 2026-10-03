import { authErrorMessage, codeSchema, emailSchema } from './auth-api';

jest.mock('../supabase/client', () => ({ supabase: {} }));

describe('authErrorMessage', () => {
  it.each([
    ['otp_expired', 403, /wrong or has expired/],
    ['over_email_send_rate_limit', 429, /Too many codes/],
    ['email_address_invalid', 400, /valid email/],
    [undefined, 0, /Can't reach the server/],
    ['unexpected_failure', 500, /Something went wrong/],
  ])('maps %p (status %p)', (code, status, expected) => {
    expect(authErrorMessage({ code, status, message: 'raw' } as never)).toMatch(expected);
  });

  it.each(['Error sending confirmation email', 'Error sending magic link email'])(
    'explains SMTP failures: %p',
    (message) => {
      expect(authErrorMessage({ code: undefined, status: 500, message } as never)).toMatch(
        /couldn't send the code email/,
      );
    },
  );
});

describe('input schemas', () => {
  it('normalises email addresses', () => {
    expect(emailSchema.parse('  Ted@Example.COM ')).toBe('ted@example.com');
    expect(emailSchema.safeParse('nope').success).toBe(false);
  });

  it('accepts only 6-digit codes', () => {
    expect(codeSchema.safeParse('123456').success).toBe(true);
    expect(codeSchema.safeParse('12345').success).toBe(false);
    expect(codeSchema.safeParse('12345a').success).toBe(false);
  });
});
