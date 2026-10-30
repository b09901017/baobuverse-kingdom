// 要還的錢（往來帳、寶媽卡、待收）：每一筆記著被抵掉了多少。事件照時間處理，
// 所以「算到某一天」就是只看那天以前的變化。

import type { Debt, DebtChannel, DebtQuery } from "./book";
import type { AccountId, Allocation, DebtRef, LocalDate, PersonId } from "./model";

interface Change {
  readonly date: LocalDate;
  readonly amount: number;
  readonly settled: number;
}

export interface OpenDebt {
  readonly channel: DebtChannel;
  readonly ref: DebtRef;
  readonly date: LocalDate;
  readonly debtor?: PersonId;
  readonly creditor?: PersonId;
  readonly account?: AccountId;
  amount: number;
  settled: number;
  readonly changes: Change[];
}

export type NewDebt = Omit<OpenDebt, "amount" | "settled" | "changes"> & { readonly amount: number };

export function debtBook() {
  const all: OpenDebt[] = [];

  /** 新的一筆要還的錢。往來帳先抵掉反方向（對方欠我的那一邊）還沒抵完的 */
  function add(d: NewDebt): OpenDebt {
    const debt: OpenDebt = { ...d, settled: 0, changes: [{ date: d.date, amount: d.amount, settled: 0 }] };
    if (d.channel === "tab") {
      const offset = d.amount - settle((o) => o.channel === "tab" && o.debtor === d.creditor && o.creditor === d.debtor, d.amount, d.date);
      if (offset > 0) change(debt, d.date, 0, offset);
    }
    all.push(debt);
    return debt;
  }

  /** 抵掉符合的那幾筆：先抵手動指定的，再抵最早還沒抵完的。回傳抵不完的 */
  function settle(match: (d: OpenDebt) => boolean, amount: number, date: LocalDate, allocations: readonly Allocation[] = []): number {
    let left = amount;
    for (const a of allocations) {
      const target = all.find((d) => match(d) && sameRef(d.ref, a.target));
      if (target === undefined) continue;
      left -= take(target, Math.min(a.amount, left), date);
    }
    for (const d of all) {
      if (left === 0) break;
      if (match(d)) left -= take(d, left, date);
    }
    return left;
  }

  function take(d: OpenDebt, upTo: number, date: LocalDate): number {
    const n = Math.min(upTo, d.amount - d.settled);
    if (n > 0) change(d, date, 0, n);
    return Math.max(n, 0);
  }

  function change(d: OpenDebt, date: LocalDate, amount: number, settled: number): void {
    d.amount += amount;
    d.settled += settled;
    d.changes.push({ date, amount, settled });
  }

  /** 退款：那一筆要還的錢變少。已經抵掉的比剩下的多時，多的部分回傳（呼叫的人當成還款再抵別筆） */
  function reduce(match: (d: OpenDebt) => boolean, by: number, date: LocalDate): number {
    const d = all.find(match);
    if (d === undefined || by <= 0) return 0;
    const excess = Math.max(d.settled - (d.amount - by), 0);
    change(d, date, -by, -excess);
    return excess;
  }

  function list(q: DebtQuery): Debt[] {
    const result: Debt[] = [];
    for (const d of all) {
      if (d.channel !== q.channel) continue;
      if (q.person !== undefined && d.debtor !== q.person && d.creditor !== q.person) continue;
      if (q.account !== undefined && d.account !== q.account) continue;
      if (q.asOf !== undefined && d.date > q.asOf) continue;
      const { amount, settled } = asOf(d, q.asOf);
      if (q.outstandingOnly === true && amount - settled === 0) continue;
      result.push({
        channel: d.channel,
        ref: d.ref,
        date: d.date,
        ...(d.debtor === undefined ? {} : { debtor: d.debtor }),
        ...(d.creditor === undefined ? {} : { creditor: d.creditor }),
        ...(d.account === undefined ? {} : { account: d.account }),
        amount,
        settled,
        outstanding: amount - settled,
      });
    }
    return result;
  }

  return { add, settle, reduce, list };
}

/** 那一天（含）為止的金額與已抵的 */
export function asOf(d: OpenDebt, date: LocalDate | undefined): { amount: number; settled: number } {
  let amount = 0;
  let settled = 0;
  for (const c of d.changes) {
    if (date !== undefined && c.date > date) break;
    amount += c.amount;
    settled += c.settled;
  }
  return { amount, settled };
}

export function sameRef(a: DebtRef, b: DebtRef): boolean {
  return a.event === b.event && a.entry === b.entry && a.item === b.item;
}
