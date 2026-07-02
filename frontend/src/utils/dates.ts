export function toLocalInputValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);

  return local.toISOString().slice(0, 16);
}

export function defaultBookingStart(): string {
  return toLocalInputValue(new Date(Date.now() + 60 * 60_000));
}

export function defaultBookingEnd(): string {
  return toLocalInputValue(new Date(Date.now() + 2 * 60 * 60_000));
}

export function defaultRangeStart(): string {
  return toLocalInputValue(new Date(Date.now() - 60 * 60_000));
}

export function defaultRangeEnd(): string {
  return toLocalInputValue(new Date(Date.now() + 8 * 60 * 60_000));
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}
