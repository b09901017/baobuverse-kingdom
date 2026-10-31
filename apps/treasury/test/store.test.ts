// store.ts 對著模擬器：存進去再讀回來，core 算出的數字一樣；斷網時記一筆，恢復網路後同步上去。

import { openBook, type Account, type AccountId, type Catalog, type Event, type PersonId } from "@baobu/core";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  disableNetwork,
  doc,
  enableNetwork,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { saveAccountNote, saveAccountOrder, save, watchCatalog, watchEvents, watchPrefs, type Prefs } from "../src/store";
import { asFirestore, startEmulator } from "./emulator";

const K = "store-test";
const 步 = "bu" as PersonId;
const 寶 = "bao" as PersonId;
const 步的帳號 = "uid-bu";

const people = [
  { id: 步, name: "步" },
  { id: 寶, name: "寶" },
];
const jars = [{ id: "daily", name: "日常", owners: [步, 寶] }] as unknown as Catalog["jars"];
const accounts = [
  { id: "post", name: "郵局", kind: "bank", owners: [步], currency: "TWD" },
  { id: "cash", name: "錢包", kind: "cash", owners: [步], currency: "TWD" },
] as unknown as Account[];
const catalog = { people, jars, accounts, tags: [] } as Catalog;

const base = { recordedBy: 步, source: "manual", status: "confirmed" } as const;
const events = [
  {
    ...base,
    id: "e1",
    date: "2026-10-01",
    recordedAt: 1,
    title: "郵局開始的餘額",
    effects: [{ type: "money", id: "m1", kind: "reconciliation", account: "post", actual: 10_000 }],
  },
  {
    ...base,
    id: "e2",
    date: "2026-10-02",
    time: "19:30",
    recordedAt: 2,
    title: "家樂福",
    effects: [
      {
        type: "money",
        id: "m1",
        kind: "expense",
        payer: 步,
        account: "post",
        amount: 820,
        beneficiary: { kind: "shared" },
        tags: [],
        items: [
          { id: "i1", name: "衛生紙", amount: 650, jar: "daily", tags: [] },
          { id: "i2", name: "零食", amount: 170, jar: "daily", tags: [], beneficiary: { kind: "person", person: 步 } },
        ],
      },
    ],
  },
  {
    ...base,
    id: "e3",
    date: "2026-10-03",
    recordedAt: 3,
    effects: [{ type: "money", id: "m1", kind: "transfer", from: "post", to: "cash", amount: 1_000 }],
  },
  {
    // 寶幫共付、步記的：寶的帳戶步看不到，就空著
    ...base,
    id: "e4",
    date: "2026-10-04",
    recordedAt: 4,
    effects: [
      {
        type: "money",
        id: "m1",
        kind: "expense",
        payer: 寶,
        amount: 300,
        beneficiary: { kind: "shared" },
        tags: [],
        items: [{ id: "i1", amount: 300, jar: "daily", tags: [] }],
      },
    ],
  },
] as unknown as Event[];

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
  });
});

const 步的 = () => asFirestore(env.authenticatedContext(步的帳號).firestore());

/** 讀伺服器上的文件（不經過規則、不經過任何人的快取） */
async function onServer(path: string) {
  // withSecurityRulesDisabled 不回傳回呼的結果，要自己接出來
  let data: DocumentData | undefined;
  await env.withSecurityRulesDisabled(async (ctx) => {
    data = (await getDoc(doc(asFirestore(ctx.firestore()), path))).data();
  });
  return data;
}

/** 等到監聽收到符合條件的結果 */
function waitFor<T>(watch: (resolve: (value: T) => void) => () => void): Promise<T> {
  return new Promise((resolve) => {
    const stop = watch((value) => {
      stop();
      resolve(value);
    });
  });
}

const numbers = (book: ReturnType<typeof openBook>) => ({
  郵局: book.total({ measure: "balance", where: { account: "post" as Account["id"] } }),
  錢包: book.total({ measure: "balance", where: { account: "cash" as Account["id"] } }),
  步的我用的: book.total({ measure: "use", person: 步 }),
  步的我付的: book.total({ measure: "paid", person: 步 }),
  步的往來帳: book.total({ measure: "tab", person: 步 }),
  步的淨資產: book.total({ measure: "netWorth", person: 步 }),
});

describe("存進去再讀回來", () => {
  it("事件一模一樣，core 算出的數字跟存之前一樣", async () => {
    const db = 步的();
    const result = save(db, K, { people, jars, accounts, events }, { catalog: { ...catalog, people: [], jars: [], accounts: [] }, events: [] });
    if (!result.ok) throw new Error(JSON.stringify(result.problems));
    await result.written;

    const [readCatalog, readEvents] = await Promise.all([
      waitFor<Catalog>((done) => watchCatalog(db, K, done, (e) => { throw e; })),
      waitFor<readonly Event[]>((done) =>
        watchEvents(db, K, 步, (list, fromCache) => { if (!fromCache && list.length === 4) done(list); }, (e) => { throw e; }),
      ),
    ]);

    const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);
    expect([...readEvents].sort(byId)).toEqual(events);
    expect([...readCatalog.accounts].sort(byId)).toEqual([...accounts].sort(byId));

    const before = numbers(openBook(catalog, events));
    const after = numbers(openBook(readCatalog, readEvents));
    expect(after).toEqual(before);
    // 確定真的算了東西：郵局 10000 − 820 − 1000
    expect(before.郵局).toBe(8_180);
  });

  it("文件多存參與者、伺服器時間、刪除標記、版本", async () => {
    const result = save(步的(), K, { people, jars, accounts, events }, { catalog, events: [] });
    if (!result.ok) throw new Error(JSON.stringify(result.problems));
    await result.written;
    const e4 = await onServer(`kingdoms/${K}/events/e4`);
    // participantsOf 回傳排序過的
    expect(e4?.participants).toEqual([寶, 步]);
    expect(e4?.updatedAt).toBeInstanceOf(Timestamp);
    expect(e4?.deleted).toBe(false);
    expect(e4?.v).toBe(1);
  });

  it("core 檢查不過的事件不存，回傳問題", async () => {
    const [, broken] = events as [Event, Event];
    const wrong = { ...broken, id: "bad", effects: [{ ...broken.effects[0], amount: 999 }] } as unknown as Event;
    const result = save(步的(), K, { events: [wrong] }, { catalog, events: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.map((p) => p.code)).toContain("items-sum-mismatch");
    expect(await onServer(`kingdoms/${K}/events/bad`)).toBeUndefined();
  });
});

describe("對方的帳戶", () => {
  const 寶媽卡 = { id: "bao-mom", name: "寶媽卡", kind: "credit-card", owners: [寶], currency: "TWD", paidByOthers: true } as unknown as Account;

  it("watchCatalog 讀得到寶的帳戶：步記「寶刷寶媽卡」存得進去、參與者有寶", async () => {
    const db = 步的();
    const ready = save(db, K, { people, jars, accounts: [...accounts, 寶媽卡] }, { catalog, events: [] });
    if (!ready.ok) throw new Error(JSON.stringify(ready.problems));
    await ready.written;

    const read = await waitFor<Catalog>((done) => watchCatalog(db, K, done, (e) => { throw e; }));
    expect(read.accounts.map((a) => a.id)).toContain("bao-mom");

    const 刷寶媽卡 = {
      ...base,
      id: "mom",
      date: "2026-10-05",
      recordedAt: 5,
      effects: [
        {
          type: "money",
          id: "m1",
          kind: "expense",
          payer: 寶,
          account: "bao-mom",
          amount: 3_000,
          beneficiary: { kind: "person", person: 寶 },
          tags: [],
          items: [{ id: "i1", amount: 3_000, jar: "daily", tags: [] }],
        },
      ],
    } as unknown as Event;
    const result = save(db, K, { events: [刷寶媽卡] }, { catalog: read, events: [] });
    if (!result.ok) throw new Error(JSON.stringify(result.problems));
    await result.written;
    expect((await onServer(`kingdoms/${K}/events/mom`))?.participants).toEqual([寶, 步]);
  });
});

describe("自己的排序與帳戶備註（同一份文件）", () => {
  const 郵局 = "post" as AccountId;
  const 錢包 = "cash" as AccountId;
  const 我的 = `kingdoms/${K}/prefs/${步}`;

  it("改排序時備註留著、改備註時排序留著", async () => {
    const db = 步的();
    await saveAccountNote(db, K, 步, 郵局, "假備註甲");
    await saveAccountOrder(db, K, 步, [錢包, 郵局]);
    expect(await onServer(我的)).toEqual({ accounts: [錢包, 郵局], accountNotes: { post: "假備註甲" } });

    await saveAccountNote(db, K, 步, 錢包, "日常");
    expect(await onServer(我的)).toEqual({ accounts: [錢包, 郵局], accountNotes: { post: "假備註甲", cash: "日常" } });

    await saveAccountOrder(db, K, 步, [郵局, 錢包]);
    expect(await onServer(我的)).toEqual({ accounts: [郵局, 錢包], accountNotes: { post: "假備註甲", cash: "日常" } });
  });

  it("備註改成空的就拿掉那一格，別的備註留著", async () => {
    const db = 步的();
    await saveAccountNote(db, K, 步, 郵局, "假備註甲");
    await saveAccountNote(db, K, 步, 錢包, "日常");
    await saveAccountNote(db, K, 步, 郵局, "");
    expect(await onServer(我的)).toEqual({ accountNotes: { cash: "日常" } });
  });

  it("watchPrefs：還沒存過是空的，存了就收到", async () => {
    const db = 步的();
    const seen: Prefs[] = [];
    const stop = watchPrefs(db, K, 步, (prefs) => seen.push(prefs), (e) => { throw e; });
    await vi.waitFor(() => expect(seen).toEqual([{}]));
    await saveAccountNote(db, K, 步, 郵局, "假備註甲");
    await vi.waitFor(() => expect(seen.at(-1)).toEqual({ accountNotes: { post: "假備註甲" } }));
    stop();
  });
});

describe("斷網", () => {
  it("斷網時記一筆，畫面馬上看得到；恢復網路後同步上去", async () => {
    const db = 步的();
    const ready = save(db, K, { people, jars, accounts }, { catalog, events: [] });
    if (!ready.ok) throw new Error("參考資料存不進去");
    await ready.written;

    await disableNetwork(db);
    const [, offline] = events as [Event, Event];
    const result = save(db, K, { events: [offline] }, { catalog, events: [] });
    if (!result.ok) throw new Error(JSON.stringify(result.problems));

    // 斷網時：監聽從本機快取看得到這一筆，伺服器上還沒有
    const seen = await waitFor<{ list: readonly Event[]; fromCache: boolean }>((done) =>
      watchEvents(db, K, 步, (list, fromCache) => { if (list.length === 1) done({ list, fromCache }); }, (e) => { throw e; }),
    );
    expect(seen.fromCache).toBe(true);
    expect(seen.list[0]).toEqual(offline);
    expect(await onServer(`kingdoms/${K}/events/${offline.id}`)).toBeUndefined();

    // 恢復網路：寫入完成，伺服器上有了
    await enableNetwork(db);
    await result.written;
    const synced = await onServer(`kingdoms/${K}/events/${offline.id}`);
    expect(synced?.title).toBe(offline.title);
    // 那一筆是共付的，參與者有寶
    expect(synced?.participants).toEqual([寶, 步]);
  });
});
