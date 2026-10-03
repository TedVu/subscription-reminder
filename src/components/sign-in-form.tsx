import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { codeSchema, emailSchema, requestCode, verifyCode } from '@/lib/auth/auth-api';

import { Body, Button, ErrorText, Screen, TextField, Title } from './ui';

const RESEND_COOLDOWN_SECONDS = 60;

export function SignInForm() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendCode(address: string) {
    setBusy(true);
    setFormError(undefined);
    const result = await requestCode(address);
    setBusy(false);
    if (!result.ok) {
      setFormError(result.message);
      return false;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
    return true;
  }

  async function submitEmail() {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    setEmail(parsed.data);
    if (await sendCode(parsed.data)) setStep('code');
  }

  async function submitCode() {
    const parsed = codeSchema.safeParse(code);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    setFormError(undefined);
    setBusy(true);
    const result = await verifyCode(email, parsed.data);
    setBusy(false);
    // On success the session listener swaps to the signed-in screens.
    if (!result.ok) setFormError(result.message);
  }

  function useDifferentEmail() {
    setStep('email');
    setCode('');
    setFieldError(undefined);
    setFormError(undefined);
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={styles.content}>
          <Title>Subscription Reminder</Title>
          {step === 'email' ? (
            <>
              <Body muted>Sign in or create an account. We&apos;ll email you a 6-digit code to sign in with. There&apos;s no password to remember.</Body>
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                error={fieldError}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="send"
                onSubmitEditing={submitEmail}
              />
              {formError ? <ErrorText>{formError}</ErrorText> : null}
              <Button label="Send code" onPress={submitEmail} loading={busy} />
            </>
          ) : (
            <>
              <Body muted>Enter the 6-digit code we sent to {email}.</Body>
              <TextField
                label="Code"
                value={code}
                onChangeText={setCode}
                error={fieldError}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={submitCode}
              />
              {formError ? <ErrorText>{formError}</ErrorText> : null}
              <Button label="Sign in" onPress={submitCode} loading={busy} />
              <Button
                label={cooldown > 0 ? `Send a new code (${cooldown}s)` : 'Send a new code'}
                variant="secondary"
                disabled={cooldown > 0 || busy}
                onPress={() => sendCode(email)}
              />
              <Button label="Use a different email" variant="secondary" onPress={useDifferentEmail} />
            </>
          )}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', gap: 16, maxWidth: 480, width: '100%', alignSelf: 'center' },
});
