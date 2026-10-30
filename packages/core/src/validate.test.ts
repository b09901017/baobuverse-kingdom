// 存之前的檢查（validateEvent）：ProblemCode 每一種一支；參與者（participantsOf）。

import { describe, expect, it } from "vitest";
import type { EntryId, Event, ItemId, JarId, MoneyEffect, PersonId, ProblemCode } from "./index";
import { participantsOf, validateEvent } from "./index";
import {
  catalog,
  expense,
  itemOf,
  kingdom,
  人,
  信用卡,
  加密貨幣,
  寶,
  寶媽,
  寶媽卡,
  寶的catalog,
  寶的銀行,
  日常,
  朋友,
  步,
  現金,
  郵局,
  國泰,
  type Spend,
} from "./test-kit";

const D = "2026-10-10";
const 一般 = { payer: 步, account: 現金, amount: 100, for: 步 } satisfies Spend;

/** 一則只有這些效果的事件，回傳檢查出來的問題代碼 */
function codes(effects: readonly MoneyEffect[], others: readonly Event[] = [], by: PersonId = 步): ProblemCode[] {
  const k = kingdom();
  const e = k.record(D, effects, { by });
  return validateEvent(e, catalog, others).map((p) => p.code);
}

const 支出 = (s: Partial<Spend> & Pick<Spend, "amount">) => expense("m1", { ...一般, ...s });

describe("validateEvent：沒有問題就回傳空陣列", () => {
  it("一般的一筆支出、轉帳、還款、對帳都沒問題", () => {
    expect(codes([支出({ amount: 100 })])).toEqual([]);
    expect(codes([{ type: "money", kind: "transfer", id: "m1" as EntryId, from: 郵局, to: 國泰, amount: 1000 }])).toEqual([]);
    expect(codes([{ type: "money", kind: "repayment", id: "m1" as EntryId, amount: 500, from: 人(寶), to: 人(步, 郵局) }])).toEqual([]);
    expect(codes([{ type: "money", kind: "reconciliation", id: "m1" as EntryId, account: 信用卡, actual: -3000 }])).toEqual([]);
  });
});

describe("validateEvent：每一種問題", () => {
  const cases: [ProblemCode, string, () => ProblemCode[]][] = [
    ["amount-invalid", "金額有小數", () => codes([支出({ amount: 100.5, items: [{ amount: 100.5 }] })])],
    ["amount-invalid", "品項金額是 0", () => codes([支出({ amount: 100, items: [{ amount: 100 }, { amount: 0 }] })])],
    ["amount-invalid", "對帳的實際餘額有小數", () => codes([{ type: "money", kind: "reconciliation", id: "m1" as EntryId, account: 現金, actual: 1.5 }])],
    ["no-items", "支出沒有品項", () => codes([支出({ amount: 100, items: [] })])],
    ["items-sum-mismatch", "品項加起來不等於整筆", () => codes([支出({ amount: 100, items: [{ amount: 60 }, { amount: 30 }] })])],
    [
      "duplicate-id",
      "同一則事件裡兩筆的 ID 一樣",
      () => {
        const k = kingdom();
        const e = k.record(D, [支出({ amount: 100 })]);
        const twice: Event = { ...e, effects: [...e.effects, ...e.effects] };
        return validateEvent(twice, catalog).map((p) => p.code);
      },
    ],
    [
      "duplicate-id",
      "同一筆裡兩個品項的 ID 一樣",
      () => {
        const m = 支出({ amount: 100, items: [{ amount: 50 }, { amount: 50 }] });
        if (m.kind !== "expense") throw new Error();
        return codes([{ ...m, items: m.items.map((i) => ({ ...i, id: "i1" as ItemId })) }]);
      },
    ],
    ["unknown-ref", "找不到的罐子", () => codes([支出({ amount: 100, jar: "nope" as JarId })])],
    [
      "unknown-ref",
      "記的人看不到的帳戶（寶記、用步的郵局）",
      () => {
        const e = kingdom().record(D, [支出({ payer: 寶, account: 郵局, amount: 100 })], { by: 寶 });
        return validateEvent(e, 寶的catalog).map((p) => p.code);
      },
    ],
    ["account-not-payers", "寶出的錢、帳戶是步的郵局", () => codes([支出({ payer: 寶, account: 郵局, amount: 100 })])],
    ["shared-account-expense", "用共有的加密貨幣帳戶付支出", () => codes([支出({ account: 加密貨幣, amount: 100 })])],
    [
      "income-account",
      "寶的收入進步的郵局",
      () => codes([{ type: "money", kind: "income", id: "m1" as EntryId, person: 寶, account: 郵局, amount: 100, tags: [] }]),
    ],
    ["transfer-owners", "寶的銀行轉到步的郵局（那是還款）", () => codes([{ type: "money", kind: "transfer", id: "m1" as EntryId, from: 寶的銀行, to: 郵局, amount: 100 }])],
    ["transfer-same-account", "轉到同一個帳戶", () => codes([{ type: "money", kind: "transfer", id: "m1" as EntryId, from: 郵局, to: 郵局, amount: 100 }])],
    ["transfer-others-account", "轉進寶媽卡（那是還款）", () => codes([{ type: "money", kind: "transfer", id: "m1" as EntryId, from: 寶的銀行, to: 寶媽卡, amount: 100 }])],
    ["repayment-parties", "朋友還寶媽卡", () => codes([{ type: "money", kind: "repayment", id: "m1" as EntryId, amount: 100, from: 朋友, to: 寶媽() }])],
    ["repayment-parties", "步還步", () => codes([{ type: "money", kind: "repayment", id: "m1" as EntryId, amount: 100, from: 人(步), to: 人(步) }])],
    ["reconcile-investment", "投資帳戶不對帳", () => codes([{ type: "money", kind: "reconciliation", id: "m1" as EntryId, account: 加密貨幣, actual: 100 }])],
    ["weights-invalid", "比例是 0", () => codes([支出({ amount: 100, for: [{ person: 步, weight: 0 }, { person: 寶, weight: 1 }] })])],
    ["weights-invalid", "比例有小數（金額只用整數算）", () => codes([支出({ amount: 100, for: [{ person: 步, weight: 0.6 }, { person: 寶, weight: 0.4 }] })])],
    ["weights-invalid", "比例裡有王國以外的人", () => codes([支出({ amount: 100, for: [{ person: 步, weight: 1 }, { person: "friend" as PersonId, weight: 1 }] })])],
    ["receivable-too-big", "待收比那一項還多", () => codes([支出({ amount: 100, items: [{ amount: 100, receivable: 150 }] })])],
    ["amortize-invalid", "按月攤 1 個月", () => codes([支出({ amount: 100, items: [{ amount: 100, months: 1 }] })])],
    ["cash-invalid", "直接給錢給自己", () => codes([支出({ amount: 100, noRepay: true, items: [{ amount: 100, cash: true }] })])],
    ["cash-invalid", "直接給錢但要還", () => codes([支出({ for: 寶, amount: 100, items: [{ amount: 100, cash: true }] })])],
  ];

  it.each(cases)("%s：%s", (code, _情況, run) => {
    expect(run()).toContain(code);
  });

  it("refund-target：退款指到不存在的品項（給了 events 才檢查）", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    const r = k.refund("2026-10-12", { ...itemOf(e), item: "nope" as ItemId }, 10);
    expect(validateEvent(r, catalog, k.events).map((p) => p.code)).toEqual(["refund-target"]);
    expect(validateEvent(r, catalog)).toEqual([]);
  });

  it("refund-too-big：退款超過那一項還沒退的", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    k.refund("2026-10-12", itemOf(e), 60);
    const r = k.refund("2026-10-13", itemOf(e), 50);
    expect(validateEvent(r, catalog, k.events).map((p) => p.code)).toEqual(["refund-too-big"]);
  });

  it("allocation-invalid：手動指定的還款指到不存在的、不是這一種要還的錢，或指定的比還款多", () => {
    const k = kingdom();
    const 寶媽卡那筆 = k.spend(D, { payer: 寶, account: 寶媽卡, amount: 3000, for: 寶 }, { by: 寶 });
    const 幫寶付 = k.spend(D, { payer: 步, amount: 500, for: 寶 });
    const 還款 = (target: ReturnType<typeof itemOf>, amount = 100) =>
      k.repay("2026-10-20", 100, 人(寶), 人(步), [{ target, amount }]);
    const check = (e: Event) => validateEvent(e, catalog, k.events).map((p) => p.code);
    expect(check(還款(itemOf(幫寶付)))).toEqual([]);
    expect(check(還款({ ...itemOf(幫寶付), item: "nope" as ItemId }))).toEqual(["allocation-invalid"]);
    expect(check(還款(itemOf(寶媽卡那筆)))).toEqual(["allocation-invalid"]);
    expect(check(還款(itemOf(幫寶付), 200))).toEqual(["allocation-invalid"]);
  });

  it("問題指得到是哪一筆、哪一項", () => {
    const k = kingdom();
    const e = k.record(D, [支出({ amount: 100, items: [{ amount: 100, months: 1 }] })]);
    expect(validateEvent(e, catalog)).toEqual([{ event: e.id, code: "amortize-invalid", entry: "m1", item: "i1" }]);
  });
});

describe("看不到的帳戶", () => {
  it("寶的帳本（沒有步的帳戶）裡，步幫共付、從國泰出 → 寶的我用的 1,000、往來帳 −1,000，不在 problems", () => {
    const k = kingdom();
    k.spend(D, { payer: 步, account: 國泰, amount: 2000, for: "共", jar: 日常 });
    const book = k.book(寶的catalog);
    expect(book.total({ measure: "use", person: 寶 })).toBe(1000);
    expect(book.total({ measure: "tab", person: 寶 })).toBe(-1000);
    expect(book.problems).toEqual([]);
  });
});

describe("參與者（participantsOf）：看得到這則事件的人，排好序、不重複", () => {
  const 誰看得到 = (e: Event, events?: readonly Event[]) => participantsOf(e, catalog, events);

  it("步幫步付（步記）→ 只有步；寶看不到", () => {
    expect(誰看得到(kingdom().spend(D, 一般))).toEqual([步]);
  });

  it("寶幫步付（步記）→ 兩個", () => {
    expect(誰看得到(kingdom().spend(D, { payer: 寶, amount: 100, for: 步 }))).toEqual([寶, 步]);
  });

  it("步幫共付 → 兩個；只有一個品項幫寶也是兩個", () => {
    expect(誰看得到(kingdom().spend(D, { ...一般, for: "共" }))).toEqual([寶, 步]);
    expect(誰看得到(kingdom().spend(D, { ...一般, items: [{ amount: 100, for: 寶 }] }))).toEqual([寶, 步]);
  });

  it("轉進共有的投資帳戶 → 兩個（寶的帳本看不到步的郵局也一樣）", () => {
    const e = kingdom().transfer(D, 郵局, 加密貨幣, 10000);
    expect(誰看得到(e)).toEqual([寶, 步]);
    expect(participantsOf(e, 寶的catalog)).toEqual([寶, 步]);
  });

  it("寶刷寶媽卡幫自己（寶記）→ 只有寶", () => {
    expect(誰看得到(kingdom().spend(D, { payer: 寶, account: 寶媽卡, amount: 3000, for: 寶 }, { by: 寶 }))).toEqual([寶]);
  });

  it("寶直接給步 → 兩個；步記寶幫寶付 → 兩個（記的人也看得到）", () => {
    const give = kingdom().spend(D, { payer: 寶, account: 寶的銀行, amount: 1000, for: 步, noRepay: true, items: [{ amount: 1000, cash: true }] }, { by: 寶 });
    expect(誰看得到(give)).toEqual([寶, 步]);
    expect(誰看得到(kingdom().spend(D, { payer: 寶, amount: 100, for: 寶 }))).toEqual([寶, 步]);
  });

  it("還款兩邊的人：寶還步 → 兩個；朋友還步 → 只有步；寶還寶媽 → 只有寶", () => {
    const k = kingdom();
    expect(誰看得到(k.repay(D, 500, 人(寶), 人(步)))).toEqual([寶, 步]);
    expect(誰看得到(k.repay(D, 500, 朋友, 人(步, 現金)))).toEqual([步]);
    expect(誰看得到(k.repay(D, 500, 人(寶, 寶的銀行), 寶媽(), undefined, { by: 寶 }))).toEqual([寶]);
  });

  it("退款 → 原本那則的參與者＋記的人（要給 events）", () => {
    const k = kingdom();
    const e = k.spend(D, { payer: 步, account: 現金, amount: 650, for: 寶 });
    const r = k.refund("2026-10-12", itemOf(e), 50);
    expect(誰看得到(r, k.events)).toEqual([寶, 步]);
    expect(誰看得到(r)).toEqual([步]);
  });
});
