// reset.ts 對著模擬器（issue 06 判準）：一鍵重置刪步的（共有的帳戶、罐子與標籤也會刪），王國、成員、人、只屬於寶的都留著；斷網時什麼都不刪。
// 清本機快取（clearLocalCache）要瀏覽器的 IndexedDB，node 測不到：手動驗的結果在 06「做完時留下的」。

import type { PersonId } from "@baobu/core";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, disableNetwork, doc, getDoc, getDocs, serverTimestamp, setDoc, type DocumentData } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resetMine } from "../src/reset";
import { asFirestore, startEmulator } from "./emulator";

const K = "reset-test";
const 步 = "bu" as PersonId;
const 寶 = "bao";
const 步的帳號 = "uid-bu";
const 寶的帳號 = "uid-bao";

const event = (id: string, recordedBy: string, participants: string[], deleted = false): DocumentData => ({
  id,
  recordedBy,
  participants,
  deleted,
});

/** 王國裡步的、寶的、共有的資料各一些（不經過規則直接放） */
const seedDocs: Record<string, DocumentData> = {
  "": { founder: 步的帳號, createdAt: serverTimestamp() },
  [`members/${步的帳號}`]: { person: 步 },
  [`members/${寶的帳號}`]: { person: 寶 },
  [`people/${步}`]: { id: 步, name: "步" },
  [`people/${寶}`]: { id: 寶, name: "寶" },
  "events/bu-1": event("bu-1", 步, [步]),
  "events/bu-shared": event("bu-shared", 步, [步, 寶]),
  "events/bu-deleted": event("bu-deleted", 步, [步], true),
  "events/bao-shared": event("bao-shared", 寶, [步, 寶]),
  "events/bao-1": event("bao-1", 寶, [寶]),
  "accounts/post": { id: "post", owners: [步] },
  "accounts/crypto": { id: "crypto", owners: [步, 寶] },
  "accounts/bao-bank": { id: "bao-bank", owners: [寶] },
  "jars/daily": { id: "daily", owners: [步, 寶] },
  "jars/meditate": { id: "meditate", owners: [寶] },
  "tags/food": { id: "food", name: "吃" },
  "recurring/rent": { id: "rent", owner: 步 },
  "recurring/bao-rent": { id: "bao-rent", owner: 寶 },
  [`prefs/${步}`]: { accounts: ["post"] },
  [`prefs/${寶}`]: { accounts: ["bao-bank"] },
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
    for (const [path, data] of Object.entries(seedDocs)) {
      await setDoc(doc(db, `kingdoms/${K}${path ? `/${path}` : ""}`), data);
    }
  });
});

const 步的 = () => asFirestore(env.authenticatedContext(步的帳號).firestore());

/** 伺服器上還留著的文件（不經過規則） */
async function remaining(): Promise<string[]> {
  const paths: string[] = [];
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = asFirestore(ctx.firestore());
    for (const name of ["members", "people", "events", "accounts", "jars", "tags", "recurring", "prefs"]) {
      const snap = await getDocs(collection(db, `kingdoms/${K}/${name}`));
      paths.push(...snap.docs.map((d) => `${name}/${d.id}`));
    }
    const kingdom = await getDocs(collection(db, "kingdoms"));
    paths.push(...kingdom.docs.map((d) => `kingdom:${d.id}`));
  });
  return paths.sort();
}

describe("一鍵重置", () => {
  it("刪步的：步記的事件（含標記刪除的）、主人有步的帳戶與罐子（含跟寶共有的）、標籤、步的固定花費與排序；只屬於寶的留著", async () => {
    const deleted = await resetMine(步的(), K, 步);
    expect(deleted).toBe(9);
    expect(await remaining()).toEqual(
      [
        `kingdom:${K}`,
        `members/${步的帳號}`,
        `members/${寶的帳號}`,
        `people/${步}`,
        `people/${寶}`,
        "events/bao-shared",
        "events/bao-1",
        "accounts/bao-bank",
        "jars/meditate",
        "recurring/bao-rent",
        `prefs/${寶}`,
      ].sort(),
    );
  });

  it("開放讀取之後，重置也不會去動只屬於寶的帳戶：寶的帳戶內容一字不變", async () => {
    await resetMine(步的(), K, 步);
    let baoBank: DocumentData | undefined;
    await env.withSecurityRulesDisabled(async (ctx) => {
      baoBank = (await getDoc(doc(asFirestore(ctx.firestore()), `kingdoms/${K}/accounts/bao-bank`))).data();
    });
    expect(baoBank).toEqual({ id: "bao-bank", owners: [寶] });
  });

  it("再按一次：沒有東西可刪", async () => {
    await resetMine(步的(), K, 步);
    expect(await resetMine(步的(), K, 步)).toBe(0);
  });

  it("斷網時丟錯，什麼都不刪", async () => {
    const db = 步的();
    await disableNetwork(db);
    await expect(resetMine(db, K, 步)).rejects.toThrow();
    expect(await remaining()).toHaveLength(Object.keys(seedDocs).length);
  });

  it("斷網、又有還沒送出的寫入時：也是馬上丟錯（不會一直等到有網路），什麼都不刪", async () => {
    const db = 步的();
    await disableNetwork(db);
    // 斷網時記的一筆：只在本機，等有網路才送
    void setDoc(doc(db, `kingdoms/${K}/tags/offline`), { id: "offline", name: "斷網時記的" });
    await expect(resetMine(db, K, 步)).rejects.toThrow();
    expect(await remaining()).toHaveLength(Object.keys(seedDocs).length);
  }, 5_000);
});
