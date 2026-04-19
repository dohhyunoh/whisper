// Ephemeral handoff: sneak-peek picks a quote, notification-preview reuses it.
// Lives outside UserData since it's transient UI state, not user profile data.

let firstQuote: string | null = null;

export function setFirstQuote(quote: string) {
  firstQuote = quote;
}

export function getFirstQuote(): string | null {
  return firstQuote;
}
