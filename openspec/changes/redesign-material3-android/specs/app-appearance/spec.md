# Spec Delta

## Purpose

Defines how the app looks on the user's phone: native Material Design 3 on Android, colours that follow the user's wallpaper where possible, and a light, dark or system appearance the user can choose.

## ADDED Requirements

### Requirement: Material Design 3 interface on Android
The system SHALL present every screen (sign-in, Home, Subscriptions, add/edit subscription and Settings) using native Material Design 3 components, typography and motion on Android, including a Material bottom navigation bar for Home, Subscriptions and Settings.

#### Scenario: Navigating the app
- **WHEN** a signed-in user opens the app on Android
- **THEN** a Material 3 bottom navigation bar with Home, Subscriptions and Settings is shown, the current destination is highlighted with an active indicator, and switching destinations does not reload data

#### Scenario: Pressing a control
- **WHEN** the user presses a button, list item or switch
- **THEN** it shows Material press feedback (ripple or state layer)

### Requirement: Wallpaper-based colour with a teal fallback
The system SHALL colour the interface with the Material You dynamic palette derived from the user's wallpaper on Android 12 and newer. On Android 11 and older, the system SHALL use a Material 3 palette generated from the seed colour teal `#006A6A`.

#### Scenario: Android 12 or newer
- **WHEN** the app runs on Android 12+ and the user changes their wallpaper colours
- **THEN** the app's palette follows the new wallpaper colours

#### Scenario: Android 11 or older
- **WHEN** the app runs on a device without dynamic colour support
- **THEN** the app uses the palette generated from teal `#006A6A` in both light and dark mode

### Requirement: Appearance setting
The system SHALL let the user choose System, Light or Dark appearance in Settings. System SHALL follow the phone's light/dark setting. The choice SHALL apply immediately to every screen, the navigation bar, dialogs and the status bar, SHALL be remembered on the device across restarts and sign-out, and SHALL default to System. The app SHALL NOT show the wrong appearance while starting.

#### Scenario: Choosing Dark
- **WHEN** the user's phone is in light mode and they choose Dark in Settings
- **THEN** every screen switches to the dark Material palette immediately

#### Scenario: Choice remembered
- **WHEN** the user chose Light, closes the app and reopens it
- **THEN** the app opens in light appearance without first showing dark

#### Scenario: Back to System
- **WHEN** the user chooses System
- **THEN** the app follows the phone's current light or dark setting, including later changes to it

### Requirement: Service icons in lists
The system SHALL show each subscription with a leading icon tile: the catalog service's monogram in its brand colour, or the first letter of the name on a neutral tile for custom subscriptions.

#### Scenario: Catalog and custom subscriptions
- **WHEN** the list shows Spotify and a custom subscription named "Local gym"
- **THEN** Spotify has a green "S" tile and Local gym has a neutral "L" tile

### Requirement: Supported platform
The system SHALL support Android only until iOS support is added by a later change. Builds and releases SHALL target Android.

#### Scenario: Building the app
- **WHEN** a release or development build is produced
- **THEN** it is an Android build
