// 04 的測試共用的王國：步、寶、帳戶、罐子、標籤，和記事件的小幫手（不從 index 匯出，只給測試用）。

import { openBook } from "./book";
import type {
  AccountId,
  Allocation,
  Amortize,
  Beneficiary,
  Catalog,
  EntryId,
  Event,
  EventId,
  EventStatus,
  Expense,
  Item,
  ItemId,
  ItemRef,
  JarId,
  LocalTime,
  MoneyEffect,
  PersonId,
  RepaymentParty,
  TagId,
  Weight,
} from "./model";

export const 步 = "bu" as PersonId;
export const 寶 = "bao" as PersonId;

export const 郵局 = "post" as AccountId;
export const 國泰 = "cathay" as AccountId;
export const 現金 = "cash" as AccountId;
export const 信用卡 = "bu-card" as AccountId;
export const 寶的銀行 = "bao-bank" as AccountId;
export const 寶媽卡 = "bao-mom-card" as AccountId;
export const 加密貨幣 = "crypto" as AccountId;

export const 日常 = "daily" as JarId;
export const 玩玩 = "play" as JarId;
export const 冥想 = "meditation" as JarId;

export const 家樂福 = "carrefour" as TagId;
export const 吃吃 = "food" as TagId;
export const 居家 = "home" as TagId;
export const 固定花費 = "recurring" as TagId;
export const 押金 = "deposit" as TagId;
export const 小七 = "711" as TagId;
export const 小七舊 = "7-11" as TagId;

const people = [
  { id: 步, name: "步" },
  { id: 寶, name: "寶" },
];
const jars = [
  { id: 日常, name: "日常", owners: [步, 寶] },
  { id: 玩玩, name: "玩玩", owners: [步, 寶] },
  { id: 冥想, name: "冥想", owners: [寶] },
];
const tags = [
  { id: 家樂福, name: "家樂福" },
  { id: 吃吃, name: "吃吃" },
  { id: 居家, name: "居家" },
  { id: 固定花費, name: "固定花費" },
  { id: 押金, name: "押金" },
  { id: 小七, name: "711" },
  { id: 小七舊, name: "7-11", mergedInto: 小七 },
];

/** 看得到所有帳戶的參考資料（app 裡也是：成員互相看得到帳戶的名字、種類） */
export const catalog: Catalog = {
  people,
  accounts: [
    { id: 郵局, name: "郵局", kind: "bank", owners: [步], currency: "TWD" },
    { id: 國泰, name: "國泰", kind: "bank", owners: [步], currency: "TWD" },
    { id: 現金, name: "錢包", kind: "cash", owners: [步], currency: "TWD" },
    { id: 信用卡, name: "信用卡", kind: "credit-card", owners: [步], currency: "TWD" },
    { id: 寶的銀行, name: "中國信託", kind: "bank", owners: [寶], currency: "TWD" },
    { id: 寶媽卡, name: "寶媽卡", kind: "credit-card", owners: [寶], currency: "TWD", paidByOthers: true },
    { id: 加密貨幣, name: "幣安＋冷錢包", kind: "investment", owners: [步, 寶], currency: "TWD" },
  ],
  jars,
  tags,
};

/** 查不到步的帳戶時（core 要容忍）：只有寶自己的帳戶和共有的 */
export const 寶的catalog: Catalog = {
  ...catalog,
  accounts: catalog.accounts.filter((a) => a.owners.includes(寶)),
};

/** 幫誰：某個人、共（平分），或共的比例（進階） */
export type For = PersonId | "共" | readonly Weight[];

export interface ItemSpec {
  readonly amount: number;
  readonly jar?: JarId;
  readonly tags?: readonly TagId[];
  readonly for?: For;
  readonly noRepay?: boolean;
  readonly receivable?: number;
  readonly months?: number;
  /** 直接給錢；給帳戶就是對方收錢的帳戶 */
  readonly cash?: AccountId | true;
}

export interface Spend {
  readonly payer: PersonId;
  readonly account?: AccountId;
  readonly amount: number;
  readonly for: For;
  readonly noRepay?: boolean;
  readonly tags?: readonly TagId[];
  /** 只有一項時的罐子（預設日常） */
  readonly jar?: JarId;
  /** 沒給就是一項、金額等於整筆 */
  readonly items?: readonly ItemSpec[];
}

export interface Options {
  readonly by?: PersonId;
  readonly time?: LocalTime;
  readonly status?: EventStatus;
}

export function beneficiary(f: For): Beneficiary {
  if (f === "共") return { kind: "shared" };
  if (typeof f === "string") return { kind: "person", person: f };
  return { kind: "shared", weights: f };
}

export const 人 = (person: PersonId, account?: AccountId): RepaymentParty =>
  account === undefined ? { kind: "person", person } : { kind: "person", person, account };
export const 寶媽 = (account: AccountId = 寶媽卡): RepaymentParty => ({ kind: "othersAccount", account });
export const 朋友: RepaymentParty = { kind: "outside" };

function toItem(spec: ItemSpec, index: number, fallbackJar: JarId): Item {
  const amortize: Amortize | undefined = spec.months === undefined ? undefined : { months: spec.months };
  return {
    id: `i${index + 1}` as ItemId,
    amount: spec.amount,
    jar: spec.jar ?? fallbackJar,
    tags: spec.tags ?? [],
    ...(spec.for === undefined ? {} : { beneficiary: beneficiary(spec.for) }),
    ...(spec.noRepay === undefined ? {} : { noRepay: spec.noRepay }),
    ...(spec.receivable === undefined ? {} : { receivable: spec.receivable }),
    ...(amortize === undefined ? {} : { amortize }),
    ...(spec.cash === undefined ? {} : { cash: spec.cash === true ? {} : { into: spec.cash } }),
  };
}

export function expense(id: string, s: Spend): Expense {
  const items = s.items ?? [{ amount: s.amount }];
  return {
    type: "money",
    kind: "expense",
    id: id as EntryId,
    payer: s.payer,
    ...(s.account === undefined ? {} : { account: s.account }),
    amount: s.amount,
    beneficiary: beneficiary(s.for),
    ...(s.noRepay === undefined ? {} : { noRepay: s.noRepay }),
    tags: s.tags ?? [],
    items: items.map((spec, i) => toItem(spec, i, s.jar ?? 日常)),
  };
}

/** 一個王國的日記：照順序記事件，記完打開帳本 */
export function kingdom() {
  let seq = 0;
  const events: Event[] = [];

  function record(date: string, effects: readonly MoneyEffect[], o: Options = {}): Event {
    seq += 1;
    const e: Event = {
      id: `e${seq}` as EventId,
      date,
      ...(o.time === undefined ? {} : { time: o.time }),
      recordedBy: o.by ?? 步,
      recordedAt: seq,
      source: "manual",
      status: o.status ?? "confirmed",
      effects: effects.map((m, i) => ({ ...m, id: `m${i + 1}` as EntryId })),
    };
    events.push(e);
    return e;
  }

  return {
    events,
    record,
    spend: (date: string, s: Spend, o?: Options) => record(date, [expense("m1", s)], o),
    income: (date: string, person: PersonId, account: AccountId | undefined, amount: number, o?: Options) =>
      record(
        date,
        [{ type: "money", kind: "income", id: "m1" as EntryId, person, ...(account === undefined ? {} : { account }), amount, tags: [] }],
        o,
      ),
    transfer: (date: string, from: AccountId, to: AccountId, amount: number, o?: Options) =>
      record(date, [{ type: "money", kind: "transfer", id: "m1" as EntryId, from, to, amount }], o),
    repay: (
      date: string,
      amount: number,
      from: RepaymentParty,
      to: RepaymentParty,
      allocations?: readonly Allocation[],
      o?: Options,
    ) =>
      record(
        date,
        [{ type: "money", kind: "repayment", id: "m1" as EntryId, amount, from, to, ...(allocations === undefined ? {} : { allocations }) }],
        o,
      ),
    reconcile: (date: string, account: AccountId, actual: number, o?: Options) =>
      record(date, [{ type: "money", kind: "reconciliation", id: "m1" as EntryId, account, actual }], o),
    refund: (date: string, target: ItemRef, amount: number, account?: AccountId, o?: Options) =>
      record(
        date,
        [{ type: "money", kind: "refund", id: "m1" as EntryId, target, amount, ...(account === undefined ? {} : { account }) }],
        o,
      ),
    book: (cat: Catalog = catalog) => openBook(cat, events),
  };
}

/** 某則事件第一筆支出的第 n 項（從 0 數） */
export function itemOf(e: Event, n = 0): ItemRef {
  const entry = e.effects.find((m) => m.kind === "expense");
  if (entry === undefined || entry.kind !== "expense") throw new Error(`${e.id} 沒有支出`);
  const item = entry.items[n];
  if (item === undefined) throw new Error(`${e.id} 沒有第 ${n} 項`);
  return { event: e.id, entry: entry.id, item: item.id };
}
