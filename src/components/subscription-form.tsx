// Add/edit form (subscription-management spec). Validation rules live in
// src/lib/subscriptions/schema.ts; the database CHECKs mirror them.

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getService } from '@/lib/catalog/services';
import { OfflineError } from '@/lib/queries/online';
import {
  CYCLE_UNITS,
  subscriptionFormSchema,
  toSubscriptionWrite,
  type SubscriptionFormInput,
  type SubscriptionFormValues,
  type SubscriptionWrite,
} from '@/lib/subscriptions/schema';

import { ServiceIcon } from './service-icon';
import { Body, Button, ErrorText, TextField, type, useColors } from './ui';

const UNIT_LABELS = { week: 'Weeks', month: 'Months', year: 'Years' } as const;

interface SubscriptionFormProps {
  initialValues: SubscriptionFormInput;
  submitLabel: string;
  onSubmit: (values: SubscriptionWrite) => Promise<unknown>;
}

export function SubscriptionForm({ initialValues, submitLabel, onSubmit }: SubscriptionFormProps) {
  const colors = useColors();
  const [submitError, setSubmitError] = useState<string>();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormInput, unknown, SubscriptionFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(subscriptionFormSchema),
  });

  const name = useWatch({ control, name: 'name' });
  const catalogKey = useWatch({ control, name: 'catalogKey' });
  const service = getService(catalogKey);

  const submit = handleSubmit(async (values) => {
    setSubmitError(undefined);
    try {
      await onSubmit(toSubscriptionWrite(values));
    } catch (error) {
      // Keep the form and what was typed; explain what happened.
      setSubmitError(
        error instanceof OfflineError ? error.message : "Couldn't save. Please try again.",
      );
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <ServiceIcon catalogKey={catalogKey} name={name || '?'} size={48} />
        <Body muted>{service ? `Enter what you pay for ${service.name}.` : 'A subscription that isn’t in the list.'}</Body>
      </View>

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField label="Name" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
            error={errors.name?.message} maxLength={60} />
        )}
      />

      <Controller
        control={control}
        name="price"
        render={({ field }) => (
          <TextField label="Price (AUD)" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
            error={errors.price?.message} keyboardType="decimal-pad" placeholder="0.00" />
        )}
      />

      <View style={styles.field}>
        <Text style={[type.small, { color: colors.muted }]}>Bills every</Text>
        <View style={styles.cycleRow}>
          <Controller
            control={control}
            name="cycleCount"
            render={({ field }) => (
              <TextField label="Number of units" value={String(field.value)} onChangeText={field.onChange}
                onBlur={field.onBlur} keyboardType="number-pad" maxLength={2} style={styles.countInput} />
            )}
          />
          <Controller
            control={control}
            name="cycleUnit"
            render={({ field }) => (
              <View style={styles.segments} accessibilityRole="radiogroup">
                {CYCLE_UNITS.map((unit) => {
                  const selected = field.value === unit;
                  return (
                    <Pressable
                      key={unit}
                      accessibilityRole="radio"
                      accessibilityLabel={UNIT_LABELS[unit]}
                      accessibilityState={{ selected }}
                      onPress={() => field.onChange(unit)}
                      style={[styles.segment, {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? colors.primary : colors.surface,
                      }]}>
                      <Text style={[type.bodyStrong, { color: selected ? colors.onPrimary : colors.text }]}>
                        {UNIT_LABELS[unit]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </View>
        {errors.cycleCount?.message ? <ErrorText>{errors.cycleCount.message}</ErrorText> : null}
      </View>

      <Controller
        control={control}
        name="startDate"
        render={({ field }) => (
          <TextField label="Start date (first payment)" value={field.value} onChangeText={field.onChange}
            onBlur={field.onBlur} error={errors.startDate?.message} placeholder="YYYY-MM-DD" maxLength={10} />
        )}
      />

      <Controller
        control={control}
        name="trialEndsOn"
        render={({ field }) => (
          <TextField label="Free trial ends (optional)" value={field.value} onChangeText={field.onChange}
            onBlur={field.onBlur} error={errors.trialEndsOn?.message} placeholder="YYYY-MM-DD" maxLength={10} />
        )}
      />

      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <TextField label="Category (optional)" value={field.value} onChangeText={field.onChange}
            onBlur={field.onBlur} error={errors.category?.message} placeholder="e.g. Streaming" maxLength={40} />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <TextField label="Notes (optional)" value={field.value} onChangeText={field.onChange}
            onBlur={field.onBlur} error={errors.notes?.message} multiline maxLength={500}
            style={styles.notes} />
        )}
      />

      {submitError ? <ErrorText>{submitError}</ErrorText> : null}
      <Button label={submitLabel} onPress={submit} loading={isSubmitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  field: { gap: 6 },
  cycleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  countInput: { width: 64, textAlign: 'center' },
  segments: { flex: 1, flexDirection: 'row', gap: 6 },
  segment: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  notes: { minHeight: 80, textAlignVertical: 'top' },
});
