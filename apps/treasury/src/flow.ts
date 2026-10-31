// 流水頁（stage-1 issue 05、06）：事件 → 依日期倒排、同一天一組的列。純函式，畫面在 screens/FlowScreen.tsx。
// 流水不是一張表：是看得到的事件的查詢結果（README「日記不是一張表」同一個道理）。還款是階段 6 的畫面，這裡先不列。

import {
  byTime,
  type Account,
  type AccountId,
  type Book,
  type Catalog,
  type EntryId,
  type Event,
  type EventId,
  type Expense,
  type Income,
  type LocalDate,
  type MoneyEffect,
  type PersonId,
  type Reconciliation,
  type Refund,
  type Transfer,
} from "@baobu/core";
import { accountsMoved, balanceText } from "./accounts";
import { dayLabel, money, signedMoney } from "./format";
import { refundNote, refundTargetAt } from "./refund";

export type FlowKind = "expense" | "income" | "transfer" | "reconcile" | "opening" | "refund";

export interface FlowRow {
  readonly event: EventId;
  readonly entry: EntryId;
  /** 樣子看這個：轉帳、對帳、退款都不是支出，要看得出來 */
  readonly kind: FlowKind;
  readonly title: string;
  /** 有正負號：支出是負的，收入、退款是正的；對帳是差額；初始餘額是實際餘額；轉帳沒篩帳戶時是正的，篩了照那個帳戶的方向 */
  readonly amount: number;
  /** 畫面上那個數字的字 */
  readonly amountText: string;
  /** 帳戶的名字；轉帳是「從 → 到」；不知道就沒有 */
  readonly account?: string;
  /** 「步 → 共」；幫自己付的不用寫 */
  readonly who?: string;
  /** 原本那筆上的註記：已退多少、每一筆的日期 */
  readonly refunded?: string;
  /** 退款指回原本那筆 */
  readonly refundOf?: { readonly event: EventId; readonly label: string };
}

export interface FlowDay {
  readonly date: LocalDate;
  readonly rows: readonly FlowRow[];
}

/** 這一列要用到的：事件、帳本（對帳差額）、誰看的、有沒有篩帳戶 */
interface Context {
  readonly events: readonly Event[];
  readonly catalog: Catalog;
  readonly me: PersonId;
  readonly account: AccountId | undefined;
  readonly diffs: ReadonlyMap<string, number>;
  readonly openings: ReadonlySet<string>;
}

const key = (event: EventId, entry: EntryId) => `${event}/${entry}`;

/** 依日期倒排、同一天新的在上面。給了 account 只列動到那個帳戶的 */
export function flowDays(events: readonly Event[], catalog: Catalog, book: Book, me: PersonId, filter: { readonly account?: AccountId } = {}): readonly FlowDay[] {
  const ctx: Context = {
    events,
    catalog,
    me,
    account: filter.account,
    diffs: new Map(book.lines({ measure: "reconcileDiff" }).map((line) => [key(line.event, line.entry), line.amount])),
    openings: firstReconciliations(events),
  };
  const days: { date: LocalDate; rows: FlowRow[] }[] = [];
  for (const event of [...events].sort(byTime).reverse()) {
    if (event.status !== "confirmed") continue;
    for (const m of event.effects) {
      if (!touches(m, ctx)) continue;
      const row = rowOf(event, m, ctx);
      if (row === null) continue;
      let day = days.at(-1);
      if (day?.date !== event.date) {
        day = { date: event.date, rows: [] };
        days.push(day);
      }
      day.rows.push(row);
    }
  }
  return days;
}

/** 每個帳戶的第一次對帳（照時間）：那是初始餘額，刪掉它下一次就變成第一次 */
function firstReconciliations(events: readonly Event[]): ReadonlySet<string> {
  const seen = new Set<AccountId>();
  const first = new Set<string>();
  for (const event of [...events].sort(byTime)) {
    if (event.status !== "confirmed") continue;
    for (const m of event.effects) {
      if (m.kind !== "reconciliation" || seen.has(m.account)) continue;
      seen.add(m.account);
      first.add(key(event.id, m.id));
    }
  }
  return first;
}

/** 有篩帳戶時，這一筆有沒有動到那個帳戶 */
function touches(m: MoneyEffect, ctx: Context): boolean {
  return ctx.account === undefined || accountsMoved(m, ctx.events).includes(ctx.account);
}

function rowOf(event: Event, m: MoneyEffect, ctx: Context): FlowRow | null {
  switch (m.kind) {
    case "expense":
    case "income":
      return spendRow(event, m, ctx);
    case "transfer":
      return transferRow(event, m, ctx);
    case "reconciliation":
      return reconcileRow(event, m, ctx);
    case "refund":
      return refundRow(event, m, ctx);
    case "repayment":
      return null;
  }
}

const accountOf = (id: AccountId | undefined, catalog: Catalog): Account | undefined => catalog.accounts.find((a) => a.id === id);
const nameOf = (id: AccountId | undefined, catalog: Catalog): string => accountOf(id, catalog)?.name ?? "看不到的帳戶";
const personOf = (catalog: Catalog) => (id: PersonId) => catalog.people.find((p) => p.id === id)?.name ?? id;

function withOptional<T extends object>(row: T, extra: { readonly account?: string | undefined; readonly who?: string | undefined; readonly refunded?: string | undefined }): T & { readonly account?: string; readonly who?: string; readonly refunded?: string } {
  return {
    ...row,
    ...(extra.account === undefined ? {} : { account: extra.account }),
    ...(extra.who === undefined ? {} : { who: extra.who }),
    ...(extra.refunded === undefined ? {} : { refunded: extra.refunded }),
  };
}

function spendTitle(event: Event, m: Expense | Income, catalog: Catalog): string {
  const tagNames = (m.kind === "expense" ? [...m.tags, ...m.items.flatMap((i) => i.tags)] : m.tags).map((id) => catalog.tags.find((t) => t.id === id)?.name ?? "").filter((name) => name !== "");
  return event.title ?? (tagNames.length > 0 ? tagNames.join("、") : m.kind === "expense" ? "支出" : "收入");
}

function spendRow(event: Event, m: Expense | Income, ctx: Context): FlowRow {
  const { catalog, me, events } = ctx;
  const person = personOf(catalog);
  const account = accountOf(m.account, catalog)?.name;
  const who = m.kind === "expense" ? whoPaid(m, person, me) : m.person === me ? undefined : `${person(m.person)}收`;
  const amount = m.kind === "expense" ? -m.amount : m.amount;
  return withOptional(
    { event: event.id, entry: m.id, kind: m.kind, title: spendTitle(event, m, catalog), amount, amountText: signedMoney(amount) },
    { account, who, refunded: m.kind === "expense" ? refundNote(event, events) : undefined },
  );
}

/** 幫自己付的不用寫；不過是對方付自己的（我幫對方記的），不寫的話看起來像我自己花的 */
function whoPaid(m: Expense, person: (id: PersonId) => string, me: PersonId): string | undefined {
  const b = m.beneficiary;
  if (b.kind === "shared") return `${person(m.payer)} → 共`;
  if (b.person !== m.payer) return `${person(m.payer)} → ${person(b.person)}`;
  return m.payer === me ? undefined : `${person(m.payer)}自己付`;
}

/** 轉帳沒有正負號（不是支出，也不是收入）；從帳戶點進來才照那個帳戶的方向寫 */
function transferRow(event: Event, m: Transfer, ctx: Context): FlowRow {
  const { catalog, me, account } = ctx;
  const from = accountOf(m.from, catalog);
  const to = accountOf(m.to, catalog);
  const amount = account === m.from ? -m.amount : m.amount;
  const owner = [from, to].find((a) => a?.owners.length === 1)?.owners[0];
  const mine = from?.owners.includes(me) === true || to?.owners.includes(me) === true;
  return withOptional(
    { event: event.id, entry: m.id, kind: "transfer" as const, title: event.title ?? "轉帳", amount, amountText: account === undefined ? money(amount) : signedMoney(amount) },
    { account: `${nameOf(m.from, catalog)} → ${nameOf(m.to, catalog)}`, who: !mine && owner !== undefined ? `${personOf(catalog)(owner)}自己轉` : undefined },
  );
}

/** 對帳不是支出：寫差多少（沒有差額也有一列，才改得了、刪得了）；第一次是初始餘額，寫實際多少。名稱看先後，不看存的字（刪掉第一次之後，下一次就變成第一次） */
function reconcileRow(event: Event, m: Reconciliation, ctx: Context): FlowRow {
  const account = accountOf(m.account, ctx.catalog);
  const actual = account === undefined ? `${money(m.actual)} 元` : balanceText(account, m.actual);
  const base = { event: event.id, entry: m.id };
  const name = nameOf(m.account, ctx.catalog);
  if (ctx.openings.has(key(event.id, m.id))) return { ...base, kind: "opening", title: "初始餘額", amount: m.actual, amountText: actual, account: name };
  const diff = ctx.diffs.get(key(event.id, m.id)) ?? 0;
  return { ...base, kind: "reconcile", title: "對帳", amount: diff, amountText: diff === 0 ? "沒有差額" : `差 ${signedMoney(diff)}`, account: `${name} · 實際 ${actual}` };
}

/** 退款不是收入：名稱寫出是退款，指回原本那筆 */
function refundRow(event: Event, m: Refund, ctx: Context): FlowRow {
  const { catalog, me, events } = ctx;
  const target = refundTargetAt(events, m.target);
  const originalTitle = target === null ? undefined : spendTitle(target.event, target.expense, catalog);
  const name = event.title ?? originalTitle;
  const into = m.account ?? target?.expense.account;
  const row = withOptional(
    { event: event.id, entry: m.id, kind: "refund" as const, title: name === undefined ? "退款" : `退款：${name}`, amount: m.amount, amountText: signedMoney(m.amount) },
    { account: into === undefined ? undefined : `退回 ${nameOf(into, catalog)}`, who: target === null ? undefined : whoPaid(target.expense, personOf(catalog), me) },
  );
  return target === null ? row : { ...row, refundOf: { event: target.event.id, label: `${dayLabel(target.event.date)} ${originalTitle ?? "支出"}` } };
}
