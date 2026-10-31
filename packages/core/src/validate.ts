// 存之前的檢查，與誰看得到一則事件（參與者）。

import { byTime } from "./dates";
import type {
  Account,
  Amount,
  Beneficiary,
  Catalog,
  DebtRef,
  EntryId,
  Event,
  EventId,
  Expense,
  Item,
  ItemId,
  ItemRef,
  LocalDate,
  LocalTime,
  PersonId,
  Refund,
  Repayment,
  Weight,
} from "./model";

export type ProblemCode =
  | "amount-invalid" // 金額不是正整數（對帳的實際餘額可以是 0 或負數，但也要是整數）
  | "no-items" // 支出沒有品項
  | "items-sum-mismatch" // 品項加起來不等於整筆
  | "duplicate-id" // 同一則事件裡一筆的 ID、同一筆裡品項的 ID 重複
  | "unknown-ref" // 找不到的人、帳戶、罐子、標籤
  | "account-not-payers" // 支出的帳戶不是誰出那個人的
  | "shared-account-expense" // 共有的帳戶付支出（現在不支援）
  | "income-account" // 收入（或直接給錢收錢）的帳戶不是收的那個人的
  | "transfer-owners" // 轉帳兩邊不是同一個人（或共有）的帳戶
  | "transfer-same-account"
  | "transfer-others-account" // 轉帳進出寶媽卡：那是還款
  | "repayment-parties" // 還款兩邊的組合不對（例如朋友還寶媽卡、自己還自己、帳戶不是那個人的）
  | "reconcile-investment" // 投資帳戶不對帳（不記市值）
  | "weights-invalid" // 比例不是正整數（金額只用整數算），或裡面有王國以外的人、重複的人
  | "receivable-too-big" // 待收比那一項還多
  | "amortize-invalid" // 按月攤的月數不是 2 以上的整數
  | "cash-invalid" // 直接給錢用在不是「幫對方、不用還」的品項（也不能同時待收、按月攤）
  | "refund-target" // 退款指到不存在的品項（或直接給錢的那一項），或排在原本那筆之前（帳本找不到它）
  | "refund-too-big" // 退款超過那一項還沒退的（同一則裡好幾筆退同一項，加起來算）
  | "refund-account" // 退回的帳戶不是原本那筆誰出的人的（或是投資帳戶、別筆的寶媽卡）
  | "refunded-item-changed" // 這筆已經有退款，這樣改會讓退款失效：被退的品項不見、金額比已退的少、排到退款之後、誰出或幫誰變了（要改就先刪退款）
  | "allocation-invalid"; // 手動指定的還款指到不存在的、不是這一種要還的錢，或指定的加起來比還款多

export interface Problem {
  readonly event: EventId;
  readonly code: ProblemCode;
  readonly entry?: EntryId;
  readonly item?: ItemId;
}

/**
 * 存之前檢查一則事件；沒有問題就回傳空陣列。參考資料要找得到（記的人看得到自己要用的帳戶、罐子、標籤）。
 * 給了 events 才檢查要對照別則事件的（退款、手動指定的還款、改已經被退款的那筆）。events 裡有這一則的舊版也沒關係。
 */
export function validateEvent(event: Event, catalog: Catalog, events?: readonly Event[]): readonly Problem[] {
  return check(event, catalog, true, events);
}

/**
 * openBook 用的檢查：只看事件本身。查不到的參考資料（帳本裡沒有的帳戶）不算問題；
 * 要對照別則事件的（退款）在帳本照時間算的時候處理；手動指定的還款指錯了就當成沒指定（錢照樣算）。
 * validateEvent 後來加嚴的（退回的帳戶、改被退款的那筆）不看，已經存進去的舊資料照算。
 */
export function checkForBook(event: Event, catalog: Catalog): readonly Problem[] {
  return check(event, catalog, false);
}

function check(event: Event, catalog: Catalog, strict: boolean, events?: readonly Event[]): Problem[] {
  const problems: Problem[] = [];
  const people = new Set(catalog.people.map((p) => p.id));
  const accounts = new Map(catalog.accounts.map((a) => [a.id, a]));
  const jars = new Set(catalog.jars.map((j) => j.id));
  const tags = new Set(catalog.tags.map((t) => t.id));

  const add = (code: ProblemCode, entry?: EntryId, item?: ItemId) =>
    problems.push({ event: event.id, code, ...(entry === undefined ? {} : { entry }), ...(item === undefined ? {} : { item }) });
  const known = (found: boolean, entry: EntryId, item?: ItemId) => {
    if (strict && !found) add("unknown-ref", entry, item);
  };
  /** 找帳戶；找不到就記 unknown-ref（openBook 不算問題） */
  const account = (id: string | undefined, entry: EntryId): Account | undefined => {
    if (id === undefined) return undefined;
    const a = accounts.get(id as Account["id"]);
    known(a !== undefined, entry);
    return a;
  };

  for (const id of duplicates(event.effects.map((m) => m.id))) add("duplicate-id", id);

  const refundedHere = new Map<string, number>();
  for (const entry of event.effects) {
    const at = entry.id;
    switch (entry.kind) {
      case "expense": {
        if (!positive(entry.amount)) add("amount-invalid", at);
        if (entry.items.length === 0) add("no-items", at);
        else if (entry.items.reduce((sum, i) => sum + i.amount, 0) !== entry.amount) add("items-sum-mismatch", at);
        for (const id of duplicates(entry.items.map((i) => i.id))) add("duplicate-id", at, id);
        known(people.has(entry.payer), at);
        const a = account(entry.account, at);
        if (a !== undefined && !a.owners.includes(entry.payer)) add("account-not-payers", at);
        if (a !== undefined && a.owners.length > 1) add("shared-account-expense", at);
        beneficiary(entry.beneficiary, at);
        for (const t of entry.tags) known(tags.has(t), at);
        for (const item of entry.items) checkItem(entry, item);
        break;
      }
      case "income": {
        if (!positive(entry.amount)) add("amount-invalid", at);
        known(people.has(entry.person), at);
        const a = account(entry.account, at);
        if (a !== undefined && !a.owners.includes(entry.person)) add("income-account", at);
        for (const t of entry.tags) known(tags.has(t), at);
        break;
      }
      case "transfer": {
        if (!positive(entry.amount) || (entry.amountIn !== undefined && !positive(entry.amountIn))) add("amount-invalid", at);
        if (entry.from === entry.to) add("transfer-same-account", at);
        const from = account(entry.from, at);
        const to = account(entry.to, at);
        if (from !== undefined && to !== undefined && entry.from !== entry.to) {
          if (from.paidByOthers === true || to.paidByOthers === true) add("transfer-others-account", at);
          else if (!from.owners.some((o) => to.owners.includes(o))) add("transfer-owners", at);
        }
        for (const t of entry.tags ?? []) known(tags.has(t), at);
        break;
      }
      case "repayment": {
        if (!positive(entry.amount)) add("amount-invalid", at);
        if (!partiesOk(entry)) add("repayment-parties", at);
        for (const t of entry.tags ?? []) known(tags.has(t), at);
        const allocations = entry.allocations ?? [];
        if (allocations.some((a) => !positive(a.amount))) add("amount-invalid", at);
        else if (allocations.reduce((sum, a) => sum + a.amount, 0) > entry.amount) add("allocation-invalid", at);
        else if (events !== undefined && allocations.some((a) => !allocationOk(entry, a.target, events))) add("allocation-invalid", at);
        break;
      }
      case "reconciliation": {
        if (!Number.isSafeInteger(entry.actual)) add("amount-invalid", at);
        const a = account(entry.account, at);
        if (a?.kind === "investment") add("reconcile-investment", at);
        break;
      }
      case "refund": {
        if (!positive(entry.amount)) add("amount-invalid", at);
        const into = account(entry.account, at);
        if (events === undefined) break;
        const target = findItem(events, entry.target);
        // 要排在原本那筆之後：帳本照 byTime 算，排在前面就找不到原本那一項，存得進去卻不算
        if (target === undefined || target.item.cash !== undefined || entry.target.event === event.id || byTime(target.event, event) >= 0) {
          add("refund-target", at);
          break;
        }
        if (into !== undefined && !refundAccountOk(into, target.expense)) add("refund-account", at);
        // 同一則裡好幾筆退同一項：加起來算
        const k = itemKey(entry.target);
        const total = (refundedHere.get(k) ?? refundedBefore(events, entry.target, event.id)) + entry.amount;
        refundedHere.set(k, total);
        if (total > target.item.amount) add("refund-too-big", at);
        break;
      }
    }
  }
  if (events !== undefined) keepRefunds(events);
  return problems;

  /**
   * 這一則已經被退款的話：改完之後帳本要還算得到那些退款（那一項還在、夠退、排在退款之前、還是已確認的），
   * 誰出與幫誰也不能變：退款文件的參與者是存退款時算的，幫步改成幫共之後，寶看不到那筆退款，寶的我用的會多算。
   * 要改就先刪退款。
   */
  function keepRefunds(all: readonly Event[]): void {
    const refunds = refundsTo(all, event.id);
    if (refunds.length === 0) return;
    if (event.status !== "confirmed" || refunds.some((r) => byTime(event, r.event) >= 0)) add("refunded-item-changed");
    for (const ref of new Map(refunds.map(({ refund }) => [itemKey(refund.target), refund.target])).values()) {
      const item = expenseIn(event, ref.entry)?.items.find((i) => i.id === ref.item);
      if (item === undefined || item.cash !== undefined || item.amount < refundedBefore(all, ref, event.id)) {
        add("refunded-item-changed", ref.entry, ref.item);
      }
    }
    const before = all.find((x) => x.id === event.id);
    for (const entry of new Set(refunds.map(({ refund }) => refund.target.entry))) {
      const was = before === undefined ? undefined : expenseIn(before, entry);
      const now = expenseIn(event, entry);
      if (was !== undefined && now !== undefined && whoChanged(was, now)) add("refunded-item-changed", entry);
    }
  }

  function checkItem(entry: Expense, item: Item): void {
    const at = entry.id;
    if (!positive(item.amount)) add("amount-invalid", at, item.id);
    known(jars.has(item.jar), at, item.id);
    for (const t of item.tags) known(tags.has(t), at, item.id);
    if (item.beneficiary !== undefined) beneficiary(item.beneficiary, at, item.id);
    const r = item.receivable;
    if (r !== undefined && !positive(r)) add("amount-invalid", at, item.id);
    else if (r !== undefined && r > item.amount) add("receivable-too-big", at, item.id);
    const months = item.amortize?.months;
    if (months !== undefined && !(Number.isSafeInteger(months) && months >= 2)) add("amortize-invalid", at, item.id);
    if (item.cash === undefined) return;
    const b = item.beneficiary ?? entry.beneficiary;
    const noRepay = item.noRepay ?? entry.noRepay ?? false;
    const toOther = b.kind === "person" && b.person !== entry.payer;
    if (!toOther || !noRepay || r !== undefined || months !== undefined) add("cash-invalid", at, item.id);
    const into = item.cash.into === undefined ? undefined : accounts.get(item.cash.into);
    if (item.cash.into !== undefined) known(into !== undefined, at, item.id);
    if (into !== undefined && b.kind === "person" && !into.owners.includes(b.person)) add("income-account", at, item.id);
  }

  function beneficiary(b: Beneficiary, at: EntryId, item?: ItemId): void {
    if (b.kind === "person") {
      known(people.has(b.person), at, item);
      return;
    }
    if (b.weights === undefined) return;
    const persons = b.weights.map((w) => w.person);
    const bad =
      b.weights.length === 0 ||
      b.weights.some((w) => !positive(w.weight) || !people.has(w.person)) ||
      duplicates(persons).length > 0;
    if (bad) add("weights-invalid", at, item);
  }

  /** 還款兩邊：步寶之間（不同人）、還寶媽卡、朋友還自己；寫了帳戶的話要是那個人的 */
  function partiesOk(entry: Repayment): boolean {
    const { from, to } = entry;
    for (const side of [from, to]) {
      if (side.kind !== "person") continue;
      known(people.has(side.person), entry.id);
      const a = account(side.account, entry.id);
      if (a !== undefined && (!a.owners.includes(side.person) || a.paidByOthers === true)) return false;
    }
    if (from.kind === "person" && to.kind === "person") return from.person !== to.person;
    if (from.kind === "person" && to.kind === "othersAccount") {
      const card = account(to.account, entry.id);
      return card === undefined || (card.paidByOthers === true && card.owners.includes(from.person));
    }
    return from.kind === "outside" && to.kind === "person";
  }

  /** 手動指定的那一筆，是不是這一種還款要還的錢 */
  function allocationOk(entry: Repayment, target: DebtRef, all: readonly Event[]): boolean {
    const { from, to } = entry;
    if (target.item === undefined) {
      // 多還變成反方向的那一段：指到一筆還款
      const e = all.find((x) => x.id === target.event);
      return e?.effects.some((m) => m.id === target.entry && m.kind === "repayment") ?? false;
    }
    const found = findItem(all, { event: target.event, entry: target.entry, item: target.item });
    if (found === undefined || found.item.cash !== undefined) return false;
    const { expense, item } = found;
    if (from.kind === "person" && to.kind === "person") {
      const b = item.beneficiary ?? expense.beneficiary;
      const helped = b.kind === "person" ? b.person === from.person : (b.weights?.some((w) => w.person === from.person) ?? true);
      const noRepay = item.noRepay ?? expense.noRepay ?? false;
      return expense.payer === to.person && helped && !noRepay && !isOthersCard(expense);
    }
    if (from.kind === "person" && to.kind === "othersAccount") return expense.account === to.account && expense.payer === from.person;
    if (from.kind === "outside" && to.kind === "person") return expense.payer === to.person && (item.receivable ?? 0) > 0;
    return false;
  }

  function isOthersCard(expense: Expense): boolean {
    return expense.account !== undefined && accounts.get(expense.account)?.paidByOthers === true;
  }
}

/** 在別則事件裡找一項（只找已確認的） */
function findItem(events: readonly Event[], ref: ItemRef): { event: Event; expense: Expense; item: Item } | undefined {
  const event = events.find((x) => x.id === ref.event && x.status === "confirmed");
  const expense = event === undefined ? undefined : expenseIn(event, ref.entry);
  const item = expense?.items.find((i) => i.id === ref.item);
  return event === undefined || expense === undefined || item === undefined ? undefined : { event, expense, item };
}

function expenseIn(event: Event, entry: EntryId): Expense | undefined {
  return event.effects.find((m): m is Expense => m.id === entry && m.kind === "expense");
}

function itemKey(ref: ItemRef): string {
  return [ref.event, ref.entry, ref.item].join("/");
}

/** 誰出變了，或任何一項實際幫的人變了（品項沒寫就是整筆的；新加的品項跟整筆原本的比） */
function whoChanged(was: Expense, now: Expense): boolean {
  if (was.payer !== now.payer) return true;
  return now.items.some((item) => {
    const old = was.items.find((i) => i.id === item.id);
    return !sameBeneficiary(old?.beneficiary ?? was.beneficiary, item.beneficiary ?? now.beneficiary);
  });
}

/** 比內容、不比欄位順序（從 Firestore 讀回來的欄位順序可能不同）；比例的順序也不算 */
function sameBeneficiary(a: Beneficiary, b: Beneficiary): boolean {
  if (a.kind === "person") return b.kind === "person" && a.person === b.person;
  if (b.kind === "person") return false;
  const shares = (weights: readonly Weight[] = []) => weights.map((w) => `${w.person}:${w.weight}`).sort().join();
  return shares(a.weights) === shares(b.weights);
}

/** 錢可以退回哪個帳戶：原本那筆誰出的人的；投資帳戶（進出都是轉帳）不行，寶媽卡（還它是還款）只能退回刷它的那筆 */
function refundAccountOk(into: Account, expense: Expense): boolean {
  if (!into.owners.includes(expense.payer) || into.kind === "investment") return false;
  return into.paidByOthers !== true || into.id === expense.account;
}

/** 一筆退款（原本那筆上的註記看這個） */
export interface RefundRecord {
  readonly event: EventId;
  readonly entry: EntryId;
  readonly date: LocalDate;
  readonly time?: LocalTime;
  readonly amount: Amount;
}

/** 指到某則事件的退款（只算已確認的、別則事件的），照時間排 */
function refundsTo(events: readonly Event[], target: EventId): { readonly event: Event; readonly refund: Refund }[] {
  return events
    .filter((e) => e.id !== target && e.status === "confirmed")
    .sort(byTime)
    .flatMap((event) =>
      event.effects.flatMap((m) => (m.kind === "refund" && m.target.event === target ? [{ event, refund: m }] : [])),
    );
}

function toRecord({ event, refund }: { readonly event: Event; readonly refund: Refund }): RefundRecord {
  return {
    event: event.id,
    entry: refund.id,
    date: event.date,
    ...(event.time === undefined ? {} : { time: event.time }),
    amount: refund.amount,
  };
}

/** 這一項被退了哪幾筆，照時間排（只算已確認的）。已退多少就是把金額加起來 */
export function refundsOf(events: readonly Event[], ref: ItemRef): readonly RefundRecord[] {
  return refundsTo(events, ref.event)
    .filter(({ refund }) => refund.target.entry === ref.entry && refund.target.item === ref.item)
    .map(toRecord);
}

/**
 * 這則事件能不能刪：回傳擋著的退款（空的就可以刪）。有退款還刪掉的話，帳本找不到原本那一項，退款整則不算，
 * 所以要先刪退款。退款自己不擋人（沒有東西指著它）。
 */
export function blockersOfDelete(eventId: EventId, events: readonly Event[]): readonly RefundRecord[] {
  return refundsTo(events, eventId).map(toRecord);
}

/** 別則事件已經退了這一項多少 */
function refundedBefore(events: readonly Event[], ref: ItemRef, except: EventId): number {
  return refundsOf(events, ref)
    .filter((r) => r.event !== except)
    .reduce((sum, r) => sum + r.amount, 0);
}

function positive(n: number): boolean {
  return Number.isSafeInteger(n) && n > 0;
}

function duplicates<T>(xs: readonly T[]): T[] {
  const seen = new Set<T>();
  const dup = new Set<T>();
  for (const x of xs) (seen.has(x) ? dup : seen).add(x);
  return [...dup];
}

/**
 * 參與者：看得到這則事件的人。記的人、誰出、幫誰（共＝每一個人）、收入或直接給錢收錢的人、
 * 動到的帳戶的主人（共有帳戶是每一個主人）、還款兩邊的人；退款再加上原本那則的參與者（要給 events）。
 * 回傳排好序、不重複。app 存事件時把它存進文件，給安全規則和查詢用（ADR 0001）。
 */
export function participantsOf(event: Event, catalog: Catalog, events?: readonly Event[]): readonly PersonId[] {
  const everyone = catalog.people.map((p) => p.id);
  const owners = new Map(catalog.accounts.map((a) => [a.id, a.owners]));
  const found = new Set<PersonId>([event.recordedBy]);
  const account = (id: string | undefined) => {
    for (const o of (id === undefined ? undefined : owners.get(id as Account["id"])) ?? []) found.add(o);
  };
  const helped = (b: Beneficiary) => {
    for (const p of b.kind === "person" ? [b.person] : everyone) found.add(p);
  };

  for (const m of event.effects) {
    switch (m.kind) {
      case "expense":
        found.add(m.payer);
        account(m.account);
        helped(m.beneficiary);
        for (const item of m.items) {
          if (item.beneficiary !== undefined) helped(item.beneficiary);
          account(item.cash?.into);
        }
        break;
      case "income":
        found.add(m.person);
        account(m.account);
        break;
      case "transfer":
        account(m.from);
        account(m.to);
        break;
      case "repayment":
        for (const side of [m.from, m.to]) {
          if (side.kind === "person") {
            found.add(side.person);
            account(side.account);
          } else if (side.kind === "othersAccount") account(side.account);
        }
        break;
      case "reconciliation":
        account(m.account);
        break;
      case "refund": {
        account(m.account);
        const original = events?.find((e) => e.id === m.target.event);
        if (original !== undefined && original.id !== event.id) for (const p of participantsOf(original, catalog)) found.add(p);
        break;
      }
    }
  }
  return [...found].sort();
}
