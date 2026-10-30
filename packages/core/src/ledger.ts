// 帳本裡面：把事件照時間排好，一筆一筆展開成「行」（book.ts 的 Line）。查詢只是把行篩出來加總。

import type { Cause, Line, Repay } from "./book";
import { addMonths } from "./dates";
import { debtBook, sameRef, type OpenDebt } from "./debts";
import type {
  Account,
  AccountId,
  Beneficiary,
  Catalog,
  EntryId,
  Event,
  Expense,
  Item,
  ItemRef,
  PersonId,
  Reconciliation,
  Refund,
  Repayment,
  TagId,
  Transfer,
} from "./model";
import { splitByWeights, splitMonthly } from "./split";
import { checkForBook, type Problem } from "./validate";

export interface Ledger {
  readonly lines: readonly Line[];
  /** 別人先出的我用的那幾行，等著哪一筆要還的錢 */
  readonly links: ReadonlyMap<Line, OpenDebt>;
  readonly debts: ReturnType<typeof debtBook>;
  readonly problems: readonly Problem[];
  /** 標籤合併過的換成合併後的那個 */
  readonly tag: (id: TagId) => TagId;
}

/** 一行裡跟「哪一筆」有關的欄位 */
type Origin = Pick<Line, "date" | "event" | "entry" | "cause" | "amortized" | "tags"> & Partial<Pick<Line, "item">>;
/** 一項來的行共用的欄位 */
type ItemBase = Origin & Pick<Line, "payer" | "jar"> & Partial<Pick<Line, "account" | "repay">>;

/** 一項的錢怎麼分：整項、朋友要還的（待收）、幫誰各分到多少 */
interface Part {
  readonly total: number;
  readonly receivable: number;
  readonly shares: ReadonlyMap<PersonId, number>;
}

/** 算過的一項（退款要找得到原本那一項） */
interface Spent {
  readonly ref: ItemRef;
  readonly entry: Expense;
  readonly item: Item;
  readonly base: ItemBase;
  readonly othersCard: boolean;
  readonly noRepay: boolean;
  readonly part: Part;
  refunded: number;
}

export function buildLedger(catalog: Catalog, events: readonly Event[]): Ledger {
  const lines: Line[] = [];
  const people = catalog.people.map((p) => p.id);
  const accounts = new Map(catalog.accounts.map((a) => [a.id, a]));
  /** 照時間算到現在的帳戶餘額（對帳拿來比） */
  const running = new Map<AccountId, number>();
  const reconciled = new Set<AccountId>();
  const debts = debtBook();
  const problems: Problem[] = [];
  const tag = tagResolver(catalog);
  const spent = new Map<string, Spent>();
  const links = new Map<Line, OpenDebt>();

  for (const event of [...events].sort(byTime)) {
    if (event.status !== "confirmed") continue;
    const found = [...checkForBook(event, catalog), ...refundProblems(event)];
    if (found.length > 0) {
      problems.push(...found);
      continue;
    }
    for (const entry of event.effects) {
      if (entry.kind === "expense") spend(event, entry);
      else if (entry.kind === "transfer") transfer(event, entry);
      else if (entry.kind === "repayment") repay(event, entry);
      else if (entry.kind === "reconciliation") reconcile(event, entry);
      else if (entry.kind === "refund") refund(event, entry);
    }
  }
  return { lines, links, debts, problems, tag };

  function origin(event: Event, entry: EntryId, cause: Cause): Origin {
    return { date: event.date, event: event.id, entry, cause, amortized: false, tags: [] };
  }

  function spend(event: Event, entry: Expense): void {
    const payer = entry.payer;
    const othersCard = entry.account !== undefined && accounts.get(entry.account)?.paidByOthers === true;
    for (const item of entry.items) {
      const cause: Cause = item.cash === undefined ? "spend" : "giveMoney";
      const tags = unique([...entry.tags, ...item.tags].map(tag));
      const base: ItemBase = {
        ...origin(event, entry.id, cause),
        item: item.id,
        payer,
        ...(entry.account === undefined ? {} : { account: entry.account }),
        jar: item.jar,
        tags,
      };
      const receivable = item.receivable ?? 0;
      const ref = { event: event.id, entry: entry.id, item: item.id };
      const s: Spent = {
        ref,
        entry,
        item,
        base,
        othersCard,
        noRepay: item.noRepay ?? entry.noRepay ?? false,
        part: { total: item.amount, receivable, shares: shares(item.beneficiary ?? entry.beneficiary, item.amount - receivable, payer) },
        refunded: 0,
      };
      spent.set(key(ref), s);

      // 別人先出的那幾份：每一份等著哪一筆要還的錢（還了沒看它）
      const waiting = new Map<PersonId, OpenDebt>();
      const date = event.date;
      if (entry.account !== undefined) {
        move(base, entry.account, -item.amount, payer);
        if (othersCard) {
          waiting.set(payer, debts.add({ channel: "othersCard", ref, date, debtor: payer, account: entry.account, amount: item.amount }));
        }
      }
      if (receivable > 0) debts.add({ channel: "receivable", ref, date, creditor: payer, amount: receivable });
      for (const [person, amount] of s.part.shares) {
        if (item.cash?.into !== undefined) move(base, item.cash.into, amount, person);
        if (person !== payer && !s.noRepay) waiting.set(person, debts.add({ channel: "tab", ref, date, debtor: person, creditor: payer, amount }));
      }
      itemLines(s, base, s.part, 1, waiting);
    }
  }

  /** 一項（或它的退款，sign −1）在我付的、我用的、收入、待收、往來帳、寵對方／被寵上的那幾行 */
  function itemLines(s: Spent, base: ItemBase, part: Part, sign: 1 | -1, waiting: ReadonlyMap<PersonId, OpenDebt>): void {
    const payer = s.entry.payer;
    if (!s.othersCard) lines.push({ ...base, measure: "paid", person: payer, amount: sign * part.total });
    if (part.receivable > 0) lines.push({ ...base, measure: "receivable", person: payer, amount: sign * part.receivable });
    for (const [person, amount] of part.shares) {
      const repay: Repay = person === payer ? "self" : s.noRepay ? "noRepay" : "repay";
      const debt = waiting.get(person);
      if (s.item.cash !== undefined) lines.push({ ...base, measure: "income", person, amount: sign * amount });
      else if (sign === 1) useLines({ ...base, repay }, person, amount, s.item.amortize?.months, debt);
      else use({ ...base, repay, measure: "use", person, amount: -amount }, debt);
      if (person === payer) continue;
      if (s.noRepay) {
        lines.push({ ...base, measure: "spoilGiven", person: payer, amount: sign * amount, counterpart: person });
        lines.push({ ...base, measure: "spoilReceived", person, amount: sign * amount, counterpart: payer });
      } else {
        lines.push({ ...base, measure: "tab", person: payer, amount: sign * amount, counterpart: person });
        lines.push({ ...base, measure: "tab", person, amount: -sign * amount, counterpart: payer });
      }
    }
  }

  /** 我用的：按月攤的切成每個月一份，第一份在付錢那天 */
  function useLines(base: ItemBase, person: PersonId, amount: number, months: number | undefined, debt: OpenDebt | undefined): void {
    if (months === undefined) {
      use({ ...base, measure: "use", person, amount }, debt);
      return;
    }
    splitMonthly(amount, months).forEach((part, i) => {
      use({ ...base, measure: "use", person, amount: part, date: addMonths(base.date, i), amortized: true }, debt);
    });
  }

  /** 我用的一行：別人先出的連到那一筆要還的錢，還了沒在查詢時照 to 那天拆（book.ts） */
  function use(line: Line, debt: OpenDebt | undefined): void {
    const settled = debt === undefined ? "none" : "outstanding";
    const withSettled: Line = { ...line, settled };
    lines.push(withSettled);
    if (debt !== undefined) links.set(withSettled, debt);
  }

  /**
   * 退款：照原本那一項的分法按比例沖回（零頭算誰出），算在退款那天、不攤。
   * 要還的那幾筆跟著變少；已經還超過的，多的部分當成還款再抵別筆（往來帳抵不完變成反方向的一筆）。
   */
  function refund(event: Event, entry: Refund): void {
    const s = spent.get(key(entry.target));
    if (s === undefined) return;
    s.refunded += entry.amount;
    const payer = s.entry.payer;
    const weights: (readonly [PersonId | "receivable", number])[] = [...s.part.shares];
    if (s.part.receivable > 0) weights.push(["receivable", s.part.receivable]);
    const split = splitByWeights(entry.amount, weights, payer);
    const part: Part = {
      total: entry.amount,
      receivable: split.get("receivable") ?? 0,
      shares: nonZero(new Map([...s.part.shares.keys()].map((p) => [p, split.get(p) ?? 0]))),
    };
    // 退款的行指到退款這一則；原本那一項的罐子、標籤、誰出、帳戶照舊
    const { item: _original, ...rest } = s.base;
    const base: ItemBase = {
      ...rest,
      date: event.date,
      event: event.id,
      entry: entry.id,
      cause: "refund",
      amortized: s.item.amortize !== undefined,
    };
    const waiting = new Map<PersonId, OpenDebt>();
    for (const person of part.shares.keys()) {
      const debt = debts.find((d) => sameRef(d.ref, s.ref) && (d.channel === "othersCard" ? d.debtor === person : d.channel === "tab" && d.debtor === person));
      if (debt !== undefined) waiting.set(person, debt);
    }
    itemLines(s, base, part, -1, waiting);

    const date = event.date;
    const same = (d: OpenDebt) => sameRef(d.ref, s.ref);
    for (const [person, amount] of part.shares) {
      if (person === payer || s.noRepay) continue;
      const excess = debts.reduce((d) => same(d) && d.channel === "tab" && d.debtor === person, amount, date);
      const tab = (d: OpenDebt) => d.channel === "tab" && d.debtor === person && d.creditor === payer;
      const left = debts.settle(tab, excess, date);
      if (left > 0) debts.add({ channel: "tab", ref: { event: event.id, entry: entry.id }, date, debtor: payer, creditor: person, amount: left });
    }
    if (part.receivable > 0) {
      const excess = debts.reduce((d) => same(d) && d.channel === "receivable", part.receivable, date);
      debts.settle((d) => d.channel === "receivable" && d.creditor === payer, excess, date);
    }
    const into = entry.account ?? s.entry.account;
    if (s.othersCard && into === s.entry.account) {
      const excess = debts.reduce((d) => same(d) && d.channel === "othersCard", entry.amount, date);
      debts.settle((d) => d.channel === "othersCard" && d.account === into && d.debtor === payer, excess, date);
    }
    if (into !== undefined) move(base, into, entry.amount, payer);
  }

  /** 退款要找得到原本那一項（而且在退款之前）、不能退超過還沒退的；有問題就整則不算 */
  function refundProblems(event: Event): Problem[] {
    const found: Problem[] = [];
    const pending = new Map<string, number>();
    for (const entry of event.effects) {
      if (entry.kind !== "refund") continue;
      const k = key(entry.target);
      const s = spent.get(k);
      if (s === undefined || s.item.cash !== undefined) {
        found.push({ event: event.id, code: "refund-target", entry: entry.id });
        continue;
      }
      const total = (pending.get(k) ?? s.refunded) + entry.amount;
      pending.set(k, total);
      if (total > s.item.amount) found.push({ event: event.id, code: "refund-too-big", entry: entry.id });
    }
    return found;
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
    const date = event.date;
    if (from.kind === "person" && to.kind === "person") {
      const debtor = from.person;
      const creditor = to.person;
      lines.push({ ...base, measure: "tab", person: creditor, amount: -amount, counterpart: debtor });
      lines.push({ ...base, measure: "tab", person: debtor, amount, counterpart: creditor });
      const tab = (d: OpenDebt) => d.channel === "tab" && d.debtor === debtor && d.creditor === creditor;
      const left = debts.settle(tab, amount, date, entry.allocations);
      // 多還的變成反方向的一筆
      if (left > 0) debts.add({ channel: "tab", ref: { event: event.id, entry: entry.id }, date, debtor: creditor, creditor: debtor, amount: left });
    }
    if (from.kind === "person" && from.account !== undefined) move(base, from.account, -amount, from.person);
    if (to.kind === "person" && to.account !== undefined) move(base, to.account, amount, to.person);
    if (from.kind === "outside" && to.kind === "person") {
      const creditor = to.person;
      lines.push({ ...base, measure: "receivable", person: creditor, amount: -amount });
      debts.settle((d) => d.channel === "receivable" && d.creditor === creditor, amount, date, entry.allocations);
    }
    if (to.kind === "othersAccount" && from.kind === "person") {
      const debtor = from.person;
      const card = to.account;
      move(base, card, amount, debtor);
      debts.settle((d) => d.channel === "othersCard" && d.account === card && d.debtor === debtor, amount, date, entry.allocations);
    }
  }

  /** 對帳：實際減掉算出來的就是差額；每個帳戶的第一次是初始餘額，不算差額 */
  function reconcile(event: Event, entry: Reconciliation): void {
    const account = accounts.get(entry.account);
    if (account === undefined) return;
    const opening = !reconciled.has(entry.account);
    reconciled.add(entry.account);
    const diff = entry.actual - (running.get(entry.account) ?? 0);
    if (diff === 0) return;
    const base = origin(event, entry.id, opening ? "opening" : "reconcile");
    const person = holder(account, event.recordedBy);
    move(base, entry.account, diff, person);
    if (!opening) lines.push({ ...base, measure: "reconcileDiff", person, account: entry.account, amount: diff });
  }

  /** 帳戶餘額變了：一行 balance，算進淨資產的再一行 netWorth。看不到的帳戶不算 */
  function move(base: Origin, id: AccountId, amount: number, by: PersonId): void {
    const account = accounts.get(id);
    if (account === undefined) return;
    const person = holder(account, by);
    running.set(id, (running.get(id) ?? 0) + amount);
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

  /** 幫誰分到的錢：共沒寫比例就平分，零頭算誰出；分到 0 的不列 */
  function shares(b: Beneficiary, amount: number, payer: PersonId): Map<PersonId, number> {
    if (b.kind === "person") return new Map([[b.person, amount]]);
    const weights = b.weights?.map((w) => [w.person, w.weight] as const) ?? people.map((p) => [p, 1] as const);
    return nonZero(splitByWeights(amount, weights, payer));
  }
}

function key(ref: ItemRef): string {
  return [ref.event, ref.entry, ref.item].join("/");
}

/** 標籤合併可以接好幾層；繞成圈的當成沒合併 */
export function tagResolver(catalog: Catalog): (id: TagId) => TagId {
  const into = new Map(catalog.tags.flatMap((t) => (t.mergedInto === undefined ? [] : [[t.id, t.mergedInto] as const])));
  return (id) => {
    const seen = new Set<TagId>([id]);
    let current = id;
    for (let next = into.get(current); next !== undefined; next = into.get(current)) {
      if (seen.has(next)) return id;
      seen.add(next);
      current = next;
    }
    return current;
  };
}

function nonZero<K>(m: Map<K, number>): Map<K, number> {
  return new Map([...m].filter(([, amount]) => amount !== 0));
}

function unique<T>(xs: readonly T[]): T[] {
  return [...new Set(xs)];
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
