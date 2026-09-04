const MIN_CREDIT_INTERVAL_SECONDS = 15;
const MAX_CREDIT_INTERVAL_SECONDS = 90;

export function creditedActiveSeconds(previous: Date | null | undefined, now: Date): number {
  if (!previous) return 0;
  const elapsedSeconds = Math.floor((now.getTime() - previous.getTime()) / 1000);
  return elapsedSeconds >= MIN_CREDIT_INTERVAL_SECONDS && elapsedSeconds <= MAX_CREDIT_INTERVAL_SECONDS ? elapsedSeconds : 0;
}
