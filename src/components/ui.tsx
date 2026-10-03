// Design tokens and shared primitives.
//
// Palette: Australian bush, cool not warm. Gum (eucalyptus) for actions,
// Wattle only ever means "charging soon". One family, Schibsted Grotesk,
// whose sturdy numerals suit prices and dates. Sentence case everywhere.

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
} from 'react-native';

const palette = {
  light: {
    background: '#F2F5F3', // paper
    surface: '#FFFFFF',
    text: '#1E2B2F', // ink
    muted: '#677875', // mist
    border: '#D3DCD8', // line
    primary: '#2F5D50', // gum
    onPrimary: '#FFFFFF',
    primarySoft: '#DCE8E3',
    accent: '#E3A008', // wattle
    accentSoft: '#FBEFCB',
    onAccent: '#3A2A00',
    danger: '#B3261E',
  },
  dark: {
    background: '#12201D',
    surface: '#1A2C28',
    text: '#E6EEEA',
    muted: '#93A6A1',
    border: '#2A403B',
    primary: '#8CC4AE',
    onPrimary: '#0E1C19',
    primarySoft: '#21403A',
    accent: '#F2C14E',
    accentSoft: '#3D3315',
    onAccent: '#2A1F00',
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
  regular: 'SchibstedGrotesk_400Regular',
  semibold: 'SchibstedGrotesk_600SemiBold',
  bold: 'SchibstedGrotesk_800ExtraBold',
};

/** Type scale: 13 / 15 / 17 / 22 / 30. */
export const type = StyleSheet.create({
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24 },
  title: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 34, letterSpacing: -0.6 },
  figure: { fontFamily: fonts.semibold, fontVariant: ['tabular-nums'] },
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

export function Heading({ children, style, ...props }: TextProps & { children: ReactNode }) {
  const colors = useColors();
  return (
    <Text accessibilityRole="header" style={[type.heading, { color: colors.text }, style]} {...props}>
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
  /** primary: filled gum. secondary: outlined. danger: quiet red text. */
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading }: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;
  const filled = variant === 'primary';
  const foreground = filled ? colors.onPrimary : variant === 'danger' ? colors.danger : colors.primary;
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
        pressed && { opacity: 0.75 },
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
});
