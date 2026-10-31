// 預設資料對著模擬器（stage-1 issue 03）：匯入、套用、重置後再套用、按兩次。金額、名稱都是假的。

import { openBook, type Account, type AccountId, type Catalog, type Event, type PersonId } from "@baobu/core";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, type DocumentData } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DAILY_JAR, type Presets } from "../src/presets";
import { resetMine } from "../src/reset";
import {
  applyPresets,
  saveAccountNote,
  saveAccountOrder,
  savePresets,
  watchCatalog,
  watchEvents,
  watchPrefs,
  watchPresets,
  type Prefs,
} from "../src/store";
import { asFirestore, startEmulator } from "./emulator";

const K = "presets-test";
const 步 = "bu" as PersonId;
const 寶 = "bao" as PersonId;
const 步的帳號 = "uid-bu";
const 寶的帳號 = "uid-bao";
const 假銀行 = "a-bank" as AccountId;
const 假投資 = "shared" as AccountId;
const 寶的假銀行 = "b-bank" as AccountId;

const 假預設 = {
  asOf: "2026-10-01",
  accounts: [
    { id: "a-wallet", name: "假錢包", kind: "cash", owners: [步], balance: 1111 },
    { id: 假銀行, name: "假銀行", kind: "bank", owners: [步], note: "假備註", balance: 22222 },
    { id: 寶的假銀行, name: "寶的假銀行", kind: "bank", owners: [寶] },
    { id: 假投資, name: "假投資", kind: "investment", owners: [步, 寶] },
  ],
  jars: [
    { id: DAILY_JAR, name: "日常", owners: [步, 寶] },
    { id: "j-bao", name: "寶的假罐子", owners: [寶] },
  ],
  tags: [
    { id: "t-2", name: "假標籤二" },
    { id: "t-1", name: "假標籤一" },
  ],
  transfers: [
    { from: 假銀行, to: 假投資, amount: 4000 },
    { from: 寶的假銀行, to: 假投資, amount: 700 },
  ],
} as unknown as Presets;

const 空的王國: Catalog = {
  people: [
    { id: 步, name: "步" },
    { id: 寶, name: "寶" },
  ],
  accounts: [],
  jars: [],
  tags: [],
};

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await startEmulator();
});
afterAll(async () => {
  await env.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = asFirestore(ctx.firestore());
    await setDoc(doc(db, `kingdoms/${K}`), { founder: 步的帳號, createdAt: serverTimestamp() });
    await setDoc(doc(db, `kingdoms/${K}/members/${步的帳號}`), { person: 步 });
    await setDoc(doc(db, `kingdoms/${K}/members/${寶的帳號}`), { person: 寶 });
    await setDoc(doc(db, `kingdoms/${K}/people/${步}`), { id: 步, name: "步" });
    await setDoc(doc(db, `kingdoms/${K}/people/${寶}`), { id: 寶, name: "寶" });
  });
});

const 步的 = () => asFirestore(env.authenticatedContext(步的帳號).firestore());
const 寶的 = () => asFirestore(env.authenticatedContext(寶的帳號).firestore());

/** 伺服器上的（不經過規則）。withSecurityRulesDisabled 不回傳回呼的結果，要自己接出來 */
async function onServer(path: string): Promise<DocumentData | undefined> {
  let data: DocumentData | undefined;
  await env.withSecurityRulesDisabled(async (ctx) => {
    data = (await getDoc(doc(asFirestore(ctx.firestore()), path))).data();
  });
  return data;
}

async function 算幾份(name: string): Promise<number> {
  let n = -1;
  await env.withSecurityRulesDisabled(async (ctx) => {
    n = (await getDocs(collection(asFirestore(ctx.firestore()), `kingdoms/${K}/${name}`))).size;
  });
  return n;
}

function 套用(db: ReturnType<typeof 步的>, now: number) {
  const result = applyPresets(db, K, 步, 假預設, { catalog: 空的王國, events: [] }, now);
  if (!result.ok) throw new Error(JSON.stringify(result.problems));
  return result.written;
}

/** 照 app 的路讀回來：監聽參考資料與事件，打開帳本 */
async function 讀回來(db: ReturnType<typeof 步的>, me: PersonId) {
  const [catalog, events] = await Promise.all([
    new Promise<Catalog>((resolve) => {
      const stop = watchCatalog(db, K, (c) => { stop(); resolve(c); }, (e) => { throw e; });
    }),
    new Promise<readonly Event[]>((resolve) => {
      const stop = watchEvents(db, K, me, (list, fromCache) => { if (!fromCache) { stop(); resolve(list); } }, (e) => { throw e; });
    }),
  ]);
  return { catalog, events, book: openBook(catalog, events) };
}

function 帳本對不對(book: ReturnType<typeof openBook>) {
  const 餘額 = (id: string) => book.total({ measure: "balance", where: { account: id as Account["id"] } });
  expect(book.problems).toEqual([]);
  expect(餘額("a-wallet")).toBe(1111);
  expect(餘額(假銀行)).toBe(22222);
  expect(book.total({ measure: "balance", person: 步, where: { account: 假投資 } })).toBe(4000);
  expect(book.total({ measure: "balance", person: 寶, where: { account: 假投資 } })).toBe(700);
  expect(book.total({ measure: "netWorth", person: 步 })).toBe(1111 + 22222 + 4000);
  expect(book.lines({ measure: "reconcileDiff" })).toEqual([]);
  for (const measure of ["use", "paid", "income"] as const) expect(book.total({ measure, person: 步 })).toBe(0);
}

describe("匯入", () => {
  it("存進自己的文件；還沒匯入是 null；寶讀不到", async () => {
    const db = 步的();
    const seen: (Presets | null)[] = [];
    const stop = watchPresets(db, K, 步, (p) => seen.push(p), (e) => { throw e; });
    await vi.waitFor(() => expect(seen).toEqual([null]));
    await savePresets(db, K, 步, 假預設);
    await vi.waitFor(() => expect(seen.at(-1)).toEqual(假預設));
    stop();
    expect(await onServer(`kingdoms/${K}/presets/${步}`)).toEqual(假預設);
    await expect(getDoc(doc(寶的(), `kingdoms/${K}/presets/${步}`))).rejects.toThrow();
  });
});

describe("套用", () => {
  it("存進去再讀回來，數字是檔案寫的；帳戶文件沒有餘額與備註；備註與標籤順序在 prefs", async () => {
    const db = 步的();
    await 套用(db, 1_000_000);
    const { book, catalog } = await 讀回來(db, 步);
    帳本對不對(book);
    expect(catalog.accounts).toHaveLength(4);
    expect(await onServer(`kingdoms/${K}/accounts/${假銀行}`)).toEqual({ id: 假銀行, name: "假銀行", kind: "bank", owners: [步], currency: "TWD" });
    expect(await onServer(`kingdoms/${K}/prefs/${步}`)).toEqual({ tags: ["t-2", "t-1"], accountNotes: { [假銀行]: "假備註" } });
  });

  it("已經拖過的帳戶排序不會被套用蓋掉（只寫備註與標籤順序）", async () => {
    const db = 步的();
    await saveAccountOrder(db, K, 步, [假銀行]);
    await 套用(db, 1_000_000);
    expect((await onServer(`kingdoms/${K}/prefs/${步}`))?.accounts).toEqual([假銀行]);
  });

  it("檔案沒有寫備註時，不會把原本的備註蓋掉", async () => {
    const db = 步的();
    await saveAccountNote(db, K, 步, 假投資, "原本的假備註");
    const 沒有備註 = {
      ...假預設,
      accounts: 假預設.accounts.map(({ note: _note, ...account }) => account),
    } as Presets;
    const result = applyPresets(db, K, 步, 沒有備註, { catalog: 空的王國, events: [] }, 1_000_000);
    if (!result.ok) throw new Error(JSON.stringify(result.problems));
    await result.written;
    expect((await onServer(`kingdoms/${K}/prefs/${步}`))?.accountNotes).toEqual({ [假投資]: "原本的假備註" });
  });

  it("初始餘額的參與者只有步：寶讀得到投入、讀不到步的實際餘額", async () => {
    const db = 步的();
    await 套用(db, 1_000_000);
    expect((await onServer(`kingdoms/${K}/events/preset-opening-${假銀行}`))?.participants).toEqual([步]);
    expect((await onServer(`kingdoms/${K}/events/preset-transfer-0`))?.participants).toEqual([寶, 步]);
    await expect(getDoc(doc(寶的(), `kingdoms/${K}/events/preset-opening-${假銀行}`))).rejects.toThrow();
    const { events } = await 讀回來(寶的(), 寶);
    expect(events.map((e) => e.id).sort()).toEqual(["preset-transfer-0", "preset-transfer-1"]);
    expect(JSON.stringify(events)).not.toContain("22222");
  });

  it("連按兩次（兩台裝置都按）：第二次整批拒絕，給白話的說明，什麼都沒多寫、數字不會變兩倍", async () => {
    await 套用(步的(), 1_000_000);
    const before = await 算幾份("events");
    await expect(套用(步的(), 2_000_000)).rejects.toThrow("已經套用過");
    expect(await 算幾份("events")).toBe(before);
    expect((await onServer(`kingdoms/${K}/events/preset-transfer-0`))?.recordedAt).toBe(1_000_000);
    帳本對不對((await 讀回來(步的(), 步)).book);
  });

  it("不是成員的人套用不了，什麼都沒寫", async () => {
    const 路人 = asFirestore(env.authenticatedContext("uid-stranger").firestore());
    await expect(套用(路人, 1_000_000)).rejects.toThrow();
    expect(await 算幾份("accounts")).toBe(0);
  });

  it("檔案和 core 對不起來（存之前檢查不過）：不寫、回傳問題", async () => {
    const 壞的 = { ...假預設, transfers: [{ from: 假銀行, to: 假銀行, amount: 1 }] } as unknown as Presets;
    const result = applyPresets(步的(), K, 步, 壞的, { catalog: 空的王國, events: [] }, 1);
    expect(result.ok).toBe(false);
    expect(await 算幾份("accounts")).toBe(0);
  });
});

describe("重置之後", () => {
  it("預設資料還在；再按套用，數字一樣；寶的帳戶、寶的罐子還在也過得了（同 ID 覆蓋）", async () => {
    const db = 步的();
    await savePresets(db, K, 步, 假預設);
    await 套用(db, 1_000_000);

    await resetMine(步的(), K, 步);
    expect(await onServer(`kingdoms/${K}/presets/${步}`)).toEqual(假預設);
    expect(await 算幾份("events")).toBe(0);
    expect(await onServer(`kingdoms/${K}/accounts/${假銀行}`)).toBeUndefined();
    expect(await onServer(`kingdoms/${K}/accounts/${寶的假銀行}`)).toBeDefined();
    expect(await onServer(`kingdoms/${K}/jars/j-bao`)).toBeDefined();

    await 套用(步的(), 2_000_000);
    帳本對不對((await 讀回來(步的(), 步)).book);
    expect((await onServer(`kingdoms/${K}/events/preset-transfer-0`))?.recordedAt).toBe(2_000_000);
  });

  it("備註與標籤順序也回來了", async () => {
    const db = 步的();
    await 套用(db, 1_000_000);
    await resetMine(步的(), K, 步);
    expect(await onServer(`kingdoms/${K}/prefs/${步}`)).toBeUndefined();
    await 套用(步的(), 2_000_000);
    const prefs = await new Promise<Prefs>((resolve) => {
      const stop = watchPrefs(步的(), K, 步, (p) => { stop(); resolve(p); }, (e) => { throw e; });
    });
    expect(prefs.accountNotes).toEqual({ [假銀行]: "假備註" });
    expect(prefs.tags).toEqual(["t-2", "t-1"]);
  });
});

describe("一批的大小", () => {
  it("帳戶、罐子、標籤、事件加起來 60 份：同一批過得了規則（比真實資料還多一點）", async () => {
    const 大的 = {
      ...假預設,
      tags: Array.from({ length: 50 }, (_, i) => ({ id: `t-${i}`, name: `假標籤${i}` })),
    } as unknown as Presets;
    const result = applyPresets(步的(), K, 步, 大的, { catalog: 空的王國, events: [] }, 1_000_000);
    if (!result.ok) throw new Error(JSON.stringify(result.problems));
    await result.written;
    expect(await 算幾份("tags")).toBe(50);
  });
});
