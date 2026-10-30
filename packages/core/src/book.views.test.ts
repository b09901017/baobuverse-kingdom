// 視角、篩選、合併的標籤、收件匣、看不到的帳戶、還了沒。

import { describe, expect, it } from "vitest";
import type { Dimension, Query, TagId } from "./index";
import { catalog, kingdom, 人, 冥想, 國泰, 固定花費, 小七, 小七舊, 寶, 寶媽, 寶媽卡, 寶的銀行, 押金, 日常, 步, 現金, 郵局 } from "./test-kit";

/** 寶十月的冥想：自己付（含固定花費、分期）、步寵寶、刷寶媽卡、步幫寶付要還 */
function 寶的冥想() {
  const k = kingdom();
  const 寶記 = { by: 寶 };
  k.spend("2026-10-01", { payer: 寶, account: 寶的銀行, amount: 1000, for: 寶, jar: 冥想, tags: [固定花費] }, 寶記);
  k.spend("2026-10-03", { payer: 步, account: 現金, amount: 500, for: 寶, jar: 冥想, noRepay: true });
  k.spend("2026-10-04", { payer: 寶, account: 寶媽卡, amount: 3000, for: 寶, jar: 冥想 }, 寶記);
  k.spend("2026-10-05", { payer: 寶, account: 寶的銀行, amount: 1200, for: 寶, jar: 冥想, items: [{ amount: 1200, months: 3 }] }, 寶記);
  k.spend("2026-10-06", { payer: 步, account: 郵局, amount: 800, for: 寶, jar: 冥想 });
  return k;
}

const 十月的冥想: Query = { measure: "use", person: 寶, to: "2026-10-31", where: { jar: 冥想 } };

describe("視角：同一個數字依某個面向拆開，加起來等於總數", () => {
  it("寶的冥想 5,700：要不要還拆成自己付 4,400、步寵寶（不用還）500、要還 800", () => {
    const book = 寶的冥想().book();
    expect(book.total(十月的冥想)).toBe(5700);
    expect(book.breakdown(十月的冥想, "repay")).toEqual([
      { key: "noRepay", amount: 500 },
      { key: "repay", amount: 800 },
      { key: "self", amount: 4400 },
    ]);
  });

  it("帳戶拆得出寶媽卡 3,000；誰出拆得出步 1,300", () => {
    const book = 寶的冥想().book();
    expect(book.breakdown(十月的冥想, "account")).toEqual(
      expect.arrayContaining([
        { key: 寶媽卡, amount: 3000 },
        { key: 寶的銀行, amount: 1400 },
      ]),
    );
    expect(book.breakdown(十月的冥想, "payer")).toEqual([
      { key: 寶, amount: 4400 },
      { key: 步, amount: 1300 },
    ]);
  });

  it("固定花費（標籤）拆成有 1,000、沒有 4,700；分期拆成 400、5,300", () => {
    const book = 寶的冥想().book();
    expect(book.breakdown(十月的冥想, { tag: 固定花費 })).toEqual([
      { key: "with", amount: 1000 },
      { key: "without", amount: 4700 },
    ]);
    expect(book.breakdown(十月的冥想, "amortized")).toEqual([
      { key: "no", amount: 5300 },
      { key: "yes", amount: 400 },
    ]);
  });

  it.each<Dimension>(["payer", "account", "repay", { tag: 固定花費 }, "amortized", "jar", "cause", "month", "person", "settled"])(
    "依 %j 拆開，加起來等於總數",
    (by) => {
      const book = 寶的冥想().book();
      const sum = book.breakdown(十月的冥想, by).reduce((s, b) => s + b.amount, 0);
      expect(sum).toBe(5700);
    },
  );
});

describe("篩選", () => {
  it("十月與十一月各一筆日常 100，查十月的日常 → 100", () => {
    const k = kingdom();
    k.spend("2026-10-15", { payer: 步, amount: 100, for: 步, jar: 日常 });
    k.spend("2026-11-15", { payer: 步, amount: 100, for: 步, jar: 日常 });
    const book = k.book();
    expect(book.total({ measure: "use", person: 步, from: "2026-10-01", to: "2026-10-31", where: { jar: 日常 } })).toBe(100);
    expect(book.total({ measure: "use", person: 步, where: { jar: 日常 } })).toBe(200);
  });

  it("看統計時排除押金（withoutTags）：押金 10,000 不算進去", () => {
    const k = kingdom();
    k.spend("2026-10-01", { payer: 步, amount: 10000, for: 步, tags: [押金] });
    k.spend("2026-10-02", { payer: 步, amount: 300, for: 步 });
    const book = k.book();
    expect(book.total({ measure: "use", person: 步 })).toBe(10300);
    expect(book.total({ measure: "use", person: 步, where: { withoutTags: [押金] } })).toBe(300);
  });

  it("依誰出、要不要還、分期、往來帳的另一個人篩", () => {
    const book = 寶的冥想().book();
    expect(book.total({ ...十月的冥想, where: { jar: 冥想, payer: 步 } })).toBe(1300);
    expect(book.total({ ...十月的冥想, where: { jar: 冥想, repay: "noRepay" } })).toBe(500);
    expect(book.total({ ...十月的冥想, where: { jar: 冥想, amortized: true } })).toBe(400);
    expect(book.total({ measure: "tab", person: 步, where: { counterpart: 寶 } })).toBe(800);
    expect(book.total({ measure: "tab", person: 步, where: { counterpart: 步 } })).toBe(0);
  });
});

describe("合併的標籤", () => {
  it("「7-11」併進「711」：查「711」兩個都算，lines 上的標籤是「711」", () => {
    const k = kingdom();
    k.spend("2026-10-01", { payer: 步, amount: 60, for: 步, tags: [小七舊] });
    k.spend("2026-10-02", { payer: 步, amount: 40, for: 步, tags: [小七] });
    const book = k.book();
    expect(book.total({ measure: "use", person: 步, where: { tags: [小七] } })).toBe(100);
    expect(book.total({ measure: "use", person: 步, where: { tags: [小七舊] } })).toBe(100);
    expect(book.lines({ measure: "use", person: 步 }).map((l) => l.tags)).toEqual([[小七], [小七]]);
    expect(book.breakdown({ measure: "use", person: 步 }, { tag: 小七舊 })).toEqual([{ key: "with", amount: 100 }]);
  });

  it("合併可以接好幾層；繞成圈的當成沒合併", () => {
    const a = "a" as TagId;
    const b = "b" as TagId;
    const c = "c" as TagId;
    const tags = [
      { id: a, name: "A", mergedInto: b },
      { id: b, name: "B", mergedInto: c },
      { id: c, name: "C" },
      { id: 小七, name: "711", mergedInto: 小七舊 },
      { id: 小七舊, name: "7-11", mergedInto: 小七 },
    ];
    const k = kingdom();
    k.spend("2026-10-01", { payer: 步, amount: 10, for: 步, tags: [a] });
    k.spend("2026-10-02", { payer: 步, amount: 20, for: 步, tags: [小七舊] });
    const book = k.book({ ...catalog, tags });
    expect(book.lines({ measure: "use" }).map((l) => l.tags)).toEqual([[c], [小七舊]]);
  });
});

describe("收件匣", () => {
  it("還沒確認的（pending）任何數字都不算、也不在 problems", () => {
    const k = kingdom();
    k.spend("2026-10-26", { payer: 步, account: 國泰, amount: 120, for: 步 }, { status: "pending" });
    k.spend("2026-10-26", { payer: 步, account: 國泰, amount: 999, for: 步, items: [{ amount: 1 }] }, { status: "pending" });
    const book = k.book();
    for (const measure of ["use", "paid", "balance", "netWorth", "tab"] as const) expect(book.total({ measure })).toBe(0);
    expect(book.problems).toEqual([]);
  });
});

describe("還了沒（別人先出的那幾行，看的是 to 那天）", () => {
  it("寶的冥想 3,000 刷寶媽卡、還 2,000 之後 → 已還 2,000、還欠 1,000", () => {
    const k = kingdom();
    k.spend("2026-10-04", { payer: 寶, account: 寶媽卡, amount: 3000, for: 寶, jar: 冥想 }, { by: 寶 });
    k.repay("2026-10-20", 2000, 人(寶, 寶的銀行), 寶媽(), undefined, { by: 寶 });
    const book = k.book();
    const 冥想罐: Query = { measure: "use", person: 寶, where: { jar: 冥想 } };
    expect(book.breakdown(冥想罐, "settled")).toEqual([
      { key: "outstanding", amount: 1000 },
      { key: "repaid", amount: 2000 },
    ]);
    expect(book.breakdown({ ...冥想罐, to: "2026-10-19" }, "settled")).toEqual([{ key: "outstanding", amount: 3000 }]);
    expect(book.total({ ...冥想罐, where: { jar: 冥想, settled: "repaid" } })).toBe(2000);
  });

  it("步幫寶付 800、寶還 300：寶的我用的拆成已還 300、還欠 500；自己付的是 none", () => {
    const k = kingdom();
    k.spend("2026-10-06", { payer: 步, amount: 800, for: 寶, jar: 冥想 });
    k.spend("2026-10-07", { payer: 寶, account: 寶的銀行, amount: 100, for: 寶, jar: 冥想 }, { by: 寶 });
    k.repay("2026-10-08", 300, 人(寶), 人(步));
    expect(k.book().breakdown({ measure: "use", person: 寶 }, "settled")).toEqual([
      { key: "none", amount: 100 },
      { key: "outstanding", amount: 500 },
      { key: "repaid", amount: 300 },
    ]);
  });

  it("寶的冥想：寶自己付、步寵寶、刷寶媽卡（還沒還）各一筆 → 不用還的、自己付的是 none，寶媽卡是還欠", () => {
    const book = 寶的冥想().book();
    expect(book.breakdown(十月的冥想, "settled")).toEqual([
      { key: "none", amount: 1900 },
      { key: "outstanding", amount: 3800 },
    ]);
  });
});
