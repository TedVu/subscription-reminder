import { Text, type TextProps } from 'react-native';

import { formatAud } from '@/lib/money';

import { type, useColors } from './ui';

interface MoneyTextProps extends Omit<TextProps, 'children'> {
  cents: number;
}

/** An AUD amount, e.g. 1549 -> "$15.49". */
export function MoneyText({ cents, style, ...props }: MoneyTextProps) {
  const colors = useColors();
  return (
    <Text style={[type.body, { color: colors.text }, style]} {...props}>
      {formatAud(cents)}
    </Text>
  );
}
