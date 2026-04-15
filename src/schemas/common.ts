import { z } from "astro/zod";

export const yyyyMmDateSchema = z
  .string()
  .regex(
    /^(20[0-7]\d)-(0[1-9]|1[0-2])$/,
    "Must be YYYY-MM with year 2000–2079 and month 01–12",
  );

export const yyyyMmDdDateSchema = z
  .string()
  .regex(
    /^(20[0-7]\d)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    "Must be YYYY-MM-DD with valid zero-padded month/day",
  );

export const yyyyMmToDateSchema = yyyyMmDateSchema
  .transform((ym) => new Date(`${ym}-01T12:00:00.000Z`));

export const yyyyMmDdToDateSchema = yyyyMmDdDateSchema
  .transform((ymd) => new Date(`${ymd}T12:00:00.000Z`));

const DATETIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Chicago',
  timeZoneName: 'short',
});

export function formatDatetime(date: Date): string {
  const p = Object.fromEntries(
    DATETIME_FORMATTER.formatToParts(new Date(date)).map(({ type, value }) => [type, value])
  );
  return `${p.month} ${p.day}, ${p.year}, ${p.hour}:${p.minute}${p.dayPeriod.toLowerCase()} ${p.timeZoneName}`;
}

const YEAR_MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatYearMonth(date: Date): string {
  return YEAR_MONTH_FORMATTER.format(new Date(date));
}

const YEAR_MONTH_DAY_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatYearMonthDay(date: Date): string {
  return YEAR_MONTH_DAY_FORMATTER.format(new Date(date));
}
