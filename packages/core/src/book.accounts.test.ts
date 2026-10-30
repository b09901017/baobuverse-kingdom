// 帳戶：信用卡、轉帳、寶媽卡、投資、對帳。

import { describe, expect, it } from "vitest";
import type { EntryId } from "./index";
import { 恆等式 } from "./identity.test-kit";
import { expense, kingdom, 人, 信用卡, 冥想, 加密貨幣, 家樂福, 寶, 寶媽, 寶媽卡, 寶的catalog, 寶的銀行, 朋友, 步, 現金, 郵局, 國泰 } from "./test-kit";

describe("不灌水：轉帳、還款、對帳差額、投資都不進我用的、我付的", () => {
  it("一連串只有這幾種的事件之後，步和寶的我用的、我付的、收入都是 0", () => {
    const k = kingdom();
    k.reconcile("2026-10-01", 郵局, 50000);
    k.transfer("2026-10-02", 郵局, 國泰, 10000);
    k.transfer("2026-10-03", 郵局, 信用卡, 3000);
    k.transfer("2026-10-04", 郵局, 加密貨幣, 10000);
    k.transfer("2026-10-05", 寶的銀行, 加密貨幣, 4000, { by: 寶 });
    k.repay("2026-10-06", 1000, 人(寶, 寶的銀行), 人(步, 郵局));
    k.repay("2026-10-07", 2000, 人(寶, 寶的銀行), 寶媽(), undefined, { by: 寶 });
    k.repay("2026-10-08", 500, 朋友, 人(步, 現金));
    k.reconcile("2026-10-31", 郵局, 27000);
    const book = k.book();
    expect(book.total({ measure: "reconcileDiff", person: 步 })).toBe(-1000);
    for (const measure of ["use", "paid", "income", "spoilGiven", "spoilReceived"] as const) {
      expect(book.lines({ measure })).toEqual([]);
    }
  });
});

describe("收入：從外面進來、歸自己的錢", () => {
  it("薪水 30,000 進國泰：步的收入 30,000、國泰 +30,000、淨資產 +30,000；我用的、我付的、往來帳都 0", () => {
    const k = kingdom();
    k.income("2026-10-05", 步, 國泰, 30000);
    const book = k.book();
    expect(book.problems).toEqual([]);
    expect(book.total({ measure: "income", person: 步 })).toBe(30000);
    expect(book.total({ measure: "balance", where: { account: 國泰 } })).toBe(30000);
    expect(book.total({ measure: "netWorth", person: 步 })).toBe(30000);
    for (const measure of ["use", "paid", "tab"] as const) {
      expect(book.total({ measure, person: 步 })).toBe(0);
    }
    expect(book.total({ measure: "income", person: 寶 })).toBe(0);
  });

  it("家樂福的回饋 50 進錢包、標籤「家樂福」：收入篩得出家樂福；沒寫帳戶的收入只算收入、不動任何帳戶", () => {
    const k = kingdom();
    k.record("2026-10-06", [{ type: "money", kind: "income", id: "m1" as EntryId, person: 步, account: 現金, amount: 50, tags: [家樂福] }]);
    k.income("2026-10-07", 寶, undefined, 800, { by: 寶 });
    const book = k.book();
    expect(book.total({ measure: "income", person: 步, where: { tags: [家樂福] } })).toBe(50);
    expect(book.total({ measure: "balance", where: { account: 現金 } })).toBe(50);
    expect(book.total({ measure: "income", person: 寶 })).toBe(800);
    expect(book.lines({ measure: "balance", person: 寶 })).toEqual([]);
  });
});

describe("信用卡與轉帳", () => {
  it("刷信用卡 1,000：信用卡欠款 +1,000（餘額 −1,000），步的我付的 +1,000", () => {
    const k = kingdom();
    k.spend("2026-10-01", { payer: 步, account: 信用卡, amount: 1000, for: 步 });
    const book = k.book();
    expect(book.total({ measure: "balance", where: { account: 信用卡 } })).toBe(-1000);
    expect(book.total({ measure: "paid", person: 步 })).toBe(1000);
  });

  it("用銀行繳卡費 1,000 是轉帳：兩邊一減一加、淨資產不變、我付的與我用的不動", () => {
    const k = kingdom();
    k.spend("2026-10-01", { payer: 步, account: 信用卡, amount: 1000, for: 步 });
    const 刷卡之後 = k.book();
    k.transfer("2026-11-05", 郵局, 信用卡, 1000);
    const book = k.book();
    expect(book.total({ measure: "balance", where: { account: 信用卡 } })).toBe(0);
    expect(book.total({ measure: "balance", where: { account: 郵局 } })).toBe(-1000);
    expect(book.total({ measure: "netWorth", person: 步 })).toBe(刷卡之後.total({ measure: "netWorth", person: 步 }));
    expect(book.total({ measure: "paid", person: 步 })).toBe(1000);
    expect(book.total({ measure: "use", person: 步 })).toBe(1000);
  });

  it("跨行轉帳 1,000＋手續費 15 是同一則事件：只有 15 進我付的、我用的", () => {
    const k = kingdom();
    k.record("2026-10-16", [
      { type: "money", kind: "transfer", id: "m1" as EntryId, from: 郵局, to: 國泰, amount: 1000 },
      expense("m2", { payer: 步, account: 郵局, amount: 15, for: 步 }),
    ]);
    const book = k.book();
    expect(book.total({ measure: "paid", person: 步 })).toBe(15);
    expect(book.total({ measure: "use", person: 步 })).toBe(15);
    expect(book.total({ measure: "balance", where: { account: 郵局 } })).toBe(-1015);
    expect(book.total({ measure: "balance", where: { account: 國泰 } })).toBe(1000);
    expect(book.total({ measure: "use", person: 寶 })).toBe(0);
  });
});

describe("投資：共有的加密貨幣帳戶", () => {
  function 一起投資() {
    const k = kingdom();
    k.transfer("2026-10-23", 郵局, 加密貨幣, 10000);
    k.transfer("2026-10-24", 寶的銀行, 加密貨幣, 4000, { by: 寶 });
    return k;
  }

  it("步從郵局轉 10,000 進去：郵局 −10,000、步投入 10,000、不是支出、步的淨資產不變", () => {
    const book = 一起投資().book();
    expect(book.total({ measure: "balance", where: { account: 郵局 } })).toBe(-10000);
    expect(book.total({ measure: "balance", person: 步, where: { account: 加密貨幣 } })).toBe(10000);
    expect(book.total({ measure: "paid", person: 步 })).toBe(0);
    expect(book.total({ measure: "use", person: 步 })).toBe(0);
    expect(book.total({ measure: "netWorth", person: 步 })).toBe(0);
  });

  it("各自投入多少分得出來：寶 4,000、加起來 14,000；拿出來 3,000 就少 3,000", () => {
    const k = 一起投資();
    k.transfer("2026-11-01", 加密貨幣, 郵局, 3000);
    const book = k.book();
    expect(book.total({ measure: "balance", person: 寶, where: { account: 加密貨幣 } })).toBe(4000);
    expect(book.total({ measure: "balance", person: 步, where: { account: 加密貨幣 } })).toBe(7000);
    expect(book.total({ measure: "balance", where: { account: 加密貨幣 } })).toBe(11000);
  });

  it("寶的帳本（看不到步的郵局）也算得出步投入 10,000", () => {
    const book = 一起投資().book(寶的catalog);
    expect(book.total({ measure: "balance", person: 步, where: { account: 加密貨幣 } })).toBe(10000);
    expect(book.total({ measure: "balance", person: 寶, where: { account: 加密貨幣 } })).toBe(4000);
    expect(book.problems).toEqual([]);
  });
});

describe("對帳", () => {
  it("第一次對帳就是初始餘額：餘額等於實際、對帳差額 0（種類是 opening）", () => {
    const k = kingdom();
    k.reconcile("2026-10-01", 現金, 1500);
    const book = k.book();
    expect(book.total({ measure: "balance", where: { account: 現金 } })).toBe(1500);
    expect(book.total({ measure: "reconcileDiff", person: 步 })).toBe(0);
    expect(book.total({ measure: "balance", where: { account: 現金, cause: "opening" } })).toBe(1500);
  });

  it("實際 1,050、算出 1,200：對帳差額 −150，不算支出也不算收入；之後的餘額是 1,050", () => {
    const k = kingdom();
    k.reconcile("2026-10-01", 現金, 1500);
    k.spend("2026-10-05", { payer: 步, account: 現金, amount: 300, for: 步 });
    k.reconcile("2026-10-24", 現金, 1050);
    const book = k.book();
    expect(book.total({ measure: "reconcileDiff", person: 步 })).toBe(-150);
    expect(book.total({ measure: "balance", where: { account: 現金 } })).toBe(1050);
    expect(book.total({ measure: "paid", person: 步 })).toBe(300);
    expect(book.total({ measure: "use", person: 步 })).toBe(300);
    expect(book.total({ measure: "income", person: 步 })).toBe(0);
  });

  it("在對帳之前補記一筆 100：差額跟著變成 −50，對帳之後的餘額還是 1,050", () => {
    const k = kingdom();
    k.reconcile("2026-10-01", 現金, 1500);
    k.spend("2026-10-05", { payer: 步, account: 現金, amount: 300, for: 步 });
    k.reconcile("2026-10-24", 現金, 1050);
    k.spend("2026-10-20", { payer: 步, account: 現金, amount: 100, for: 步 });
    const book = k.book();
    expect(book.total({ measure: "reconcileDiff", person: 步 })).toBe(-50);
    expect(book.total({ measure: "balance", where: { account: 現金 } })).toBe(1050);
  });
});

describe("寶媽卡（寶的角度）", () => {
  function 刷寶媽卡() {
    const k = kingdom();
    k.spend("2026-10-01", { payer: 寶, account: 寶媽卡, amount: 3000, for: 寶, jar: 冥想 }, { by: 寶 });
    return k;
  }

  it("刷 3,000 冥想：寶的冥想罐（我用的）3,000、寶的我付的 0、寶媽卡還欠 +3,000、寶的淨資產不動", () => {
    const book = 刷寶媽卡().book();
    expect(book.total({ measure: "use", person: 寶, where: { jar: 冥想 } })).toBe(3000);
    expect(book.total({ measure: "paid", person: 寶 })).toBe(0);
    expect(book.total({ measure: "balance", where: { account: 寶媽卡 } })).toBe(-3000);
    expect(book.total({ measure: "netWorth", person: 寶 })).toBe(0);
  });

  it("寶還寶媽 2,000 是還款：寶的銀行 −2,000、寶媽卡還欠 1,000、不算支出也不算收入、寶的淨資產 −2,000", () => {
    const k = 刷寶媽卡();
    k.repay("2026-10-20", 2000, 人(寶, 寶的銀行), 寶媽(), undefined, { by: 寶 });
    const book = k.book();
    expect(book.total({ measure: "balance", where: { account: 寶的銀行 } })).toBe(-2000);
    expect(book.total({ measure: "balance", where: { account: 寶媽卡 } })).toBe(-1000);
    expect(book.total({ measure: "paid", person: 寶 })).toBe(0);
    expect(book.total({ measure: "use", person: 寶 })).toBe(3000);
    expect(book.total({ measure: "income", person: 寶 })).toBe(0);
    expect(book.total({ measure: "netWorth", person: 寶 })).toBe(-2000);
  });

  it("恆等式成立（刷的時候、還了之後）", () => {
    const k = 刷寶媽卡();
    expect(恆等式(k.book(), 寶)).toEqual({ 左邊: -3000, 右邊: -3000 });
    k.repay("2026-10-20", 2000, 人(寶, 寶的銀行), 寶媽(), undefined, { by: 寶 });
    expect(恆等式(k.book(), 寶)).toEqual({ 左邊: -3000, 右邊: -3000 });
  });
});
