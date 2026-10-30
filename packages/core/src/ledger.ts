// 帳本裡面：把事件照時間排好，一筆一筆展開成「行」（book.ts 的 Line）。查詢只是把行篩出來加總。

import type { Cause, Line } from "./book";
import type {
  Account,
  AccountId,
  Beneficiary,
  Catalog,
  EntryId,
  Event,
  Expense,
  PersonId,
  Repayment,
  Transfer,
} from "./model";
import { splitByWeights } from "./split";

export interface Ledger {
  readonly lines: readonly Line[];
}

/** 一行裡跟「哪一筆」有關的欄位 */
type Origin = Pick<Line, "date" | "event" | "entry" | "cause" | "amortized" | "tags"> & Partial<Pick<Line, "item">>;

export function buildLedger(catalog: Catalog, events: readonly Event[]): Ledger {
  const lines: Line[] = [];
  const people = catalog.people.map((p) => p.id);
  const accounts = new Map(catalog.accounts.map((a) => [a.id, a]));

  for (const event of [...events].sort(byTime)) {
    if (event.status !== "confirmed") continue;
    for (const entry of event.effects) {
      if (entry.kind === "expense") spend(event, entry);
      else if (entry.kind === "transfer") transfer(event, entry);
      else if (entry.kind === "repayment") repay(event, entry);
    }
  }
  return { lines };

  function origin(event: Event, entry: EntryId, cause: Cause): Origin {
    return { date: event.date, event: event.id, entry, cause, amortized: false, tags: [] };
  }

  function spend(event: Event, entry: Expense): void {
    for (const item of entry.items) {
      const payer = entry.payer;
      const noRepay = item.noRepay ?? entry.noRepay ?? false;
      const cause: Cause = item.cash === undefined ? "spend" : "giveMoney";
      const base = { ...origin(event, entry.id, cause), item: item.id, payer, jar: item.jar };
      lines.push({ ...base, measure: "paid", person: payer, amount: item.amount });
      for (const [person, amount] of shares(item.beneficiary ?? entry.beneficiary, item.amount, payer)) {
        if (item.cash === undefined) lines.push({ ...base, measure: "use", person, amount });
        else lines.push({ ...base, measure: "income", person, amount });
        if (person === payer) continue;
        if (noRepay) {
          lines.push({ ...base, measure: "spoilGiven", person: payer, amount, counterpart: person });
          lines.push({ ...base, measure: "spoilReceived", person, amount, counterpart: payer });
        } else {
          lines.push({ ...base, measure: "tab", person: payer, amount, counterpart: person });
          lines.push({ ...base, measure: "tab", person, amount: -amount, counterpart: payer });
        }
      }
    }
  }

  function transfer(event: Event, entry: Transfer): void {
    const base = origin(event, entry.id, "transfer");
    const by = mover(event, entry.from, entry.to);
    move(base, entry.from, -entry.amount, by);
    move(base, entry.to, entry.amountIn ?? entry.amount, by);
  }

  function repay(event: Event, entry: Repayment): void {
    const base = origin(event, entry.id, "repayment");
    const { from, to, amount } = entry;
    if (from.kind === "person" && to.kind === "person") {
      lines.push({ ...base, measure: "tab", person: to.person, amount: -amount, counterpart: from.person });
      lines.push({ ...base, measure: "tab", person: from.person, amount, counterpart: to.person });
    }
    if (from.kind === "person" && from.account !== undefined) move(base, from.account, -amount, from.person);
    if (to.kind === "person" && to.account !== undefined) move(base, to.account, amount, to.person);
  }

  /** 帳戶餘額變了：一行 balance，算進淨資產的再一行 netWorth。看不到的帳戶不算 */
  function move(base: Origin, id: AccountId, amount: number, by: PersonId): void {
    const account = accounts.get(id);
    if (account === undefined) return;
    const person = holder(account, by);
    const line = { ...base, person, account: id, amount };
    lines.push({ ...line, measure: "balance" });
    if (account.paidByOthers !== true) lines.push({ ...line, measure: "netWorth" });
  }

  /** 帳戶的這一行算誰的：一個主人就是那個人；共有的是投入、拿出的那個人 */
  function holder(account: Account, by: PersonId): PersonId {
    return account.owners.length === 1 && account.owners[0] !== undefined ? account.owners[0] : by;
  }

  /**
   * 轉帳是誰在搬錢（共有的投資帳戶那一邊算這個人投入、拿出）：另一邊帳戶的主人；
   * 另一邊看不到（寶的帳本裡步的郵局）或也是共有的，就是記的人（記的人一定看得到自己用的帳戶）。
   */
  function mover(event: Event, from: AccountId, to: AccountId): PersonId {
    for (const id of [from, to]) {
      const owners = accounts.get(id)?.owners;
      if (owners?.length === 1 && owners[0] !== undefined) return owners[0];
    }
    return event.recordedBy;
  }

  /** 幫誰分到的錢：共沒寫比例就平分，零頭算誰出 */
  function shares(b: Beneficiary, amount: number, payer: PersonId): Map<PersonId, number> {
    if (b.kind === "person") return new Map([[b.person, amount]]);
    const weights = b.weights?.map((w) => [w.person, w.weight] as const) ?? people.map((p) => [p, 1] as const);
    return splitByWeights(amount, weights, payer);
  }
}

/** 事件的先後：日期 → 時間（沒寫的排前面）→ 記下來的時間 → ID */
export function byTime(a: Event, b: Event): number {
  return (
    compare(a.date, b.date) || compare(a.time ?? "", b.time ?? "") || a.recordedAt - b.recordedAt || compare(a.id, b.id)
  );
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
