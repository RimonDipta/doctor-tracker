const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Dates are stored and bucketed in UTC, so they are displayed in UTC too. */
export const formatDate = (value: string) => dateFormat.format(new Date(value));

export const toDateInput = (value: string) => value.slice(0, 10);

const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const monthYearFormat = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const formatMonth = (month: string) => monthFormat.format(new Date(`${month}-01`));
export const formatMonthYear = (month: string) => monthYearFormat.format(new Date(`${month}-01`));

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelative(value: string) {
  const seconds = (new Date(value).getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  if (Math.abs(seconds) >= 30 * 86_400) return formatDate(value);
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function initials(name: string) {
  const parts = name.replace(/^Dr\.?\s+/i, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase();
}

export function ageFrom(dateOfBirth: string) {
  const birth = new Date(dateOfBirth);
  const now = new Date();
  const age = now.getUTCFullYear() - birth.getUTCFullYear();
  const hadBirthday =
    now.getUTCMonth() > birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() >= birth.getUTCDate());
  return hadBirthday ? age : age - 1;
}

export const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

export const DOCTOR_STATUS_LABELS = {
  active: "Active",
  on_leave: "On leave",
  inactive: "Inactive",
} as const;

export const PATIENT_STATUS_LABELS = {
  active: "Active",
  follow_up: "Follow-up",
  discharged: "Discharged",
} as const;

export const GENDER_LABELS = {
  female: "Female",
  male: "Male",
  other: "Other",
  undisclosed: "Prefer not to say",
} as const;

export const toOptions = <K extends string>(labels: Record<K, string>) =>
  (Object.entries(labels) as [K, string][]).map(([value, label]) => ({ value, label }));
