# Spec Delta

## Purpose

Defines exactly when each subscription next renews and when a free trial ends, so that lists, totals and reminders all agree on the same dates.

## ADDED Requirements

### Requirement: Renewal dates are calculated from the start date
The system SHALL calculate a subscription's renewal dates as the start date plus whole multiples of its billing cycle. The next renewal SHALL be the earliest such date that is on or after today in the user's timezone. Each renewal SHALL be calculated from the start date, not from the previous renewal.

#### Scenario: Monthly renewal
- **WHEN** a monthly subscription started on 2026-03-05 and today is 2026-10-01
- **THEN** its next renewal is 2026-10-05

#### Scenario: Renewal today
- **WHEN** a monthly subscription started on 2026-03-05 and today is 2026-10-05
- **THEN** its next renewal is 2026-10-05

#### Scenario: Start date in the future
- **WHEN** a subscription's start date is after today
- **THEN** its next renewal is the start date

#### Scenario: Multi-week cycle
- **WHEN** a subscription bills every 2 weeks from 2026-09-01 and today is 2026-09-20
- **THEN** its next renewal is 2026-09-29

### Requirement: Month-end dates are clamped
The system SHALL move a renewal that falls on a day missing from the target month (for example the 31st) to that month's last day, without shifting later renewals.

#### Scenario: Started on the 31st
- **WHEN** a monthly subscription started on 2026-01-31
- **THEN** its renewals are 2026-02-28, 2026-03-31, 2026-04-30 and 2026-05-31

#### Scenario: Yearly from 29 February
- **WHEN** a yearly subscription started on 2028-02-29
- **THEN** it renews on 2029-02-28 and again on 2032-02-29

### Requirement: Renewals move forward automatically
The system SHALL treat a passed renewal as having happened and SHALL show the following renewal without asking the user to confirm.

#### Scenario: Day after renewal
- **WHEN** a monthly subscription renewed on 2026-10-05 and today is 2026-10-06
- **THEN** the app shows its next renewal as 2026-11-05

### Requirement: Free trials end on their trial end date
The system SHALL treat a subscription with a trial end date in the future as being in a free trial. While in a trial, its next billing event SHALL be the trial end date, labelled as the date the trial converts to paid. After the trial end date passes, renewals SHALL follow the normal schedule. A trial end date SHALL NOT be before the start date.

#### Scenario: Active trial
- **WHEN** a $13.99 monthly subscription has a trial ending 2026-10-10 and today is 2026-10-01
- **THEN** it shows that the trial ends on 10 Oct 2026 and then costs $13.99 per month

#### Scenario: Trial end before start
- **WHEN** the user enters a trial end date earlier than the start date
- **THEN** the subscription is not saved and the form explains the trial must end on or after the start date

### Requirement: Paused and cancelled subscriptions have no upcoming renewal
The system SHALL NOT show an upcoming renewal or trial end for a paused or cancelled subscription.

#### Scenario: Cancelled subscription
- **WHEN** a subscription is cancelled
- **THEN** no next renewal date is displayed for it
