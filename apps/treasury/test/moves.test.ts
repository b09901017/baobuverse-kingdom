// 轉帳、對帳、退款的純函式（issue 06）：表單 → 事件、選單，以及存進帳本之後數字對不對。不用模擬器。資料都是假的。

import { openBook, validateEvent, type Account, type AccountId, type Catalog, type EntryId, type Event, type EventId, type Expense, type ItemId, type JarId, type PersonId, type Refund, type TagId } from "@baobu/core";
import { describe, expect, it } from "vitest";
import { reconcileNote } from "../src/accounts";
import { flowDays } from "../src/flow";
import { DAILY_JAR } from "../src/presets";
import {
  actualOf,
  buildReconciliation,
  checkReconcileForm,
  defaultReconcile,
  diffRows,
  reconcileFormOf,
  reconcilePreview,
  type ReconcileForm,
} from "../src/reconcile";
import { buildExpense, buildIncome, formOf, type RecordForm } from "../src/record";
import {
  buildRefund,
  checkRefundForm,
  defaultRefund,
  refundAccountOptions,
  refundFormOf,
  refundNote,
  refundTargetAt,
  refundTargetOf,
  refundable,
  type RefundForm,
} from "../src/refund";
import {
  buildTransfer,
  checkTransferForm,
  defaultTransfer,
  sourceOptions,
  targetOptions,
  transferFormOf,
  transferGroups,
  withSource,
  type TransferForm,
} from "../src/transfer";

const 步 = "bu" as PersonId;
const 寶 = "bao" as PersonId;
const people = [
  { id: 步, name: "步" },
  { id: 寶, name: "寶" },
];
const account = (id: string, kind: Account["kind"], owners: readonly PersonId[] = [步], extra: Partial<Account> = {}): Account => ({
  id: id as AccountId,
  name: id,
  kind,
  owners,
  currency: "TWD",
  ...extra,
});
const 假錢包 = account("假錢包", "cash");
const 假銀行 = account("假銀行", "bank");
const 假儲值卡 = account("假儲值卡", "stored-value");
const 假信用卡 = account("假信用卡", "credit-card");
const 舊銀行 = account("舊銀行", "bank", [步], { archived: true });
const 假投資 = account("假投資", "investment");
const 共有投資 = account("共有投資", "investment", [步, 寶]);
const 寶的錢包 = account("寶的錢包", "cash", [寶]);
const 寶的銀行 = account("寶的銀行", "bank", [寶]);
const 寶的信用卡 = account("寶的信用卡", "credit-card", [寶]);
const 假媽媽卡 = account("假媽媽卡", "credit-card", [寶], { paidByOthers: true });
const 假吃吃 = "假吃吃" as TagId;
const catalog: Catalog = {
  people,
  accounts: [假錢包, 假銀行, 假儲值卡, 假信用卡, 舊銀行, 假投資, 共有投資, 寶的錢包, 寶的銀行, 寶的信用卡, 假媽媽卡],
  jars: [{ id: DAILY_JAR as JarId, name: "日常", owners: [步, 寶] }],
  tags: [{ id: 假吃吃, name: "假吃吃" }],
};
const ids = (list: readonly { readonly id: string }[]) => list.map((x) => x.id);
const book = (events: readonly Event[]) => openBook(catalog, events);
const worth = (events: readonly Event[], person: PersonId = 步) => book(events).total({ measure: "netWorth", person });
const balance = (events: readonly Event[], a: Account) => book(events).total({ measure: "balance", where: { account: a.id } });
const flat = (events: readonly Event[], measure: "use" | "paid" | "income", person: PersonId = 步) => book(events).total({ measure, person });

/** 從假錢包算起的初始餘額：讓轉帳有錢可以轉（寫得一看就是假的） */
const opening = (a: Account, actual: number, id = `開-${a.id}`, date = "2026-01-01"): Event =>
  buildReconciliation({ ...defaultReconcile(a.id, new Date("2026-01-01T00:00:00")), actual: String(Math.abs(actual)), date, time: "" }, a, { id: id as EventId, me: 步, now: 1 });

const expense = (f: Partial<RecordForm> = {}, id = "支"): Event =>
  buildExpense(
    { kind: "expense", amount: "1000", title: "假午餐", person: 步, account: 假銀行.id, helped: 步, jar: DAILY_JAR as JarId, tags: [], date: "2026-10-20", time: "12:00", ...f },
    { id: id as EventId, me: 步, now: 100 },
  );

// ── 轉帳 ──────────────────────────────────────────────────

const transferForm = (f: Partial<TransferForm> = {}): TransferForm => ({ amount: "500", title: "", from: 假銀行.id, to: 假儲值卡.id, date: "2026-10-31", time: "12:00", ...f });
const transfer = (f: Partial<TransferForm> = {}, id = "轉", recordedBy: PersonId = 步): Event => buildTransfer(transferForm(f), { id: id as EventId, me: recordedBy, now: 1_000 });

describe("轉帳 · 帳本", () => {
  const start = [opening(假銀行, 10_000), opening(假錢包, 2_000)];

  it("淨資產不變；我用的、我付的、收入都不動", () => {
    const events = [...start, transfer()];
    expect(worth(events)).toBe(worth(start));
    expect(flat(events, "use")).toBe(0);
    expect(flat(events, "paid")).toBe(0);
    expect(flat(events, "income")).toBe(0);
    expect(balance(events, 假銀行)).toBe(9_500);
    expect(balance(events, 假儲值卡)).toBe(500);
  });
  it("加值悠遊卡 500、再搭捷運 30：卡片剩 470，我用的是 30", () => {
    const ride = expense({ amount: "30", account: 假儲值卡.id, date: "2026-10-31", time: "13:00" });
    const events = [...start, transfer(), ride];
    expect(balance(events, 假儲值卡)).toBe(470);
    expect(flat(events, "use")).toBe(30);
    expect(worth(events)).toBe(worth(start) - 30);
  });
  it("繳卡費（銀行 → 信用卡）：銀行少、欠的少、淨資產不變", () => {
    const card = expense({ amount: "800", account: 假信用卡.id, date: "2026-10-01" });
    const before = [...start, card];
    const events = [...before, transfer({ from: 假銀行.id, to: 假信用卡.id, amount: "800" })];
    expect(balance(before, 假信用卡)).toBe(-800);
    expect(balance(events, 假信用卡)).toBe(0);
    expect(balance(events, 假銀行)).toBe(9_200);
    expect(worth(events)).toBe(worth(before));
    expect(flat(events, "use")).toBe(800); // 刷的時候算過一次，繳卡費不再算
  });
  it("步轉 1,000 進共有帳戶：算步投入；寶的那份沒動；步的淨資產不變", () => {
    const events = [...start, transfer({ to: 共有投資.id, amount: "1000" })];
    const b = book(events);
    expect(b.total({ measure: "balance", person: 步, where: { account: 共有投資.id } })).toBe(1_000);
    expect(b.total({ measure: "balance", person: 寶, where: { account: 共有投資.id } })).toBe(0);
    expect(worth(events)).toBe(worth(start));
    expect(worth(events, 寶)).toBe(0);
  });
  it("從共有帳戶轉回步的帳戶：步的投入變少，寶的沒動，步的淨資產不變", () => {
    const events = [...start, transfer({ to: 共有投資.id, amount: "1000" }, "入"), transfer({ from: 共有投資.id, to: 假錢包.id, amount: "400" }, "出")];
    const b = book(events);
    expect(b.total({ measure: "balance", person: 步, where: { account: 共有投資.id } })).toBe(600);
    expect(b.total({ measure: "balance", person: 寶, where: { account: 共有投資.id } })).toBe(0);
    expect(worth(events)).toBe(worth(start));
  });
  it("步幫寶記「寶的銀行 → 寶的信用卡」：步的數字不動，寶的帳戶動", () => {
    const events = [...start, transfer({ from: 寶的銀行.id, to: 寶的信用卡.id })];
    expect(validateEvent(events[2] as Event, catalog, start)).toEqual([]);
    expect(worth(events)).toBe(worth(start));
    expect(worth(events, 寶)).toBe(0);
    expect(balance(events, 寶的銀行)).toBe(-500);
    expect(balance(events, 寶的信用卡)).toBe(500);
    for (const measure of ["use", "paid", "income"] as const) expect(flat(events, measure)).toBe(0);
  });
});

describe("轉帳 · 選單", () => {
  const accounts = catalog.accounts;
  it("來源列步的、共有的、寶的；封存的、寶媽卡不列", () => {
    expect(ids(sourceOptions(accounts))).toEqual([假錢包.id, 假銀行.id, 假儲值卡.id, 假信用卡.id, 假投資.id, 共有投資.id, 寶的錢包.id, 寶的銀行.id, 寶的信用卡.id]);
  });
  it("選了步的帳戶：目的只列步的與共有的，不含自己；不會出現寶的（那是還款）", () => {
    expect(ids(targetOptions(accounts, 假銀行.id))).toEqual([假錢包.id, 假儲值卡.id, 假信用卡.id, 假投資.id, 共有投資.id]);
  });
  it("選了寶的帳戶：目的只列寶的與共有的", () => {
    expect(ids(targetOptions(accounts, 寶的銀行.id))).toEqual([共有投資.id, 寶的錢包.id, 寶的信用卡.id]);
  });
  it("選了共有的：兩個人的都可以", () => {
    expect(ids(targetOptions(accounts, 共有投資.id))).toEqual([假錢包.id, 假銀行.id, 假儲值卡.id, 假信用卡.id, 假投資.id, 寶的錢包.id, 寶的銀行.id, 寶的信用卡.id]);
  });
  it("選單裡每一種組合都過得了 core（轉帳的錯不會跳到使用者臉上）", () => {
    for (const from of sourceOptions(accounts)) {
      for (const to of targetOptions(accounts, from.id)) {
        expect(validateEvent(transfer({ from: from.id, to: to.id }), catalog, [])).toEqual([]);
      }
    }
  });
  it("改一筆：現在用的封存帳戶還在，別的封存的不在；寶媽卡就算是現在用的也不列", () => {
    expect(ids(sourceOptions(accounts, 舊銀行.id))).toContain(舊銀行.id);
    expect(ids(targetOptions(accounts, 假銀行.id, 舊銀行.id))).toContain(舊銀行.id);
    expect(ids(sourceOptions(accounts, 假媽媽卡.id))).not.toContain(假媽媽卡.id);
    // 封存的不能變成跟來源對不上：寶的帳戶當來源時，步的封存帳戶還是不列
    expect(ids(targetOptions(accounts, 寶的銀行.id, 舊銀行.id))).not.toContain(舊銀行.id);
  });
  it("換來源：目的對不上就清空，對得上就留著；不會留著一模一樣的帳戶", () => {
    expect(withSource(transferForm({ from: 假銀行.id, to: 假錢包.id }), 寶的銀行.id, accounts).to).toBe("");
    expect(withSource(transferForm({ from: 假銀行.id, to: 假錢包.id }), 假儲值卡.id, accounts).to).toBe(假錢包.id);
    expect(withSource(transferForm({ from: 假銀行.id, to: 假錢包.id }), 假錢包.id, accounts).to).toBe("");
    expect(withSource(transferForm({ from: 假銀行.id, to: 共有投資.id }), 寶的銀行.id, accounts).to).toBe(共有投資.id);
  });
  it("選單依主人分組：自己在最前面，空的組不列", () => {
    const groups = transferGroups(sourceOptions(accounts), people, 步);
    expect(groups.map((g) => g.label)).toEqual(["步", "共有", "寶"]);
    expect(ids(groups[1]?.accounts ?? [])).toEqual([共有投資.id]);
    expect(transferGroups([寶的銀行], people, 步).map((g) => g.label)).toEqual(["寶"]);
  });
});

describe("轉帳 · 預設值", () => {
  const ctx = (events: readonly Event[]) => ({ me: 步, catalog, events, now: new Date("2026-10-31T09:05:00") });
  it("第一次：來源是自己的現金帳戶、目的要自己選；日期、時間是現在", () => {
    const f = defaultTransfer(ctx([]));
    expect(f).toMatchObject({ amount: "", title: "", from: 假錢包.id, to: "", date: "2026-10-31", time: "09:05" });
  });
  it("第一次的現金是我的：Firestore 讀回來寶的排在前面也一樣", () => {
    const herFirst: Catalog = { ...catalog, accounts: [寶的錢包, ...catalog.accounts.filter((a) => a.id !== 寶的錢包.id)] };
    expect(defaultTransfer({ ...ctx([]), catalog: herFirst }).from).toBe(假錢包.id);
  });
  it("之後跟我上一次轉帳一樣；別人記的、套用預設寫的投入不算", () => {
    const mine = transfer({ from: 假銀行.id, to: 假信用卡.id }, "我的");
    const others = { ...transfer({ from: 寶的銀行.id, to: 寶的錢包.id }, "別人的", 寶), recordedAt: 2_000 };
    const preset = { ...transfer({ from: 假錢包.id, to: 共有投資.id }, "preset-transfer-0"), recordedAt: 3_000 };
    expect(defaultTransfer(ctx([mine, others, preset]))).toMatchObject({ from: 假銀行.id, to: 假信用卡.id });
  });
  it("上一次用的封存了就不帶", () => {
    const old = transfer({ from: 舊銀行.id, to: 假錢包.id }, "舊");
    expect(defaultTransfer(ctx([old]))).toMatchObject({ from: 假錢包.id, to: "" });
  });
});

describe("轉帳 · 表單", () => {
  it("金額、兩邊都要有；兩邊不能一樣", () => {
    expect(checkTransferForm(transferForm())).toEqual([]);
    expect(checkTransferForm(transferForm({ amount: "" }))).toEqual(["要填金額"]);
    expect(checkTransferForm(transferForm({ amount: "1.5" }))).toEqual(["金額要是整數，不能有小數"]);
    expect(checkTransferForm(transferForm({ from: "" }))).toEqual(["要選從哪個帳戶"]);
    expect(checkTransferForm(transferForm({ to: "" }))).toEqual(["要選轉到哪個帳戶"]);
    expect(checkTransferForm(transferForm({ to: 假銀行.id }))).toEqual(["轉帳兩邊是同一個帳戶"]);
    expect(checkTransferForm(transferForm({ date: "" }))).toEqual(["要填日期"]);
    expect(checkTransferForm(transferForm({ title: "假".repeat(201) }))).toEqual(["名稱最多 200 字"]);
  });
  it("名稱空著就沒有欄位", () => {
    expect(transfer().title).toBeUndefined();
    expect(transfer({ title: " 假加值 " }).title).toBe("假加值");
  });
  it("存的是一則事件、一筆轉帳", () => {
    const e = transfer({ amount: "1,000" });
    expect(e.effects).toEqual([{ type: "money", id: "m1", kind: "transfer", from: 假銀行.id, to: 假儲值卡.id, amount: 1_000 }]);
  });
  it("改一筆：ID、誰記的、什麼時候記的、一筆的 ID、表單沒有的欄位都留著；空了的名稱、時間要拿掉", () => {
    const was: Event = { ...transfer({ title: "舊名稱" }), note: "假備註", effects: [{ type: "money", id: "老" as EntryId, kind: "transfer", from: 假銀行.id, to: 假儲值卡.id, amount: 500, tags: [假吃吃] }] };
    const form = transferFormOf(was);
    expect(form).toMatchObject({ amount: "500", title: "舊名稱", from: 假銀行.id, to: 假儲值卡.id, date: "2026-10-31", time: "12:00" });
    const next = buildTransfer({ ...(form as TransferForm), amount: "600", title: "", time: "" }, { id: "別的" as EventId, me: 寶, now: 9_999, existing: was });
    expect(next).toMatchObject({ id: was.id, recordedBy: 步, recordedAt: 1_000, note: "假備註" });
    expect(next.title).toBeUndefined();
    expect(next.time).toBeUndefined();
    expect(next.effects).toEqual([{ type: "money", id: "老", kind: "transfer", from: 假銀行.id, to: 假儲值卡.id, amount: 600, tags: [假吃吃] }]);
  });
  it("不是一筆轉帳、或換匯（表單表達不了）的打不開", () => {
    expect(transferFormOf(expense())).toBeNull();
    const fx = { ...transfer(), effects: [{ type: "money", id: "m1", kind: "transfer", from: "a", to: "b", amount: 1, amountIn: 2 }] } as unknown as Event;
    expect(transferFormOf(fx)).toBeNull();
    expect(formOf(transfer())).toBeNull();
  });
});

// ── 對帳 ──────────────────────────────────────────────────

const reconcile = (a: Account, actual: string, date: string, id: string, f: Partial<ReconcileForm> = {}): Event =>
  buildReconciliation({ account: a.id, actual, overpaid: false, date, time: "12:00", ...f }, a, { id: id as EventId, me: 步, now: 1_000 });
const preview = (a: Account, actual: string, events: readonly Event[], f: Partial<ReconcileForm> = {}, self?: EventId) =>
  reconcilePreview({ account: a.id, actual, overpaid: false, date: "2026-10-31", time: "12:00", ...f }, a, { catalog, events, recordedAt: 5_000, ...(self === undefined ? {} : { self }) });

describe("對帳 · 帳本", () => {
  const first = reconcile(假銀行, "1000", "2026-10-01", "第一次");
  const second = reconcile(假銀行, "800", "2026-10-20", "第二次");
  const diffs = (events: readonly Event[]) => diffRows(book(events), catalog, 步);

  it("第一次不算對帳差額；餘額變成實際的", () => {
    expect(diffs([first]).rows).toEqual([]);
    expect(diffs([first]).total).toBe(0);
    expect(balance([first], 假銀行)).toBe(1_000);
  });
  it("第二次差 −200：對帳差額列出 −200、餘額變成實際的、不算支出也不算收入", () => {
    const events = [first, second];
    expect(diffs(events).total).toBe(-200);
    expect(diffs(events).rows).toEqual([{ event: second.id, entry: "m1", date: "2026-10-20", account: "假銀行", amount: -200 }]);
    expect(balance(events, 假銀行)).toBe(800);
    for (const measure of ["use", "paid", "income"] as const) expect(flat(events, measure)).toBe(0);
  });
  it("信用卡輸入 3,000 存成 −3,000；差額是實際比算出來少（欠得更多）", () => {
    const card = [expense({ amount: "2800", account: 假信用卡.id, date: "2026-10-01" }), opening(假信用卡, 2_800, "開", "2026-10-02")];
    const later = reconcile(假信用卡, "3,000", "2026-10-20", "卡");
    expect(later.effects[0]).toMatchObject({ kind: "reconciliation", actual: -3_000 });
    const events = [...card, later];
    expect(diffs(events).total).toBe(-200);
    expect(balance(events, 假信用卡)).toBe(-3_000);
  });
  it("信用卡多繳（銀行要還我）：勾了才存成正的", () => {
    const paidTooMuch = reconcile(假信用卡, "150", "2026-10-20", "多繳", { overpaid: true });
    expect(paidTooMuch.effects[0]).toMatchObject({ actual: 150 });
    expect(reconcileFormOf(paidTooMuch, 假信用卡)).toMatchObject({ actual: "150", overpaid: true });
  });
  it("補記一筆比對帳早的支出：對帳差額跟著變（ADR 0001）", () => {
    const events = [first, second];
    expect(diffs(events).total).toBe(-200);
    const backfill = expense({ amount: "150", date: "2026-10-10" }, "補記");
    expect(diffs([...events, backfill]).total).toBe(-50);
    expect(balance([...events, backfill], 假銀行)).toBe(800);
  });
  it("刪掉第一次：下一次變成初始餘額，差額不見，餘額還對", () => {
    const events = [second]; // 刪掉就是讀回來沒有它（fromEventDoc 濾掉）
    expect(diffs(events).rows).toEqual([]);
    expect(balance(events, 假銀行)).toBe(800);
    expect(preview(假銀行, "800", [first], { date: "2026-10-20" }).opening).toBe(false);
    expect(preview(假銀行, "800", [], { date: "2026-10-20" }).opening).toBe(true);
  });
  it("差 0 存得進去、天數歸零，而且不多一行差額", () => {
    const same = reconcile(假銀行, "1000", "2026-10-30", "一樣");
    expect(validateEvent(same, catalog, [first])).toEqual([]);
    expect(diffs([first, same]).rows).toEqual([]);
    expect(reconcileNote(假銀行, [first], "2026-10-31")).toBeNull();
    expect(reconcileNote(假銀行, [first], "2027-01-01")).toBe("92 天沒對帳");
    expect(reconcileNote(假銀行, [first, same], "2027-01-01")).toBe("63 天沒對帳");
  });
  it("差額只列我的：寶的帳戶的不算進我的合計", () => {
    const hers = [reconcile(寶的銀行, "100", "2026-10-01", "寶一"), reconcile(寶的銀行, "50", "2026-10-02", "寶二")];
    expect(diffs(hers).rows).toEqual([]);
    expect(diffs(hers).total).toBe(0);
  });
  it("差額新的在上面，合計是全部加起來", () => {
    const third = reconcile(假銀行, "900", "2026-10-25", "第三次");
    const list = diffs([first, second, third]);
    expect(list.rows.map((r) => r.amount)).toEqual([100, -200]);
    expect(list.total).toBe(-100);
  });
});

describe("對帳 · 預覽", () => {
  const paid = expense({ amount: "300", date: "2026-10-10" });
  const start = opening(假銀行, 1_000, "開", "2026-10-01");

  it("第一次寫這是初始餘額", () => {
    expect(preview(假銀行, "500", [])).toMatchObject({ opening: true, computed: 0, diff: 500, text: "這是初始餘額，不算差額" });
  });
  it("第一次之前已經記過：也還是初始餘額，把算出來的講出來", () => {
    const p = preview(假銀行, "500", [paid]);
    expect(p).toMatchObject({ opening: true, computed: -300 });
    expect(p.text).toBe("這是初始餘額，不算差額（算出來 −300 元）");
  });
  it("之後：算出來 X、差 Y", () => {
    expect(preview(假銀行, "500", [start, paid]).text).toBe("算出來 700 元、差 −200 元（實際比算出來少）");
    expect(preview(假銀行, "800", [start, paid]).text).toBe("算出來 700 元、差 +100 元（實際比算出來多）");
    expect(preview(假銀行, "700", [start, paid]).text).toBe("算出來 700 元、沒有差額");
  });
  it("還沒輸入、輸入不是數字：只寫算出來的", () => {
    expect(preview(假銀行, "", [start, paid])).toMatchObject({ computed: 700, text: "算出來 700 元" });
    expect(preview(假銀行, "abc", [start, paid]).text).toBe("算出來 700 元");
  });
  it("信用卡的方向用欠來講", () => {
    const card = [opening(假信用卡, 2_800, "開", "2026-10-01")];
    expect(preview(假信用卡, "3000", card).text).toBe("算出來 欠 2,800 元、差 −200 元（欠得比算出來多）");
    expect(preview(假信用卡, "2500", card).text).toBe("算出來 欠 2,800 元、差 +300 元（欠得比算出來少）");
  });
  it("只算這個日期、時間之前的：之後才發生的不算", () => {
    expect(preview(假銀行, "1000", [start, paid], { date: "2026-10-05" }).computed).toBe(1_000);
    expect(preview(假銀行, "700", [start, paid], { date: "2026-10-10", time: "11:59" }).computed).toBe(1_000);
    expect(preview(假銀行, "700", [start, paid], { date: "2026-10-10", time: "12:01" }).computed).toBe(700);
  });
  it("改一筆：不把自己算進去", () => {
    const self = reconcile(假銀行, "500", "2026-10-31", "這筆");
    const p = preview(假銀行, "600", [start, paid, self], {}, self.id);
    expect(p).toMatchObject({ opening: false, computed: 700, diff: -100 });
    // 第一次對帳改金額：還是第一次
    expect(preview(假銀行, "600", [self], {}, self.id).opening).toBe(true);
  });
  it("收件匣裡的對帳還沒入帳：這一次還是初始餘額", () => {
    expect(preview(假銀行, "600", [{ ...start, status: "pending" }]).opening).toBe(true);
  });
});

describe("對帳 · 表單", () => {
  it("實際餘額要是整數；空的要講；信用卡不用寫負號", () => {
    const form = (actual: string, overpaid = false): ReconcileForm => ({ account: 假銀行.id, actual, overpaid, date: "2026-10-31", time: "12:00" });
    expect(checkReconcileForm(form("100"), 假銀行)).toEqual([]);
    expect(checkReconcileForm(form("0"), 假銀行)).toEqual([]);
    expect(checkReconcileForm(form("-50"), 假銀行)).toEqual([]); // 透支
    expect(checkReconcileForm(form(""), 假銀行)).toEqual(["要填實際餘額"]);
    expect(checkReconcileForm(form("1.5"), 假銀行)).toEqual(["餘額要是整數"]);
    expect(checkReconcileForm(form(""), 假信用卡)).toEqual(["要填現在欠多少"]);
    expect(checkReconcileForm(form("-50"), 假信用卡)).toEqual(["信用卡填欠多少，不用寫負號"]);
    expect(checkReconcileForm(form("-50", true), 假信用卡)).toEqual(["信用卡填欠多少，不用寫負號"]);
    expect(checkReconcileForm({ ...form("1"), date: "" }, 假銀行)).toEqual(["要填日期"]);
  });
  it("多繳只有信用卡算數", () => {
    const form: ReconcileForm = { account: 假銀行.id, actual: "100", overpaid: true, date: "2026-10-31", time: "" };
    expect(actualOf(form, 假銀行)).toEqual({ ok: true, value: 100 });
    expect(actualOf({ ...form, actual: "0" }, 假信用卡)).toEqual({ ok: true, value: 0 });
    expect(actualOf({ ...form, actual: "100" }, 假信用卡)).toEqual({ ok: true, value: 100 });
    expect(actualOf({ ...form, overpaid: false }, 假信用卡)).toEqual({ ok: true, value: -100 });
    // 銀行帳戶勾了也沒差：透支照樣打得進去
    expect(actualOf({ ...form, actual: "-100" }, 假銀行)).toEqual({ ok: true, value: -100 });
  });
  it("預設現在的日期、時間", () => {
    expect(defaultReconcile(假銀行.id, new Date("2026-10-31T09:05:00"))).toEqual({ account: 假銀行.id, actual: "", overpaid: false, date: "2026-10-31", time: "09:05" });
  });
  it("改一筆：存的是負數的信用卡，表單顯示欠多少；ID、記的時間、一筆的 ID 都留著", () => {
    const was = reconcile(假信用卡, "3000", "2026-10-20", "卡");
    const form = reconcileFormOf(was, 假信用卡) as ReconcileForm;
    expect(form).toMatchObject({ account: 假信用卡.id, actual: "3000", overpaid: false, date: "2026-10-20", time: "12:00" });
    const next = buildReconciliation({ ...form, actual: "3500" }, 假信用卡, { id: "別的" as EventId, me: 寶, now: 9_999, existing: was });
    expect(next).toMatchObject({ id: was.id, recordedBy: 步, recordedAt: 1_000 });
    expect(next.effects).toEqual([{ type: "money", id: "m1", kind: "reconciliation", account: 假信用卡.id, actual: -3_500 }]);
  });
  it("改一筆：一筆的 ID 不是預設的也留著", () => {
    const was: Event = { ...reconcile(假銀行, "1", "2026-10-01", "舊"), effects: [{ type: "money", id: "老" as EntryId, kind: "reconciliation", account: 假銀行.id, actual: 1 }] };
    const next = buildReconciliation({ ...(reconcileFormOf(was, 假銀行) as ReconcileForm), actual: "2" }, 假銀行, { id: "x" as EventId, me: 步, now: 2, existing: was });
    expect(next.effects[0]?.id).toBe("老");
  });
  it("初始餘額那則（名稱是別的）改完名稱還在；新的一筆名稱是對帳", () => {
    expect(reconcile(假銀行, "1", "2026-10-01", "新").title).toBe("對帳");
    const was: Event = { ...reconcile(假銀行, "1", "2026-10-01", "舊"), title: "假的舊名稱" };
    const next = buildReconciliation({ ...(reconcileFormOf(was, 假銀行) as ReconcileForm), actual: "2" }, 假銀行, { id: "x" as EventId, me: 步, now: 2, existing: was });
    expect(next.title).toBe("假的舊名稱");
  });
  it("不是對帳的打不開", () => {
    expect(reconcileFormOf(expense(), 假銀行)).toBeNull();
  });
});

// ── 退款 ──────────────────────────────────────────────────

const lunch = expense({ tags: [假吃吃] });
const lunchTarget = refundTargetOf(lunch)!;
const refundForm = (f: Partial<RefundForm> = {}): RefundForm => ({ amount: "300", account: 假銀行.id, date: "2026-10-25", time: "09:00", ...f });
const refund = (f: Partial<RefundForm> = {}, id = "退", target = lunchTarget, now = 2_000): Event => buildRefund(refundForm(f), target, { id: id as EventId, me: 步, now });

describe("退款 · 帳本", () => {
  const start = [opening(假銀行, 5_000)];

  it("退款後：我用的（罐子、標籤）變少、我付的變少、餘額回到帳戶、收入沒變", () => {
    const before = [...start, lunch];
    const events = [...before, refund()];
    const b = book(events);
    expect(b.total({ measure: "use", person: 步 })).toBe(700);
    expect(b.total({ measure: "use", person: 步, where: { jar: DAILY_JAR as JarId } })).toBe(700);
    expect(b.total({ measure: "use", person: 步, where: { tags: [假吃吃] } })).toBe(700);
    expect(b.total({ measure: "paid", person: 步 })).toBe(700);
    expect(b.total({ measure: "income", person: 步 })).toBe(0);
    expect(balance(events, 假銀行)).toBe(4_300);
    expect(worth(events)).toBe(worth(before) + 300);
    expect(b.problems).toEqual([]);
  });
  it("退到步的另一個帳戶：錢進那一個，原本的不動", () => {
    const events = [...start, lunch, refund({ account: 假錢包.id })];
    expect(balance(events, 假銀行)).toBe(4_000);
    expect(balance(events, 假錢包)).toBe(300);
  });
  it("共付那筆退款：步、寶照原本的分法各沖回，零頭算誰出", () => {
    const shared = expense({ amount: "1001", helped: "shared" }, "共付");
    const target = refundTargetOf(shared)!;
    const events = [...start, shared, refund({ amount: "101" }, "退共", target)];
    const b = book(events);
    // 原本步 501、寶 500；101 照 501:500 分，零頭算誰出（步）
    expect(b.total({ measure: "use", person: 步 })).toBe(501 - 51);
    expect(b.total({ measure: "use", person: 寶 })).toBe(500 - 50);
    expect(b.total({ measure: "paid", person: 步 })).toBe(1_001 - 101);
    expect(b.total({ measure: "tab", person: 步, where: { counterpart: 寶 } })).toBe(500 - 50);
  });
  describe("改原本那筆的帳戶", () => {
    const editLunch = (account: AccountId, paid = lunch) => buildExpense({ ...(formOf(paid) as RecordForm), account }, { id: "別的" as EventId, me: 步, now: 9_000, existing: paid });
    const swap = (events: readonly Event[], next: Event) => events.map((e) => (e.id === next.id ? next : e));

    it("退回原本那個帳戶的：不寫帳戶，跟著原本那筆走（改了之後兩個帳戶的餘額都對）", () => {
      const before = [...start, opening(假錢包, 2_000), lunch, refund({ account: 假銀行.id })];
      expect((before.at(-1)?.effects[0] as Refund).account).toBeUndefined();
      const moved = editLunch(假錢包.id);
      expect(validateEvent(moved, catalog, before)).toEqual([]);
      const after = swap(before, moved);
      expect(balance(after, 假銀行)).toBe(5_000);
      expect(balance(after, 假錢包)).toBe(2_000 - 1_000 + 300);
      expect(worth(after)).toBe(worth(before));
    });
    it("退到別的帳戶的：寫帳戶，原本那筆怎麼改，錢都在那個帳戶", () => {
      const before = [...start, opening(假錢包, 2_000), lunch, refund({ account: 假錢包.id })];
      expect((before.at(-1)?.effects[0] as Refund).account).toBe(假錢包.id);
      const after = swap(before, editLunch(假信用卡.id));
      expect(balance(after, 假銀行)).toBe(5_000);
      expect(balance(after, 假錢包)).toBe(2_300);
      expect(balance(after, 假信用卡)).toBe(-1_000);
    });
    it("刷寶媽卡全退、再把原本那筆改成寶的銀行：寶媽卡、寶的銀行、寶的淨資產都回到 0", () => {
      const card = expense({ person: 寶, helped: 寶, account: 假媽媽卡.id, amount: "1000" }, "媽媽卡");
      const back = refund({ amount: "1000", account: 假媽媽卡.id }, "退卡", refundTargetOf(card)!);
      const before = [card, back];
      const moved = buildExpense({ ...(formOf(card) as RecordForm), account: 寶的銀行.id }, { id: "別的" as EventId, me: 步, now: 9_000, existing: card });
      expect(validateEvent(moved, catalog, before)).toEqual([]);
      const after = swap(before, moved);
      expect(balance(after, 假媽媽卡)).toBe(0);
      expect(balance(after, 寶的銀行)).toBe(0);
      expect(worth(after, 寶)).toBe(0);
    });
    it("表單打開時帶的還是實際退回的帳戶（畫面不會變成不知道）", () => {
      expect(refundFormOf(refund({ account: 假銀行.id }), lunchTarget)).toMatchObject({ account: 假銀行.id });
      expect(refundFormOf(refund({ account: 假錢包.id }), lunchTarget)).toMatchObject({ account: 假錢包.id });
    });
  });
  it("原本那筆不知道帳戶：退款也不動任何帳戶的餘額", () => {
    const unknown = expense({ account: "" }, "不知道");
    const target = refundTargetOf(unknown)!;
    const events = [...start, unknown, refund({ account: "" }, "退", target)];
    expect(balance(events, 假銀行)).toBe(5_000);
    expect(book(events).total({ measure: "use", person: 步 })).toBe(700);
  });
  it("退款存一則事件，名稱帶原本的；指回原本那一項", () => {
    const e = refund();
    expect(e.title).toBe("假午餐");
    const m = e.effects[0] as Refund;
    const paid = lunch.effects[0] as Expense;
    expect(e.effects).toHaveLength(1);
    expect(m.target).toEqual({ event: lunch.id, entry: paid.id, item: paid.items[0]?.id });
    expect(m).toMatchObject({ kind: "refund", amount: 300 });
    expect(validateEvent(e, catalog, [lunch])).toEqual([]);
  });
  it("沒有名稱的那筆：退款也沒有名稱", () => {
    const blank = expense({ title: "" }, "空");
    expect(refund({}, "退", refundTargetOf(blank)!).title).toBeUndefined();
  });
});

describe("退款 · 表單與約束", () => {
  const remainingAfter = (events: readonly Event[], except?: EventId) => refundable(lunchTarget, events, except);
  const errors = (f: Partial<RefundForm>, events: readonly Event[] = [lunch], self?: EventId) =>
    checkRefundForm(refundForm(f), lunchTarget, events, { recordedAt: 3_000, ...(self === undefined ? {} : { self }) });

  it("還沒退的 = 原本的 − 已退的；改一筆退款時不算自己", () => {
    const one = refund({ amount: "300" });
    expect(remainingAfter([lunch])).toBe(1_000);
    expect(remainingAfter([lunch, one])).toBe(700);
    expect(remainingAfter([lunch, one], one.id)).toBe(1_000);
  });
  it("預設：金額是還沒退的全部、帳戶是原本那個、時間是現在", () => {
    const f = defaultRefund(lunchTarget, [lunch, refund({ amount: "300" })], new Date("2026-10-31T09:05:00"));
    expect(f).toEqual({ amount: "700", account: 假銀行.id, date: "2026-10-31", time: "09:05" });
    const blank = refundTargetOf(expense({ account: "" }, "空"))!;
    expect(defaultRefund(blank, [], new Date("2026-10-31T09:05:00")).account).toBe("");
  });
  it("退超過還沒退的：擋住，把數字講清楚", () => {
    const one = refund({ amount: "300" });
    expect(errors({ amount: "1000" })).toEqual([]);
    expect(errors({ amount: "1001" })).toEqual(["最多只能退 1,000 元"]);
    expect(errors({ amount: "701" }, [lunch, one])).toEqual(["最多只能退 700 元（已經退了 300 元）"]);
    expect(errors({ amount: "1000" }, [lunch, one], one.id)).toEqual([]);
  });
  it("金額 0、負數、小數、空白：跟記一筆一樣的字", () => {
    expect(errors({ amount: "" })).toEqual(["要填金額"]);
    expect(errors({ amount: "0" })).toEqual(["金額要大於 0"]);
    expect(errors({ amount: "-1" })).toEqual(["金額不能是負的"]);
    expect(errors({ amount: "1.5" })).toEqual(["金額要是整數，不能有小數"]);
  });
  it("排在原本那筆之前：擋住，講原本那筆是什麼時候", () => {
    expect(errors({ date: "2026-10-19" })).toEqual(["退款要排在原本那筆（10/20（二） 12:00）之後"]);
    expect(errors({ date: "2026-10-20", time: "11:59" })).toEqual(["退款要排在原本那筆（10/20（二） 12:00）之後"]);
    expect(errors({ date: "2026-10-20", time: "12:01" })).toEqual([]);
  });
  it("同一天沒寫時間（沒寫時間的排前面）：提醒要寫時間，core 也同樣擋", () => {
    expect(errors({ date: "2026-10-20", time: "" })).toEqual(["同一天的退款要寫時間，而且要比原本那筆（12:00）晚"]);
    const e = refund({ date: "2026-10-20", time: "" });
    expect(validateEvent(e, catalog, [lunch]).map((p) => p.code)).toContain("refund-target");
    expect(errors({ date: "2026-10-21", time: "" })).toEqual([]);
  });
  it("畫面的檢查過了，core 也一定過（不會跳出另一句）", () => {
    for (const f of [{ amount: "1000" }, { date: "2026-10-20", time: "12:01" }, { date: "2026-10-21", time: "" }, { account: 假錢包.id }]) {
      expect(errors(f)).toEqual([]);
      expect(validateEvent(refund(f), catalog, [lunch])).toEqual([]);
    }
  });
  it("同一天同一分鐘：比記下來的時間（晚記的排後面）", () => {
    const f = { date: "2026-10-20", time: "12:00" };
    expect(checkRefundForm(refundForm(f), lunchTarget, [lunch], { recordedAt: 3_000 })).toEqual([]);
    expect(validateEvent(refund(f), catalog, [lunch])).toEqual([]);
  });
  it("改一筆：ID、誰記的、記的時間、指回的那一項都留著；名稱不動", () => {
    const was = refund({ amount: "300" });
    const form = refundFormOf(was, lunchTarget) as RefundForm;
    expect(form).toEqual({ amount: "300", account: 假銀行.id, date: "2026-10-25", time: "09:00" });
    const next = buildRefund({ ...form, amount: "400", account: 假錢包.id, time: "" }, lunchTarget, { id: "別的" as EventId, me: 寶, now: 9_999, existing: was });
    expect(next).toMatchObject({ id: was.id, recordedBy: 步, recordedAt: 2_000, title: "假午餐" });
    expect(next.time).toBeUndefined();
    expect(next.effects).toEqual([{ type: "money", id: "m1", kind: "refund", target: (was.effects[0] as Refund).target, amount: 400, account: 假錢包.id }]);
  });
  it("改一筆：原本那筆後來改了名稱，退款存的名稱不跟著變；一筆的 ID 不是預設的也留著", () => {
    const was: Event = { ...refund(), effects: [{ ...(refund().effects[0] as Refund), id: "老" as EntryId }] };
    const renamed = { ...lunchTarget, title: "假的新名稱" };
    const next = buildRefund(refundFormOf(was, renamed) as RefundForm, renamed, { id: "別的" as EventId, me: 步, now: 9_999, existing: was });
    expect(next.title).toBe("假午餐");
    expect(next.effects[0]?.id).toBe("老");
  });
  it("不是一筆退款的打不開", () => {
    expect(refundFormOf(lunch)).toBeNull();
    expect(formOf(refund())).toBeNull();
    expect(transferFormOf(refund())).toBeNull();
  });
});

describe("退款 · 選單與找原本那一項", () => {
  const options = (paid: Event, current?: AccountId) => ids(refundAccountOptions(catalog.accounts, (paid.effects[0] as Expense), current));

  it("只列誰出那個人的；不含投資、共有、封存、別筆的寶媽卡", () => {
    expect(options(lunch)).toEqual([假錢包.id, 假銀行.id, 假儲值卡.id, 假信用卡.id]);
    const hers = expense({ person: 寶, account: 寶的銀行.id }, "寶付");
    expect(options(hers)).toEqual([寶的錢包.id, 寶的銀行.id, 寶的信用卡.id]);
  });
  it("刷寶媽卡的那筆：寶媽卡也在（退回去），也可以退到寶自己的帳戶", () => {
    const card = expense({ person: 寶, account: 假媽媽卡.id }, "媽媽卡");
    expect(options(card)).toEqual([寶的錢包.id, 寶的銀行.id, 寶的信用卡.id, 假媽媽卡.id]);
  });
  it("原本那個帳戶、現在用的就算封存了也在", () => {
    const old = expense({ account: 舊銀行.id }, "舊");
    expect(options(old)).toContain(舊銀行.id);
    expect(options(lunch, 舊銀行.id)).toContain(舊銀行.id);
    expect(options(lunch)).not.toContain(舊銀行.id);
  });
  it("選單裡每個帳戶都過得了 core", () => {
    for (const paid of [lunch, expense({ person: 寶, account: 寶的銀行.id }, "寶付"), expense({ person: 寶, account: 假媽媽卡.id }, "媽媽卡")]) {
      const target = refundTargetOf(paid)!;
      for (const a of options(paid)) {
        expect(validateEvent(refund({ account: a as AccountId }, "退", target), catalog, [paid])).toEqual([]);
      }
    }
  });
  it("拆過品項、不是支出、直接給錢的那一項：這個畫面退不了", () => {
    const paid = lunch.effects[0] as Expense;
    const item = paid.items[0]!;
    const split: Event = { ...lunch, effects: [{ ...paid, items: [{ ...item, amount: 400 }, { ...item, id: "第二項" as ItemId, amount: 600 }] }] };
    expect(refundTargetOf(split)).toBeNull();
    expect(refundTargetOf(buildIncome({ kind: "income", amount: "1", title: "", person: 步, account: "", helped: 步, jar: DAILY_JAR as JarId, tags: [], date: "2026-10-20", time: "" }, { id: "收" as EventId, me: 步, now: 1 }))).toBeNull();
    const gift: Event = { ...lunch, effects: [{ ...paid, items: [{ ...item, cash: {} }] }] };
    expect(refundTargetOf(gift)).toBeNull();
    expect(refundTargetOf({ ...lunch, status: "pending" })).toBeNull();
  });
  it("從退款找回原本那一項；找不到是 null", () => {
    const m = refund().effects[0] as Refund;
    expect(refundTargetAt([lunch], m.target)?.title).toBe("假午餐");
    expect(refundTargetAt([], m.target)).toBeNull();
    expect(refundTargetAt([lunch], { ...m.target, item: "沒有" as ItemId })).toBeNull();
  });
});

describe("退款 · 註記", () => {
  const a = refund({ amount: "300", date: "2026-10-25" }, "第一筆");
  const b = refund({ amount: "200", date: "2026-10-28" }, "第二筆");
  it("沒退過沒有註記", () => {
    expect(refundNote(lunch, [lunch])).toBeUndefined();
  });
  it("寫已退多少與每一筆的日期", () => {
    expect(refundNote(lunch, [lunch, a])).toBe("已退 300 元：10/25（日）");
    expect(refundNote(lunch, [lunch, a, b])).toBe("已退 500 元：10/25（日）300、10/28（三）200");
  });
  it("刪掉退款後註記不見", () => {
    expect(refundNote(lunch, [lunch, b])).toBe("已退 200 元：10/28（三）");
    expect(refundNote(lunch, [lunch])).toBeUndefined();
  });
});

// ── 流水 ──────────────────────────────────────────────────

describe("流水頁 · 轉帳、對帳、退款", () => {
  const days = (events: readonly Event[], filter = {}) => flowDays(events, catalog, book(events), 步, filter);
  const rows = (events: readonly Event[], filter = {}) => days(events, filter).flatMap((d) => d.rows);
  const one = (events: readonly Event[], id: string, filter = {}) => rows(events, filter).find((r) => r.event === id);

  it("轉帳：看得出兩邊，沒有正負號（不是支出）；有名稱用名稱", () => {
    const r = one([transfer({ title: "假加值" })], "轉");
    expect(r).toMatchObject({ kind: "transfer", title: "假加值", account: "假銀行 → 假儲值卡", amountText: "500" });
    expect(one([transfer()], "轉")?.title).toBe("轉帳");
  });
  it("從帳戶點進來：轉帳照這個帳戶的方向寫正負；兩邊都列得到", () => {
    const e = transfer();
    expect(one([e], "轉", { account: 假銀行.id })?.amountText).toBe("−500");
    expect(one([e], "轉", { account: 假儲值卡.id })?.amountText).toBe("+500");
    expect(one([e], "轉", { account: 假錢包.id })).toBeUndefined();
  });
  it("步幫寶記的轉帳：寫是寶自己轉的", () => {
    expect(one([transfer({ from: 寶的銀行.id, to: 寶的信用卡.id })], "轉")?.who).toBe("寶自己轉");
    expect(one([transfer()], "轉")?.who).toBeUndefined();
    expect(one([transfer({ to: 共有投資.id })], "轉")?.who).toBeUndefined();
  });
  it("第一次對帳：初始餘額，寫實際多少；信用卡寫欠多少", () => {
    const r = one([reconcile(假銀行, "1000", "2026-10-01", "第一次")], "第一次");
    expect(r).toMatchObject({ kind: "opening", title: "初始餘額", account: "假銀行", amountText: "1,000 元" });
    expect(one([reconcile(假信用卡, "3000", "2026-10-01", "卡")], "卡")?.amountText).toBe("欠 3,000 元");
  });
  it("之後的對帳：寫差多少；差 0 也有一列（才改得了、刪得了），字不一樣", () => {
    const first = reconcile(假銀行, "1000", "2026-10-01", "第一次");
    const events = [first, reconcile(假銀行, "800", "2026-10-20", "第二次"), reconcile(假銀行, "800", "2026-10-25", "第三次")];
    expect(one(events, "第二次")).toMatchObject({ kind: "reconcile", title: "對帳", account: "假銀行 · 實際 800 元", amountText: "差 −200" });
    expect(one(events, "第三次")).toMatchObject({ kind: "reconcile", amountText: "沒有差額" });
  });
  it("初始餘額那則就算存的名稱是別的，第一次之後的也不會寫成初始餘額", () => {
    const named: Event = { ...reconcile(假銀行, "800", "2026-10-20", "第二次"), title: "初始餘額" };
    const events = [reconcile(假銀行, "1000", "2026-10-01", "第一次"), named];
    expect(one(events, "第二次")?.title).toBe("對帳");
  });
  it("第一次看的是時間，不是讀回來的順序；收件匣裡的不算第一次", () => {
    const earlier = reconcile(假銀行, "1000", "2026-10-01", "早");
    const later = reconcile(假銀行, "800", "2026-10-20", "晚");
    expect(one([later, earlier], "早")?.kind).toBe("opening");
    expect(one([later, earlier], "晚")?.kind).toBe("reconcile");
    expect(one([{ ...earlier, status: "pending" }, later], "晚")?.kind).toBe("opening");
  });
  it("刪掉第一次對帳：下一次那一列變成初始餘額", () => {
    expect(one([reconcile(假銀行, "800", "2026-10-20", "第二次")], "第二次")?.kind).toBe("opening");
  });
  it("原本那筆註記已退多少；退款自己那一列指回原本那筆；看得出不是收入", () => {
    const events = [lunch, refund()];
    expect(one(events, lunch.id)).toMatchObject({ kind: "expense", amountText: "−1,000", refunded: "已退 300 元：10/25（日）" });
    expect(one(events, "退")).toMatchObject({
      kind: "refund",
      title: "退款：假午餐",
      account: "退回 假銀行",
      amountText: "+300",
      refundOf: { event: lunch.id, label: "10/20（二） 假午餐" },
    });
  });
  it("刪掉退款後，原本那筆的註記消失", () => {
    expect(one([lunch], lunch.id)?.refunded).toBeUndefined();
  });
  it("依帳戶篩：退款看錢退回哪裡", () => {
    const events = [lunch, refund({ account: 假錢包.id })];
    expect(one(events, "退", { account: 假錢包.id })).toBeDefined();
    expect(one(events, "退", { account: 假銀行.id })).toBeUndefined();
    const { account: _account, ...bare } = refund().effects[0] as Refund;
    expect(one([lunch, { ...refund(), effects: [bare] }], "退", { account: 假銀行.id })).toBeDefined();
  });
  it("依帳戶篩：對帳只列那個帳戶的", () => {
    const events = [reconcile(假銀行, "1", "2026-10-01", "銀"), reconcile(假錢包, "1", "2026-10-01", "錢")];
    expect(rows(events, { account: 假銀行.id }).map((r) => r.event)).toEqual(["銀"]);
  });
  it("收件匣裡的不列；還款這一輪不列（階段 6）", () => {
    const repayment = { ...transfer({}, "還"), effects: [{ type: "money", id: "m1" as EntryId, kind: "repayment", amount: 1, from: { kind: "person", person: 寶 }, to: { kind: "person", person: 步 } }] } as Event;
    expect(rows([{ ...transfer({}, "收"), status: "pending" }, repayment])).toEqual([]);
  });
});
