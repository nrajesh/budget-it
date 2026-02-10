/**
 * Parses a frequency string into milliseconds.
 * Supported formats:
 * - "7m", "7 min", "7 minutes" -> 7 * 60 * 1000
 * - "1h", "1 hour", "1 hr" -> 1 * 60 * 60 * 1000
 * - "1d", "1 day" -> 1 * 24 * 60 * 60 * 1000
 *
 * Returns null if parsing fails or input is invalid.
 * Minimum allowed value is 1 minute (60000ms).
 */
export function parseFrequency(input: string): number | null {
  if (!input || typeof input !== "string") return null;

  const normalized = input.toLowerCase().trim();

  // Regex to capture the number and the unit
  const regex = /^(\d+)\s*([a-z]+)$/;
  const match = normalized.match(regex);

  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (isNaN(value) || value <= 0) return null;

  let multiplier = 0;

  // Minutes
  if (["m", "min", "mins", "minute", "minutes"].includes(unit)) {
    multiplier = 60 * 1000;
  }
  // Hours
  else if (["h", "hr", "hrs", "hour", "hours"].includes(unit)) {
    multiplier = 60 * 60 * 1000;
  }
  // Days
  else if (["d", "day", "days"].includes(unit)) {
    multiplier = 24 * 60 * 60 * 1000;
  } else {
    return null;
  }

  const result = value * multiplier;

  // Enforce minimum 1 minute
  return result >= 60000 ? result : 60000;
}

/**
 * Formats milliseconds back to a readable string
 */
export function formatFrequency(ms: number): string {
  if (ms < 60000) return "Unknown";

  if (ms % (24 * 60 * 60 * 1000) === 0) {
    return `${ms / (24 * 60 * 60 * 1000)} day(s)`;
  }
  if (ms % (60 * 60 * 1000) === 0) {
    return `${ms / (60 * 60 * 1000)} hour(s)`;
  }
  return `${Math.floor(ms / 60000)} minute(s)`;
}
