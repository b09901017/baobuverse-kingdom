// 03 的形狀裝不裝得下 04 的每一種情況：這支主要靠型別檢查（寫得出來就是裝得下），
// 執行時只檢查例子本身寫對了（整筆＝品項加起來）。數字怎麼算是 04 的測試。

import { describe, expect, it } from "vitest";
import type {
  Account,
  AccountId,
  Catalog,
  EntryId,
  Event,
  EventId,
  ItemId,
  JarId,
  MoneyEffect,
  PersonId,
  Recurring,
  RecurringId,
  TagId,
} from "./index";

const 步 = "bu" as PersonId;
const 寶 = "bao" as PersonId;
const 郵局 = "post" as AccountId;
const 國泰 = "cathay" as AccountId;
const 現金 = "cash" as AccountId;
const 寶的銀行 = "bao-bank" as AccountId;
const 寶媽卡 = "bao-mom-card" as AccountId;
const 加密貨幣 = "crypto" as AccountId;
const 信用卡 = "bu-card" as AccountId;
const 日常 = "daily" as JarId;
const 冥想 = "meditation" as JarId;
const 家樂福 = "carrefour" as TagId;
const 吃吃 = "food" as TagId;
const 固定花費 = "recurring" as TagId;

const accounts: Account[] = [
  { id: 郵局, name: "郵局", kind: "bank", owners: [步], currency: "TWD" },
  { id: 國泰, name: "國泰", kind: "bank", owners: [步], currency: "TWD" },
  { id: 現金, name: "錢包", kind: "cash", owners: [步], currency: "TWD" },
  { id: 信用卡, name: "信用卡", kind: "credit-card", owners: [步], currency: "TWD" },
  { id: 寶的銀行, name: "中國信託", kind: "bank", owners: [寶], currency: "TWD" },
  { id: 寶媽卡, name: "寶媽卡", kind: "credit-card", owners: [寶], currency: "TWD", paidByOthers: true },
  { id: 加密貨幣, name: "幣安＋冷錢包", kind: "investment", owners: [步, 寶], currency: "TWD" },
];

const catalog: Catalog = {
  people: [
    { id: 步, name: "步" },
    { id: 寶, name: "寶" },
  ],
  accounts,
  jars: [
    { id: 日常, name: "日常", owners: [步, 寶] },
    { id: 冥想, name: "冥想", owners: [寶] },
  ],
  tags: [
    { id: 家樂福, name: "家樂福" },
    { id: 吃吃, name: "吃吃", defaultJar: 日常 },
    { id: 固定花費, name: "固定花費" },
    { id: "711-dup" as TagId, name: "7-11", mergedInto: "711" as TagId },
  ],
};

let seq = 0;
function event(date: string, effects: readonly MoneyEffect[], recordedBy: PersonId = 步): Event {
  seq += 1;
  return { id: `e${seq}` as EventId, date, recordedBy, recordedAt: seq, source: "manual", status: "confirmed", effects };
}
const entry = (id: string) => id as EntryId;
const item = (id: string) => id as ItemId;

const examples: Record<string, Event> = {
  "家樂福 820：品項 95 吃吃＋725 居家，650 那一項進階改成幫寶": event("2026-10-10", [
    {
      type: "money",
      kind: "expense",
      id: entry("m1"),
      payer: 步,
      account: 現金,
      amount: 820,
      beneficiary: { kind: "person", person: 步 },
      tags: [家樂福],
      items: [
        { id: item("i1"), name: "零食", amount: 170, jar: 日常, tags: [吃吃] },
        { id: item("i2"), name: "寶的保養品", amount: 650, jar: 日常, tags: [], beneficiary: { kind: "person", person: 寶 } },
      ],
    },
  ]),
  "步幫共付 1,000 用 6:4": event("2026-10-11", [
    {
      type: "money",
      kind: "expense",
      id: entry("m1"),
      payer: 步,
      account: 國泰,
      amount: 1000,
      beneficiary: {
        kind: "shared",
        weights: [
          { person: 步, weight: 6 },
          { person: 寶, weight: 4 },
        ],
      },
      tags: [],
      items: [{ id: item("i1"), amount: 1000, jar: 日常, tags: [吃吃] }],
    },
  ]),
  "寶幫步付 1,200（步記的，寶還沒有帳號、不知道寶的帳戶）": event("2026-10-12", [
    {
      type: "money",
      kind: "expense",
      id: entry("m1"),
      payer: 寶,
      amount: 1200,
      beneficiary: { kind: "person", person: 步 },
      tags: [],
      items: [{ id: item("i1"), amount: 1200, jar: 日常, tags: [] }],
    },
  ]),
  "步寵寶 500（不用還）": event("2026-10-13", [
    {
      type: "money",
      kind: "expense",
      id: entry("m1"),
      payer: 步,
      account: 現金,
      amount: 500,
      beneficiary: { kind: "person", person: 寶 },
      noRepay: true,
      tags: [],
      items: [{ id: item("i1"), amount: 500, jar: 冥想, tags: [] }],
    },
  ]),
  "寶直接給步 1,000 寵步": event(
    "2026-10-14",
    [
      {
        type: "money",
        kind: "expense",
        id: entry("m1"),
        payer: 寶,
        account: 寶的銀行,
        amount: 1000,
        beneficiary: { kind: "person", person: 步 },
        noRepay: true,
        tags: [],
        items: [{ id: item("i1"), amount: 1000, jar: 日常, tags: [], cash: { into: 現金 } }],
      },
    ],
    寶,
  ),
  "寶還步 5,000": event("2026-10-15", [
    {
      type: "money",
      kind: "repayment",
      id: entry("m1"),
      amount: 5000,
      from: { kind: "person", person: 寶 },
      to: { kind: "person", person: 步, account: 郵局 },
    },
  ]),
  "跨行轉帳 1,000＋手續費 15：同一則事件": event("2026-10-16", [
    { type: "money", kind: "transfer", id: entry("m1"), from: 郵局, to: 國泰, amount: 1000 },
    {
      type: "money",
      kind: "expense",
      id: entry("m2"),
      payer: 步,
      account: 郵局,
      amount: 15,
      beneficiary: { kind: "person", person: 步 },
      tags: [],
      items: [{ id: item("i1"), name: "跨行手續費", amount: 15, jar: 日常, tags: [] }],
    },
  ]),
  "寶刷寶媽卡 3,000 冥想": event(
    "2026-10-01",
    [
      {
        type: "money",
        kind: "expense",
        id: entry("m1"),
        payer: 寶,
        account: 寶媽卡,
        amount: 3000,
        beneficiary: { kind: "person", person: 寶 },
        tags: [],
        items: [{ id: item("i1"), amount: 3000, jar: 冥想, tags: [] }],
      },
    ],
    寶,
  ),
  "寶還寶媽 2,000，手動指定抵 10/1 那筆冥想": event(
    "2026-10-20",
    [
      {
        type: "money",
        kind: "repayment",
        id: entry("m1"),
        amount: 2000,
        from: { kind: "person", person: 寶, account: 寶的銀行 },
        to: { kind: "othersAccount", account: 寶媽卡 },
        allocations: [{ target: { event: "e8" as EventId, entry: entry("m1"), item: item("i1") }, amount: 2000 }],
      },
    ],
    寶,
  ),
  "聚餐 2,000、4 人平分：待收 1,500": event("2026-10-21", [
    {
      type: "money",
      kind: "expense",
      id: entry("m1"),
      payer: 步,
      account: 信用卡,
      amount: 2000,
      beneficiary: { kind: "person", person: 步 },
      tags: [吃吃],
      items: [{ id: item("i1"), amount: 2000, jar: 日常, tags: [], receivable: 1500 }],
    },
  ]),
  "朋友還 500": event("2026-10-22", [
    {
      type: "money",
      kind: "repayment",
      id: entry("m1"),
      amount: 500,
      from: { kind: "outside" },
      to: { kind: "person", person: 步, account: 現金 },
    },
  ]),
  "刷 12,000 分 12 期": event("2026-10-10", [
    {
      type: "money",
      kind: "expense",
      id: entry("m1"),
      payer: 步,
      account: 信用卡,
      amount: 12000,
      beneficiary: { kind: "person", person: 步 },
      tags: [],
      items: [{ id: item("i1"), name: "手機", amount: 12000, jar: 日常, tags: [], amortize: { months: 12 } }],
    },
  ]),
  "步從郵局轉 10,000 進共有的加密貨幣": event("2026-10-23", [
    { type: "money", kind: "transfer", id: entry("m1"), from: 郵局, to: 加密貨幣, amount: 10000 },
  ]),
  "對帳：錢包實際 1,050": event("2026-10-24", [
    { type: "money", kind: "reconciliation", id: entry("m1"), account: 現金, actual: 1050 },
  ]),
  "退款 95：沖回家樂福那筆的零食": event("2026-10-25", [
    {
      type: "money",
      kind: "refund",
      id: entry("m1"),
      target: { event: "e1" as EventId, entry: entry("m1"), item: item("i1") },
      amount: 95,
    },
  ]),
  "收入：薪水進國泰": event("2026-10-05", [
    { type: "money", kind: "income", id: entry("m1"), person: 步, account: 國泰, amount: 30000, tags: [] },
  ]),
};

const pendingFromNotification: Event = {
  ...event("2026-10-26", [
    {
      type: "money",
      kind: "expense",
      id: entry("m1"),
      payer: 步,
      account: 國泰,
      amount: 120,
      beneficiary: { kind: "person", person: 步 },
      tags: [],
      items: [{ id: item("i1"), amount: 120, jar: 日常, tags: [] }],
    },
  ]),
  source: "notification",
  status: "pending",
  externalIds: ["cathay:2026-10-26T12:03:00:120"],
};

const rent: Recurring = {
  id: "rent" as RecurringId,
  owner: 步,
  name: "房租",
  amount: 8000,
  every: "month",
  day: 5,
  account: 郵局,
  beneficiary: { kind: "shared" },
  jar: 日常,
  tags: [固定花費],
};

describe("形狀裝得下 04 的情況", () => {
  it.each(Object.entries(examples))("%s：每一筆支出的整筆等於品項加起來", (_name, e) => {
    for (const effect of e.effects) {
      if (effect.kind !== "expense") continue;
      expect(effect.items.reduce((sum, i) => sum + i.amount, 0)).toBe(effect.amount);
    }
  });

  it("收件匣裡的通知、固定花費的範本也裝得下", () => {
    expect(pendingFromNotification.status).toBe("pending");
    expect(rent.tags).toContain(固定花費);
    expect(catalog.accounts.filter((a) => a.paidByOthers)).toHaveLength(1);
  });
});
