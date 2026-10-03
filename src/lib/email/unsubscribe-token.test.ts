import { signUnsubscribeToken, unsubscribeUrl, verifyUnsubscribeToken } from './unsubscribe-token.ts';

const SECRET = 'test-secret';
const USER = '00000000-0000-0000-0000-00000000000a';

describe('unsubscribe tokens', () => {
  it('a valid token verifies', async () => {
    const token = await signUnsubscribeToken(USER, SECRET);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await verifyUnsubscribeToken(USER, token, SECRET)).toBe(true);
  });

  it('a tampered token is rejected', async () => {
    const token = await signUnsubscribeToken(USER, SECRET);
    const tampered = (token[0] === 'A' ? 'B' : 'A') + token.slice(1);
    expect(await verifyUnsubscribeToken(USER, tampered, SECRET)).toBe(false);
    expect(await verifyUnsubscribeToken(USER, token.slice(1), SECRET)).toBe(false);
    expect(await verifyUnsubscribeToken(USER, '', SECRET)).toBe(false);
  });

  it("another user's token is rejected", async () => {
    const token = await signUnsubscribeToken(USER, SECRET);
    expect(await verifyUnsubscribeToken('00000000-0000-0000-0000-00000000000b', token, SECRET)).toBe(false);
  });

  it('a token signed with a different secret is rejected', async () => {
    const token = await signUnsubscribeToken(USER, 'other-secret');
    expect(await verifyUnsubscribeToken(USER, token, SECRET)).toBe(false);
  });

  it('builds the link', async () => {
    const url = await unsubscribeUrl('https://ref.supabase.co/functions/v1', USER, SECRET);
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/functions/v1/unsubscribe');
    expect(parsed.searchParams.get('u')).toBe(USER);
    expect(await verifyUnsubscribeToken(USER, parsed.searchParams.get('t')!, SECRET)).toBe(true);
  });
});
