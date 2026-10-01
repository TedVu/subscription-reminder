# Spec Delta

## Purpose

Gives users an at-a-glance picture of what their subscriptions cost and what is about to renew, which is the main view when they open the app.

## ADDED Requirements

### Requirement: Cost totals
The system SHALL show the total cost of active subscriptions as a monthly figure and a yearly figure in AUD. Each subscription SHALL be converted to a yearly cost (weekly price x 52, monthly x 12, yearly x 1, divided by the cycle interval), and the monthly total SHALL be the yearly total divided by 12, rounded to the nearest cent. Subscriptions that are in a free trial, paused or cancelled SHALL NOT count towards totals.

#### Scenario: Mixed cycles
- **WHEN** the active subscriptions are $15.49 monthly and $120.00 yearly
- **THEN** the yearly total is $305.88 and the monthly total is $25.49

#### Scenario: No active subscriptions
- **WHEN** the user has no active subscriptions
- **THEN** both totals show $0.00 and the home screen invites them to add their first subscription

### Requirement: Upcoming renewals list
The system SHALL show active subscriptions on the home screen ordered by next renewal or trial end date, soonest first, each with its name, icon, price, cycle and date.

#### Scenario: Ordering
- **WHEN** Netflix renews on 2026-10-12 and Spotify on 2026-10-05
- **THEN** Spotify is listed before Netflix

### Requirement: Totals update immediately
The system SHALL update the totals and the upcoming list as soon as a subscription is added, edited, paused, cancelled, reactivated or deleted, without the user refreshing.

#### Scenario: Add a subscription
- **WHEN** the user saves a new $10.99 monthly subscription
- **THEN** on returning to the home screen the monthly total has increased by $10.99
