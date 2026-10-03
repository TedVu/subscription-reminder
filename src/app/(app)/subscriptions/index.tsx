import { router } from 'expo-router';

import { MaterialHost } from '@/components/material/material-host';
import { ErrorView, LoadingView } from '@/components/material/pieces';
import { SubscriptionsScreen } from '@/components/material/subscriptions-screen';
import { useSubscriptions } from '@/lib/queries/subscriptions';
import { subscriptionsScreen } from '@/lib/screens/subscriptions';
import { localToday } from '@/lib/subscriptions/form-values';

export default function SubscriptionsRoute() {
  const { data, isError, refetch } = useSubscriptions();
  return (
    <MaterialHost>
      {data ? (
        <SubscriptionsScreen
          model={subscriptionsScreen(data, localToday())}
          onAdd={() => router.push('/subscriptions/new')}
          onOpen={(id) => router.push({ pathname: '/subscriptions/[id]', params: { id } })}
        />
      ) : isError ? (
        <ErrorView message="Couldn’t load your subscriptions." onRetry={refetch} />
      ) : (
        <LoadingView />
      )}
    </MaterialHost>
  );
}
