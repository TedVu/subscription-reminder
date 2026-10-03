import NetInfo from '@react-native-community/netinfo';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import type { SubscriptionWrite } from '../subscriptions/schema.ts';
import { supabase } from '../supabase/client';

import { OFFLINE_MESSAGE } from './online';
import {
  onDataChanged,
  queryKeys,
  useCreateSubscription,
  useDeleteSubscription,
  useSubscriptions,
} from './subscriptions';

jest.mock('@react-native-community/netinfo', () => ({ fetch: jest.fn(), addEventListener: jest.fn() }));

// Chainable stand-in for the Supabase query builder: every method returns the
// builder, and awaiting it resolves to the configured result.
const mockResult: { data: unknown; error: { message: string } | null } = { data: null, error: null };
const mockBuilder: Record<string, jest.Mock> & { then: (resolve: (v: unknown) => void) => void } = {
  then: (resolve: (v: unknown) => void) => resolve(mockResult),
} as never;
for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single']) {
  mockBuilder[method] = jest.fn(() => mockBuilder);
}
jest.mock('../supabase/client', () => ({ supabase: { from: jest.fn(() => mockBuilder) } }));

const mockFetch = jest.mocked(NetInfo.fetch);
const newSub: SubscriptionWrite = {
  catalog_key: 'spotify',
  name: 'Spotify',
  amount_cents: 1399,
  cycle_unit: 'month',
  cycle_count: 1,
  start_date: '2026-03-05',
  trial_ends_on: null,
  category: null,
  notes: null,
};

function setup() {
  // gcTime Infinity: no garbage-collection timers left running after the test.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: 0, gcTime: Infinity } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockResult.data = null;
  mockResult.error = null;
  mockFetch.mockResolvedValue({ isConnected: true } as never);
});

describe('subscription queries', () => {
  it('loads the subscription list', async () => {
    mockResult.data = [{ id: '1', ...newSub }];
    const { wrapper } = setup();
    const { result } = await renderHook(() => useSubscriptions(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: '1', ...newSub }]);
    expect(supabase.from).toHaveBeenCalledWith('subscriptions');
  });

  it('surfaces server errors', async () => {
    mockResult.error = { message: 'permission denied' };
    const { wrapper } = setup();
    const { result } = await renderHook(() => useSubscriptions(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('permission denied');
  });
});

describe('subscription mutations', () => {
  it('a successful create invalidates subscriptions and profile and notifies listeners', async () => {
    mockResult.data = { id: 'new', ...newSub };
    const listener = jest.fn();
    const unsubscribe = onDataChanged(listener);
    const { queryClient, wrapper } = setup();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = await renderHook(() => useCreateSubscription(), { wrapper });

    await act(() => result.current.mutateAsync(newSub));

    expect(mockBuilder.insert).toHaveBeenCalledWith(newSub);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.subscriptions });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.profile });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('rejects immediately while offline without calling the server', async () => {
    mockFetch.mockResolvedValue({ isConnected: false } as never);
    const listener = jest.fn();
    const unsubscribe = onDataChanged(listener);
    const { wrapper } = setup();
    const { result } = await renderHook(() => useCreateSubscription(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(newSub)).rejects.toThrow(OFFLINE_MESSAGE);
    });

    expect(supabase.from).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('delete targets the subscription by id', async () => {
    const { wrapper } = setup();
    const { result } = await renderHook(() => useDeleteSubscription(), { wrapper });

    await act(() => result.current.mutateAsync('abc'));

    expect(mockBuilder.delete).toHaveBeenCalled();
    expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'abc');
  });
});
