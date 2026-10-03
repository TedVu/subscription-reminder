// Design tokens and shared primitives — "Polymer" (.superdesign/design-system.md).
//
// Australian polymer banknotes: pale polymer grey, deep navy ink, and each
// subscription coloured by the note that covers its monthly cost. Note colours
// are information, never decoration. One family, Familjen Grotesk. Sentence
// case everywhere; no shadows or gradients.

import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
  type TextInputProps,
  type TextProps,
  type ViewProps,
} from 'react-native';

import type { NoteTier } from '@/lib/subscriptions/note-tier';

/** Banknote colours, the same in light and dark mode. */
export const notes: Record<NoteTier, string> = {
  5: '#C77DB5',
  10: '#2E8BC0',
  20: '#E2573B',
  50: '#E9B527',
  100: '#2FA37A',
};

const palette = {
  light: {
    background: '#ECEFF1', // polymer
    surface: '#FFFFFF', // sheet
    text: '#1A1F36', // ink
    muted: '#5E6478',
    border: '#D5DADF', // rule
    primary: '#1A1F36', // actions are ink
    onPrimary: '#FFFFFF',
    pressed: '#DDE2E6',
    window: 'rgba(255,255,255,0.55)',
    danger: '#B3261E',
  },
  dark: {
    background: '#121521',
    surface: '#1B1F2E',
    text: '#E9ECF5',
    muted: '#9AA0B4',
    border: '#2B3044',
    primary: '#E9ECF5',
    onPrimary: '#121521',
    pressed: '#22273A',
    window: 'rgba(255,255,255,0.06)',
    danger: '#F2B8B5',
  },
};

export type Colors = typeof palette.light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? palette.dark : palette.light;
}

export { palette };

/** Loaded in the root layout; text falls back to the system font until then. */
export const fonts = {
  regular: 'FamiljenGrotesk_400Regular',
  semibold: 'FamiljenGrotesk_600SemiBold',
  bold: 'FamiljenGrotesk_700Bold',
};

/** Type scale: 13 / 15 / 17 / 22 / 34. */
export const type = StyleSheet.create({
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24 },
  subtitle: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28 },
  title: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 38, letterSpacing: -0.5 },
});

export function Screen({ children }: { children: ReactNode }) {
  const colors = useColors();
  return <View style={[styles.screen, { backgroundColor: colors.background }]}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <Text accessibilityRole="header" style={[type.title, { color: colors.text }]}>
      {children}
    </Text>
  );
}

export function Heading({ children, style, muted, ...props }: TextProps & { children: ReactNode; muted?: boolean }) {
  const colors = useColors();
  return (
    <Text
      accessibilityRole="header"
      style={[type.heading, { color: muted ? colors.muted : colors.text }, style]}
      {...props}>
      {children}
    </Text>
  );
}

export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  const colors = useColors();
  return <Text style={[type.body, { color: muted ? colors.muted : colors.text }]}>{children}</Text>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <Text accessibilityRole="alert" style={[type.body, { color: colors.danger }]}>
      {children}
    </Text>
  );
}

/** Small round banknote-colour marker. */
export function NoteSwatch({ tier, size = 10 }: { tier: NoteTier; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: notes[tier] }} />;
}

/** The clear polymer "window" — used only to mark today. */
export function PolymerWindow({ children, style, ...props }: ViewProps & { children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.window, { borderColor: colors.text, backgroundColor: colors.window }, style]} {...props}>
      {children}
    </View>
  );
}

interface SegmentedControlProps<T extends string> {
  /** Names the group for screen readers, e.g. "Appearance". */
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A row of mutually exclusive choices (radio buttons). */
export function SegmentedControl<T extends string>({ label, options, value, onChange }: SegmentedControlProps<T>) {
  const colors = useColors();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.segments}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary : colors.surface,
              },
            ]}>
            <Text style={[type.bodyStrong, { color: selected ? colors.onPrimary : colors.text }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, style, ...inputProps }: TextFieldProps) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[type.small, { color: colors.muted }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          type.body,
          { color: colors.text, backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border },
          style,
        ]}
        {...inputProps}
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
    </View>
  );
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  /** primary: filled ink. secondary: sheet with a rule. danger: quiet red text. */
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading }: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;
  const filled = variant === 'primary';
  const foreground = filled ? colors.onPrimary : variant === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        filled && { backgroundColor: colors.primary },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
        pressed && { opacity: 0.8 },
        isDisabled && { opacity: 0.5 },
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <Text style={[type.bodyStrong, { color: foreground }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, gap: 16 },
  field: { gap: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  button: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  window: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  segments: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
});
