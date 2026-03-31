import PostHog from 'posthog-react-native';

export const posthog = new PostHog('phc_8NkT0vcocdWuRWSU28L303MN1vsHzQhf8YnRuopi4b2', {
  host: 'https://us.i.posthog.com',
  disabled: __DEV__,
});

// Event names
export const Events = {
  ONBOARDING_SCREEN_VIEWED: 'onboarding_screen_viewed',
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_CHOICE_MADE: 'onboarding_choice_made',
  PAYWALL_VIEWED: 'paywall_viewed',
  PAYWALL_PURCHASE_TAPPED: 'paywall_purchase_tapped',
  PAYWALL_PURCHASE_COMPLETED: 'paywall_purchase_completed',
  PAYWALL_SKIPPED: 'paywall_skipped',
  PAYWALL_RESTORE_TAPPED: 'paywall_restore_tapped',
  PAYWALL_TRIAL_VIEWED: 'paywall_trial_viewed',
  PAYWALL_TRIAL_STARTED: 'paywall_trial_started',
} as const;
