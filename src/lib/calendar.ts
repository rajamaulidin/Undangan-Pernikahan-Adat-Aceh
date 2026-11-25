import type { ReceptionSchedule } from "@/config/wedding.config";

function toIcsUtcTimestamp(isoString: string): string {
  const d = new Date(isoString);
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function buildGoogleCalendarUrl(
  schedule: ReceptionSchedule,
  coupleSummary: string
): string {
  const startUtc = toIcsUtcTimestamp(schedule.startTimeIso);
  const endUtc = toIcsUtcTimestamp(schedule.endTimeIso);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${schedule.title} (${coupleSummary})`,
    dates: `${startUtc}/${endUtc}`,
    details: schedule.description,
    location: `${schedule.venueName}, ${schedule.address}, ${schedule.city}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsContent(
  schedule: ReceptionSchedule,
  coupleSummary: string
): string {
  const startUtc = toIcsUtcTimestamp(schedule.startTimeIso);
  const endUtc = toIcsUtcTimestamp(schedule.endTimeIso);
  const nowUtc = toIcsUtcTimestamp(new Date().toISOString());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UndanganAdatAceh//IntatLintoBaro//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:intat-linto-baro-${startUtc}@undangan-aceh.local`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${schedule.title} - ${coupleSummary}`,
    `DESCRIPTION:${schedule.description}`,
    `LOCATION:${schedule.venueName}\\, ${schedule.address}\\, ${schedule.city}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

export function downloadIcsFile(
  schedule: ReceptionSchedule,
  coupleSummary: string
): void {
  const content = buildIcsContent(schedule, coupleSummary);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "resepsi-intat-linto-baro.ics";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
