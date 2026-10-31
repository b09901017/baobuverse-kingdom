// 記一筆與流水頁的純函式（issue 05）。不用模擬器。資料都是假的。

import { openBook, validateEvent, type Account, type AccountId, type Catalog, type EntryId, type Event, type EventId, type ItemId, type JarId, type PersonId, type Tag, type TagId } from "@baobu/core";
import { describe, expect, it } from "vitest";
import { flowDays } from "../src/flow";
import { DAILY_JAR } from "../src/presets";
import {
  QUICK_TAGS,
  accountOptions,
  buildExpense,
  buildIncome,
  checkRecordForm,
  defaultForm,
  formOf,
  isRefunded,
  jarOptions,
  lastAccount,
  parseAmount,
  rankTags,
  recordChanges,
  tagFromName,
  visibleTags,
  withHelped,
  withKind,
  withPerson,
  type RecordForm,
} from "../src/record";

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
const 舊銀行 = account("舊銀行", "bank", [步], { archived: true });
const 假投資 = account("假投資", "investment", [步]);
const 共有投資 = account("共有投資", "investment", [步, 寶]);
const 寶的錢包 = account("寶的錢包", "cash", [寶]);
const 寶的銀行 = account("寶的銀行", "bank", [寶]);
const 假媽媽卡 = account("假媽媽卡", "credit-card", [寶], { paidByOthers: true });
const jar = (id: string, owners: readonly PersonId[], extra: object = {}) => ({ id: id as JarId, name: id, owners, ...extra });
const 日常 = jar(DAILY_JAR, [步, 寶]);
const 玩玩 = jar("玩玩", [步, 寶]);
const 步罐 = jar("步罐", [步]);
const 寶罐 = jar("寶罐", [寶]);
const 舊罐 = jar("舊罐", [步, 寶], { archived: true });
const tag = (id: string, extra: Partial<Tag> = {}): Tag => ({ id: id as TagId, name: id, ...extra });
const catalog: Catalog = {
  people,
  accounts: [假錢包, 假銀行, 舊銀行, 假投資, 共有投資, 寶的錢包, 寶的銀行, 假媽媽卡],
  jars: [日常, 玩玩, 步罐, 寶罐, 舊罐],
  tags: [tag("假吃吃"), tag("假車錢")],
};

const form = (extra: Partial<RecordForm> = {}): RecordForm => ({
  kind: "expense",
  amount: "100",
  title: "",
  person: 步,
  account: "",
  helped: 步,
  jar: DAILY_JAR,
  tags: [],
  date: "2026-10-31",
  time: "12:00",
  ...extra,
});
const ctx = { id: "new" as EventId, me: 步, now: 1_000 };
const ids = (list: readonly { readonly id: string }[]) => list.map((x) => x.id);
const check = (event: Event) => validateEvent(event, catalog, []);

describe("金額", () => {
  it.each([
    ["", "要填金額"],
    ["   ", "要填金額"],
    ["0", "金額要大於 0"],
    ["00", "金額要大於 0"],
    ["-5", "金額不能是負的"],
    ["−5", "金額不能是負的"],
    ["1.5", "金額要是整數，不能有小數"],
    [".5", "金額要是整數，不能有小數"],
    ["abc", "金額只能是數字"],
    ["12元", "金額只能是數字"],
    ["99999999999999999", "金額太大了"],
  ])("%j 擋下來：%s", (text, error) => {
    expect(parseAmount(text)).toEqual({ ok: false, error });
  });
  it("整數、千分位可以", () => {
    expect(parseAmount(" 120 ")).toEqual({ ok: true, value: 120 });
    expect(parseAmount("1,001")).toEqual({ ok: true, value: 1_001 });
  });
  it("表單：只有金額是必填的；清掉日期、時間格式錯才擋", () => {
    expect(checkRecordForm(form())).toEqual([]);
    expect(checkRecordForm(form({ time: "" }))).toEqual([]);
    expect(checkRecordForm(form({ amount: "" }))).toEqual(["要填金額"]);
    expect(checkRecordForm(form({ date: "" }))).toEqual(["要填日期"]);
    expect(checkRecordForm(form({ time: "9點" }))).toEqual(["時間的格式不對"]);
  });
});

describe("帳戶選單", () => {
  it("支出：誰出那個人沒封存的，不含投資、共有；寶的含寶媽卡", () => {
    expect(ids(accountOptions(catalog.accounts, "expense", 步))).toEqual(["假錢包", "假銀行"]);
    expect(ids(accountOptions(catalog.accounts, "expense", 寶))).toEqual(["寶的錢包", "寶的銀行", "假媽媽卡"]);
  });
  it("收入：不含投資、不含寶媽卡", () => {
    expect(ids(accountOptions(catalog.accounts, "income", 寶))).toEqual(["寶的錢包", "寶的銀行"]);
  });
  it("封存的不在選單；改一筆時這一筆現在用的要在", () => {
    expect(ids(accountOptions(catalog.accounts, "expense", 步, 舊銀行.id))).toEqual(["假錢包", "假銀行", "舊銀行"]);
  });
  it("封存的寶的帳戶不在誰出選寶的清單裡", () => {
    const accounts = [{ ...寶的銀行, archived: true as const }, 寶的錢包];
    expect(ids(accountOptions(accounts, "expense", 寶))).toEqual(["寶的錢包"]);
  });
  it("這一筆現在用的不是這個人的（剛換了誰出）：不列", () => {
    expect(ids(accountOptions(catalog.accounts, "expense", 寶, 假銀行.id))).toEqual(["寶的錢包", "寶的銀行", "假媽媽卡"]);
  });
  it("存進去的不會是 core 擋的：選單裡每個帳戶記支出、收入都過得了", () => {
    for (const person of [步, 寶]) {
      for (const a of accountOptions(catalog.accounts, "expense", person)) {
        expect(check(buildExpense(form({ person, account: a.id, helped: person }), ctx))).toEqual([]);
      }
      for (const a of accountOptions(catalog.accounts, "income", person)) {
        expect(check(buildIncome(form({ kind: "income", person, account: a.id }), ctx))).toEqual([]);
      }
    }
  });
});

describe("罐子選單", () => {
  it("幫步：步的罐子；幫寶：寶的；幫共：兩個人都有的；日常在最前面；封存的不列", () => {
    expect(ids(jarOptions(catalog, 步))).toEqual([DAILY_JAR, "玩玩", "步罐"]);
    expect(ids(jarOptions(catalog, 寶))).toEqual([DAILY_JAR, "玩玩", "寶罐"]);
    expect(ids(jarOptions(catalog, "shared"))).toEqual([DAILY_JAR, "玩玩"]);
  });
  it("還沒有日常時也列得出來（存的時候同一批建）", () => {
    expect(ids(jarOptions({ ...catalog, jars: [] }, 步))).toEqual([DAILY_JAR]);
  });
  it("改一筆時這一筆現在用的要在（封存了也是）", () => {
    expect(ids(jarOptions(catalog, 步, 舊罐.id))).toContain("舊罐");
  });
  it("換幫誰：罐子還合就留著，不合回到日常", () => {
    const f = form({ jar: 玩玩.id });
    expect(withHelped(f, 寶, catalog).jar).toBe(玩玩.id);
    const mine = form({ jar: 步罐.id });
    expect(withHelped(mine, "shared", catalog).jar).toBe(DAILY_JAR);
    expect(withHelped(mine, 寶, catalog).jar).toBe(DAILY_JAR);
    expect(withHelped(form({ jar: 寶罐.id, helped: 寶 }), 步, catalog).jar).toBe(DAILY_JAR);
  });
  it("收入沒有罐子", () => {
    const m = buildIncome(form({ kind: "income", jar: 玩玩.id }), ctx).effects[0];
    expect(m && "items" in m).toBe(false);
    expect(JSON.stringify(m)).not.toContain("jar");
  });
});

describe("標籤", () => {
  const tags = [tag("甲"), tag("乙"), tag("丙")];
  const order = ["甲", "乙", "丙"] as unknown as TagId[];
  const used = (n: number, t: string): Event[] =>
    Array.from({ length: n }, (_, i) => buildExpense(form({ tags: [t as TagId] }), { ...ctx, id: `${t}${i}` as EventId }));

  it("第一次用：照預設的順序", () => {
    expect(ids(rankTags(tags, [], order))).toEqual(["甲", "乙", "丙"]);
  });
  it("用了 3 次的排到前面", () => {
    expect(ids(rankTags(tags, used(3, "丙"), order))).toEqual(["丙", "甲", "乙"]);
    expect(ids(rankTags(tags, [...used(3, "丙"), ...used(4, "乙")], order))).toEqual(["乙", "丙", "甲"]);
  });
  it("當場加的（不在 prefs）排在預設的後面", () => {
    expect(ids(rankTags([tag("新的"), ...tags], [], order))).toEqual(["甲", "乙", "丙", "新的"]);
  });
  it("收入、整筆的、品項的都算用過；同一則不重複算", () => {
    const income = buildIncome(form({ kind: "income", tags: ["丙" as TagId] }), ctx);
    expect(ids(rankTags(tags, [income], order))[0]).toBe("丙");
  });
  it("封存的、併進別的不列；這一筆正在用的要列", () => {
    const list = [tag("甲"), tag("舊", { archived: true }), tag("併", { mergedInto: "甲" as TagId })];
    expect(ids(rankTags(list, [], undefined))).toEqual(["甲"]);
    expect(ids(rankTags(list, [], undefined, ["舊" as TagId]))).toEqual(["甲", "舊"]);
  });
  it("收起來只先顯示最常用的幾個，選了的不會看不到；展開全部", () => {
    const many = Array.from({ length: QUICK_TAGS + 3 }, (_, i) => tag(`t${i}`));
    expect(visibleTags(many, [], false)).toHaveLength(QUICK_TAGS);
    const last = many.at(-1) as Tag;
    expect(ids(visibleTags(many, [last.id], false))).toContain(last.id);
    expect(visibleTags(many, [], true)).toHaveLength(many.length);
  });
  it("當場加：同名的用原本那個，空白擋下來", () => {
    expect(tagFromName(" 假押金 ", tags, "x" as TagId)).toEqual({ ok: true, value: { tag: { id: "x", name: "假押金" }, isNew: true } });
    expect(tagFromName("甲", tags, "x" as TagId)).toEqual({ ok: true, value: { tag: tags[0], isNew: false } });
    expect(tagFromName("  ", tags, "x" as TagId).ok).toBe(false);
  });
});

describe("預設值", () => {
  const now = new Date(2026, 9, 31, 8, 5);
  const defaults = (events: readonly Event[], kind: "expense" | "income" = "expense") => defaultForm(kind, { me: 步, catalog, events, now });
  const spent = (id: string, recordedAt: number, f: Partial<RecordForm>) => buildExpense(form(f), { ...ctx, id: id as EventId, now: recordedAt });

  it("第一次：自己出、幫自己、現金帳戶、日常、今天、現在", () => {
    expect(defaults([])).toMatchObject({ person: 步, helped: 步, account: 假錢包.id, jar: DAILY_JAR, date: "2026-10-31", time: "08:05", amount: "", tags: [] });
  });
  it("誰出、幫誰跟上一筆一樣，帳戶是那個人上次用的", () => {
    const events = [spent("a", 1, { account: 假銀行.id }), spent("b", 2, { person: 寶, account: 假媽媽卡.id, helped: "shared" })];
    expect(defaults(events)).toMatchObject({ person: 寶, helped: "shared", account: 假媽媽卡.id });
  });
  it("「上一筆」是最後記的，不是日期最晚的", () => {
    const events = [spent("a", 2, { date: "2026-01-01", helped: 寶 }), spent("b", 1, { date: "2026-10-30", helped: "shared" })];
    expect(defaults(events).helped).toBe(寶);
  });
  it("上一筆刪掉之後，回到再上一筆（刪掉的不在 events 裡）", () => {
    const a = spent("a", 1, { helped: 寶, account: 假銀行.id });
    const b = spent("b", 2, { helped: "shared", account: 假錢包.id });
    expect(defaults([a, b]).helped).toBe("shared");
    expect(defaults([a])).toMatchObject({ helped: 寶, account: 假銀行.id });
  });
  it("上次用的帳戶封存了：不帶它，往前找或回到現金", () => {
    expect(defaults([spent("a", 1, { account: 舊銀行.id })]).account).toBe(假錢包.id);
  });
  it("那個人沒有現金帳戶：不知道", () => {
    const noCash = { ...catalog, accounts: [假銀行] };
    expect(lastAccount(noCash, [], "expense", 步)).toBe("");
  });
  it("收入：誰收預設自己，上次收入進哪個帳戶；不會帶支出用的帳戶", () => {
    const events = [spent("a", 5, { person: 寶, account: 假媽媽卡.id, helped: 寶 }), buildIncome(form({ kind: "income", account: 假銀行.id }), { ...ctx, id: "i" as EventId })];
    expect(defaults(events, "income")).toMatchObject({ person: 步, account: 假銀行.id });
    expect(defaults([], "income").account).toBe(假錢包.id);
  });
  it("支出、收入各看各的：後來用假錢包付錢，收入還是帶上次收入的帳戶；反過來也是", () => {
    const income = buildIncome(form({ kind: "income", account: 假銀行.id }), { ...ctx, id: "i" as EventId, now: 1 });
    const later = spent("a", 2, { account: 假錢包.id });
    expect(defaults([income, later], "income").account).toBe(假銀行.id);
    const earlier = spent("b", 1, { account: 假錢包.id });
    const laterIncome = buildIncome(form({ kind: "income", account: 假銀行.id }), { ...ctx, id: "j" as EventId, now: 2 });
    expect(defaults([earlier, laterIncome]).account).toBe(假錢包.id);
  });
  it("換誰出：帳戶換成那個人的，不會留著另一個人的", () => {
    const events = [spent("a", 1, { person: 寶, account: 寶的銀行.id, helped: 寶 })];
    const f = form({ account: 假銀行.id });
    expect(withPerson(f, 寶, catalog, events).account).toBe(寶的銀行.id);
    expect(withPerson(f, 寶, catalog, []).account).toBe(寶的錢包.id);
    expect(check(buildExpense(withPerson(f, 寶, catalog, []), ctx))).toEqual([]);
    expect(withPerson(f, 步, catalog, events)).toBe(f);
  });
  it("切到收入：寶媽卡不會留著，金額與名稱留著", () => {
    const f = form({ person: 寶, account: 假媽媽卡.id, amount: "50", title: "假紅包" });
    const income = withKind(f, "income", { me: 步, catalog, events: [], now });
    expect(income).toMatchObject({ kind: "income", person: 步, account: 假錢包.id, amount: "50", title: "假紅包" });
  });
});

describe("表單 → 事件", () => {
  it("只填金額就能存：core 檢查過、餘額沒動、算日常", () => {
    const event = buildExpense(form({ amount: "120" }), ctx);
    expect(check(event)).toEqual([]);
    expect(event).toMatchObject({ id: "new", recordedBy: 步, recordedAt: 1_000, source: "manual", status: "confirmed", date: "2026-10-31", time: "12:00" });
    expect(event.title).toBeUndefined();
    const book = openBook(catalog, [event]);
    expect(book.total({ measure: "use", person: 步, where: { jar: DAILY_JAR } })).toBe(120);
    expect(book.total({ measure: "netWorth", person: 步 })).toBe(0);
  });
  it("選了帳戶：餘額、淨資產馬上少", () => {
    const book = openBook(catalog, [buildExpense(form({ amount: "120", account: 假銀行.id }), ctx)]);
    expect(book.total({ measure: "balance", where: { account: 假銀行.id } })).toBe(-120);
    expect(book.total({ measure: "netWorth", person: 步 })).toBe(-120);
  });
  it("名稱同時是事件的 title 與品項的 name；空白不寫欄位", () => {
    const event = buildExpense(form({ title: " 假早餐 " }), ctx);
    expect(event.title).toBe("假早餐");
    expect(event.effects[0]).toMatchObject({ items: [{ name: "假早餐" }] });
    const blank = buildExpense(form({ title: "  " }), ctx);
    expect("title" in blank).toBe(false);
    expect(JSON.stringify(blank)).not.toContain("name");
  });
  it("存進去的物件沒有 undefined（Firestore 不收）", () => {
    const hasUndefined = (x: unknown): boolean =>
      x === undefined || (typeof x === "object" && x !== null && Object.values(x).some(hasUndefined));
    expect(hasUndefined(buildExpense(form({ time: "" }), ctx))).toBe(false);
    expect(hasUndefined(buildIncome(form({ kind: "income", time: "" }), ctx))).toBe(false);
    expect(hasUndefined(recordChanges(form(), { ...ctx, catalog, newTags: [] }))).toBe(false);
  });
  it("步記「寶付、寶媽卡、幫寶、500」：步的帳戶沒動；寶的我付的不多算；寶的我用的 500", () => {
    const book = openBook(catalog, [buildExpense(form({ amount: "500", person: 寶, account: 假媽媽卡.id, helped: 寶 }), ctx)]);
    expect(book.total({ measure: "balance", person: 步 })).toBe(0);
    expect(book.total({ measure: "netWorth", person: 步 })).toBe(0);
    expect(book.total({ measure: "paid", person: 寶 })).toBe(0);
    expect(book.total({ measure: "use", person: 寶 })).toBe(500);
    expect(book.total({ measure: "use", person: 步 })).toBe(0);
    expect(book.debts({ channel: "othersCard", account: 假媽媽卡.id })[0]?.outstanding).toBe(500);
  });
  it("步記「步付、幫共、1,001」：步用 501、寶用 500（零頭算誰出）", () => {
    const event = buildExpense(form({ amount: "1,001", helped: "shared", account: 假銀行.id }), ctx);
    const book = openBook(catalog, [event]);
    expect(book.total({ measure: "use", person: 步 })).toBe(501);
    expect(book.total({ measure: "use", person: 寶 })).toBe(500);
    expect(book.total({ measure: "paid", person: 步 })).toBe(1_001);
    expect(book.total({ measure: "tab", person: 步 })).toBe(500);
  });
  it("收入：算收入，不在任何支出的加總（我用的、我付的都是 0）", () => {
    const book = openBook(catalog, [buildIncome(form({ kind: "income", amount: "900", account: 假銀行.id, tags: ["假吃吃" as TagId] }), ctx)]);
    expect(book.total({ measure: "income", person: 步 })).toBe(900);
    expect(book.total({ measure: "use", person: 步 })).toBe(0);
    expect(book.total({ measure: "paid", person: 步 })).toBe(0);
    expect(book.total({ measure: "balance", where: { account: 假銀行.id } })).toBe(900);
  });
  it("幫別人收：帳戶是寶的，步的數字不動", () => {
    const book = openBook(catalog, [buildIncome(form({ kind: "income", amount: "900", person: 寶, account: 寶的銀行.id }), ctx)]);
    expect(book.total({ measure: "income", person: 寶 })).toBe(900);
    expect(book.total({ measure: "netWorth", person: 步 })).toBe(0);
  });
  it("一次動作只寫一則事件", () => {
    expect(recordChanges(form(), { ...ctx, catalog, newTags: [] }).events).toHaveLength(1);
  });
  it("沒有日常：同一批建一個，ID 是常數，主人步和寶；有日常、收入都不建", () => {
    const empty = { ...catalog, jars: [] };
    expect(recordChanges(form(), { ...ctx, catalog: empty, newTags: [] }).jars).toEqual([{ id: DAILY_JAR, name: "日常", owners: [步, 寶] }]);
    expect(recordChanges(form(), { ...ctx, catalog, newTags: [] }).jars).toBeUndefined();
    expect(recordChanges(form({ kind: "income" }), { ...ctx, catalog: empty, newTags: [] }).jars).toBeUndefined();
  });
  it("當場加的標籤：有選到的才存", () => {
    const a = tag("新甲");
    const b = tag("新乙");
    const changes = recordChanges(form({ tags: [a.id] }), { ...ctx, catalog, newTags: [a, b] });
    expect(changes.tags).toEqual([a]);
    expect(changes.events?.[0]?.effects[0]).toMatchObject({ tags: [a.id] });
  });
});

describe("改一筆", () => {
  const original = (extra: Partial<RecordForm> = {}) => buildExpense(form({ amount: "300", title: "假午餐", account: 舊銀行.id, jar: 舊罐.id, tags: ["假吃吃" as TagId], ...extra }), ctx);
  const edit = (event: Event, f: Partial<RecordForm>) => {
    const was = formOf(event);
    if (was === null) throw new Error("打不開表單");
    return buildExpense({ ...was, ...f }, { id: "不該用到" as EventId, me: 步, now: 99_999, existing: event });
  };

  it("打開表單：值都對，封存的帳戶、罐子還在選單裡", () => {
    const f = formOf(original());
    expect(f).toMatchObject({ kind: "expense", amount: "300", title: "假午餐", person: 步, account: 舊銀行.id, jar: 舊罐.id, tags: ["假吃吃"], helped: 步 });
    expect(ids(accountOptions(catalog.accounts, "expense", 步, f?.account))).toContain(舊銀行.id);
    expect(ids(jarOptions(catalog, 步, f?.jar))).toContain(舊罐.id);
  });
  it("用封存的帳戶記過的一筆，改名稱再存：帳戶還是原本那個、餘額沒變、ID 都沒變", () => {
    const event = original();
    const changed = edit(event, { title: "新名稱" });
    expect(changed.effects[0]).toMatchObject({ account: 舊銀行.id });
    const balance = (e: Event) => openBook(catalog, [e]).total({ measure: "balance", where: { account: 舊銀行.id } });
    expect(balance(changed)).toBe(balance(event));
    expect(changed.id).toBe(event.id);
    expect(changed.recordedBy).toBe(event.recordedBy);
    expect(changed.recordedAt).toBe(event.recordedAt);
    expect(changed.effects[0]?.id).toBe(event.effects[0]?.id);
  });
  it("一筆與品項的 ID 沒換：退款還指得到", () => {
    const event = { ...original(), effects: [{ ...(original().effects[0] as object), id: "寫死的一筆", items: [{ id: "寫死的品項", amount: 300, jar: 舊罐.id, tags: [] }] }] } as unknown as Event;
    const changed = edit(event, { amount: "280", title: "新名稱" });
    expect(changed.effects[0]).toMatchObject({ id: "寫死的一筆", amount: 280, items: [{ id: "寫死的品項", amount: 280, name: "新名稱" }] });
    expect(changed.effects).toHaveLength(1);
  });
  it("名稱、時間清掉：欄位拿掉，不留舊的", () => {
    const changed = edit(original(), { title: "", time: "" });
    expect("title" in changed).toBe(false);
    expect("time" in changed).toBe(false);
    expect(JSON.stringify(changed.effects)).not.toContain("假午餐");
  });
  it("帳戶改成不知道：欄位拿掉，餘額回來", () => {
    const changed = edit(original(), { account: "" });
    expect(changed.effects[0] && "account" in changed.effects[0]).toBe(false);
  });
  it("表單沒有的欄位留著：不用還、比例、有疑問、備註、來源", () => {
    const base = original({ helped: "shared" });
    const m = base.effects[0] as object;
    const event = {
      ...base,
      note: "假備註",
      source: "voice",
      doubts: { bao: { at: 1 } },
      effects: [{ ...m, noRepay: true, beneficiary: { kind: "shared", weights: [{ person: 步, weight: 6 }, { person: 寶, weight: 4 }] } }],
    } as unknown as Event;
    const changed = edit(event, { title: "新名稱" });
    expect(changed).toMatchObject({ note: "假備註", source: "voice", doubts: { bao: { at: 1 } } });
    expect(changed.effects[0]).toMatchObject({ noRepay: true, beneficiary: { weights: [{ weight: 6 }, { weight: 4 }] } });
    // 幫誰真的換了才用新的
    expect(edit(event, { helped: 步 }).effects[0]).toMatchObject({ beneficiary: { kind: "person", person: 步 } });
  });
  it("收入改一筆：ID 留著", () => {
    const event = buildIncome(form({ kind: "income", amount: "50", tags: ["假吃吃" as TagId] }), ctx);
    const was = formOf(event);
    if (was === null) throw new Error("打不開表單");
    expect(was).toMatchObject({ kind: "income", amount: "50" });
    const changed = buildIncome({ ...was, amount: "70" }, { id: "不該用到" as EventId, me: 步, now: 9, existing: event });
    expect(changed.id).toBe(event.id);
    expect(changed.recordedAt).toBe(event.recordedAt);
    expect(changed.effects[0]).toMatchObject({ id: event.effects[0]?.id, amount: 70, tags: ["假吃吃"] });
  });
  it("表單表達不了的不打開：好幾項、品項自己的幫誰、轉帳、對帳", () => {
    const event = original();
    const m = event.effects[0] as object;
    const items = [{ id: "a", amount: 100, jar: DAILY_JAR, tags: [] }, { id: "b", amount: 200, jar: DAILY_JAR, tags: [] }];
    expect(formOf({ ...event, effects: [{ ...m, items }] } as unknown as Event)).toBeNull();
    expect(formOf({ ...event, effects: [{ ...m, items: [{ ...items[0], beneficiary: { kind: "person", person: 寶 } }] }] } as unknown as Event)).toBeNull();
    expect(formOf({ ...event, effects: [{ type: "money", id: "m1", kind: "transfer", from: "a", to: "b", amount: 1 }] } as unknown as Event)).toBeNull();
    expect(formOf({ ...event, effects: [{ type: "money", id: "m1", kind: "reconciliation", account: "a", actual: 1 }] } as unknown as Event)).toBeNull();
  });

  describe("有退款的那筆（02 擋的，畫面照它）", () => {
    const paid = buildExpense(form({ amount: "1000", account: 假銀行.id, date: "2026-10-20", time: "12:00" }), ctx);
    const m = paid.effects[0] as unknown as { id: EntryId; items: { id: ItemId }[] };
    const refund: Event = {
      id: "退款" as EventId,
      date: "2026-10-25",
      recordedBy: 步,
      recordedAt: 2_000,
      source: "manual",
      status: "confirmed",
      effects: [{ type: "money", id: "r1" as EntryId, kind: "refund", target: { event: paid.id, entry: m.id, item: (m.items[0] as { id: ItemId }).id }, amount: 300 }],
    };
    const all = [paid, refund];
    const codes = (f: Partial<RecordForm>) => validateEvent(edit(paid, f), catalog, all).map((p) => p.code);

    it("查得到它有退款；沒退款的沒有", () => {
      expect(isRefunded(paid.id, all)).toBe(true);
      expect(isRefunded(paid.id, [paid])).toBe(false);
    });
    it("改名稱、罐子、標籤、同一個人的帳戶可以", () => {
      expect(codes({ title: "新名稱", jar: 玩玩.id, tags: ["假吃吃" as TagId], account: 假錢包.id })).toEqual([]);
    });
    it("金額改到比已退的少、日期改到退款之後、誰出、幫誰：core 擋，白話在 problems.ts", () => {
      expect(codes({ amount: "200" })).toContain("refunded-item-changed");
      expect(codes({ date: "2026-10-26" })).toContain("refunded-item-changed");
      expect(codes({ person: 寶, account: "" })).toContain("refunded-item-changed");
      expect(codes({ helped: "shared" })).toContain("refunded-item-changed");
      expect(codes({ amount: "300" })).toEqual([]);
    });
  });
});

describe("流水頁", () => {
  const spent = (id: string, f: Partial<RecordForm>) => buildExpense(form(f), { ...ctx, id: id as EventId });
  const days = (events: readonly Event[], filter = {}) => flowDays(events, catalog, 步, filter);

  it("依日期倒排，同一天一組，新的在上面（時間 → 記下來的時間）", () => {
    const events = [
      spent("早", { date: "2026-10-30", time: "08:00" }),
      spent("晚", { date: "2026-10-30", time: "20:00" }),
      spent("新", { date: "2026-10-31", time: "" }),
    ];
    const list = days(events);
    expect(list.map((d) => d.date)).toEqual(["2026-10-31", "2026-10-30"]);
    expect(list[1]?.rows.map((r) => r.event)).toEqual(["晚", "早"]);
  });
  it("支出是負的、收入是正的、帳戶的名字", () => {
    const rows = days([spent("a", { amount: "120", account: 假銀行.id, time: "09:00" }), buildIncome(form({ kind: "income", amount: "900", time: "10:00" }), { ...ctx, id: "b" as EventId })])[0]?.rows;
    expect(rows?.map((r) => r.amount)).toEqual([900, -120]);
    expect(rows?.[1]?.account).toBe("假銀行");
    expect(rows?.[0]?.account).toBeUndefined();
  });
  it("誰出 → 幫誰：幫自己付的不用寫；幫共、幫對方要寫", () => {
    const who = (f: Partial<RecordForm>) => days([spent("a", f)])[0]?.rows[0]?.who;
    expect(who({})).toBeUndefined();
    expect(who({ helped: "shared" })).toBe("步 → 共");
    expect(who({ helped: 寶 })).toBe("步 → 寶");
    expect(who({ person: 寶, helped: 步 })).toBe("寶 → 步");
    expect(who({ person: 寶, helped: "shared" })).toBe("寶 → 共");
    // 步幫寶記寶自己付的：不寫的話看起來像步花的
    expect(who({ person: 寶, helped: 寶 })).toBe("寶自己付");
  });
  it("別人收的收入寫出來，自己收的不用", () => {
    const income = (person: PersonId) => days([buildIncome(form({ kind: "income", person }), ctx)])[0]?.rows[0]?.who;
    expect(income(步)).toBeUndefined();
    expect(income(寶)).toBe("寶收");
  });
  it("沒有名稱時用標籤，再沒有用種類", () => {
    const title = (e: Event) => days([e])[0]?.rows[0]?.title;
    expect(title(spent("a", { title: "假早餐", tags: ["假吃吃" as TagId] }))).toBe("假早餐");
    expect(title(spent("a", { tags: ["假吃吃" as TagId, "假車錢" as TagId] }))).toBe("假吃吃、假車錢");
    expect(title(spent("a", {}))).toBe("支出");
    expect(title(buildIncome(form({ kind: "income" }), ctx))).toBe("收入");
  });
  it("依帳戶篩", () => {
    const events = [spent("a", { account: 假銀行.id }), spent("b", { account: 假錢包.id }), spent("c", {})];
    expect(days(events, { account: 假銀行.id })[0]?.rows.map((r) => r.event)).toEqual(["a"]);
  });
  it("轉帳、對帳這一支還不列（06 接）；收件匣裡的不列", () => {
    const transfer = { ...spent("t", {}), effects: [{ type: "money", id: "m1", kind: "transfer", from: "a", to: "b", amount: 1 }] } as unknown as Event;
    const pending: Event = { ...spent("p", {}), status: "pending" };
    expect(days([transfer, pending])).toEqual([]);
  });
});
