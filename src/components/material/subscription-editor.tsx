// Add/edit subscription form in Material 3 (redesign-material3-android 4.4).
// Validation and conversion come from validateSubscriptionForm (tested); this
// file only lays out fields and dialogs.

import {
  AlertDialog,
  Button,
  Column,
  DateTimePicker,
  LazyColumn,
  ListItem,
  OutlinedButton,
  OutlinedTextField,
  Row,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Text,
  TextButton,
  useMaterialColors,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import { clickable, fillMaxSize, fillMaxWidth, padding, testID, weight, width } from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';

import { OfflineError } from '@/lib/queries/online';
import type { SubscriptionStatus } from '@/lib/schedule';
import {
  describeDateField,
  isoFromPickedDate,
  validateSubscriptionForm,
  type FormField,
} from '@/lib/screens/subscription-form';
import { CYCLE_UNITS, type SubscriptionFormInput, type SubscriptionWrite } from '@/lib/subscriptions/schema';

import { OfflineBanner, ServiceTile } from './pieces';

const UNIT_LABELS = { week: 'Weeks', month: 'Months', year: 'Years' } as const;

export interface EditActions {
  status: SubscriptionStatus;
  onStatusChange: (status: SubscriptionStatus) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}

interface SubscriptionEditorProps {
  initialValues: SubscriptionFormInput;
  submitLabel: string;
  onSubmit: (values: SubscriptionWrite) => Promise<unknown>;
  /** Present when editing an existing subscription. */
  edit?: EditActions;
}

function messageFor(error: unknown): string {
  return error instanceof OfflineError ? error.message : 'Couldn’t save. Please try again.';
}

function Field({
  label,
  initial,
  onChange,
  error,
  keyboardType,
  prefix,
  multiline,
  id,
}: {
  label: string;
  initial: string;
  onChange: (value: string) => void;
  error?: string;
  keyboardType?: 'text' | 'decimal' | 'number';
  prefix?: string;
  multiline?: boolean;
  id: string;
}) {
  const state = useNativeState(initial);
  return (
    <OutlinedTextField
      value={state}
      onValueChange={onChange}
      isError={!!error}
      singleLine={!multiline}
      minLines={multiline ? 3 : undefined}
      keyboardOptions={{ keyboardType: keyboardType ?? 'text', capitalization: keyboardType ? 'none' : 'sentences' }}
      modifiers={[fillMaxWidth(), testID(id)]}>
      <OutlinedTextField.Label>
        <Text>{label}</Text>
      </OutlinedTextField.Label>
      {prefix ? (
        <OutlinedTextField.Prefix>
          <Text>{prefix}</Text>
        </OutlinedTextField.Prefix>
      ) : null}
      {error ? (
        <OutlinedTextField.SupportingText>
          <Text>{error}</Text>
        </OutlinedTextField.SupportingText>
      ) : null}
    </OutlinedTextField>
  );
}

export function SubscriptionEditor({ initialValues, submitLabel, onSubmit, edit }: SubscriptionEditorProps) {
  const palette = useMaterialColors();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState<'startDate' | 'trialEndsOn' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (field: FormField) => (value: string) => setValues((current) => ({ ...current, [field]: value }));

  async function run(action: () => Promise<unknown>) {
    setFormError(undefined);
    setBusy(true);
    try {
      await action();
    } catch (error) {
      setFormError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  function save() {
    const result = validateSubscriptionForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    run(() => onSubmit(result.write));
  }

  const dateRow = (field: 'startDate' | 'trialEndsOn', label: string, emptyText: string) => (
    <ListItem key={field} modifiers={[clickable(() => setPicking(field)), testID(`field-${field}`)]}>
      <ListItem.HeadlineContent>
        <Text style={{ typography: 'bodyLarge' }}>{label}</Text>
      </ListItem.HeadlineContent>
      <ListItem.SupportingContent>
        <Text color={errors[field] ? palette.error : palette.onSurfaceVariant}>
          {errors[field] ?? describeDateField(values[field], emptyText)}
        </Text>
      </ListItem.SupportingContent>
      {field === 'trialEndsOn' && values.trialEndsOn ? (
        <ListItem.TrailingContent>
          <TextButton onClick={() => set('trialEndsOn')('')}>
            <Text>Clear</Text>
          </TextButton>
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  );

  return (
    <>
      <LazyColumn modifiers={[fillMaxSize()]} contentPadding={{ start: 16, end: 16, top: 8, bottom: 32 }} verticalArrangement={{ spacedBy: 12 }}>
        <OfflineBanner />
        <Row key="header" verticalAlignment="center" horizontalArrangement={{ spacedBy: 12 }}>
          <ServiceTile catalogKey={values.catalogKey} name={values.name || '?'} />
          <Text color={palette.onSurfaceVariant} style={{ typography: 'bodyMedium' }}>
            {values.catalogKey ? `Enter what you pay for ${values.name}.` : 'A subscription that isn’t in the list.'}
          </Text>
        </Row>
        <Field id="field-name" label="Name" initial={values.name} onChange={set('name')} error={errors.name} />
        <Field id="field-price" label="Price (AUD)" prefix="$" keyboardType="decimal" initial={values.price} onChange={set('price')} error={errors.price} />
        <Column key="cycle" verticalArrangement={{ spacedBy: 8 }}>
          <Text color={palette.onSurfaceVariant} style={{ typography: 'labelLarge' }}>
            Bills every
          </Text>
          <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 12 }}>
            <Column modifiers={[width(88)]}>
              <Field id="field-cycleCount" label="Number" keyboardType="number" initial={String(values.cycleCount)} onChange={set('cycleCount')} />
            </Column>
            <SingleChoiceSegmentedButtonRow modifiers={[weight(1)]}>
              {CYCLE_UNITS.map((unit) => (
                <SegmentedButton key={unit} selected={values.cycleUnit === unit} onClick={() => setValues((v) => ({ ...v, cycleUnit: unit }))}>
                  <SegmentedButton.Label>
                    <Text>{UNIT_LABELS[unit]}</Text>
                  </SegmentedButton.Label>
                </SegmentedButton>
              ))}
            </SingleChoiceSegmentedButtonRow>
          </Row>
          {errors.cycleCount ? (
            <Text color={palette.error} style={{ typography: 'bodySmall' }}>
              {errors.cycleCount}
            </Text>
          ) : null}
        </Column>
        {dateRow('startDate', 'Start date (first payment)', 'Not set')}
        {dateRow('trialEndsOn', 'Free trial ends', 'No free trial')}
        <Field id="field-category" label="Category (optional)" initial={values.category} onChange={set('category')} error={errors.category} />
        <Field id="field-notes" label="Notes (optional)" multiline initial={values.notes} onChange={set('notes')} error={errors.notes} />
        {formError ? (
          <Text key="form-error" color={palette.error} style={{ typography: 'bodyMedium' }}>
            {formError}
          </Text>
        ) : null}
        <Button key="save" enabled={!busy} onClick={save} modifiers={[fillMaxWidth(), testID('save')]}>
          <Text>{submitLabel}</Text>
        </Button>
        {edit ? (
          <Column key="actions" verticalArrangement={{ spacedBy: 8 }} modifiers={[padding(0, 8, 0, 0)]}>
            {edit.status === 'active' ? (
              <>
                <OutlinedButton enabled={!busy} onClick={() => run(() => edit.onStatusChange('paused'))} modifiers={[fillMaxWidth()]}>
                  <Text>Pause</Text>
                </OutlinedButton>
                <OutlinedButton enabled={!busy} onClick={() => run(() => edit.onStatusChange('cancelled'))} modifiers={[fillMaxWidth()]}>
                  <Text>Mark as cancelled</Text>
                </OutlinedButton>
              </>
            ) : (
              <OutlinedButton enabled={!busy} onClick={() => run(() => edit.onStatusChange('active'))} modifiers={[fillMaxWidth()]}>
                <Text>Reactivate</Text>
              </OutlinedButton>
            )}
            <TextButton enabled={!busy} onClick={() => setConfirmDelete(true)} modifiers={[fillMaxWidth()]}>
              <Text color={palette.error}>Delete</Text>
            </TextButton>
          </Column>
        ) : null}
      </LazyColumn>

      {picking ? (
        <AlertDialog onDismissRequest={() => setPicking(null)}>
          <AlertDialog.Title>
            <Text>{picking === 'startDate' ? 'Start date' : 'Free trial ends'}</Text>
          </AlertDialog.Title>
          <AlertDialog.Text>
            <DateTimePicker
              initialDate={values[picking] || values.startDate || null}
              variant="picker"
              onDateSelected={(date) => {
                set(picking)(isoFromPickedDate(date));
                setPicking(null);
              }}
            />
          </AlertDialog.Text>
          <AlertDialog.DismissButton>
            <TextButton onClick={() => setPicking(null)}>
              <Text>Cancel</Text>
            </TextButton>
          </AlertDialog.DismissButton>
        </AlertDialog>
      ) : null}

      {confirmDelete && edit ? (
        <AlertDialog onDismissRequest={() => setConfirmDelete(false)}>
          <AlertDialog.Title>
            <Text>{`Delete ${values.name}?`}</Text>
          </AlertDialog.Title>
          <AlertDialog.Text>
            <Text>This permanently removes it and its reminders.</Text>
          </AlertDialog.Text>
          <AlertDialog.ConfirmButton>
            <TextButton
              onClick={() => {
                setConfirmDelete(false);
                run(edit.onDelete);
              }}>
              <Text color={palette.error}>Delete</Text>
            </TextButton>
          </AlertDialog.ConfirmButton>
          <AlertDialog.DismissButton>
            <TextButton onClick={() => setConfirmDelete(false)}>
              <Text>Cancel</Text>
            </TextButton>
          </AlertDialog.DismissButton>
        </AlertDialog>
      ) : null}
    </>
  );
}
