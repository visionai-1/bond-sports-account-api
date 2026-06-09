// Reusable UTC date helpers. Pure date math — no business logic.

export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function nextUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1),
  );
}

// UTC calendar-day window [00:00:00.000, 23:59:59.999] for "today".
export function todayUtcRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = startOfUtcDay(now);
  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
  return { start, end };
}

// Whole-day inclusive statement window: [start of `from`'s UTC day, start of the
// day after `to`). The exclusive upper bound makes a date-only `to` include that day.
export function statementUtcRange(
  from: string,
  to: string,
): { from: Date; toExclusive: Date } {
  return {
    from: startOfUtcDay(new Date(from)),
    toExclusive: nextUtcDay(new Date(to)),
  };
}
