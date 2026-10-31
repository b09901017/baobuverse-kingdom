// 轉帳的邏輯（stage-1 issue 06）：選單、預設值、表單 → 事件。純函式，畫面在 screens/TransferForm.tsx。
// 轉帳不是支出：錢在同一個人（或共有）的帳戶之間搬動，淨資產不變（README）。

import type { Account, AccountId, Catalog, EntryId, Event, LocalDate, LocalTime, Person, PersonId, Transfer } from "@baobu/core";
import { dateOf, timeOf } from "./format";
import { isPresetEvent } from "./presets";
import { eventBase, newestFirst, parseAmount, type BuildContext } from "./record";

export interface TransferForm {
  readonly amount: string;
  readonly title: string;
  /** 空字串是還沒選 */
  readonly from: AccountId | "";
  readonly to: AccountId | "";
  readonly date: LocalDate;
  /** 空字串是沒寫時間 */
  readonly time: LocalTime | "";
}

/**
 * 來源的選單：步的、共有的與寶的（誰記都可以）。寶媽卡不列（進出它是還款，階段 6）；封存的不列，除非這一筆正在用。
 * 投資帳戶要列：進出投資帳戶都是轉帳（GLOSSARY）。
 */
export function sourceOptions(accounts: readonly Account[], current?: AccountId | ""): readonly Account[] {
  return accounts.filter((a) => a.paidByOthers !== true && (a.id === current || !a.archived));
}

/** 目的的選單：跟來源有同一個主人的（同一個人或共有），不含來源自己。步的帳戶 → 寶的帳戶不會出現（那是還款） */
export function targetOptions(accounts: readonly Account[], from: AccountId | "", current?: AccountId | ""): readonly Account[] {
  const source = accounts.find((a) => a.id === from);
  return sourceOptions(accounts, current).filter((a) => a.id !== from && (source === undefined || a.owners.some((o) => source.owners.includes(o))));
}

/** 選單依主人分組（看得出是誰的帳戶）：自己、共有、其他人；空的組不列 */
export function transferGroups(accounts: readonly Account[], people: readonly Person[], me: PersonId): readonly { readonly label: string; readonly accounts: readonly Account[] }[] {
  const of = (person: PersonId) => accounts.filter((a) => a.owners.length === 1 && a.owners[0] === person);
  const groups = [
    ...people.filter((p) => p.id === me).map((p) => ({ label: p.name, accounts: of(p.id) })),
    { label: "共有", accounts: accounts.filter((a) => a.owners.length > 1) },
    ...people.filter((p) => p.id !== me).map((p) => ({ label: p.name, accounts: of(p.id) })),
  ];
  return groups.filter((g) => g.accounts.length > 0);
}

/** 換來源：目的對不上（不是同一個人的、或一模一樣）就清空，要重選 */
export function withSource(form: TransferForm, from: AccountId | "", accounts: readonly Account[]): TransferForm {
  const fits = targetOptions(accounts, from, form.to).some((a) => a.id === form.to);
  return { ...form, from, to: fits ? form.to : "" };
}

/** 新的一筆：兩邊跟我上一次轉帳一樣（plan.md：帳戶預設上次用的）；第一次來源是自己的現金帳戶、目的自己選。套用預設寫的投入不算「上一次」 */
export function defaultTransfer(ctx: { readonly me: PersonId; readonly catalog: Catalog; readonly events: readonly Event[]; readonly now: Date }): TransferForm {
  const { me, catalog, events, now } = ctx;
  const accounts = catalog.accounts;
  const last = newestFirst(events)
    .filter((e) => e.recordedBy === me && !isPresetEvent(e.id))
    .flatMap((e) => e.effects)
    .find((m): m is Transfer => m.kind === "transfer");
  const sources = sourceOptions(accounts);
  const usable = last !== undefined && sources.some((a) => a.id === last.from);
  const cash = sources.find((a) => a.kind === "cash" && a.owners.length === 1 && a.owners[0] === me);
  const from: AccountId | "" = usable ? last.from : (cash?.id ?? "");
  const to: AccountId | "" = usable && targetOptions(accounts, from).some((a) => a.id === last.to) ? last.to : "";
  return { amount: "", title: "", from, to, date: dateOf(now), time: timeOf(now) };
}

/** 表單有什麼問題；空的就可以存 */
export function checkTransferForm(form: TransferForm): readonly string[] {
  const errors: string[] = [];
  const amount = parseAmount(form.amount);
  if (!amount.ok) errors.push(amount.error);
  if (form.from === "") errors.push("要選從哪個帳戶");
  if (form.to === "") errors.push("要選轉到哪個帳戶");
  if (form.from !== "" && form.from === form.to) errors.push("轉帳兩邊是同一個帳戶");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) errors.push("要填日期");
  if (form.time !== "" && !/^\d{2}:\d{2}$/.test(form.time)) errors.push("時間的格式不對");
  if (form.title.length > 200) errors.push("名稱最多 200 字");
  return errors;
}

/** 這則事件打得開轉帳的表單嗎：一則一筆轉帳；換匯（兩邊金額不同）表達不了，不要假裝改得了 */
export function transferFormOf(event: Event): TransferForm | null {
  const [m, ...rest] = event.effects;
  if (m?.kind !== "transfer" || rest.length > 0 || m.amountIn !== undefined) return null;
  return { amount: String(m.amount), title: event.title ?? "", from: m.from, to: m.to, date: event.date, time: event.time ?? "" };
}

const entryId = "m1" as EntryId;

export function buildTransfer(form: TransferForm, ctx: BuildContext): Event {
  const amount = parseAmount(form.amount);
  if (!amount.ok) throw new Error(amount.error); // 畫面存之前先 checkTransferForm
  if (form.from === "" || form.to === "") throw new Error("要選帳戶");
  const was = ctx.existing?.effects[0]?.kind === "transfer" ? ctx.existing.effects[0] : undefined;
  const entry = was ?? { type: "money" as const, id: entryId, kind: "transfer" as const };
  const transfer: Transfer = { ...entry, from: form.from, to: form.to, amount: amount.value };
  return { ...eventBase(form, ctx), effects: [transfer] };
}
