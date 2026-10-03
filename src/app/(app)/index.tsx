import { router } from 'expo-router';
import { View } from 'react-native';

import { HomeView } from '@/components/home-view';
import { Loading, LoadError, OfflineBanner } from '@/components/query-state';
import { useProfile, useSubscriptions } from '@/lib/queries/subscriptions';
import { localToday } from '@/lib/subscriptions/form-values';

export default function HomeRoute() {
  const subscriptions = useSubscriptions();
  const profile = useProfile();

  if (subscriptions.data && profile.data) {
    return (
      <View style={{ flex: 1 }}>
        <OfflineBanner />
        <HomeView
          subs={subscriptions.data}
          profile={profile.data}
          today={localToday()}
          onAdd={() => router.push('/subscriptions/new')}
          onOpen={(id) => router.push({ pathname: '/subscriptions/[id]', params: { id } })}
        />
      </View>
    );
  }
  if (subscriptions.isError || profile.isError) {
    return <LoadError onRetry={() => Promise.all([subscriptions.refetch(), profile.refetch()])} />;
  }
  return <Loading />;
}
