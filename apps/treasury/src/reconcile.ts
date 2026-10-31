// 對帳的邏輯（stage-1 issue 06）：看著實際餘額輸入、跟算出來的比。純函式，畫面在 screens/ReconcileForm.tsx。
// 差 0 也要存一則：「N 天沒對帳」才會歸零（accounts.ts 的 lastReconciled 看事件）。

import { byTime, openBook, type Account, type AccountId, type Book, type Catalog, type EntryId, type Event, type EventId, type LocalDate, type LocalTime, type PersonId, type Reconciliation } from "@baobu/core";
import { balanceText, parseActual, type Parsed } from "./accounts";
import { dateOf, signedMoney, timeOf } from "./format";
import { eventBase, type BuildContext } from "./record";

export interface ReconcileForm {
  readonly account: AccountId;
  /** 看著實際餘額輸入的字；信用卡是欠多少 */
  readonly actual: string;
  /** 信用卡多繳（銀行要還我）：只有這時候存成正的 */
  readonly overpaid: boolean;
  readonly date: LocalDate;
  /** 空字串是沒寫時間 */
  readonly time: LocalTime | "";
}

export function defaultReconcile(account: AccountId, now: Date): ReconcileForm {
  return { account, actual: "", overpaid: false, date: dateOf(now), time: timeOf(now) };
}

/** 輸入的字 → 存的數字（信用卡欠的存成負數）。多繳時信用卡也不用寫負號，避免把「欠 3,000」打成 -3000 又勾到多繳 */
export function actualOf(form: ReconcileForm, account: Account): Parsed<number> {
  if (!form.overpaid || account.kind !== "credit-card") return parseActual(form.actual, account.kind);
  const n = parseActual(form.actual, "bank");
  return n.ok && n.value < 0 ? { ok: false, error: "信用卡填欠多少，不用寫負號" } : n;
}

/** 表單有什麼問題；空的就可以存 */
export function checkReconcileForm(form: ReconcileForm, account: Account): readonly string[] {
  const errors: string[] = [];
  if (form.actual.trim() === "") errors.push(account.kind === "credit-card" ? "要填現在欠多少" : "要填實際餘額");
  else {
    const actual = actualOf(form, account);
    if (!actual.ok) errors.push(actual.error);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) errors.push("要填日期");
  if (form.time !== "" && !/^\d{2}:\d{2}$/.test(form.time)) errors.push("時間的格式不對");
  return errors;
}

export interface ReconcilePreview {
  /** 這個帳戶在這之前沒對帳過：這一次是初始餘額，不算差額 */
  readonly opening: boolean;
  /** 算到這個日期、時間之前的餘額 */
  readonly computed: number;
  /** 實際 − 算出來；還沒輸入就沒有 */
  readonly diff?: number;
  readonly text: string;
}

/**
 * 表單上即時顯示的「算出來 X、差 Y」。只算排在這一筆之前的事件（跟帳本算的同一個先後）；改一筆時不算自己。
 * recordedAt：新的一筆是現在，改一筆是原本的。
 */
export function reconcilePreview(
  form: ReconcileForm,
  account: Account,
  ctx: { readonly catalog: Catalog; readonly events: readonly Event[]; readonly recordedAt: number; readonly self?: EventId },
): ReconcilePreview {
  const at: Event = {
    id: ctx.self ?? ("" as EventId),
    date: form.date,
    ...(form.time === "" ? {} : { time: form.time }),
    recordedBy: "" as PersonId,
    recordedAt: ctx.recordedAt,
    source: "manual",
    status: "confirmed",
    effects: [],
  };
  const before = ctx.events.filter((e) => e.id !== ctx.self && e.status === "confirmed" && byTime(e, at) < 0);
  const computed = openBook(ctx.catalog, before).total({ measure: "balance", where: { account: account.id } });
  const opening = !before.some((e) => e.effects.some((m) => m.kind === "reconciliation" && m.account === account.id));
  const actual = form.actual.trim() === "" ? undefined : actualOf(form, account);
  const diff = actual?.ok === true ? actual.value - computed : undefined;
  return { opening, computed, ...(diff === undefined ? {} : { diff }), text: previewText(account, opening, computed, diff) };
}

function previewText(account: Account, opening: boolean, computed: number, diff: number | undefined): string {
  const counted = balanceText(account, computed);
  if (opening) return computed === 0 ? "這是初始餘額，不算差額" : `這是初始餘額，不算差額（算出來 ${counted}）`;
  if (diff === undefined) return `算出來 ${counted}`;
  if (diff === 0) return `算出來 ${counted}、沒有差額`;
  const credit = account.kind === "credit-card";
  const why = diff < 0 ? (credit ? "欠得比算出來多" : "實際比算出來少") : credit ? "欠得比算出來少" : "實際比算出來多";
  return `算出來 ${counted}、差 ${signedMoney(diff)} 元（${why}）`;
}

/** 這則事件打得開對帳的表單嗎：一則一筆對帳。信用卡顯示欠多少；正的是多繳 */
export function reconcileFormOf(event: Event, account: Account): ReconcileForm | null {
  const [m, ...rest] = event.effects;
  if (m?.kind !== "reconciliation" || rest.length > 0) return null;
  const credit = account.kind === "credit-card";
  const overpaid = credit && m.actual > 0;
  return { account: m.account, actual: String(credit && !overpaid ? Math.abs(m.actual) : m.actual), overpaid, date: event.date, time: event.time ?? "" };
}

const entryId = "m1" as EntryId;

export function buildReconciliation(form: ReconcileForm, account: Account, ctx: BuildContext): Event {
  const actual = actualOf(form, account);
  if (!actual.ok) throw new Error(actual.error); // 畫面存之前先 checkReconcileForm
  const was = ctx.existing?.effects[0]?.kind === "reconciliation" ? ctx.existing.effects[0] : undefined;
  const entry = was ?? { type: "money" as const, id: entryId, kind: "reconciliation" as const };
  const reconciliation: Reconciliation = { ...entry, account: form.account, actual: actual.value };
  return { ...eventBase({ ...form, title: ctx.existing?.title ?? "對帳" }, ctx), effects: [reconciliation] };
}

export interface DiffRow {
  readonly event: EventId;
  readonly entry: EntryId;
  readonly date: LocalDate;
  /** 帳戶的名字 */
  readonly account: string;
  readonly amount: number;
}

/** 對帳差額另列（不混進收入、支出）：我的每一筆，新的在上面，與合計。第一次對帳與差 0 的沒有差額，不會有一列 */
export function diffRows(book: Book, catalog: Catalog, me: PersonId): { readonly total: number; readonly rows: readonly DiffRow[] } {
  const lines = book.lines({ measure: "reconcileDiff", person: me });
  return {
    total: lines.reduce((sum, line) => sum + line.amount, 0),
    rows: [...lines].reverse().map((line) => ({
      event: line.event,
      entry: line.entry,
      date: line.date,
      account: catalog.accounts.find((a) => a.id === line.account)?.name ?? "看不到的帳戶",
      amount: line.amount,
    })),
  };
}

