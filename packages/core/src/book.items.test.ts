// 品項、進階（單項改幫誰、改比例）、按月攤、退款。

import { describe, expect, it } from "vitest";
import { validateEvent } from "./index";
import { 恆等式 } from "./identity.test-kit";
import type { ItemId } from "./index";
import { catalog, expense, itemOf, kingdom, 人, 信用卡, 吃吃, 固定花費, 居家, 家樂福, 寶, 日常, 步, 現金, 郵局 } from "./test-kit";

function 家樂福820() {
  const k = kingdom();
  const e = k.spend("2026-10-10", {
    payer: 步,
    account: 現金,
    amount: 820,
    for: 步,
    tags: [家樂福],
    items: [
      { amount: 95, tags: [吃吃] },
      { amount: 725, tags: [居家] },
    ],
  });
  return { k, e };
}

describe("品項：整筆的標籤套到每一項", () => {

  it("整筆 820、標籤「家樂福」，品項 95（吃吃）＋725（居家）→「家樂福」820、「吃吃」95、「居家」725", () => {
    const book = 家樂福820().k.book();
    const 我用的 = (tag: typeof 家樂福) => book.total({ measure: "use", person: 步, where: { tags: [tag] } });
    expect([我用的(家樂福), 我用的(吃吃), 我用的(居家)]).toEqual([820, 95, 725]);
    expect(book.total({ measure: "use", person: 步, where: { tags: [家樂福, 吃吃] } })).toBe(95);
  });

  it("品項加起來不等於整筆就拒絕：validateEvent 回 items-sum-mismatch，openBook 不算它、列在 problems", () => {
    const k = kingdom();
    const bad = k.record("2026-10-10", [
      expense("m1", { payer: 步, amount: 820, for: 步, items: [{ amount: 95 }, { amount: 700 }] }),
    ]);
    expect(validateEvent(bad, catalog)).toEqual([{ event: bad.id, code: "items-sum-mismatch", entry: "m1" }]);
    const book = k.book();
    expect(book.total({ measure: "use", person: 步 })).toBe(0);
    expect(book.problems).toEqual([{ event: bad.id, code: "items-sum-mismatch", entry: "m1" }]);
  });
});

describe("退款：沖回原本那一項，不算收入", () => {
  it("原本那一項（日常、標籤「家樂福」）退 95 → 日常與「家樂福」的我用的各少 95、我付的也少 95、不算收入、錢回到原本的帳戶", () => {
    const { k, e } = 家樂福820();
    k.refund("2026-10-25", itemOf(e, 0), 95);
    const book = k.book();
    expect(book.total({ measure: "use", person: 步, where: { jar: 日常 } })).toBe(725);
    expect(book.total({ measure: "use", person: 步, where: { tags: [家樂福] } })).toBe(725);
    expect(book.total({ measure: "use", person: 步, where: { tags: [吃吃] } })).toBe(0);
    expect(book.total({ measure: "paid", person: 步 })).toBe(725);
    expect(book.total({ measure: "income", person: 步 })).toBe(0);
    expect(book.total({ measure: "balance", where: { account: 現金 } })).toBe(-725);
  });

  it("退款算在退款那天：原本那個月的數字不變", () => {
    const { k, e } = 家樂福820();
    k.refund("2026-11-02", itemOf(e, 0), 95);
    const book = k.book();
    expect(book.breakdown({ measure: "use", person: 步 }, "month")).toEqual([
      { key: "2026-10", amount: 820 },
      { key: "2026-11", amount: -95 },
    ]);
  });

  it("原本是幫寶付的那一項退款 → 寶的我用的、往來帳也少；要還的那一筆跟著變少", () => {
    const k = kingdom();
    const e = k.spend("2026-10-10", { payer: 步, amount: 820, for: 步, items: [{ amount: 170 }, { amount: 650, for: 寶 }] });
    k.refund("2026-10-12", itemOf(e, 1), 50);
    const book = k.book();
    expect(book.total({ measure: "use", person: 寶 })).toBe(600);
    expect(book.total({ measure: "tab", person: 步 })).toBe(600);
    expect(book.debts({ channel: "tab" })).toMatchObject([{ amount: 600, settled: 0, outstanding: 600 }]);
    expect(恆等式(book, 步)).toEqual({ 左邊: 600, 右邊: 600 });
  });

  it("共付那一項退款照原本的分法按比例沖回：2,000 平分退 301 → 步 −151、寶 −150", () => {
    const k = kingdom();
    const e = k.spend("2026-10-10", { payer: 步, amount: 2000, for: "共" });
    const r = k.refund("2026-10-12", itemOf(e), 301);
    const lines = k.book().lines({ measure: "use", where: { cause: "refund" } });
    expect(lines.map((l) => [l.person, l.amount, l.event])).toEqual([
      [步, -151, r.id],
      [寶, -150, r.id],
    ]);
  });

  it("寶已經還清之後才退款：多還的部分變成步欠寶", () => {
    const k = kingdom();
    const e = k.spend("2026-10-10", { payer: 步, amount: 650, for: 寶 });
    k.repay("2026-10-11", 650, 人(寶), 人(步));
    k.refund("2026-10-12", itemOf(e), 50);
    const book = k.book();
    expect(book.total({ measure: "tab", person: 步 })).toBe(-50);
    expect(book.debts({ channel: "tab", outstandingOnly: true })).toMatchObject([{ debtor: 步, creditor: 寶, outstanding: 50 }]);
  });

  it("找不到原本那一項、或退得比還沒退的多：不算這筆退款、列在 problems", () => {
    const { k, e } = 家樂福820();
    const 沒有 = k.refund("2026-10-25", { ...itemOf(e, 0), item: "nope" as ItemId }, 10);
    k.refund("2026-10-25", itemOf(e, 0), 60);
    const 太多 = k.refund("2026-10-26", itemOf(e, 0), 40);
    const book = k.book();
    expect(book.problems).toEqual([
      { event: 沒有.id, code: "refund-target", entry: "m1" },
      { event: 太多.id, code: "refund-too-big", entry: "m1" },
    ]);
    expect(book.total({ measure: "use", person: 步 })).toBe(760);
  });
});

describe("按月攤：帳戶記全額，我用的平均攤到之後幾個月", () => {
  it("10/10 刷 12,000 分 12 期：信用卡欠款當天 +12,000、我付的當天 12,000；我用的 10 月到隔年 9 月每月 1,000", () => {
    const k = kingdom();
    k.spend("2026-10-10", { payer: 步, account: 信用卡, amount: 12000, for: 步, items: [{ amount: 12000, months: 12 }] });
    const book = k.book();
    expect(book.total({ measure: "balance", where: { account: 信用卡 }, to: "2026-10-10" })).toBe(-12000);
    expect(book.breakdown({ measure: "paid", person: 步 }, "month")).toEqual([{ key: "2026-10", amount: 12000 }]);
    const 每月 = book.breakdown({ measure: "use", person: 步 }, "month");
    expect(每月).toHaveLength(12);
    expect(每月[0]).toEqual({ key: "2026-10", amount: 1000 });
    expect(每月[11]).toEqual({ key: "2027-09", amount: 1000 });
    expect(new Set(每月.map((b) => b.amount))).toEqual(new Set([1000]));
  });

  it("年繳保險 12,000 一樣：每月 1,000、標籤「固定花費」也跟著每一份", () => {
    const k = kingdom();
    k.spend("2026-03-05", { payer: 步, account: 郵局, amount: 12000, for: 步, tags: [固定花費], items: [{ amount: 12000, months: 12 }] });
    const 每月 = k.book().breakdown({ measure: "use", person: 步, where: { tags: [固定花費] } }, "month");
    expect(每月.map((b) => b.amount)).toEqual(Array(12).fill(1000));
    expect(每月.map((b) => b.key)).toContain("2027-02");
  });

  it("1,000 攤 3 個月 → 334、333、333（零頭放在前面）；每一份在每個月同一天，那個月沒有這天就用月底", () => {
    const k = kingdom();
    k.spend("2027-01-31", { payer: 步, amount: 1000, for: 步, items: [{ amount: 1000, months: 3 }] });
    const lines = k.book().lines({ measure: "use", person: 步 });
    expect(lines.map((l) => [l.date, l.amount, l.amortized])).toEqual([
      ["2027-01-31", 334, true],
      ["2027-02-28", 333, true],
      ["2027-03-31", 333, true],
    ]);
  });

  it("共付的分期：每個人那一份各自攤", () => {
    const k = kingdom();
    k.spend("2026-10-10", { payer: 步, amount: 3000, for: "共", items: [{ amount: 3000, months: 3 }] });
    const book = k.book();
    expect(book.breakdown({ measure: "use", person: 寶 }, "month")).toEqual([
      { key: "2026-10", amount: 500 },
      { key: "2026-11", amount: 500 },
      { key: "2026-12", amount: 500 },
    ]);
    expect(book.total({ measure: "tab", person: 步, to: "2026-10-10" })).toBe(1500);
  });
});

describe("進階：單項改幫誰、改比例", () => {
  it("820 裡 650 那一項改成幫寶付 → 步的我用的 170、往來帳 +650", () => {
    const k = kingdom();
    k.spend("2026-10-10", { payer: 步, amount: 820, for: 步, items: [{ amount: 170 }, { amount: 650, for: 寶 }] });
    const book = k.book();
    expect(book.total({ measure: "use", person: 步 })).toBe(170);
    expect(book.total({ measure: "tab", person: 步 })).toBe(650);
    expect(book.total({ measure: "use", person: 寶 })).toBe(650);
  });

  it("步幫共付 1,000 用 6:4（步 6）→ 步的我用的 600、往來帳 +400", () => {
    const k = kingdom();
    const weights = [
      { person: 步, weight: 6 },
      { person: 寶, weight: 4 },
    ];
    k.spend("2026-10-11", { payer: 步, amount: 1000, for: weights });
    const book = k.book();
    expect(book.total({ measure: "use", person: 步 })).toBe(600);
    expect(book.total({ measure: "tab", person: 步 })).toBe(400);
  });

  it("共付 1,001 平分 → 出錢的人 501（零頭算誰出）", () => {
    const k = kingdom();
    k.spend("2026-10-12", { payer: 寶, amount: 1001, for: "共" }, { by: 寶 });
    const book = k.book();
    expect(book.total({ measure: "use", person: 寶 })).toBe(501);
    expect(book.total({ measure: "use", person: 步 })).toBe(500);
  });

  it("比例除不盡也只用整數：1,000 用 步 1、寶 2，步付 → 寶 666、步 334", () => {
    const k = kingdom();
    k.spend("2026-10-12", { payer: 步, amount: 1000, for: [{ person: 步, weight: 1 }, { person: 寶, weight: 2 }] });
    const book = k.book();
    expect(book.total({ measure: "use", person: 寶 })).toBe(666);
    expect(book.total({ measure: "use", person: 步 })).toBe(334);
  });
});
