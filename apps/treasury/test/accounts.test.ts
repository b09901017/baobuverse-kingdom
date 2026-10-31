// 帳戶頁的純函式（issue 04）。不用模擬器。資料都是假的。

import { openBook, type Account, type AccountId, type Catalog, type EntryId, type Event, type EventId, type ItemId, type JarId, type PersonId } from "@baobu/core";
import { describe, expect, it } from "vitest";
import {
  balanceText,
  checkAccountForm,
  lastReconciled,
  moved,
  myAccounts,
  newAccountChanges,
  othersAccounts,
  ownerChoices,
  parseActual,
  reconcileNote,
  sharesOf,
  usageCounts,
  wallOrder,
  withArchived,
  type AccountForm,
} from "../src/accounts";

const 步 = "bu" as PersonId;
const 寶 = "bao" as PersonId;
const people = [
  { id: 步, name: "步" },
  { id: 寶, name: "寶" },
];
const id = (s: string) => s as AccountId;
const account = (name: string, kind: Account["kind"], owners: readonly PersonId[] = [步], extra: Partial<Account> = {}): Account => ({
  id: id(name),
  name,
  kind,
  owners,
  currency: "TWD",
  ...extra,
});

const 假銀行 = account("假銀行", "bank");
const 假錢包 = account("假錢包", "cash");
const 假卡 = account("假卡", "credit-card");
const 假幣 = account("假幣", "investment", [步, 寶]);
const 寶的假銀行 = account("寶的假銀行", "bank", [寶]);
const catalog: Catalog = {
  people,
  accounts: [假銀行, 假錢包, 假卡, 假幣, 寶的假銀行],
  jars: [{ id: "daily" as JarId, name: "日常", owners: [步, 寶] }],
  tags: [],
};

const base = (n: string, date = "2026-10-01") => ({
  id: n as EventId,
  date,
  recordedBy: 步,
  recordedAt: 1,
  source: "manual" as const,
  status: "confirmed" as const,
});
const entry = { type: "money", id: "m1" as EntryId } as const;
const spend = (n: string, from: Account, amount = 100, date?: string): Event => ({
  ...base(n, date),
  effects: [
    {
      ...entry,
      kind: "expense",
      payer: 步,
      account: from.id,
      amount,
      beneficiary: { kind: "person", person: 步 },
      tags: [],
      items: [{ id: "i1" as ItemId, amount, jar: "daily" as JarId, tags: [] }],
    },
  ],
});
const check = (n: string, of: Account, actual: number, date?: string): Event => ({
  ...base(n, date),
  effects: [{ ...entry, kind: "reconciliation", account: of.id, actual }],
});
const move = (n: string, from: Account, to: Account, amount: number, recordedBy = 步): Event => ({
  ...base(n),
  recordedBy,
  effects: [{ ...entry, kind: "transfer", from: from.id, to: to.id, amount }],
});

describe("誰的帳戶", () => {
  it("卡片牆只有主人有我的（含共有），寶的帳戶不出現", () => {
    expect(myAccounts(catalog, 步).map((a) => a.name)).toEqual(["假銀行", "假錢包", "假卡", "假幣"]);
  });
  it("設定頁的清單是只屬於別人的；共有的不算", () => {
    expect(othersAccounts(catalog, 步).map((a) => a.name)).toEqual(["寶的假銀行"]);
  });
});

describe("卡片牆的順序", () => {
  const accounts = [假銀行, 假錢包, 假卡];

  it("沒用過：現金在最上面（照種類）", () => {
    expect(wallOrder(accounts, undefined, []).map((a) => a.name)).toEqual(["假錢包", "假銀行", "假卡"]);
  });
  it("沒拖過：用過的次數多的在上面", () => {
    const events = [spend("1", 假卡), spend("2", 假卡), spend("3", 假銀行)];
    expect(wallOrder(accounts, undefined, events).map((a) => a.name)).toEqual(["假卡", "假銀行", "假錢包"]);
  });
  it("對帳不算用過", () => {
    expect(usageCounts([check("1", 假卡, -100)]).get(假卡.id)).toBeUndefined();
  });
  it("套用預設寫的投入不算用過，自己記的轉帳兩邊都算", () => {
    const counts = usageCounts([move("preset-transfer-0", 假銀行, 假幣, 100), move("t", 假銀行, 假錢包, 100)]);
    expect(counts.get(假銀行.id)).toBe(1);
    expect(counts.get(假錢包.id)).toBe(1);
    expect(counts.get(假幣.id)).toBeUndefined();
  });
  it("拖過：照存的，用得多也不會跑到前面", () => {
    const events = [spend("1", 假卡), spend("2", 假卡)];
    const saved = [假銀行.id, 假錢包.id, 假卡.id];
    expect(wallOrder(accounts, saved, events).map((a) => a.name)).toEqual(["假銀行", "假錢包", "假卡"]);
  });
  it("拖過之後新增的帳戶排最後，存的裡面已經沒有的帳戶不影響", () => {
    const saved = [id("已經不在的"), 假卡.id, 假銀行.id];
    expect(wallOrder(accounts, saved, [spend("1", 假錢包)]).map((a) => a.name)).toEqual(["假卡", "假銀行", "假錢包"]);
  });
  it("拖曳：拖到別張的位置，往前往後都對", () => {
    const order = [id("a"), id("b"), id("c"), id("d")];
    expect(moved(order, id("d"), id("b")).join()).toBe("a,d,b,c");
    expect(moved(order, id("a"), id("c")).join()).toBe("b,c,a,d");
    expect(moved(order, id("a"), id("a"))).toBe(order);
    expect(moved(order, id("沒有"), id("a"))).toBe(order);
  });
  it("拖曳時封存的（x）留在中間：解封後回到原本的位置", () => {
    const order = [id("a"), id("x"), id("b"), id("c")];
    // 畫面上看到 a、b、c；c 拖到 b 前面
    expect(moved(order, id("c"), id("b")).join()).toBe("a,x,c,b");
  });
});

describe("對帳的提醒", () => {
  it("沒對過帳：還沒對帳", () => {
    expect(reconcileNote(假銀行, [spend("1", 假銀行)], "2026-10-31")).toBe("還沒對帳");
  });
  it("差額是 0 也算對過帳（帳本沒有那一行，要看事件）", () => {
    const events = [check("1", 假銀行, 500, "2026-10-01"), check("2", 假銀行, 500, "2026-10-20")];
    const book = openBook(catalog, events);
    expect(book.lines({ measure: "balance", where: { account: 假銀行.id } }).map((l) => l.date)).toEqual(["2026-10-01"]);
    expect(lastReconciled(events, 假銀行.id)).toBe("2026-10-20");
  });
  it("剛好 30 天不寫，31 天寫天數", () => {
    const events = [check("1", 假銀行, 500, "2026-10-01")];
    expect(reconcileNote(假銀行, events, "2026-10-31")).toBeNull();
    expect(reconcileNote(假銀行, events, "2026-11-01")).toBe("31 天沒對帳");
  });
  it("投資帳戶都不寫", () => {
    expect(reconcileNote(假幣, [], "2026-10-31")).toBeNull();
  });
  it("別的帳戶的對帳、收件匣裡的對帳不算", () => {
    const pending: Event = { ...check("2", 假銀行, 1), status: "pending" };
    expect(lastReconciled([check("1", 假卡, 0), pending], 假銀行.id)).toBeUndefined();
  });
});

describe("卡片上的數字", () => {
  it("信用卡欠 500 寫「欠 500 元」，淨資產減 500", () => {
    const events = [spend("1", 假卡, 500)];
    const book = openBook(catalog, events);
    const balance = book.total({ measure: "balance", where: { account: 假卡.id } });
    expect(balanceText(假卡, balance)).toBe("欠 500 元");
    expect(book.total({ measure: "netWorth", person: 步 })).toBe(-500);
  });
  it("信用卡沒欠、多繳", () => {
    expect(balanceText(假卡, 0)).toBe("欠 0 元");
    expect(balanceText(假卡, 300)).toBe("多繳 300 元");
  });
  it("一般帳戶透支是負的、有千分位", () => {
    expect(balanceText(假銀行, 1_234_567)).toBe("1,234,567 元");
    expect(balanceText(假銀行, -50)).toBe("−50 元");
  });
  it("共有帳戶：總數、各自投入；算進淨資產的是自己投入的那一份，寶的不算", () => {
    const events = [check("0", 假銀行, 10_000), move("a", 假銀行, 假幣, 4_000), move("b", 寶的假銀行, 假幣, 1_000, 寶)];
    const book = openBook(catalog, events);
    expect(book.total({ measure: "balance", where: { account: 假幣.id } })).toBe(5_000);
    expect(sharesOf(假幣, book, people)).toEqual([
      { name: "步", amount: 4_000 },
      { name: "寶", amount: 1_000 },
    ]);
    expect(book.total({ measure: "netWorth", person: 步 })).toBe(10_000);
    expect(sharesOf(假銀行, book, people)).toEqual([]);
  });
  it("寶的帳戶的數字不會混進步的淨資產", () => {
    const book = openBook(catalog, [check("1", 假銀行, 700), spend("2", 假銀行, 100), move("3", 寶的假銀行, 假幣, 900, 寶)]);
    expect(book.total({ measure: "netWorth", person: 步 })).toBe(600);
  });
  it("封存的帳戶還在淨資產裡", () => {
    const archived = withArchived(假銀行, true);
    const book = openBook({ ...catalog, accounts: [archived] }, [check("1", 假銀行, 700)]);
    expect(book.total({ measure: "netWorth", person: 步 })).toBe(700);
  });
  it("解封把欄位拿掉（規則只收 true）", () => {
    const archived = withArchived(假銀行, true);
    expect(archived.archived).toBe(true);
    expect("archived" in withArchived(archived, false)).toBe(false);
  });
});

describe("新增帳戶", () => {
  const form = (extra: Partial<AccountForm> = {}): AccountForm => ({
    name: "新的假銀行",
    kind: "bank",
    owner: 步,
    paidByOthers: false,
    note: "",
    balance: "",
    ...extra,
  });
  const ctx = { me: 步, people, accountId: id("new"), eventId: "ev" as EventId, now: 5, today: "2026-10-31" };

  it("只填名字：只有帳戶，沒有事件、沒有 prefs", () => {
    const changes = newAccountChanges(form(), ctx);
    expect(changes.accounts).toEqual([{ id: "new", name: "新的假銀行", kind: "bank", owners: [步], currency: "TWD" }]);
    expect(changes.events).toBeUndefined();
    expect(changes.prefs).toBeUndefined();
  });
  it("順便填餘額：同一批多一次對帳（第一次就是初始餘額），算出來就是填的數字", () => {
    const changes = newAccountChanges(form({ balance: "1,500" }), ctx);
    expect(changes.events).toHaveLength(1);
    const book = openBook({ ...catalog, accounts: changes.accounts ?? [] }, changes.events ?? []);
    expect(book.total({ measure: "balance", where: { account: id("new") } })).toBe(1_500);
    expect(book.total({ measure: "reconcileDiff" })).toBe(0);
  });
  it("信用卡填欠多少，存成負數；填 0 也算對過帳", () => {
    const owe = newAccountChanges(form({ kind: "credit-card", balance: "3000" }), ctx);
    expect(owe.events?.[0]?.effects[0]).toMatchObject({ kind: "reconciliation", actual: -3_000 });
    const zero = newAccountChanges(form({ kind: "credit-card", balance: "0" }), ctx);
    expect(zero.events?.[0]?.effects[0]).toMatchObject({ actual: 0 });
    expect(Object.is((zero.events?.[0]?.effects[0] as { actual: number }).actual, -0)).toBe(false);
  });
  it("別人的、投資的帳戶就算表單裡有餘額也不存（對帳的參與者會多出別人）；別人的也不存備註", () => {
    const others = newAccountChanges(form({ owner: 寶, balance: "100", note: "假備註" }), ctx);
    expect(others.events).toBeUndefined();
    expect(others.prefs).toBeUndefined();
    const investing = newAccountChanges(form({ kind: "investment", balance: "100" }), ctx);
    expect(investing.events).toBeUndefined();
  });
  it("共有：主人是兩個人，備註進自己的 prefs", () => {
    const shared = newAccountChanges(form({ kind: "investment", owner: "shared", note: "假備註" }), ctx);
    expect(shared.accounts?.[0]?.owners).toEqual([步, 寶]);
    expect(shared.prefs).toEqual({ of: 步, set: { accountNotes: { new: "假備註" } } });
  });
  it("別人繳的只有信用卡能有", () => {
    expect(newAccountChanges(form({ kind: "credit-card", paidByOthers: true }), ctx).accounts?.[0]?.paidByOthers).toBe(true);
    expect("paidByOthers" in (newAccountChanges(form({ paidByOthers: true }), ctx).accounts?.[0] ?? {})).toBe(false);
  });
  it("存進去的物件沒有 undefined（Firestore 不收）", () => {
    const changes = newAccountChanges(form({ balance: "1", note: "假備註" }), ctx);
    expect(JSON.stringify(changes)).toBe(JSON.stringify(JSON.parse(JSON.stringify(changes))));
    const hasUndefined = (x: unknown): boolean =>
      x === undefined || (typeof x === "object" && x !== null && Object.values(x).some(hasUndefined));
    expect(hasUndefined(changes)).toBe(false);
  });
  it("共有只有投資能選", () => {
    expect(ownerChoices("bank", people, 步).map((o) => o.label)).toEqual(["步", "寶"]);
    expect(ownerChoices("investment", people, 步).map((o) => o.label)).toEqual(["步", "寶", "共有"]);
    // Firestore 讀回來是照 ID 排的（寶在前面）：自己還是排第一
    expect(ownerChoices("bank", [...people].reverse(), 步).map((o) => o.label)).toEqual(["步", "寶"]);
    expect(ownerChoices("bank", people, 寶).map((o) => o.label)).toEqual(["寶", "步"]);
    expect(checkAccountForm(form({ owner: "shared" }), 步)).toEqual(["共有的帳戶只能是投資（目前沒有共同帳戶）"]);
  });
  it("表單的錯誤：沒名字、名字太長、餘額不是整數", () => {
    expect(checkAccountForm(form(), 步)).toEqual([]);
    expect(checkAccountForm(form({ name: "  " }), 步)).toEqual(["要取一個名字"]);
    expect(checkAccountForm(form({ name: "假".repeat(41) }), 步)).toEqual(["名字最多 40 字"]);
    expect(checkAccountForm(form({ balance: "12.5" }), 步)).toEqual(["餘額要是整數"]);
    expect(checkAccountForm(form({ kind: "credit-card", balance: "-5" }), 步)).toEqual(["信用卡填欠多少，不用寫負號"]);
    // 別人的帳戶不填餘額，打了也不算錯
    expect(checkAccountForm(form({ owner: 寶, balance: "abc" }), 步)).toEqual([]);
  });
  it("實際餘額的寫法：負的、全形負號、千分位", () => {
    expect(parseActual("-100", "bank")).toEqual({ ok: true, value: -100 });
    expect(parseActual("−100", "bank")).toEqual({ ok: true, value: -100 });
    expect(parseActual("1,000", "cash")).toEqual({ ok: true, value: 1_000 });
    expect(parseActual("abc", "cash").ok).toBe(false);
    expect(parseActual("99999999999999999", "cash").ok).toBe(false);
  });
});
