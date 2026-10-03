import { router } from 'expo-router';
import { View } from 'react-native';

import { Loading, LoadError, OfflineBanner } from '@/components/query-state';
import { SubscriptionList } from '@/components/subscription-list';
import { useSubscriptions } from '@/lib/queries/subscriptions';
import { localToday } from '@/lib/subscriptions/form-values';

export default function SubscriptionsRoute() {
  const { data, isError, refetch } = useSubscriptions();
  if (data) {
    return (
      <View style={{ flex: 1 }}>
        <OfflineBanner />
        <SubscriptionList
          subs={data}
          today={localToday()}
          onAdd={() => router.push('/subscriptions/new')}
          onOpen={(id) => router.push({ pathname: '/subscriptions/[id]', params: { id } })}
        />
      </View>
    );
  }
  return isError ? <LoadError onRetry={refetch} /> : <Loading />;
}
