import { render, screen, userEvent } from '@testing-library/react-native';

import { requestCode, verifyCode } from '@/lib/auth/auth-api';

import { SignInForm } from './sign-in-form';

jest.mock('@/lib/supabase/client', () => ({ supabase: {} }));
jest.mock('@/lib/auth/auth-api', () => ({
  ...jest.requireActual('@/lib/auth/auth-api'),
  requestCode: jest.fn(),
  verifyCode: jest.fn(),
}));

const mockRequestCode = jest.mocked(requestCode);
const mockVerifyCode = jest.mocked(verifyCode);

beforeEach(() => {
  jest.clearAllMocks();
  mockRequestCode.mockResolvedValue({ ok: true });
});

async function goToCodeStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email'), 'Ted@Example.com');
  await user.press(screen.getByRole('button', { name: 'Send code' }));
  await screen.findByLabelText('Code');
}

describe('user-auth: sign in with an emailed code', () => {
  it('invalid email address: no code is sent and a validation error is shown', async () => {
    const user = userEvent.setup();
    await render(<SignInForm />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.press(screen.getByRole('button', { name: 'Send code' }));

    expect(await screen.findByText('Enter a valid email address')).toBeOnTheScreen();
    expect(mockRequestCode).not.toHaveBeenCalled();
  });

  it('a valid email sends a code to the normalised address and asks for it', async () => {
    const user = userEvent.setup();
    await render(<SignInForm />);

    await goToCodeStep(user);

    expect(mockRequestCode).toHaveBeenCalledWith('ted@example.com');
    expect(screen.getByText('Enter the 6-digit code we sent to ted@example.com.')).toBeOnTheScreen();
  });

  it('wrong or expired code: shows the error and offers a new code', async () => {
    mockVerifyCode.mockResolvedValue({
      ok: false,
      message: 'That code is wrong or has expired. Check it, or send a new code.',
    });
    const user = userEvent.setup();
    await render(<SignInForm />);
    await goToCodeStep(user);

    await user.type(screen.getByLabelText('Code'), '123456');
    await user.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(mockVerifyCode).toHaveBeenCalledWith('ted@example.com', '123456');
    expect(
      await screen.findByText('That code is wrong or has expired. Check it, or send a new code.'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Send a new code/ })).toBeOnTheScreen();
  });

  it('a code that is not 6 digits is rejected before calling the server', async () => {
    const user = userEvent.setup();
    await render(<SignInForm />);
    await goToCodeStep(user);

    await user.type(screen.getByLabelText('Code'), '12a');
    await user.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter the 6-digit code from the email')).toBeOnTheScreen();
    expect(mockVerifyCode).not.toHaveBeenCalled();
  });

  it('a server error while sending the code keeps the user on the email step', async () => {
    mockRequestCode.mockResolvedValue({ ok: false, message: 'Too many codes requested. Wait a minute, then try again.' });
    const user = userEvent.setup();
    await render(<SignInForm />);

    await user.type(screen.getByLabelText('Email'), 'ted@example.com');
    await user.press(screen.getByRole('button', { name: 'Send code' }));

    expect(await screen.findByText('Too many codes requested. Wait a minute, then try again.')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Code')).toBeNull();
  });
});
