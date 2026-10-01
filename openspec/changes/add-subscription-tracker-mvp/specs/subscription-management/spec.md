# Spec Delta

## Purpose

Lets a user keep an accurate record of the subscriptions they already pay for elsewhere: what each one is, what it costs in AUD, how often it bills and whether it is still active.

## ADDED Requirements

### Requirement: Subscriptions are tracked manually
The system SHALL treat every subscription as a record entered by the user. The system SHALL NOT sign up for, pay for, cancel, or connect to any third-party service on the user's behalf.

#### Scenario: Recording a subscription has no external effect
- **WHEN** the user adds a Netflix subscription
- **THEN** only a record is saved in the user's account and no request is made to Netflix

### Requirement: Add a subscription
The system SHALL let the user add a subscription with: a name (required, 1-60 characters), a price in AUD (required, from $0.00 to $99,999.99), a billing cycle (required), a start date (required), a free-trial end date (optional), a category (optional) and notes (optional, up to 500 characters). Billing cycles SHALL be an interval of 1-12 in weeks, months or years. Newly added subscriptions SHALL be active.

#### Scenario: Valid subscription is saved
- **WHEN** the user enters name "Spotify", price 13.99, cycle every 1 month and start date 2026-03-05, and saves
- **THEN** the subscription appears in their list as active, priced at $13.99 per month

#### Scenario: Missing required field
- **WHEN** the user tries to save without a name or price
- **THEN** the subscription is not saved and the missing fields are highlighted

#### Scenario: Invalid price
- **WHEN** the user enters a negative price, more than two decimal places, or more than $99,999.99
- **THEN** the subscription is not saved and the form explains the allowed price format

### Requirement: Prices are in AUD only
The system SHALL record and display every price in Australian dollars, stored exactly in whole cents. The system SHALL NOT offer a currency choice.

#### Scenario: Price display
- **WHEN** a subscription with a price of 15.49 is shown anywhere in the app
- **THEN** it is displayed as "$15.49" with no rounding error, and no other currency can be selected

### Requirement: Service catalog prefills common services
The system SHALL offer a searchable catalog of at least these services: Netflix, Spotify, YouTube Premium, LinkedIn Premium, Disney+, Stan, Binge, Amazon Prime, Apple One, iCloud+, Google One, Microsoft 365, ChatGPT Plus, Kayo Sports and Paramount+. Choosing one SHALL prefill the name and a suggested billing cycle and show an icon for that service. The system SHALL NOT prefill a price. The user SHALL also be able to add a custom subscription not in the catalog.

#### Scenario: Choose a catalog service
- **WHEN** the user searches "spo" and picks Spotify
- **THEN** the form shows name "Spotify", cycle monthly and the Spotify icon, and the price is empty for the user to enter

#### Scenario: Custom subscription
- **WHEN** the user picks custom and types "Local gym"
- **THEN** they can save it with a generic icon and any valid cycle

### Requirement: Edit a subscription
The system SHALL let the user change any field of a subscription. Changes to the start date, cycle or trial end date SHALL recalculate the next renewal and its reminders.

#### Scenario: Change the price
- **WHEN** the user changes Netflix from $15.49 to $18.99 and saves
- **THEN** the list and totals show $18.99

#### Scenario: Change the cycle
- **WHEN** the user changes a subscription from monthly to yearly
- **THEN** its next renewal date and scheduled reminders are recalculated

### Requirement: Pause, cancel and reactivate
The system SHALL let the user set a subscription to paused or cancelled and set it back to active. Paused and cancelled subscriptions SHALL be kept in the list, shown separately from active ones, excluded from totals, and SHALL NOT trigger reminders. Reactivating SHALL resume reminders from the next renewal on or after today.

#### Scenario: Cancel a subscription
- **WHEN** the user marks Stan as cancelled
- **THEN** Stan moves to the cancelled section, the totals drop by its cost, and no further Stan reminders are sent

#### Scenario: Reactivate
- **WHEN** the user sets a cancelled subscription back to active
- **THEN** it rejoins the active list and totals, and reminders resume for its next renewal

### Requirement: Delete a subscription
The system SHALL let the user permanently delete a subscription after confirming. Deleting SHALL cancel its pending reminders.

#### Scenario: Delete with confirmation
- **WHEN** the user deletes a subscription and confirms
- **THEN** it disappears from all lists and totals and no reminders for it are delivered

### Requirement: Edits need a connection, viewing works offline
The system SHALL require an internet connection to add, edit, change the status of or delete a subscription. Without a connection, the system SHALL still show the most recently loaded subscriptions and SHALL tell the user that changes can't be saved.

#### Scenario: Save while offline
- **WHEN** the device is offline and the user tries to save a change
- **THEN** the change is not saved, the form keeps what they typed, and a message says they need a connection

#### Scenario: Browse while offline
- **WHEN** the device is offline and the user opens the app after having loaded their subscriptions before
- **THEN** they see their last loaded subscriptions with an indication that the data may be out of date
