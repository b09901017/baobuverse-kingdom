// 退款的邏輯（stage-1 issue 06）：商家退回的錢，沖回原本那一項，不算收入（GLOSSARY）。純函式，畫面在 screens/RefundForm.tsx。
// 存成一則新事件、在原本那筆上看得到註記（plan.md）。約束在 core 的 validateEvent；這裡先把話講清楚，core 是最後一道。

import { blockersOfDelete, byTime, refundsOf, type Account, type AccountId, type EntryId, type Event, type EventId, type Expense, type Item, type ItemRef, type LocalDate, type LocalTime, type Refund } from "@baobu/core";
import { dateOf, dayLabel, money, timeOf } from "./format";
import { eventBase, parseAmount, type BuildContext } from "./record";

/** 要退的那一項 */
export interface RefundTarget {
  readonly event: Event;
  readonly expense: Expense;
  readonly item: Item;
  readonly ref: ItemRef;
  /** 原本的名稱；沒有就沒有 */
  readonly title?: string;
}

export interface RefundForm {
  readonly amount: string;
  /** 退回哪個帳戶；空字串只出現在原本那筆也不知道帳戶時：不動任何帳戶的餘額 */
  readonly account: AccountId | "";
  readonly date: LocalDate;
  /** 空字串是沒寫時間 */
  readonly time: LocalTime | "";
}

function targetIn(event: Event, expense: Expense, item: Item): RefundTarget | null {
  if (event.status !== "confirmed" || item.cash !== undefined) return null;
  const title = event.title ?? item.name;
  return { event, expense, item, ref: { event: event.id, entry: expense.id, item: item.id }, ...(title === undefined ? {} : { title }) };
}

/** 這則事件的「退款」要退哪一項：階段 1 沒有拆品項的畫面，一則一筆一項才有；直接給錢的不能退（core 也擋） */
export function refundTargetOf(event: Event): RefundTarget | null {
  const [m, ...rest] = event.effects;
  if (m?.kind !== "expense" || rest.length > 0 || m.items.length !== 1) return null;
  const [item] = m.items;
  return item === undefined ? null : targetIn(event, m, item);
}

/** 從退款找回原本那一項；找不到（已經看不到了）是 null */
export function refundTargetAt(events: readonly Event[], ref: ItemRef): RefundTarget | null {
  const event = events.find((e) => e.id === ref.event);
  const expense = event?.effects.find((m): m is Expense => m.id === ref.entry && m.kind === "expense");
  const item = expense?.items.find((i) => i.id === ref.item);
  return event === undefined || expense === undefined || item === undefined ? null : targetIn(event, expense, item);
}

/** 還沒退的金額；except 是正在改的那則退款（不算自己） */
export function refundable(target: RefundTarget, events: readonly Event[], except?: EventId): number {
  const refunded = refundsOf(events, target.ref)
    .filter((r) => r.event !== except)
    .reduce((sum, r) => sum + r.amount, 0);
  return target.item.amount - refunded;
}

/** 新的一筆退款：金額預設還沒退的全部、帳戶是原本那個、時間是現在（沒寫時間的排在同一天前面，core 會擋） */
export function defaultRefund(target: RefundTarget, events: readonly Event[], now: Date): RefundForm {
  return { amount: String(refundable(target, events)), account: target.expense.account ?? "", date: dateOf(now), time: timeOf(now) };
}

/**
 * 退回帳戶的選單：原本那筆誰出的人的，不含投資（進出都是轉帳）、共有、封存、別筆的寶媽卡（還它是還款）。
 * 原本那個帳戶、這一筆現在用的（改一筆時）就算封存了也要在，不然表單變空。
 */
export function refundAccountOptions(accounts: readonly Account[], expense: Expense, current?: AccountId | ""): readonly Account[] {
  return accounts.filter((a) => {
    if (!a.owners.includes(expense.payer)) return false;
    if (a.id === expense.account || a.id === current) return true;
    return !a.archived && a.kind !== "investment" && a.owners.length === 1 && a.paidByOthers !== true;
  });
}

/** 表單有什麼問題；空的就可以存。recordedAt：新的一筆是現在，改一筆是原本的；self：正在改的這則 */
export function checkRefundForm(form: RefundForm, target: RefundTarget, events: readonly Event[], ctx: { readonly recordedAt: number; readonly self?: EventId }): readonly string[] {
  const errors: string[] = [];
  const amount = parseAmount(form.amount);
  const left = refundable(target, events, ctx.self);
  if (!amount.ok) errors.push(amount.error);
  else if (amount.value > left) {
    const done = target.item.amount - left;
    errors.push(`最多只能退 ${money(left)} 元${done > 0 ? `（已經退了 ${money(done)} 元）` : ""}`);
  }
  const dated = /^\d{4}-\d{2}-\d{2}$/.test(form.date);
  if (!dated) errors.push("要填日期");
  if (form.time !== "" && !/^\d{2}:\d{2}$/.test(form.time)) errors.push("時間的格式不對");
  if (dated) {
    const order = orderProblem(form, target.event, ctx.recordedAt);
    if (order !== undefined) errors.push(order);
  }
  return errors;
}

/** 退款要排在原本那筆之後（帳本照這個先後算，排在前面就找不到原本那一項）。先後跟帳本同一個 byTime */
function orderProblem(form: RefundForm, original: Event, recordedAt: number): string | undefined {
  const { time: _time, ...rest } = original;
  const refundAt: Event = { ...rest, date: form.date, recordedAt, ...(form.time === "" ? {} : { time: form.time }), effects: [] };
  if (byTime(original, refundAt) < 0) return undefined;
  if (form.time === "" && form.date === original.date && original.time !== undefined) return `同一天的退款要寫時間，而且要比原本那筆（${original.time}）晚`;
  return `退款要排在原本那筆（${dayLabel(original.date)}${original.time === undefined ? "" : ` ${original.time}`}）之後`;
}

/** 這則事件打得開退款的表單嗎：一則一筆退款。沒寫帳戶：就是原本那筆的帳戶 */
export function refundFormOf(event: Event, target?: RefundTarget | null): RefundForm | null {
  const [m, ...rest] = event.effects;
  if (m?.kind !== "refund" || rest.length > 0) return null;
  return { amount: String(m.amount), account: m.account ?? target?.expense.account ?? "", date: event.date, time: event.time ?? "" };
}

const entryId = "m1" as EntryId;

export function buildRefund(form: RefundForm, target: RefundTarget, ctx: BuildContext): Event {
  const amount = parseAmount(form.amount);
  if (!amount.ok) throw new Error(amount.error); // 畫面存之前先 checkRefundForm
  const was = ctx.existing?.effects[0]?.kind === "refund" ? ctx.existing.effects[0] : undefined;
  const { account: _account, ...entry } = was ?? { type: "money" as const, id: entryId, kind: "refund" as const, target: target.ref };
  // 退回原本那個帳戶就不寫：原本那筆之後改帳戶時，退款跟著走，兩個帳戶的餘額才對
  const elsewhere = form.account !== "" && form.account !== target.expense.account;
  const refund: Refund = { ...entry, amount: amount.value, ...(elsewhere ? { account: form.account } : {}) };
  const title = ctx.existing === undefined ? target.title : ctx.existing.title;
  return { ...eventBase({ ...form, title: title ?? "" }, ctx), effects: [refund] };
}

/** 原本那筆上的註記：已退多少與每一筆的日期；沒退過是 undefined。不是另存的數字，是查退款事件來的，刪掉退款就不見 */
export function refundNote(event: Event, events: readonly Event[]): string | undefined {
  const records = blockersOfDelete(event.id, events);
  if (records.length === 0) return undefined;
  const total = records.reduce((sum, r) => sum + r.amount, 0);
  const each = records.length === 1 ? dayLabel(records[0]?.date as LocalDate) : records.map((r) => `${dayLabel(r.date)}${money(r.amount)}`).join("、");
  return `已退 ${money(total)} 元：${each}`;
}
