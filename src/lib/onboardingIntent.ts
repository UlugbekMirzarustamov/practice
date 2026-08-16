export type OnboardingIntent = 'prepping' | 'habit' | 'curious'

const INTENT_KEY = 'practice.onboardingIntent'
const ANSWERED_KEY = 'practice.onboardingIntentAnswered'

export function hasAnsweredOnboardingIntent(): boolean {
  return localStorage.getItem(ANSWERED_KEY) === 'true'
}

/** Pass null for a skip — records that the prompt was seen without setting a preference. */
export function saveOnboardingIntent(intent: OnboardingIntent | null): void {
  localStorage.setItem(ANSWERED_KEY, 'true')
  if (intent) localStorage.setItem(INTENT_KEY, intent)
}
