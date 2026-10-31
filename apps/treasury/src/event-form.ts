// 四個表單（記一筆、轉帳、對帳、退款）共用的：金額、日期時間的檢查，表單 → 事件的共同部分。都是純函式。

import type { Catalog, EntryId, Event, EventId, LocalDate, LocalTime, MoneyEffect, PersonId } from "@baobu/core";

export type Parsed<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: string };

/** 金額：大於 0 的整數。逗號可以打（1,000），其他都擋下來、講清楚 */
export function parseAmount(text: string): Parsed<number> {
  const clean = text.replaceAll(",", "").trim();
  if (clean === "") return { ok: false, error: "要填金額" };
  if (/^[-−－]/.test(clean)) return { ok: false, error: "金額不能是負的" };
  if (/^\d*\.\d*$/.test(clean)) return { ok: false, error: "金額要是整數，不能有小數" };
  if (!/^\d+$/.test(clean)) return { ok: false, error: "金額只能是數字" };
  const n = Number(clean);
  if (n === 0) return { ok: false, error: "金額要大於 0" };
  if (!Number.isSafeInteger(n)) return { ok: false, error: "金額太大了" };
  return { ok: true, value: n };
}

/** 組事件時的金額：畫面存之前已經檢查過，這裡還不對就是程式錯了 */
export function checkedAmount(text: string): number {
  const amount = parseAmount(text);
  if (!amount.ok) throw new Error(amount.error);
  return amount.value;
}

export const isDate = (text: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(text);

/** 日期、時間的檢查：日期有預設，清空了才會擋；時間可以不填 */
export function whenErrors(form: { readonly date: LocalDate; readonly time: LocalTime | "" }): readonly string[] {
  return [
    ...(isDate(form.date) ? [] : ["要填日期"]),
    ...(form.time === "" || /^\d{2}:\d{2}$/.test(form.time) ? [] : ["時間的格式不對"]),
  ];
}

/** 新的一筆的預設值要看的 */
export interface FormContext {
  readonly me: PersonId;
  readonly catalog: Catalog;
  readonly events: readonly Event[];
  readonly now: Date;
}

/** 表單存的事件都是一則一筆，一筆的 ID 只要在這一則裡不重複 */
export const ENTRY_ID = "m1" as EntryId;

/** 這則事件是一則一筆、而且是這一種的話，回傳那一筆（表單只打得開這種，表達不了的不要假裝改得了） */
export function soleEntry<K extends MoneyEffect["kind"]>(event: Event, kind: K): Extract<MoneyEffect, { readonly kind: K }> | undefined {
  const [m, ...rest] = event.effects;
  return rest.length === 0 && m?.kind === kind ? (m as Extract<MoneyEffect, { readonly kind: K }>) : undefined;
}

export interface BuildContext {
  /** 新的一筆用；改一筆時用 existing 的 */
  readonly id: EventId;
  readonly me: PersonId;
  readonly now: number;
  /** 改一筆時：原本那則。id、recordedBy、recordedAt（規則不讓改）、一筆與品項的 ID（退款指著它們）、表單沒有的欄位都留著 */
  readonly existing?: Event;
}

/** 事件的共同部分。名稱、時間空了要把欄位拿掉，不能留舊的 */
export function eventBase(form: { readonly title: string; readonly date: LocalDate; readonly time: LocalTime | "" }, ctx: BuildContext): Omit<Event, "effects"> {
  const { effects: _effects, title: _title, time: _time, ...kept } = ctx.existing ?? {
    id: ctx.id,
    date: form.date,
    recordedBy: ctx.me,
    recordedAt: ctx.now,
    source: "manual" as const,
    status: "confirmed" as const,
    effects: [],
  };
  const title = form.title.trim();
  return { ...kept, date: form.date, ...(form.time === "" ? {} : { time: form.time }), ...(title === "" ? {} : { title }) };
}
