// 04 的表：每一列一支測試，從步的角度看我付的、我用的、往來帳（寶欠步為正），再看「其他」那一欄；
// 最後每一列再驗一次恆等式。

import { describe, expect, it } from "vitest";
import type { Book, PersonId } from "./index";
import { kingdom, 人, 國泰, 寶, 步, 郵局 } from "./test-kit";
import { 恆等式 } from "./identity.test-kit";

const D = "2026-10-10";
type Kingdom = ReturnType<typeof kingdom>;

const 表: Record<string, (k: Kingdom) => void> = {
  "步幫自己付 5,000": (k) => k.spend(D, { payer: 步, amount: 5000, for: 步 }),
  "步幫寶付 3,000": (k) => k.spend(D, { payer: 步, amount: 3000, for: 寶 }),
  "寶幫步付 1,200": (k) => k.spend(D, { payer: 寶, amount: 1200, for: 步 }),
  "步幫共付 2,000（5:5）": (k) => k.spend(D, { payer: 步, amount: 2000, for: "共" }),
  "寶幫共付 2,000（5:5）": (k) => k.spend(D, { payer: 寶, amount: 2000, for: "共" }),
  "步寵寶 500（不用還）": (k) => k.spend(D, { payer: 步, amount: 500, for: 寶, noRepay: true }),
  "寶寵步 300（買東西）": (k) => k.spend(D, { payer: 寶, amount: 300, for: 步, noRepay: true }, { by: 寶 }),
  "寶直接給步 1,000 寵步": (k) =>
    k.spend(D, { payer: 寶, amount: 1000, for: 步, noRepay: true, items: [{ amount: 1000, cash: true }] }, { by: 寶 }),
  "寶還步 5,000": (k) => k.repay(D, 5000, 人(寶), 人(步, 郵局)),
  "郵局轉國泰 10,000": (k) => k.transfer(D, 郵局, 國泰, 10000),
};

function 記(情況: string): Book {
  const k = kingdom();
  const record = 表[情況];
  if (record === undefined) throw new Error(`表裡沒有：${情況}`);
  record(k);
  return k.book();
}

function 三個數字(book: Book, person: PersonId) {
  return {
    我付的: book.total({ measure: "paid", person }),
    我用的: book.total({ measure: "use", person }),
    往來帳: book.total({ measure: "tab", person }),
  };
}

describe("誰出、幫誰（預設要還）", () => {
  it("步幫自己付 5,000：我付的 5,000、我用的 5,000、往來帳 0", () => {
    expect(三個數字(記("步幫自己付 5,000"), 步)).toEqual({ 我付的: 5000, 我用的: 5000, 往來帳: 0 });
  });

  it("步幫寶付 3,000：步的我付的 3,000、我用的 0、往來帳 +3,000；寶的我用的 +3,000", () => {
    const book = 記("步幫寶付 3,000");
    expect(三個數字(book, 步)).toEqual({ 我付的: 3000, 我用的: 0, 往來帳: 3000 });
    expect(book.total({ measure: "use", person: 寶 })).toBe(3000);
  });

  it("寶幫步付 1,200：步的我付的 0、我用的 1,200、往來帳 −1,200", () => {
    expect(三個數字(記("寶幫步付 1,200"), 步)).toEqual({ 我付的: 0, 我用的: 1200, 往來帳: -1200 });
  });

  it("步幫共付 2,000（5:5）：步的我付的 2,000、我用的 1,000、往來帳 +1,000；寶的我用的 +1,000", () => {
    const book = 記("步幫共付 2,000（5:5）");
    expect(三個數字(book, 步)).toEqual({ 我付的: 2000, 我用的: 1000, 往來帳: 1000 });
    expect(book.total({ measure: "use", person: 寶 })).toBe(1000);
  });

  it("寶幫共付 2,000（5:5）：步的我付的 0、我用的 1,000、往來帳 −1,000", () => {
    expect(三個數字(記("寶幫共付 2,000（5:5）"), 步)).toEqual({ 我付的: 0, 我用的: 1000, 往來帳: -1000 });
  });
});

describe("寵對方、被寵（進階：不用還）", () => {
  it("步寵寶 500：步的我付的 500、我用的 0、往來帳 0；寶的我用的 +500；步的寵對方 500", () => {
    const book = 記("步寵寶 500（不用還）");
    expect(三個數字(book, 步)).toEqual({ 我付的: 500, 我用的: 0, 往來帳: 0 });
    expect(book.total({ measure: "use", person: 寶 })).toBe(500);
    expect(book.total({ measure: "spoilGiven", person: 步 })).toBe(500);
  });

  it("寶寵步 300（買東西）：步的我付的 0、我用的 300、往來帳 0；步的被寵 300", () => {
    const book = 記("寶寵步 300（買東西）");
    expect(三個數字(book, 步)).toEqual({ 我付的: 0, 我用的: 300, 往來帳: 0 });
    expect(book.total({ measure: "spoilReceived", person: 步, where: { cause: "spend" } })).toBe(300);
  });

  it("寶直接給步 1,000 寵步：步的三個數字都 0；步的收入 1,000、被寵 1,000", () => {
    const book = 記("寶直接給步 1,000 寵步");
    expect(三個數字(book, 步)).toEqual({ 我付的: 0, 我用的: 0, 往來帳: 0 });
    expect(book.total({ measure: "income", person: 步 })).toBe(1000);
    expect(book.total({ measure: "spoilReceived", person: 步, where: { cause: "giveMoney" } })).toBe(1000);
  });
});

describe("還款、轉帳：不是支出也不是收入", () => {
  it("寶還步 5,000：步的往來帳 −5,000，不是收入；步的帳戶 +5,000", () => {
    const book = 記("寶還步 5,000");
    expect(三個數字(book, 步)).toEqual({ 我付的: 0, 我用的: 0, 往來帳: -5000 });
    expect(book.total({ measure: "income", person: 步 })).toBe(0);
    expect(book.total({ measure: "balance", person: 步, where: { account: 郵局 } })).toBe(5000);
  });

  it("郵局轉國泰 10,000：兩個帳戶一減一加，淨資產不變", () => {
    const book = 記("郵局轉國泰 10,000");
    expect(三個數字(book, 步)).toEqual({ 我付的: 0, 我用的: 0, 往來帳: 0 });
    expect(book.total({ measure: "balance", person: 步, where: { account: 郵局 } })).toBe(-10000);
    expect(book.total({ measure: "balance", person: 步, where: { account: 國泰 } })).toBe(10000);
    expect(book.total({ measure: "netWorth", person: 步 })).toBe(0);
  });
});

describe("恆等式：我付的 − 我用的 ＝ 往來帳因支出的變化 ＋ 寵對方 − 被寵（買東西的）＋ 待收的增加 − 寶媽卡幫出", () => {
  it.each(Object.keys(表).flatMap((情況) => [[情況, "步"] as const, [情況, "寶"] as const]))("%s（%s的）", (情況, 誰) => {
    const { 左邊, 右邊 } = 恆等式(記(情況), 誰 === "步" ? 步 : 寶);
    expect(左邊).toBe(右邊);
  });
});
