import { router } from 'expo-router';

import { HomeScreen } from '@/components/material/home-screen';
import { MaterialHost } from '@/components/material/material-host';
import { ErrorView, LoadingView } from '@/components/material/pieces';
import { useProfile, useSubscriptions } from '@/lib/queries/subscriptions';
import { homeScreen } from '@/lib/screens/home';
import { localToday } from '@/lib/subscriptions/form-values';

export default function HomeRoute() {
  const subscriptions = useSubscriptions();
  const profile = useProfile();

  return (
    <MaterialHost>
      {subscriptions.data && profile.data ? (
        <HomeScreen
          model={homeScreen(subscriptions.data, profile.data, localToday())}
          onAdd={() => router.push('/subscriptions/new')}
          onOpen={(id) => router.push({ pathname: '/subscriptions/[id]', params: { id } })}
        />
      ) : subscriptions.isError || profile.isError ? (
        <ErrorView
          message="Couldn’t load your subscriptions."
          onRetry={() => Promise.all([subscriptions.refetch(), profile.refetch()])}
        />
      ) : (
        <LoadingView />
      )}
    </MaterialHost>
  );
}
