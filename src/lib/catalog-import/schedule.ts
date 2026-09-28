export const CATALOG_SCHEDULE_TIME_ZONE = "Australia/Melbourne";

type ZonedDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function zonedDateTimeParts(date: Date, timeZone: string): ZonedDateTimeParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const number = (part: keyof ZonedDateTimeParts) => Number(values.get(part));
  return {
    year: number("year"),
    month: number("month"),
    day: number("day"),
    hour: number("hour"),
    minute: number("minute"),
    second: number("second"),
  };
}

function timeZoneOffsetMilliseconds(date: Date, timeZone: string) {
  const parts = zonedDateTimeParts(date, timeZone);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return representedAsUtc - Math.floor(date.getTime() / 1_000) * 1_000;
}

function zonedMidnightUtc(year: number, month: number, day: number, timeZone: string) {
  const nominalUtc = Date.UTC(year, month - 1, day);
  let instant = nominalUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    instant = nominalUtc - timeZoneOffsetMilliseconds(new Date(instant), timeZone);
  }
  return new Date(instant);
}

export function catalogRunStamp(date = new Date()) {
  const parts = zonedDateTimeParts(date, CATALOG_SCHEDULE_TIME_ZONE);
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}-${pad(parts.hour)}${pad(parts.minute)}${pad(parts.second)}`;
}

export function catalogDayBounds(date = new Date()) {
  const parts = zonedDateTimeParts(date, CATALOG_SCHEDULE_TIME_ZONE);
  const nextDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  return {
    start: zonedMidnightUtc(parts.year, parts.month, parts.day, CATALOG_SCHEDULE_TIME_ZONE),
    end: zonedMidnightUtc(
      nextDate.getUTCFullYear(),
      nextDate.getUTCMonth() + 1,
      nextDate.getUTCDate(),
      CATALOG_SCHEDULE_TIME_ZONE,
    ),
  };
}
