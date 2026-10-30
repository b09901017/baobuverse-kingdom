// firestore.rules 的測試：issue 05 的判準與段二留的案例（05 的 Comments）。

import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { asFirestore, startEmulator } from "./emulator";

const K = "kingdoms/test";
const 步 = "bu";
const 寶 = "bao";
const 步的帳號 = "uid-bu";
const 寶的帳號 = "uid-bao";
const 路人的帳號 = "uid-stranger";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await startEmulator();
});
afterAll(async () => {
  await env.cleanup();
});

/** 王國已經建好，步是成員；寶還沒有成員文件（階段 6 才有） */
beforeEach(async () => {
  await env.clearFirestore();
  await seed({
    [K]: { founder: 步的帳號, createdAt: serverTimestamp() },
    [`${K}/members/${步的帳號}`]: { person: 步 },
    [`${K}/people/${步}`]: { id: 步, name: "步" },
    [`${K}/people/${寶}`]: { id: 寶, name: "寶" },
    [`${K}/jars/daily`]: { id: "daily", name: "日常", owners: [步, 寶] },
    [`${K}/accounts/post`]: account("post", [步]),
    [`${K}/accounts/bao-bank`]: account("bao-bank", [寶]),
    [`${K}/accounts/crypto`]: account("crypto", [步, 寶], "investment"),
  });
});

function seed(docs: Record<string, DocumentData>): Promise<void> {
  return env.withSecurityRulesDisabled(async (ctx) => {
    const db = asFirestore(ctx.firestore());
    for (const [path, data] of Object.entries(docs)) await setDoc(doc(db, path), data);
  });
}

/** 階段 6：寶有了成員文件 */
const 寶加入 = () => seed({ [`${K}/members/${寶的帳號}`]: { person: 寶 } });

const as = (uid: string): Firestore => asFirestore(env.authenticatedContext(uid).firestore());
const 沒登入 = (): Firestore => asFirestore(env.unauthenticatedContext().firestore());

function account(id: string, owners: string[], kind = "bank"): DocumentData {
  return { id, name: id, kind, owners, currency: "TWD" };
}

/** 固定花費：每月 5 號從郵局付房租 */
function recurring(id: string, owner: string): DocumentData {
  return {
    id,
    owner,
    name: "房租",
    amount: 12000,
    every: "month",
    day: 5,
    account: "post",
    beneficiary: { kind: "person", person: owner },
    jar: "daily",
    tags: [],
  };
}

/** 一則事件文件：預設是步記的、步幫步付 */
function eventDoc(id: string, overrides: DocumentData = {}): DocumentData {
  return {
    id,
    date: "2026-10-30",
    recordedBy: 步,
    recordedAt: 1_761_800_000_000,
    source: "manual",
    status: "confirmed",
    effects: [
      {
        type: "money",
        id: "e1",
        kind: "expense",
        payer: 步,
        account: "post",
        amount: 120,
        beneficiary: { kind: "person", person: 步 },
        tags: [],
        items: [{ id: "i1", amount: 120, jar: "daily", tags: [] }],
      },
    ],
    participants: [步],
    updatedAt: serverTimestamp(),
    deleted: false,
    v: 1,
    ...overrides,
  };
}

/** 寶幫共付、步記的：參與者是步和寶 */
const 寶幫共付步記的 = (id: string) =>
  eventDoc(id, {
    participants: [步, 寶],
    effects: [
      {
        type: "money",
        id: "e1",
        kind: "expense",
        payer: 寶,
        amount: 820,
        beneficiary: { kind: "shared" },
        tags: [],
        items: [{ id: "i1", amount: 820, jar: "daily", tags: [] }],
      },
    ],
  });

describe("沒登入", () => {
  it("每個路徑都讀不到", async () => {
    await seed({ [`${K}/events/a`]: eventDoc("a") });
    const db = 沒登入();
    await assertFails(getDoc(doc(db, K)));
    await assertFails(getDoc(doc(db, `${K}/members/${步的帳號}`)));
    await assertFails(getDoc(doc(db, `${K}/people/${步}`)));
    await assertFails(getDoc(doc(db, `${K}/accounts/post`)));
    await assertFails(getDoc(doc(db, `${K}/events/a`)));
    await assertFails(getDocs(query(collection(db, `${K}/events`), where("participants", "array-contains", 步))));
  });

  it("每個路徑都寫不了", async () => {
    const db = 沒登入();
    await assertFails(setDoc(doc(db, "kingdoms/new"), { founder: "x", createdAt: serverTimestamp() }));
    await assertFails(setDoc(doc(db, `${K}/events/a`), eventDoc("a")));
    await assertFails(setDoc(doc(db, `${K}/people/${步}`), { id: 步, name: "步" }));
  });
});

describe("登入了但不是成員", () => {
  it("讀不到王國裡的任何東西", async () => {
    await seed({ [`${K}/events/a`]: eventDoc("a") });
    const db = as(路人的帳號);
    await assertFails(getDoc(doc(db, K)));
    await assertFails(getDoc(doc(db, `${K}/people/${步}`)));
    await assertFails(getDoc(doc(db, `${K}/accounts/post`)));
    await assertFails(getDoc(doc(db, `${K}/events/a`)));
    await assertFails(getDoc(doc(db, `${K}/members/${步的帳號}`)));
  });

  it("不能自己加進已經有人的王國", async () => {
    const db = as(路人的帳號);
    await assertFails(setDoc(doc(db, `${K}/members/${路人的帳號}`), { person: 步 }));
    // 改王國的建立者也不行
    await assertFails(setDoc(doc(db, K), { founder: 路人的帳號, createdAt: serverTimestamp() }));
    const batch = writeBatch(db);
    batch.set(doc(db, K), { founder: 路人的帳號, createdAt: serverTimestamp() });
    batch.set(doc(db, `${K}/members/${路人的帳號}`), { person: 步 });
    await assertFails(batch.commit());
  });

  it("寫不了事件、帳戶、參考資料、固定花費、排序", async () => {
    const db = as(路人的帳號);
    await assertFails(setDoc(doc(db, `${K}/events/a`), eventDoc("a")));
    await assertFails(setDoc(doc(db, `${K}/accounts/x`), account("x", [步])));
    await assertFails(setDoc(doc(db, `${K}/jars/x`), { id: "x", name: "x", owners: [步] }));
    await assertFails(setDoc(doc(db, `${K}/people/${步}`), { id: 步, name: "路人" }));
    await assertFails(setDoc(doc(db, `${K}/tags/x`), { id: "x", name: "x" }));
    await assertFails(setDoc(doc(db, `${K}/recurring/x`), recurring("x", 步)));
    await assertFails(setDoc(doc(db, `${K}/prefs/${步}`), { accounts: ["post"] }));
  });
});

describe("第一份成員文件：建王國", () => {
  const 新王國 = "kingdoms/fresh";

  it("王國還不存在時，第一個登入的人建王國和自己的成員文件", async () => {
    const db = as(步的帳號);
    const batch = writeBatch(db);
    batch.set(doc(db, 新王國), { founder: 步的帳號, createdAt: serverTimestamp() });
    batch.set(doc(db, `${新王國}/members/${步的帳號}`), { person: 步 });
    batch.set(doc(db, `${新王國}/people/${步}`), { id: 步, name: "步" });
    batch.set(doc(db, `${新王國}/people/${寶}`), { id: 寶, name: "寶" });
    await assertSucceeds(batch.commit());
    await assertSucceeds(getDoc(doc(db, 新王國)));
  });

  it("建的人只能寫自己", async () => {
    const db = as(步的帳號);
    await assertFails(setDoc(doc(db, 新王國), { founder: 寶的帳號, createdAt: serverTimestamp() }));
    // 不能順便幫別人建成員文件
    const batch = writeBatch(db);
    batch.set(doc(db, 新王國), { founder: 步的帳號, createdAt: serverTimestamp() });
    batch.set(doc(db, `${新王國}/members/${寶的帳號}`), { person: 寶 });
    await assertFails(batch.commit());
  });

  it("成員文件建了就不能改（不能換成另一個人）", async () => {
    await assertFails(updateDoc(doc(as(步的帳號), `${K}/members/${步的帳號}`), { person: 寶 }));
    await assertFails(deleteDoc(doc(as(步的帳號), `${K}/members/${步的帳號}`)));
  });

  it("只有本人讀得到自己的成員文件", async () => {
    await 寶加入();
    await assertSucceeds(getDoc(doc(as(步的帳號), `${K}/members/${步的帳號}`)));
    await assertFails(getDoc(doc(as(寶的帳號), `${K}/members/${步的帳號}`)));
  });
});

describe("步的事件", () => {
  it("建：記的人是步、參與者有步", async () => {
    await assertSucceeds(setDoc(doc(as(步的帳號), `${K}/events/a`), eventDoc("a")));
  });

  it("不能冒用別人記、不能把自己排除在參與者外", async () => {
    const db = as(步的帳號);
    await assertFails(setDoc(doc(db, `${K}/events/a`), eventDoc("a", { recordedBy: 寶 })));
    await assertFails(setDoc(doc(db, `${K}/events/a`), eventDoc("a", { participants: [寶] })));
  });

  it("文件的形狀要對：ID、版本、伺服器時間、沒有多的欄位、日期格式", async () => {
    const db = as(步的帳號);
    await assertFails(setDoc(doc(db, `${K}/events/a`), eventDoc("b")));
    await assertFails(setDoc(doc(db, `${K}/events/a`), eventDoc("a", { v: 2 })));
    await assertFails(setDoc(doc(db, `${K}/events/a`), eventDoc("a", { updatedAt: 0 })));
    await assertFails(setDoc(doc(db, `${K}/events/a`), eventDoc("a", { extra: "x" })));
    await assertFails(setDoc(doc(db, `${K}/events/a`), eventDoc("a", { date: "10/30" })));
    await assertFails(setDoc(doc(db, `${K}/events/a`), eventDoc("a", { deleted: true })));
    await assertFails(setDoc(doc(db, `${K}/events/a`), eventDoc("a", { effects: [] })));
    const { participants: _, ...沒有參與者 } = eventDoc("a");
    await assertFails(setDoc(doc(db, `${K}/events/a`), 沒有參與者));
  });

  it("讀得到參與者有步的；查詢要帶參與者", async () => {
    await seed({ [`${K}/events/a`]: eventDoc("a") });
    const db = as(步的帳號);
    await assertSucceeds(getDoc(doc(db, `${K}/events/a`)));
    await assertSucceeds(getDocs(query(collection(db, `${K}/events`), where("participants", "array-contains", 步))));
    await assertFails(getDocs(collection(db, `${K}/events`)));
  });

  it("改自己記的、標記刪除；誰記的不能改（真的刪除在「一鍵重置」）", async () => {
    await seed({ [`${K}/events/a`]: eventDoc("a") });
    const db = as(步的帳號);
    await assertSucceeds(setDoc(doc(db, `${K}/events/a`), eventDoc("a", { title: "晚餐" })));
    await assertSucceeds(updateDoc(doc(db, `${K}/events/a`), { deleted: true, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(db, `${K}/events/a`), { recordedAt: 1, updatedAt: serverTimestamp() }));
    await assertFails(
      updateDoc(doc(db, `${K}/events/a`), { recordedBy: 寶, participants: [步, 寶], updatedAt: serverTimestamp() }),
    );
    await assertFails(updateDoc(doc(db, `${K}/events/a`), { title: "沒更新時間" }));
  });
});

describe("寶幫共付、步記的", () => {
  it("寶還沒有成員文件也存得進去；步讀得到、改得了", async () => {
    const db = as(步的帳號);
    await assertSucceeds(setDoc(doc(db, `${K}/events/a`), 寶幫共付步記的("a")));
    await assertSucceeds(getDoc(doc(db, `${K}/events/a`)));
    await assertSucceeds(setDoc(doc(db, `${K}/events/a`), { ...寶幫共付步記的("a"), title: "家樂福" }));
  });

  it("寶沒有成員文件：讀不到（目前拒絕，階段 6 寶加入後才讀得到）", async () => {
    await seed({ [`${K}/events/a`]: 寶幫共付步記的("a") });
    await assertFails(getDoc(doc(as(寶的帳號), `${K}/events/a`)));
  });

  describe("階段 6：寶有了成員文件", () => {
    beforeEach(async () => {
      await 寶加入();
      await seed({ [`${K}/events/a`]: 寶幫共付步記的("a") });
    });

    it("寶讀得到", async () => {
      const db = as(寶的帳號);
      await assertSucceeds(getDoc(doc(db, `${K}/events/a`)));
      await assertSucceeds(getDocs(query(collection(db, `${K}/events`), where("participants", "array-contains", 寶))));
    });

    it("寶只能改有疑問裡自己那一格", async () => {
      const db = as(寶的帳號);
      const ref = doc(db, `${K}/events/a`);
      await assertSucceeds(updateDoc(ref, { "doubts.bao": { note: "金額？", at: 1 }, updatedAt: serverTimestamp() }));
      await assertFails(updateDoc(ref, { "doubts.bu": { at: 1 }, updatedAt: serverTimestamp() }));
      await assertFails(updateDoc(ref, { title: "改名", updatedAt: serverTimestamp() }));
      await assertFails(updateDoc(ref, { deleted: true, updatedAt: serverTimestamp() }));
      await assertFails(updateDoc(ref, { "doubts.bao": { at: 1, extra: true }, updatedAt: serverTimestamp() }));
    });

    it("步改內容時不能動寶的有疑問", async () => {
      // 寶先標有疑問
      await assertSucceeds(
        updateDoc(doc(as(寶的帳號), `${K}/events/a`), { "doubts.bao": { at: 1 }, updatedAt: serverTimestamp() }),
      );
      const ref = doc(as(步的帳號), `${K}/events/a`);
      await assertFails(updateDoc(ref, { "doubts.bao": { at: 2 }, updatedAt: serverTimestamp() }));
      await assertSucceeds(updateDoc(ref, { title: "家樂福", updatedAt: serverTimestamp() }));
    });
  });
});

describe("步幫步付", () => {
  it("參與者只有步：寶讀不到（現在、階段 6 都一樣）", async () => {
    await 寶加入();
    await seed({ [`${K}/events/a`]: eventDoc("a") });
    const db = as(寶的帳號);
    await assertFails(getDoc(doc(db, `${K}/events/a`)));
    await assertFails(getDocs(query(collection(db, `${K}/events`), where("participants", "array-contains", 步))));
    // 寶查自己的，查不到步幫步付的
    const mine = await getDocs(query(collection(db, `${K}/events`), where("participants", "array-contains", 寶)));
    if (mine.size !== 0) throw new Error(`寶查到 ${mine.size} 則`);
  });
});

describe("帳戶", () => {
  it("只有主人讀寫得到", async () => {
    await 寶加入();
    const 步db = as(步的帳號);
    const 寶db = as(寶的帳號);
    await assertSucceeds(getDoc(doc(步db, `${K}/accounts/post`)));
    await assertFails(getDoc(doc(寶db, `${K}/accounts/post`)));
    await assertFails(getDoc(doc(步db, `${K}/accounts/bao-bank`)));
    await assertFails(setDoc(doc(寶db, `${K}/accounts/post`), account("post", [寶])));
  });

  it("共有的投資帳戶兩個人都可以", async () => {
    await 寶加入();
    await assertSucceeds(getDoc(doc(as(步的帳號), `${K}/accounts/crypto`)));
    await assertSucceeds(getDoc(doc(as(寶的帳號), `${K}/accounts/crypto`)));
  });

  it("查詢要帶主人；結果只有自己的", async () => {
    const db = as(步的帳號);
    const mine = await assertSucceeds(
      getDocs(query(collection(db, `${K}/accounts`), where("owners", "array-contains", 步))),
    );
    if (mine.size !== 2) throw new Error(`查到 ${mine.size} 個帳戶`);
    await assertFails(getDocs(collection(db, `${K}/accounts`)));
  });

  it("建帳戶時自己要在主人裡；不能把帳戶整個送人；形狀要對", async () => {
    const db = as(步的帳號);
    await assertSucceeds(setDoc(doc(db, `${K}/accounts/x`), account("x", [步])));
    await assertFails(setDoc(doc(db, `${K}/accounts/y`), account("y", [寶])));
    await assertFails(setDoc(doc(db, `${K}/accounts/x`), account("x", [寶])));
    await assertFails(setDoc(doc(db, `${K}/accounts/z`), { ...account("z", [步]), currency: "USD" }));
    await assertFails(setDoc(doc(db, `${K}/accounts/z`), { ...account("z", [步]), balance: 100 }));
  });
});

describe("參考資料", () => {
  it("成員讀得到人、罐子；可以加罐子；形狀要對", async () => {
    const db = as(步的帳號);
    await assertSucceeds(getDoc(doc(db, `${K}/people/${寶}`)));
    await assertSucceeds(getDoc(doc(db, `${K}/jars/daily`)));
    await assertSucceeds(setDoc(doc(db, `${K}/jars/play`), { id: "play", name: "玩玩", owners: [步, 寶] }));
    await assertFails(setDoc(doc(db, `${K}/jars/x`), { id: "y", name: "x", owners: [步] }));
    await assertFails(setDoc(doc(db, `${K}/jars/x`), { id: "x", name: "x".repeat(41), owners: [步] }));
  });
});

describe("固定花費、排序：只有本人", () => {
  beforeEach(async () => {
    await 寶加入();
    await seed({
      [`${K}/recurring/bao-rent`]: recurring("bao-rent", 寶),
      [`${K}/prefs/${寶}`]: { accounts: ["bao-bank"] },
    });
  });

  it("步建、讀、改得了自己的固定花費；不能寫成寶的、讀不到寶的", async () => {
    const db = as(步的帳號);
    await assertSucceeds(setDoc(doc(db, `${K}/recurring/rent`), recurring("rent", 步)));
    await assertSucceeds(getDoc(doc(db, `${K}/recurring/rent`)));
    await assertSucceeds(setDoc(doc(db, `${K}/recurring/rent`), { ...recurring("rent", 步), amount: 13000 }));
    await assertFails(setDoc(doc(db, `${K}/recurring/rent`), recurring("rent", 寶)));
    await assertFails(setDoc(doc(db, `${K}/recurring/x`), recurring("x", 寶)));
    await assertFails(getDoc(doc(db, `${K}/recurring/bao-rent`)));
    await assertFails(setDoc(doc(db, `${K}/recurring/bao-rent`), recurring("bao-rent", 步)));
  });

  it("步讀寫得了自己的排序；寶的讀不到、寫不了", async () => {
    const db = as(步的帳號);
    await assertSucceeds(setDoc(doc(db, `${K}/prefs/${步}`), { accounts: ["post"] }));
    await assertSucceeds(getDoc(doc(db, `${K}/prefs/${步}`)));
    await assertFails(getDoc(doc(db, `${K}/prefs/${寶}`)));
    await assertFails(setDoc(doc(db, `${K}/prefs/${寶}`), { accounts: ["post"] }));
  });
});

// 上線前（firestore.rules 的 canReset() 是 true）：本人可以真的刪自己的資料。上線後 canReset() 是 false，這一段要改成全部拒絕。
describe("一鍵重置（上線前）", () => {
  beforeEach(async () => {
    await 寶加入();
    await seed({
      [`${K}/events/mine`]: eventDoc("mine"),
      [`${K}/events/bao`]: { ...寶幫共付步記的("bao"), recordedBy: 寶 },
      [`${K}/jars/meditate`]: { id: "meditate", name: "冥想", owners: [寶] },
      [`${K}/tags/food`]: { id: "food", name: "吃" },
      [`${K}/recurring/rent`]: { id: "rent", owner: 步 },
      [`${K}/recurring/bao-rent`]: { id: "bao-rent", owner: 寶 },
      [`${K}/prefs/${步}`]: { accounts: ["post"] },
      [`${K}/prefs/${寶}`]: { accounts: ["bao-bank"] },
    });
  });

  it("步刪得掉自己的：自己記的事件、主人有步的帳戶與罐子、標籤、自己的固定花費與排序", async () => {
    const db = as(步的帳號);
    for (const path of [
      "events/mine",
      "accounts/post",
      "accounts/crypto",
      "jars/daily",
      "tags/food",
      "recurring/rent",
      `prefs/${步}`,
    ]) {
      await assertSucceeds(deleteDoc(doc(db, `${K}/${path}`)));
    }
  });

  it("步刪不掉別人的：寶記的事件（參與者有步也一樣）、寶的帳戶、罐子、固定花費、排序", async () => {
    const db = as(步的帳號);
    for (const path of ["events/bao", "accounts/bao-bank", "jars/meditate", "recurring/bao-rent", `prefs/${寶}`]) {
      await assertFails(deleteDoc(doc(db, `${K}/${path}`)));
    }
  });

  it("王國、成員、王國裡的人永遠刪不掉", async () => {
    const db = as(步的帳號);
    for (const path of [K, `${K}/members/${步的帳號}`, `${K}/members/${寶的帳號}`, `${K}/people/${步}`]) {
      await assertFails(deleteDoc(doc(db, path)));
    }
  });

  it("沒登入、不是成員：什麼都刪不掉", async () => {
    for (const db of [沒登入(), as(路人的帳號)]) {
      for (const path of ["events/mine", "accounts/post", "jars/daily", "tags/food", `prefs/${步}`]) {
        await assertFails(deleteDoc(doc(db, `${K}/${path}`)));
      }
    }
  });
});

describe("王國以外", () => {
  it("全部拒絕", async () => {
    const db = as(步的帳號);
    await assertFails(getDoc(doc(db, "users/x")));
    await assertFails(setDoc(doc(db, "users/x"), { a: 1 }));
    await assertFails(setDoc(doc(db, `${K}/other/x`), { a: 1 }));
  });
});
