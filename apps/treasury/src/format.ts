// 畫面上的數字與當地日期、時間。只有純函式。

import type { LocalDate, LocalTime } from "@baobu/core";

const pad = (n: number) => String(n).padStart(2, "0");

/** 1,234；負的用「−」 */
export function money(n: number): string {
  const text = Math.abs(n).toLocaleString("en-US");
  return n < 0 ? `−${text}` : text;
}

/** 這一刻當地是哪一天 */
export function dateOf(now: Date): LocalDate {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** 這一刻當地是幾點幾分 */
export function timeOf(now: Date): LocalTime {
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** 從 from 到 to 過了幾天（to 比較早是負的）。用 UTC 算，不會被日光節約影響 */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  const utc = (date: LocalDate) => {
    const [y, m, d] = date.split("-").map(Number) as [number, number, number];
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** 10/31（六） */
export function dayLabel(date: LocalDate): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return `${m}/${d}（${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}）`;
}
