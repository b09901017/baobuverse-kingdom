// 當地日期 `YYYY-MM-DD` 的加減、事件的先後。只用字串與整數，不經過 Date（不會被時區影響）。

import type { Event, LocalDate } from "./model";

/** 事件的先後：日期 → 時間（沒寫的排前面）→ 記下來的時間 → ID */
export function byTime(a: Event, b: Event): number {
  return (
    compare(a.date, b.date) || compare(a.time ?? "", b.time ?? "") || a.recordedAt - b.recordedAt || compare(a.id, b.id)
  );
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** 往後 n 個月的同一天；那個月沒有這天就用月底（1/31 → 2/28） */
export function addMonths(date: LocalDate, n: number): LocalDate {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const index = y * 12 + (m - 1) + n;
  const year = (index - (index % 12)) / 12;
  const month = (index % 12) + 1;
  const day = Math.min(d, daysIn(year, month));
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

function daysIn(year: number, month: number): number {
  if (month === 2) return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}
