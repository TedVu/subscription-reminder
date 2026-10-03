import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import { OfflineError } from '@/lib/queries/online';
import { parseRemindDays } from '@/lib/reminders/prefs';

import { ReminderSettings } from './reminder-settings';

jest.mock('@react-native-community/netinfo', () => ({ fetch: jest.fn(), addEventListener: jest.fn() }));

const defaults = { remind_days: [3, 1], notify_push: true, notify_in_app: true, notify_email: true };

describe('parseRemindDays', () => {
  it.each([
    ['3, 1', [3, 1]],
    ['1 3', [3, 1]],
    ['0', [0]],
    ['30,7,1', [30, 7, 1]],
  ])('accepts %p', (text, days) => {
    expect(parseRemindDays(text)).toEqual({ ok: true, days });
  });

  it.each([
    ['', /at least one/],
    ['7, 3, 1, 0', /at most 3/],
    ['3, 3', /duplicate/],
    ['31', /0 to 30/],
    ['-1', /0 to 30/],
    ['1.5', /0 to 30/],
  ])('rejects %p', (text, message) => {
    const result = parseRemindDays(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(message);
  });
});

describe('reminders: reminder preferences', () => {
  it('shows the current preferences', async () => {
    await render(<ReminderSettings profile={defaults} onSave={jest.fn()} />);
    expect(screen.getByLabelText('Phone notifications')).toHaveProp('value', true);
    expect(screen.getByLabelText('Email reminders')).toHaveProp('value', true);
    expect(screen.getByLabelText('Remind me this many days before')).toHaveDisplayValue('3, 1');
  });

  it('turning email off and reminding 7 days before saves both', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    await render(<ReminderSettings profile={defaults} onSave={onSave} />);

    // press() doesn't toggle a Switch; flipping it fires valueChange.
    await fireEvent(screen.getByLabelText('Email reminders'), 'valueChange', false);
    await user.clear(screen.getByLabelText('Remind me this many days before'));
    await user.type(screen.getByLabelText('Remind me this many days before'), '7');
    await user.press(screen.getByRole('button', { name: 'Save reminder settings' }));

    expect(onSave).toHaveBeenCalledWith({ notify_push: true, notify_in_app: true, notify_email: false, remind_days: [7] });
    expect(await screen.findByText('Saved.')).toBeOnTheScreen();
  });

  it('rejects a fourth value without saving', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    await render(<ReminderSettings profile={defaults} onSave={onSave} />);

    await user.type(screen.getByLabelText('Remind me this many days before'), ', 7, 14');
    await user.press(screen.getByRole('button', { name: 'Save reminder settings' }));

    expect(await screen.findByText('Use at most 3 reminders')).toBeOnTheScreen();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('rejects duplicates without saving', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    await render(<ReminderSettings profile={defaults} onSave={onSave} />);

    await user.clear(screen.getByLabelText('Remind me this many days before'));
    await user.type(screen.getByLabelText('Remind me this many days before'), '3, 3');
    await user.press(screen.getByRole('button', { name: 'Save reminder settings' }));

    expect(await screen.findByText('Remove the duplicate value')).toBeOnTheScreen();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('explains when offline', async () => {
    const onSave = jest.fn().mockRejectedValue(new OfflineError());
    const user = userEvent.setup();
    await render(<ReminderSettings profile={defaults} onSave={onSave} />);

    await user.press(screen.getByRole('button', { name: 'Save reminder settings' }));
    expect(await screen.findByText(/You're offline/)).toBeOnTheScreen();
  });

  it('explains when phone notifications are blocked by the OS', async () => {
    await render(<ReminderSettings profile={defaults} pushBlocked onSave={jest.fn()} />);
    expect(screen.getByText(/Turn them on in your phone's Settings/)).toBeOnTheScreen();
  });
});
