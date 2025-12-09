export const RATING_REMINDER_DISMISSED_KEY =
  "spotlib-rating-reminder-dismissed";

export function dismissRatingReminder(): void {
  localStorage.setItem(RATING_REMINDER_DISMISSED_KEY, "true");
}

export function isRatingReminderDismissed(): boolean {
  return localStorage.getItem(RATING_REMINDER_DISMISSED_KEY) === "true";
}
