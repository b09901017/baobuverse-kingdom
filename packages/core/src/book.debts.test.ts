// 要還的錢：還款先抵最早還沒還清的（進階可以手動指定），往來帳用同一套，待收。

import { describe, expect, it } from "vitest";
import type { Book, DebtQuery } from "./index";
import { 恆等式 } from "./identity.test-kit";
import { itemOf, kingdom, 人, 信用卡, 冥想, 朋友, 現金, 寶, 寶媽, 寶媽卡, 寶的銀行, 步 } from "./test-kit";

/** 每一筆要還的錢：[日期, 金額, 已還, 還欠] */
function 每一筆(book: Book, query: DebtQuery) {
  return book.debts(query).map((d) => [d.date, d.amount, d.settled, d.outstanding]);
}

describe("還款先抵最早還沒還清的（寶媽卡）", () => {
  function 刷了兩筆() {
    const k = kingdom();
    const 冥想那筆 = k.spend("2026-10-01", { payer: 寶, account: 寶媽卡, amount: 3000, for: 寶, jar: 冥想 }, { by: 寶 });
    const 日常那筆 = k.spend("2026-10-15", { payer: 寶, account: 寶媽卡, amount: 1000, for: 寶 }, { by: 寶 });
    return { k, 冥想那筆, 日常那筆 };
  }

  it("10/20 還 2,000：冥想已還 2,000、還欠 1,000，日常還欠 1,000", () => {
    const { k } = 刷了兩筆();
    k.repay("2026-10-20", 2000, 人(寶, 寶的銀行), 寶媽(), undefined, { by: 寶 });
    expect(每一筆(k.book(), { channel: "othersCard", person: 寶 })).toEqual([
      ["2026-10-01", 3000, 2000, 1000],
      ["2026-10-15", 1000, 0, 1000],
    ]);
  });

  it("11/5 再還 2,000：兩筆都還清", () => {
    const { k } = 刷了兩筆();
    k.repay("2026-10-20", 2000, 人(寶, 寶的銀行), 寶媽(), undefined, { by: 寶 });
    k.repay("2026-11-05", 2000, 人(寶, 寶的銀行), 寶媽(), undefined, { by: 寶 });
    expect(每一筆(k.book(), { channel: "othersCard", person: 寶 })).toEqual([
      ["2026-10-01", 3000, 3000, 0],
      ["2026-10-15", 1000, 1000, 0],
    ]);
  });

  it("進階手動指定：10/20 那 2,000 指定抵日常 → 日常還清、冥想還欠 2,000（多出的 1,000 再抵最早的）", () => {
    const { k, 日常那筆 } = 刷了兩筆();
    k.repay("2026-10-20", 2000, 人(寶, 寶的銀行), 寶媽(), [{ target: itemOf(日常那筆), amount: 2000 }], { by: 寶 });
    expect(每一筆(k.book(), { channel: "othersCard", person: 寶 })).toEqual([
      ["2026-10-01", 3000, 1000, 2000],
      ["2026-10-15", 1000, 1000, 0],
    ]);
  });

  it("算到某一天（asOf）與只看還欠的（outstandingOnly）", () => {
    const { k } = 刷了兩筆();
    k.repay("2026-10-20", 2000, 人(寶, 寶的銀行), 寶媽(), undefined, { by: 寶 });
    k.repay("2026-11-05", 2000, 人(寶, 寶的銀行), 寶媽(), undefined, { by: 寶 });
    const book = k.book();
    expect(每一筆(book, { channel: "othersCard", asOf: "2026-10-10" })).toEqual([["2026-10-01", 3000, 0, 3000]]);
    expect(每一筆(book, { channel: "othersCard", asOf: "2026-10-31", outstandingOnly: true })).toEqual([
      ["2026-10-01", 3000, 2000, 1000],
      ["2026-10-15", 1000, 0, 1000],
    ]);
    expect(每一筆(book, { channel: "othersCard", outstandingOnly: true })).toEqual([]);
  });
});

describe("往來帳用同一套：之後反方向的支出、還款都先抵最早的", () => {
  function 互相幫付() {
    const k = kingdom();
    k.spend("2026-10-01", { payer: 步, amount: 3000, for: 寶 });
    k.spend("2026-10-05", { payer: 寶, amount: 1200, for: 步 });
    return k;
  }

  it("步幫寶付 3,000、之後寶幫步付 1,200：那 3,000 已抵 1,200、還欠 1,800", () => {
    const book = 互相幫付().book();
    expect(book.debts({ channel: "tab" })).toMatchObject([
      { date: "2026-10-01", debtor: 寶, creditor: 步, amount: 3000, settled: 1200, outstanding: 1800 },
      { date: "2026-10-05", debtor: 步, creditor: 寶, amount: 1200, settled: 1200, outstanding: 0 },
    ]);
    expect(book.total({ measure: "tab", person: 步 })).toBe(1800);
  });

  it("寶還步 1,800：還清", () => {
    const k = 互相幫付();
    k.repay("2026-10-10", 1800, 人(寶), 人(步));
    expect(每一筆(k.book(), { channel: "tab", outstandingOnly: true })).toEqual([]);
  });

  it("再多還 100：變成步欠寶 100（指到那筆還款，沒有品項）", () => {
    const k = 互相幫付();
    k.repay("2026-10-10", 1800, 人(寶), 人(步));
    const 多還 = k.repay("2026-10-12", 100, 人(寶), 人(步));
    const book = k.book();
    expect(book.debts({ channel: "tab", outstandingOnly: true })).toEqual([
      {
        channel: "tab",
        ref: { event: 多還.id, entry: "m1" },
        date: "2026-10-12",
        debtor: 步,
        creditor: 寶,
        amount: 100,
        settled: 0,
        outstanding: 100,
      },
    ]);
    expect(book.total({ measure: "tab", person: 步 })).toBe(-100);
  });
});

describe("待收（進階：有人要還我）", () => {
  function 聚餐() {
    const k = kingdom();
    k.spend("2026-10-21", { payer: 步, account: 信用卡, amount: 2000, for: 步, items: [{ amount: 2000, receivable: 1500 }] });
    return k;
  }

  it("聚餐 2,000、4 人平分：步的我用的 500、我付的 2,000、待收 1,500", () => {
    const book = 聚餐().book();
    expect(book.total({ measure: "use", person: 步 })).toBe(500);
    expect(book.total({ measure: "paid", person: 步 })).toBe(2000);
    expect(book.total({ measure: "receivable", person: 步 })).toBe(1500);
  });

  it("朋友還 500：待收 1,000、那一項還欠 1,000；朋友還的不是收入", () => {
    const k = 聚餐();
    k.repay("2026-10-22", 500, 朋友, 人(步, 現金));
    const book = k.book();
    expect(book.total({ measure: "receivable", person: 步 })).toBe(1000);
    expect(每一筆(book, { channel: "receivable", person: 步 })).toEqual([["2026-10-21", 1500, 500, 1000]]);
    expect(book.total({ measure: "income", person: 步 })).toBe(0);
    expect(book.total({ measure: "balance", where: { account: 現金 } })).toBe(500);
  });

  it("恆等式成立（記的時候、朋友還了之後）", () => {
    const k = 聚餐();
    expect(恆等式(k.book(), 步)).toEqual({ 左邊: 1500, 右邊: 1500 });
    k.repay("2026-10-22", 500, 朋友, 人(步, 現金));
    expect(恆等式(k.book(), 步)).toEqual({ 左邊: 1500, 右邊: 1500 });
  });
});
