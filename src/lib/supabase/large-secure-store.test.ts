import AsyncStorage from '@react-native-async-storage/async-storage';

import { largeSecureStore } from './large-secure-store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-crypto', () => ({
  getRandomBytes: (length: number) => globalThis.crypto.getRandomValues(new Uint8Array(length)),
}));

// In-memory SecureStore that enforces the real ~2 KB value limit.
const mockSecureValues = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  setItemAsync: async (key: string, value: string) => {
    if (value.length > 2048) throw new Error('SecureStore value too large');
    mockSecureValues.set(key, value);
  },
  getItemAsync: async (key: string) => mockSecureValues.get(key) ?? null,
  deleteItemAsync: async (key: string) => {
    mockSecureValues.delete(key);
  },
}));

const KEY = 'sb-test-auth-token';

beforeEach(async () => {
  mockSecureValues.clear();
  await AsyncStorage.clear();
});

describe('largeSecureStore', () => {
  it('round-trips a value larger than 2 KB', async () => {
    const session = JSON.stringify({ access_token: 'x'.repeat(4000), user: { email: 'a@example.com' } });
    await largeSecureStore.setItem(KEY, session);
    expect(await largeSecureStore.getItem(KEY)).toBe(session);
  });

  it('does not store the plaintext in AsyncStorage', async () => {
    await largeSecureStore.setItem(KEY, 'secret-session-value');
    const stored = await AsyncStorage.getItem(KEY);
    expect(stored).not.toContain('secret-session-value');
    expect(stored).toMatch(/^[0-9a-f]+$/);
  });

  it('uses a new key on every write', async () => {
    await largeSecureStore.setItem(KEY, 'same value');
    const firstKey = mockSecureValues.get(KEY);
    await largeSecureStore.setItem(KEY, 'same value');
    expect(mockSecureValues.get(KEY)).not.toBe(firstKey);
    expect(await largeSecureStore.getItem(KEY)).toBe('same value');
  });

  it('removes both the ciphertext and the key', async () => {
    await largeSecureStore.setItem(KEY, 'value');
    await largeSecureStore.removeItem(KEY);
    expect(await largeSecureStore.getItem(KEY)).toBeNull();
    expect(mockSecureValues.has(KEY)).toBe(false);
  });

  it('returns null when nothing is stored or the key is missing', async () => {
    expect(await largeSecureStore.getItem(KEY)).toBeNull();
    await largeSecureStore.setItem(KEY, 'value');
    mockSecureValues.clear();
    expect(await largeSecureStore.getItem(KEY)).toBeNull();
  });
});
