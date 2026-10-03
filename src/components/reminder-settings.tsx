// Reminder preferences (reminders spec, "Reminder preferences").

import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import type { Profile, ProfileUpdate } from '@/lib/queries/subscriptions';
import { OfflineError } from '@/lib/queries/online';
import { formatRemindDays, parseRemindDays } from '@/lib/reminders/prefs';

import { Body, Button, ErrorText, TextField, type, useColors } from './ui';

interface ReminderSettingsProps {
  profile: Pick<Profile, 'remind_days' | 'notify_push' | 'notify_in_app' | 'notify_email'>;
  /** Shown under the phone switch when the OS has blocked notifications. */
  pushBlocked?: boolean;
  /** Overrides the blocked message, e.g. when running in Expo Go. */
  pushNotice?: string;
  onSave: (update: ProfileUpdate) => Promise<unknown>;
}

export function ReminderSettings({ profile, pushBlocked, pushNotice, onSave }: ReminderSettingsProps) {
  const [push, setPush] = useState(profile.notify_push);
  const [inApp, setInApp] = useState(profile.notify_in_app);
  const [email, setEmail] = useState(profile.notify_email);
  const [daysText, setDaysText] = useState(formatRemindDays(profile.remind_days));
  const [daysError, setDaysError] = useState<string>();
  const [status, setStatus] = useState<{ kind: 'saved' } | { kind: 'error'; message: string }>();
  const [saving, setSaving] = useState(false);

  async function save() {
    setStatus(undefined);
    const parsed = parseRemindDays(daysText);
    if (!parsed.ok) {
      setDaysError(parsed.message);
      return;
    }
    setDaysError(undefined);
    setSaving(true);
    try {
      await onSave({ notify_push: push, notify_in_app: inApp, notify_email: email, remind_days: parsed.days });
      setDaysText(formatRemindDays(parsed.days));
      setStatus({ kind: 'saved' });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof OfflineError ? error.message : "Couldn't save. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Toggle label="Phone notifications" value={push} onChange={setPush} />
      {pushBlocked && push ? (
        <Body muted>
          {pushNotice ??
            "Notifications are turned off for this app. Turn them on in your phone's Settings to get phone reminders. Email and in-app reminders still work."}
        </Body>
      ) : null}
      <Toggle label="In-app reminders" value={inApp} onChange={setInApp} />
      <Toggle label="Email reminders" value={email} onChange={setEmail} />
      <TextField
        label="Remind me this many days before"
        value={daysText}
        onChangeText={setDaysText}
        error={daysError}
        keyboardType="numbers-and-punctuation"
        placeholder="3, 1"
      />
      <Body muted>Up to 3 values from 0 (the day itself) to 30. Reminders arrive at 9am.</Body>
      {status?.kind === 'error' ? <ErrorText>{status.message}</ErrorText> : null}
      {status?.kind === 'saved' ? <Body muted>Saved.</Body> : null}
      <Button label="Save reminder settings" onPress={save} loading={saving} />
    </View>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  const colors = useColors();
  return (
    <View style={styles.toggle}>
      <Text style={[type.body, { color: colors.text }]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
