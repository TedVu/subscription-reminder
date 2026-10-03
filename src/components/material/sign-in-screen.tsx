// Email-code sign-in in Material 3 (redesign-material3-android 4.6).
// Validation and Supabase calls come from auth-api (tested).

import {
  Box,
  Button,
  Column,
  OutlinedTextField,
  Text,
  TextButton,
  useMaterialColors,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import { fillMaxSize, fillMaxWidth, paddingAll, testID } from '@expo/ui/jetpack-compose/modifiers';
import { useEffect, useState } from 'react';

import { codeSchema, emailSchema, requestCode, verifyCode } from '@/lib/auth/auth-api';

const RESEND_COOLDOWN_SECONDS = 60;

export function SignInScreen() {
  const palette = useMaterialColors();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const emailState = useNativeState('');
  const codeState = useNativeState('');
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
    codeState.set('');
    setFieldError(undefined);
    setFormError(undefined);
  }

  return (
    <Box contentAlignment="center" modifiers={[fillMaxSize(), paddingAll(24)]}>
      <Column verticalArrangement={{ spacedBy: 16 }} modifiers={[fillMaxWidth()]}>
        <Text style={{ typography: 'headlineMedium' }}>Subscription Reminder</Text>
        {step === 'email' ? (
          <>
            <Text color={palette.onSurfaceVariant} style={{ typography: 'bodyLarge' }}>
              Sign in or create an account. We’ll email you a 6-digit code to sign in with. There’s no password to remember.
            </Text>
            <OutlinedTextField
              value={emailState}
              onValueChange={setEmail}
              isError={!!fieldError}
              singleLine
              keyboardOptions={{ keyboardType: 'email', capitalization: 'none', autoCorrectEnabled: false, imeAction: 'send' }}
              keyboardActions={{ onSend: () => submitEmail() }}
              modifiers={[fillMaxWidth(), testID('email')]}>
              <OutlinedTextField.Label>
                <Text>Email</Text>
              </OutlinedTextField.Label>
              {fieldError ? (
                <OutlinedTextField.SupportingText>
                  <Text>{fieldError}</Text>
                </OutlinedTextField.SupportingText>
              ) : null}
            </OutlinedTextField>
            {formError ? <Text color={palette.error}>{formError}</Text> : null}
            <Button enabled={!busy} onClick={submitEmail} modifiers={[fillMaxWidth(), testID('send-code')]}>
              <Text>Send code</Text>
            </Button>
          </>
        ) : (
          <>
            <Text color={palette.onSurfaceVariant} style={{ typography: 'bodyLarge' }}>
              {`Enter the 6-digit code we sent to ${email}.`}
            </Text>
            <OutlinedTextField
              value={codeState}
              onValueChange={setCode}
              isError={!!fieldError}
              singleLine
              maxLength={6}
              keyboardOptions={{ keyboardType: 'number', imeAction: 'done' }}
              keyboardActions={{ onDone: () => submitCode() }}
              modifiers={[fillMaxWidth(), testID('code')]}>
              <OutlinedTextField.Label>
                <Text>Code</Text>
              </OutlinedTextField.Label>
              {fieldError ? (
                <OutlinedTextField.SupportingText>
                  <Text>{fieldError}</Text>
                </OutlinedTextField.SupportingText>
              ) : null}
            </OutlinedTextField>
            {formError ? <Text color={palette.error}>{formError}</Text> : null}
            <Button enabled={!busy} onClick={submitCode} modifiers={[fillMaxWidth(), testID('sign-in')]}>
              <Text>Sign in</Text>
            </Button>
            <TextButton enabled={cooldown <= 0 && !busy} onClick={() => sendCode(email)} modifiers={[fillMaxWidth()]}>
              <Text>{cooldown > 0 ? `Send a new code (${cooldown}s)` : 'Send a new code'}</Text>
            </TextButton>
            <TextButton onClick={useDifferentEmail} modifiers={[fillMaxWidth()]}>
              <Text>Use a different email</Text>
            </TextButton>
          </>
        )}
      </Column>
    </Box>
  );
}
