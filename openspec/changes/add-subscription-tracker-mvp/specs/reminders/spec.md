# Spec Delta

## Purpose

Warns users ahead of each renewal and free-trial end through the channels they choose, so they have time to cancel or budget before they are charged.

## ADDED Requirements

### Requirement: Reminder preferences
The system SHALL let each user choose which channels are on (phone notification, in-app, email) and how many days before an event to be reminded, as a set of 1 to 3 distinct values between 0 and 30 days. Defaults SHALL be all three channels on and reminders at 3 days and 1 day before. Preferences SHALL apply to all of the user's subscriptions.

#### Scenario: Defaults for a new account
- **WHEN** a new user signs in for the first time
- **THEN** their preferences are phone, in-app and email on, with reminders 3 and 1 days before

#### Scenario: Change preferences
- **WHEN** the user turns email off and sets reminders to 7 days before
- **THEN** no further reminder emails are sent, and future phone and in-app reminders use the 7-day timing

### Requirement: Reminder events and timing
The system SHALL create a reminder for each active subscription's next renewal, or for its trial end while in a free trial, at each configured number of days before it. Reminders SHALL be due at 09:00 in the user's timezone on the reminder day. A reminder whose due time has already passed when it is created SHALL NOT be sent. Paused and cancelled subscriptions SHALL NOT produce reminders.

#### Scenario: Standard reminders
- **WHEN** Netflix renews on 2026-10-12, the user's timezone is Australia/Sydney, and reminders are 3 and 1 days before
- **THEN** reminders are due at 09:00 Sydney time on 2026-10-09 and 2026-10-11

#### Scenario: Trial reminder
- **WHEN** a free trial ends on 2026-10-10 and a reminder is due 1 day before
- **THEN** the reminder says the trial converts to paid on 10 Oct 2026 and states the price

#### Scenario: Subscription added too late for a reminder
- **WHEN** the user adds a subscription renewing tomorrow and reminders are 3 and 1 days before
- **THEN** the 3-day reminder is not sent and the 1-day reminder is sent only if its 09:00 time is still ahead

### Requirement: User timezone
The system SHALL store the user's timezone, taken from the device, and update it when the app opens on a device set to a different timezone. Reminder times SHALL follow daylight saving changes in that timezone.

#### Scenario: Timezone is updated
- **WHEN** a user whose stored timezone is Australia/Sydney opens the app on a device set to Australia/Perth
- **THEN** their stored timezone becomes Australia/Perth and later email reminders arrive at 09:00 Perth time

### Requirement: Phone notifications
When phone notifications are on and the user has granted notification permission, the system SHALL show a device notification at each due reminder time, including when the app is closed or the device is offline. The notification SHALL name the subscription, the price and the renewal or trial end date, and tapping it SHALL open that subscription. The system SHALL refresh scheduled notifications whenever subscriptions or preferences change and whenever the app opens.

#### Scenario: Notification fires
- **WHEN** a 3-day phone reminder is due for Spotify, renewing at $13.99 on 8 Oct
- **THEN** the device shows a notification such as "Spotify renews in 3 days: $13.99 on 8 Oct", even if the app is closed

#### Scenario: Permission denied
- **WHEN** the user has denied notification permission
- **THEN** settings show that phone reminders are blocked and explain how to enable them in the device settings, and the other channels still work

#### Scenario: Subscription deleted
- **WHEN** the user deletes a subscription that had a scheduled phone reminder
- **THEN** that notification does not fire

### Requirement: In-app reminders
When in-app reminders are on, the system SHALL show a "renewing soon" section on the home screen listing every active subscription with a renewal or trial end within the user's largest reminder window, soonest first, each with its date, price and days remaining. When there are none, the section SHALL say nothing is renewing soon.

#### Scenario: Items within the window
- **WHEN** reminders are 3 and 1 days before, and Netflix renews in 2 days and Spotify in 10 days
- **THEN** the renewing soon section lists Netflix with "in 2 days" and does not list Spotify

#### Scenario: In-app reminders off
- **WHEN** the user turns in-app reminders off
- **THEN** the renewing soon section is not shown

### Requirement: Email reminders
When email reminders are on, the system SHALL email the user's verified address for each due reminder, whether or not the app has been opened recently. Each email SHALL name the subscription, price and renewal or trial end date and SHALL include a way to turn email reminders off. The system SHALL send each reminder email at most once, even if sending is retried. An email SHALL be sent no later than 2 hours after its due time.

#### Scenario: Email sent while the app is unused
- **WHEN** an email reminder for Netflix is due and the user has not opened the app for a month
- **THEN** an email about the Netflix renewal arrives within 2 hours of the due time

#### Scenario: No duplicates
- **WHEN** the sending process runs again after an email for a reminder was already sent
- **THEN** the user does not receive a second email for that reminder

#### Scenario: Email turned off
- **WHEN** the user turns email reminders off
- **THEN** no reminder emails are sent to them from then on
