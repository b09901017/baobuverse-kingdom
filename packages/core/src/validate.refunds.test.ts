// 退款的查法與約束（stage-1 issue 02）：註記查得到、改刪不會讓退款失效、存得進去的帳本一定算。

import { describe, expect, it } from "vitest";
import type { EntryId, Event, Expense, Item, ItemId, ItemRef, ProblemCode } from "./index";
import { blockersOfDelete, openBook, refundsOf, validateEvent } from "./index";
import { catalog, itemOf, kingdom, 加密貨幣, 吃吃, 家樂福, 寶, 寶媽卡, 寶的銀行, 步, 玩玩, 現金, 郵局 } from "./test-kit";

const D = "2026-10-20";
const 一般 = { payer: 步, account: 現金, amount: 1000, for: 步 } as const;

type K = ReturnType<typeof kingdom>;

/** 檢查這則事件（這則事件的舊版留在 k.events 裡，跟 app 存的時候一樣） */
const check = (k: K, e: Event): readonly ProblemCode[] => validateEvent(e, catalog, k.events).map((p) => p.code);

/** 存得進去的，帳本就要算得到：把新版換進去，帳本的 problems 要是空的 */
const 帳本沒問題 = (k: K, e: Event) => openBook(catalog, [...k.events.filter((x) => x.id !== e.id), e]).problems;

const 退款 = (id: string, target: ItemRef, amount: number): Event["effects"][number] => ({
  type: "money",
  kind: "refund",
  id: id as EntryId,
  target,
  amount,
});

describe("存退款：要在原本那筆之後（不然帳本找不到）", () => {
  it("原本那筆 14:00，同一天的退款沒寫時間：擋（沒寫時間的排前面）", () => {
    const k = kingdom();
    const e = k.spend(D, 一般, { time: "14:00" });
    const r = k.refund(D, itemOf(e), 100);
    expect(check(k, r)).toEqual(["refund-target"]);
    // 被擋的理由是真的：存進去的話帳本不算
    expect(k.book().problems).toMatchObject([{ event: r.id, code: "refund-target" }]);
  });

  it("原本那筆 14:00，同一天的退款 13:00：擋；15:00：可以，帳本算得到", () => {
    const k = kingdom();
    const e = k.spend(D, 一般, { time: "14:00" });
    expect(check(k, k.refund(D, itemOf(e), 100, undefined, { time: "13:00" }))).toEqual(["refund-target"]);
    const k2 = kingdom();
    const e2 = k2.spend(D, 一般, { time: "14:00" });
    const r2 = k2.refund(D, itemOf(e2), 100, undefined, { time: "15:00" });
    expect(check(k2, r2)).toEqual([]);
    expect(帳本沒問題(k2, r2)).toEqual([]);
  });

  it("都沒寫時間、同一天：看記下來的先後，先記原本那筆就可以", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    const r = k.refund(D, itemOf(e), 100);
    expect(check(k, r)).toEqual([]);
    expect(帳本沒問題(k, r)).toEqual([]);
  });

  it("退款日期比原本那筆早：擋", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    expect(check(k, k.refund("2026-10-19", itemOf(e), 100))).toEqual(["refund-target"]);
  });

  it("改一筆退款，把日期改到原本那筆之前：擋", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    const r = k.refund("2026-10-25", itemOf(e), 100);
    expect(check(k, r)).toEqual([]);
    expect(check(k, { ...r, date: "2026-10-19" })).toEqual(["refund-target"]);
  });

  it("退款指到自己這一則裡的品項：擋（帳本先看退款、還沒算到那一項）", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    const 同一則 = { ...e, effects: [...e.effects, 退款("m2", itemOf(e), 100)] };
    expect(check(k, 同一則)).toEqual(["refund-target"]);
    expect(帳本沒問題(k, 同一則)).toMatchObject([{ code: "refund-target" }]);
    // 順便把日期改晚：舊版排在新版前面，但帳本裡只有新版，一樣找不到
    const 改晚 = { ...同一則, date: "2026-10-25" };
    expect(check(k, 改晚)).toEqual(["refund-target"]);
    expect(帳本沒問題(k, 改晚)).toMatchObject([{ code: "refund-target" }]);
  });

  it("直接給錢的那一項不能退（原本的檢查還在）", () => {
    const k = kingdom();
    const e = k.spend(D, { payer: 步, account: 現金, amount: 500, for: 寶, noRepay: true, items: [{ amount: 500, cash: true }] });
    expect(check(k, k.refund("2026-10-25", itemOf(e), 100))).toEqual(["refund-target"]);
  });
});

describe("存退款：退回的帳戶要是原本那筆誰出的人的", () => {
  it("步付的那筆，退到寶的帳戶：擋（不然步的淨資產少、寶的多）", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    expect(check(k, k.refund("2026-10-25", itemOf(e), 100, 寶的銀行))).toEqual(["refund-account"]);
  });

  it("步付的那筆，退到步的另一個帳戶：可以；沒寫帳戶（退回原本的）也可以", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    const 另一個 = k.refund("2026-10-25", itemOf(e), 100, 郵局);
    expect(check(k, 另一個)).toEqual([]);
    expect(帳本沒問題(k, 另一個)).toEqual([]);
    expect(check(k, k.refund("2026-10-25", itemOf(e), 100))).toEqual([]);
  });

  it("寶付的那筆（步記的、帳戶空著）：退到寶的帳戶可以、退到步的帳戶擋", () => {
    const k = kingdom();
    const e = k.spend(D, { payer: 寶, amount: 500, for: 寶 });
    expect(check(k, k.refund("2026-10-25", itemOf(e), 100, 寶的銀行))).toEqual([]);
    expect(check(k, k.refund("2026-10-25", itemOf(e), 100, 現金))).toEqual(["refund-account"]);
  });

  it("投資帳戶不能收退款（進出都是轉帳）", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    expect(check(k, k.refund("2026-10-25", itemOf(e), 100, 加密貨幣))).toEqual(["refund-account"]);
  });

  it("寶媽卡：刷它的那筆可以退回它、也可以退到寶自己的帳戶；別筆不能退進它（還它是還款）", () => {
    const k = kingdom();
    const 刷寶媽卡 = k.spend(D, { payer: 寶, account: 寶媽卡, amount: 3000, for: 寶 }, { by: 寶 });
    const 寶自己刷 = k.spend(D, { payer: 寶, account: 寶的銀行, amount: 500, for: 寶 }, { by: 寶 });
    expect(check(k, k.refund("2026-10-25", itemOf(刷寶媽卡), 100, 寶媽卡, { by: 寶 }))).toEqual([]);
    expect(check(k, k.refund("2026-10-25", itemOf(刷寶媽卡), 100, 寶的銀行, { by: 寶 }))).toEqual([]);
    expect(check(k, k.refund("2026-10-25", itemOf(寶自己刷), 100, 寶媽卡, { by: 寶 }))).toEqual(["refund-account"]);
  });
});

describe("存退款：不能退超過還沒退的", () => {
  it("同一則裡 60＋60，那項只剩 100 可退：擋；60＋40：可以，帳本算得到", () => {
    const k = kingdom();
    const e = k.spend(D, { ...一般, amount: 200 });
    k.refund("2026-10-21", itemOf(e), 100);
    const 太多 = k.record("2026-10-25", [退款("m1", itemOf(e), 60), 退款("m2", itemOf(e), 60)]);
    expect(check(k, 太多)).toEqual(["refund-too-big"]);
    expect(帳本沒問題(k, 太多)).toMatchObject([{ code: "refund-too-big" }]);

    const k2 = kingdom();
    const e2 = k2.spend(D, { ...一般, amount: 200 });
    k2.refund("2026-10-21", itemOf(e2), 100);
    const 剛好 = k2.record("2026-10-25", [退款("m1", itemOf(e2), 60), 退款("m2", itemOf(e2), 40)]);
    expect(check(k2, 剛好)).toEqual([]);
    expect(帳本沒問題(k2, 剛好)).toEqual([]);
  });

  it("同一則裡退不同項：分開算", () => {
    const k = kingdom();
    const e = k.spend(D, { ...一般, amount: 200, items: [{ amount: 100 }, { amount: 100 }] });
    const r = k.record("2026-10-25", [退款("m1", itemOf(e, 0), 100), 退款("m2", itemOf(e, 1), 100)]);
    expect(check(k, r)).toEqual([]);
  });

  it("改一筆退款的金額：不會把自己算進去", () => {
    const k = kingdom();
    const e = k.spend(D, { ...一般, amount: 100 });
    const r = k.refund("2026-10-25", itemOf(e), 60);
    const 改成 = (amount: number): Event => ({ ...r, effects: [退款("m1", itemOf(e), amount)] });
    expect(check(k, 改成(100))).toEqual([]);
    expect(check(k, 改成(101))).toEqual(["refund-too-big"]);
  });

  it("收件匣裡的退款不佔額度", () => {
    const k = kingdom();
    const e = k.spend(D, { ...一般, amount: 100 });
    k.refund("2026-10-25", itemOf(e), 100, undefined, { status: "pending" });
    expect(check(k, k.refund("2026-10-26", itemOf(e), 100))).toEqual([]);
  });
});

/** 這則事件的支出 */
const 支出之 = (e: Event): Expense => {
  const m = e.effects.find((x) => x.kind === "expense");
  if (m === undefined || m.kind !== "expense") throw new Error(`${e.id} 沒有支出`);
  return m;
};
/** 改過的新版：ID、記的人、記的時間都留著（跟 app 改一筆一樣） */
const 改 = (e: Event, 支出: Partial<Expense>, 事件: Partial<Event> = {}): Event => ({ ...e, ...事件, effects: [{ ...支出之(e), ...支出 }] });
const 改金額 = (e: Event, amount: number): Event => {
  const [first] = 支出之(e).items;
  if (first === undefined) throw new Error("沒有品項");
  return 改(e, { amount, items: [{ ...first, amount }] });
};

describe("改原本那筆：已退的部分不能失效", () => {
  /** 10/20 付 1,000，10/25 退 300 */
  function 已退300() {
    const k = kingdom();
    const e = k.spend(D, 一般);
    const r = k.refund("2026-10-25", itemOf(e), 300);
    return { k, e, r };
  }

  it("原本那筆 1,000 已退 300：改成 200 擋、改成 300 可以", () => {
    const { k, e } = 已退300();
    expect(check(k, 改金額(e, 200))).toEqual(["refunded-item-changed"]);
    expect(check(k, 改金額(e, 300))).toEqual([]);
    expect(帳本沒問題(k, 改金額(e, 300))).toEqual([]);
  });

  it("被擋的理由是真的：真的存進去，帳本就把退款整則丟掉", () => {
    const { k, e } = 已退300();
    expect(帳本沒問題(k, 改金額(e, 200))).toMatchObject([{ code: "refund-too-big" }]);
  });

  it("問題指得到是哪一項", () => {
    const { k, e } = 已退300();
    expect(validateEvent(改金額(e, 200), catalog, k.events)).toEqual([{ event: e.id, code: "refunded-item-changed", entry: "m1", item: "i1" }]);
  });

  it("好幾筆退款加起來算：退 300＋200，改成 400 擋、改成 500 可以", () => {
    const { k, e } = 已退300();
    k.refund("2026-10-26", itemOf(e), 200);
    expect(check(k, 改金額(e, 400))).toEqual(["refunded-item-changed"]);
    expect(check(k, 改金額(e, 500))).toEqual([]);
  });

  it("原本那筆 10/20、10/25 退款：改成 10/26 擋；改成 10/25 也擋（退款沒寫時間，排在前面）", () => {
    const { k, e } = 已退300();
    expect(check(k, 改(e, {}, { date: "2026-10-26" }))).toEqual(["refunded-item-changed"]);
    expect(check(k, 改(e, {}, { date: "2026-10-25", time: "08:00" }))).toEqual(["refunded-item-changed"]);
    expect(帳本沒問題(k, 改(e, {}, { date: "2026-10-26" }))).toMatchObject([{ code: "refund-target" }]);
  });

  it("退款 10/25 12:00：原本那筆改成同一天 13:00 擋、同一天 11:00 可以、10/24 可以", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    k.refund("2026-10-25", itemOf(e), 300, undefined, { time: "12:00" });
    expect(check(k, 改(e, {}, { date: "2026-10-25", time: "13:00" }))).toEqual(["refunded-item-changed"]);
    const 同一天早 = 改(e, {}, { date: "2026-10-25", time: "11:00" });
    expect(check(k, 同一天早)).toEqual([]);
    expect(帳本沒問題(k, 同一天早)).toEqual([]);
    expect(check(k, 改(e, {}, { date: "2026-10-24" }))).toEqual([]);
  });

  it("把已退的品項換成新 ID（等於拿掉）：擋；沒被退的品項可以拿掉", () => {
    const k = kingdom();
    const e = k.spend(D, { ...一般, items: [{ amount: 600 }, { amount: 400 }] });
    k.refund("2026-10-25", itemOf(e, 0), 300);
    const [i1, i2] = 支出之(e).items as [Item, Item];
    expect(check(k, 改(e, { items: [{ ...i1, id: "new" as ItemId }, i2] }))).toEqual(["refunded-item-changed"]);
    const 拿掉i1 = 改(e, { amount: 400, items: [i2] });
    expect(check(k, 拿掉i1)).toEqual(["refunded-item-changed"]);
    expect(帳本沒問題(k, 拿掉i1)).toMatchObject([{ code: "refund-target" }]);
    const 拿掉i2 = 改(e, { amount: 600, items: [i1] });
    expect(check(k, 拿掉i2)).toEqual([]);
    expect(帳本沒問題(k, 拿掉i2)).toEqual([]);
  });

  it("把那一筆的 ID 換掉：擋", () => {
    const { k, e } = 已退300();
    const 換ID: Event = { ...e, effects: [{ ...支出之(e), id: "m9" as EntryId }] };
    expect(check(k, 換ID)).toEqual(["refunded-item-changed"]);
  });

  it("把被退的那一項改成直接給錢：擋（帳本不收這種退款）", () => {
    const k = kingdom();
    const e = k.spend(D, { payer: 步, account: 現金, amount: 500, for: 寶, noRepay: true });
    k.refund("2026-10-25", itemOf(e), 100);
    const [i1] = 支出之(e).items as [Item];
    expect(check(k, 改(e, { items: [{ ...i1, cash: {} }] }))).toEqual(["refunded-item-changed"]);
  });

  it("把有退款的那筆改回收件匣（pending）：擋（帳本只找已確認的）", () => {
    const { k, e } = 已退300();
    expect(check(k, 改(e, {}, { status: "pending" }))).toEqual(["refunded-item-changed"]);
  });

  it("誰出步改成寶、幫步改成幫共：擋（退款文件的參與者是存退款時算的）", () => {
    const { k, e } = 已退300();
    expect(check(k, 改(e, { payer: 寶, account: 寶的銀行 }))).toEqual(["refunded-item-changed"]);
    expect(check(k, 改(e, { beneficiary: { kind: "shared" } }))).toEqual(["refunded-item-changed"]);
    expect(check(k, 改(e, { beneficiary: { kind: "person", person: 寶 } }))).toEqual(["refunded-item-changed"]);
  });

  it("品項自己的幫誰也算；比例改了也算", () => {
    const k = kingdom();
    const e = k.spend(D, { ...一般, for: [{ person: 步, weight: 6 }, { person: 寶, weight: 4 }] });
    k.refund("2026-10-25", itemOf(e), 100);
    const [i1] = 支出之(e).items as [Item];
    expect(check(k, 改(e, { items: [{ ...i1, beneficiary: { kind: "person", person: 寶 } }] }))).toEqual(["refunded-item-changed"]);
    expect(check(k, 改(e, { beneficiary: { kind: "shared" } }))).toEqual(["refunded-item-changed"]);
    expect(check(k, 改(e, { beneficiary: { kind: "shared", weights: [{ person: 步, weight: 5 }, { person: 寶, weight: 5 }] } }))).toEqual(["refunded-item-changed"]);
  });

  it("實際幫的人沒變就不算改：品項寫明幫步、整筆也是幫步；比例順序不同；從 Firestore 讀回來欄位順序不同", () => {
    const { k, e } = 已退300();
    const [i1] = 支出之(e).items as [Item];
    expect(check(k, 改(e, { items: [{ ...i1, beneficiary: { kind: "person", person: 步 } }] }))).toEqual([]);
    expect(check(k, 改(e, { beneficiary: { person: 步, kind: "person" } }))).toEqual([]);

    const k2 = kingdom();
    const e2 = k2.spend(D, { ...一般, for: [{ person: 步, weight: 6 }, { person: 寶, weight: 4 }] });
    k2.refund("2026-10-25", itemOf(e2), 100);
    expect(check(k2, 改(e2, { beneficiary: { kind: "shared", weights: [{ person: 寶, weight: 4 }, { person: 步, weight: 6 }] } }))).toEqual([]);
  });

  it("改名稱、罐子、標籤、帳戶（誰出那個人的另一個）、備註：可以", () => {
    const { k, e } = 已退300();
    const [i1] = 支出之(e).items as [Item];
    const 改過 = 改(e, { account: 郵局, tags: [家樂福], items: [{ ...i1, name: "新名字", jar: 玩玩, tags: [吃吃] }] }, { title: "新名字", note: "備註" });
    expect(check(k, 改過)).toEqual([]);
    expect(帳本沒問題(k, 改過)).toEqual([]);
  });

  it("明寫退回寶媽卡的那筆，原本那筆改成別的帳戶：擋（寶媽卡只能退回刷它的那筆，不然餘額多出來、還欠的沒變）", () => {
    const k = kingdom();
    const e = k.spend(D, { payer: 寶, account: 寶媽卡, amount: 1000, for: 寶 }, { by: 寶 });
    k.refund("2026-10-25", itemOf(e), 300, 寶媽卡, { by: 寶 });
    expect(check(k, 改(e, { account: 寶的銀行 }))).toEqual(["refunded-item-changed"]);
    expect(check(k, 改(e, { tags: [家樂福] }))).toEqual([]);
  });

  it("明寫退到自己另一個帳戶的那筆，原本那筆改帳戶：可以（錢就是進那個帳戶）", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    k.refund("2026-10-25", itemOf(e), 300, 郵局);
    expect(check(k, 改(e, { account: 郵局 }))).toEqual([]);
  });

  it("沒有退款的那筆：想怎麼改都可以（只看一般的檢查）", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    expect(check(k, 改金額(e, 1))).toEqual([]);
    expect(check(k, 改(e, { payer: 寶, account: 寶的銀行, beneficiary: { kind: "shared" } }, { date: "2030-01-01" }))).toEqual([]);
  });

  it("只有收件匣裡的退款：不擋", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    k.refund("2026-10-25", itemOf(e), 300, undefined, { status: "pending" });
    expect(check(k, 改金額(e, 200))).toEqual([]);
  });

  it("沒給 events 就不檢查這些（跟以前一樣）", () => {
    const { e } = 已退300();
    expect(validateEvent(改金額(e, 200), catalog)).toEqual([]);
  });
});

describe("帳本讀的時候：新檢查不影響已經存進去的舊資料", () => {
  it("步付的那筆退到寶的帳戶（01 之前存得進去的）：帳本照算，不進 problems", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    k.refund("2026-10-25", itemOf(e), 300, 寶的銀行);
    const book = k.book();
    expect(book.problems).toEqual([]);
    expect(book.total({ measure: "use", person: 步 })).toBe(700);
    expect(book.total({ measure: "balance", where: { account: 寶的銀行 } })).toBe(300);
  });

  it("退到投資帳戶、別筆的寶媽卡（舊資料）：帳本照算，不進 problems", () => {
    const k = kingdom();
    const e = k.spend(D, { payer: 寶, account: 寶的銀行, amount: 1000, for: 寶 });
    k.refund("2026-10-25", itemOf(e), 100, 加密貨幣);
    k.refund("2026-10-26", itemOf(e), 100, 寶媽卡);
    const book = k.book();
    expect(book.problems).toEqual([]);
    expect(book.total({ measure: "use", person: 寶 })).toBe(800);
  });

  it("誰出、幫誰被改過的舊資料（退款已經存在）：帳本照算", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    k.refund("2026-10-25", itemOf(e), 300);
    const 舊資料 = k.events.map((x) => (x.id === e.id ? 改(e, { beneficiary: { kind: "shared" } }) : x));
    const book = openBook(catalog, 舊資料);
    expect(book.problems).toEqual([]);
    expect(book.total({ measure: "use" })).toBe(700);
  });
});

describe("refundsOf：一項被退了哪幾筆（註記用）", () => {
  it("還沒退：空的", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    expect(refundsOf(k.events, itemOf(e))).toEqual([]);
  });

  it("回傳每一筆的事件 ID、日期、金額，照時間排；加起來就是已退多少", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    const 後來的 = k.refund("2026-10-25", itemOf(e), 300);
    const 早的 = k.refund("2026-10-22", itemOf(e), 100);
    expect(refundsOf(k.events, itemOf(e))).toEqual([
      { event: 早的.id, entry: "m1", date: "2026-10-22", amount: 100 },
      { event: 後來的.id, entry: "m1", date: "2026-10-25", amount: 300 },
    ]);
  });

  it("有寫時間的話也帶出來", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    const r = k.refund("2026-10-25", itemOf(e), 300, undefined, { time: "09:30" });
    expect(refundsOf(k.events, itemOf(e))).toEqual([{ event: r.id, entry: "m1", date: "2026-10-25", time: "09:30", amount: 300 }]);
  });

  it("收件匣裡的（pending）、別項的、別則的都不算", () => {
    const k = kingdom();
    const e = k.spend(D, { ...一般, items: [{ amount: 600 }, { amount: 400 }] });
    const 別則 = k.spend(D, 一般);
    k.refund("2026-10-25", itemOf(e, 0), 50, undefined, { status: "pending" });
    k.refund("2026-10-25", itemOf(e, 1), 60);
    k.refund("2026-10-25", itemOf(別則), 70);
    const r = k.refund("2026-10-25", itemOf(e, 0), 80);
    expect(refundsOf(k.events, itemOf(e, 0))).toEqual([{ event: r.id, entry: "m1", date: "2026-10-25", amount: 80 }]);
  });

  it("同一則事件裡好幾筆退款指到同一項：一筆一列", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    const refund = (id: string, amount: number) => ({ type: "money", kind: "refund", id, target: itemOf(e), amount }) as Event["effects"][number];
    const r = k.record("2026-10-25", [refund("m1", 60), refund("m2", 40)]);
    expect(refundsOf(k.events, itemOf(e)).map((x) => [x.event, x.amount])).toEqual([
      [r.id, 60],
      [r.id, 40],
    ]);
  });

  it("指到不存在的品項：空的", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    k.refund("2026-10-25", itemOf(e), 300);
    expect(refundsOf(k.events, { ...itemOf(e), item: "nope" as ItemId })).toEqual([]);
  });
});

describe("blockersOfDelete：這則能不能刪", () => {
  it("沒有退款：可以刪", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    expect(blockersOfDelete(e.id, k.events)).toEqual([]);
  });

  it("有退款的那則：回傳擋著的退款（每一項的都算）；退款先刪掉之後就可以", () => {
    const k = kingdom();
    const e = k.spend(D, { ...一般, items: [{ amount: 600 }, { amount: 400 }] });
    const r1 = k.refund("2026-10-25", itemOf(e, 0), 100);
    const r2 = k.refund("2026-10-26", itemOf(e, 1), 100);
    expect(blockersOfDelete(e.id, k.events).map((x) => x.event)).toEqual([r1.id, r2.id]);
    const 刪掉退款之後 = k.events.filter((x) => x.id !== r1.id && x.id !== r2.id);
    expect(blockersOfDelete(e.id, 刪掉退款之後)).toEqual([]);
  });

  it("退款自己可以刪；收件匣裡的退款不擋", () => {
    const k = kingdom();
    const e = k.spend(D, 一般);
    const r = k.refund("2026-10-25", itemOf(e), 100);
    expect(blockersOfDelete(r.id, k.events)).toEqual([]);
    const k2 = kingdom();
    const e2 = k2.spend(D, 一般);
    k2.refund("2026-10-25", itemOf(e2), 100, undefined, { status: "pending" });
    expect(blockersOfDelete(e2.id, k2.events)).toEqual([]);
  });
});
