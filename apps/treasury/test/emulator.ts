// 模擬器測試共用的：規則、測試環境、步和寶。專案是 demo- 開頭的，碰不到任何真的專案。

import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import type { Firestore } from "firebase/firestore";
import rules from "../../../firestore.rules?raw";

export const PROJECT = "demo-baobu-kingdom";

export function startEmulator(): Promise<RulesTestEnvironment> {
  // 模擬器的位置從 firebase emulators:exec 設的環境變數來
  return initializeTestEnvironment({ projectId: PROJECT, firestore: { rules } });
}

/** rules-unit-testing 給的是舊版的 Firestore 物件，新版的函式也吃得下，只是型別不同 */
export function asFirestore(db: unknown): Firestore {
  return db as Firestore;
}
