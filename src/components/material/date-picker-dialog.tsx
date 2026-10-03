// Material 3 date picker dialog. A plain AlertDialog caps its width below what
// the date picker needs (~360dp), clipping the Saturday column, so this uses a
// BasicAlertDialog without the platform default width and a full-width picker.
// The chosen date is only applied when the user presses OK: the picker reports
// a date as soon as it opens and on every tap.

import {
  BasicAlertDialog,
  Column,
  DateTimePicker,
  Row,
  Surface,
  Text,
  TextButton,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import { clip, fillMaxWidth, padding, Shapes } from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';

import { isoFromPickedDate } from '@/lib/screens/subscription-form';

interface DatePickerDialogProps {
  /** YYYY-MM-DD shown first, or null for today. */
  initialDate: string | null;
  onConfirm: (iso: string) => void;
  onDismiss: () => void;
}

export function DatePickerDialog({ initialDate, onConfirm, onDismiss }: DatePickerDialogProps) {
  const palette = useMaterialColors();
  const [pending, setPending] = useState<string>();

  return (
    <BasicAlertDialog onDismissRequest={onDismiss} properties={{ usePlatformDefaultWidth: false }}>
      <Surface
        color={palette.surfaceContainerHigh}
        contentColor={palette.onSurface}
        modifiers={[padding(12, 0, 12, 0), fillMaxWidth(), clip(Shapes.RoundedCorner(28))]}>
        <Column>
          <DateTimePicker
            initialDate={initialDate}
            variant="picker"
            showVariantToggle
            onDateSelected={(date) => setPending(isoFromPickedDate(date))}
            modifiers={[fillMaxWidth()]}
          />
          <Row modifiers={[fillMaxWidth(), padding(8, 0, 12, 12)]} horizontalArrangement="end">
            <TextButton onClick={onDismiss}>
              <Text>Cancel</Text>
            </TextButton>
            <TextButton
              enabled={!!(pending ?? initialDate)}
              onClick={() => {
                const date = pending ?? initialDate;
                if (date) onConfirm(date);
              }}>
              <Text>OK</Text>
            </TextButton>
          </Row>
        </Column>
      </Surface>
    </BasicAlertDialog>
  );
}
