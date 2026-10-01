# Spec Delta

## Purpose

Lets a person create an account and sign in with only their email address, so their subscriptions are stored securely and reminders reach a verified inbox.

## ADDED Requirements

### Requirement: Sign in with an emailed code
The system SHALL let a user sign in by entering their email address and then entering a 6-digit code sent to that address. Signing in with a new address SHALL create an account. The system SHALL NOT use passwords.

#### Scenario: New user signs in
- **WHEN** a person enters an email address with no account and then enters the correct code sent to it
- **THEN** an account is created for that address, the address is marked verified, and the user is signed in

#### Scenario: Returning user signs in
- **WHEN** a person enters the email address of an existing account and then enters the correct code
- **THEN** they are signed in to that account and see its subscriptions

#### Scenario: Wrong or expired code
- **WHEN** the user enters a code that is wrong or has expired
- **THEN** sign-in fails, an error explains the code is invalid or expired, and the user can request a new code

#### Scenario: Invalid email address
- **WHEN** the user enters text that is not a valid email address
- **THEN** no code is sent and the form shows a validation error

### Requirement: Session persists across launches
The system SHALL keep the user signed in across app restarts until they sign out or the session can no longer be refreshed. The session SHALL be stored in the device's secure storage.

#### Scenario: Reopen the app
- **WHEN** a signed-in user closes and reopens the app
- **THEN** they are still signed in and land on the home screen without entering a code

#### Scenario: Signed-out user opens the app
- **WHEN** a user with no session opens the app
- **THEN** they see the sign-in screen and cannot reach any other screen

### Requirement: Sign out
The system SHALL let the user sign out. Signing out SHALL remove the session and cached subscription data from the device and cancel phone notifications scheduled by the app.

#### Scenario: User signs out
- **WHEN** the user chooses sign out in settings
- **THEN** they return to the sign-in screen, no subscription data remains visible on the device, and no further phone reminders fire

### Requirement: Delete account
The system SHALL let the user permanently delete their account from inside the app after an explicit confirmation. Deleting SHALL remove the account, all its subscriptions, its preferences and its reminder history from the server, and SHALL sign the user out.

#### Scenario: User confirms deletion
- **WHEN** the user chooses delete account and confirms
- **THEN** all of their server data is deleted, they are signed out, and signing in again with the same email starts a new empty account

#### Scenario: User cancels deletion
- **WHEN** the user chooses delete account and then cancels the confirmation
- **THEN** nothing is deleted and they stay signed in

### Requirement: Users can only access their own data
The system SHALL ensure a user can read and change only their own subscriptions, preferences and reminder history, enforced by the server and not only by the app.

#### Scenario: Request for another user's data
- **WHEN** a signed-in user's credentials are used to request or change another user's subscription
- **THEN** the server returns no data and makes no change
