// 上線前的一鍵重置（issue 06）：刪掉目前登入的人在王國裡的資料，再清掉這台裝置的離線快取。
// 王國文件、成員文件、王國裡的人留著：刪了王國文件，任何登入的人都能搶先建王國、變成步（HANDOFF 中途發現 · 段四）。
// 上線後（launch.ts 的 LAUNCHED）按鈕不出現、規則也不讓刪。

import type { PersonId } from "@baobu/core";
import {
  clearIndexedDbPersistence,
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  query,
  terminate,
  waitForPendingWrites,
  where,
  writeBatch,
  type DocumentReference,
  type Firestore,
} from "firebase/firestore";

/** 一批最多 500 筆寫入 */
const BATCH_LIMIT = 500;

/** 確認框上給人看的：會刪什麼、不會刪什麼 */
export const RESET_DELETES = [
  "你記的事件（包括標記刪除的）",
  "主人有你的帳戶、罐子（包括跟別人共有的）",
  "標籤（標籤沒有主人，是整個王國共用的）",
  "你的固定花費、你的排序與帳戶備註",
  "這台裝置上的離線資料",
] as const;
export const RESET_KEEPS = ["王國", "你是誰（成員資料）", "別人記的事件", "只屬於別人的帳戶與罐子"] as const;

/**
 * 刪掉 me 在王國 k 裡的資料，回傳刪了幾份文件。
 * 要有網路：先等還沒送出的寫入送完，再從伺服器查（不從快取查，免得漏掉伺服器上有、快取沒有的）。
 * 斷網時查詢會丟錯，什麼都不刪。
 */
export async function resetMine(db: Firestore, k: string, me: PersonId): Promise<number> {
  const kingdom = `kingdoms/${k}`;
  // 先問一次伺服器：斷網時這裡就丟錯。不先問的話，斷網又有還沒送出的寫入時，下一行會一直等到有網路
  await getDocFromServer(doc(db, kingdom));
  await waitForPendingWrites(db);

  const mine = (name: string, fieldPath: string, op: "==" | "array-contains") =>
    getDocsFromServer(query(collection(db, kingdom, name), where(fieldPath, op, me)));

  const [events, accounts, jars, tags, recurring, prefs] = await Promise.all([
    // 規則只讓查參與者有我的；我記的一定有我（建、改都要求）
    mine("events", "participants", "array-contains"),
    mine("accounts", "owners", "array-contains"),
    mine("jars", "owners", "array-contains"),
    getDocsFromServer(collection(db, kingdom, "tags")),
    mine("recurring", "owner", "=="),
    getDocFromServer(doc(db, kingdom, "prefs", me)),
  ]);

  const refs: DocumentReference[] = [
    ...events.docs.filter((d) => d.get("recordedBy") === me).map((d) => d.ref),
    ...[accounts, jars, tags, recurring].flatMap((snap) => snap.docs.map((d) => d.ref)),
    ...(prefs.exists() ? [prefs.ref] : []),
  ];
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const ref of refs.slice(i, i + BATCH_LIMIT)) batch.delete(ref);
    await batch.commit();
  }
  return refs.length;
}

/**
 * 清掉這台裝置的離線快取，之後要重新整理頁面（db 已經關掉不能用）。
 * 其他分頁也開著國庫時清不掉：丟錯，請使用者關掉其他分頁再按一次。
 */
export async function clearLocalCache(db: Firestore): Promise<void> {
  await terminate(db);
  await clearIndexedDbPersistence(db);
}
