// 接到新的 Firebase 專案 baobu-kingdom（issue 01）。國王日記的 baobu-app 不在這裡出現。
// `vite --mode emulators`（pnpm dev:emulators）時改接本機的模擬器，專案是 demo- 開頭的，碰不到任何真的專案。

import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

export const useEmulators = import.meta.env.MODE === "emulators";

/** 部署之後的網址（06 的 Hosting）。在這兩個網址上，登入的網域跟網頁同一個，才能用 redirect 登入 */
const hostedDomains = ["baobu-kingdom.web.app", "baobu-kingdom.firebaseapp.com"];
export const onHostedDomain = hostedDomains.includes(location.hostname);

// 網頁設定本來就是公開的（issue 01「做完時留下的」）
const app = initializeApp({
  apiKey: "AIzaSyAmR2pMj3iH41mx8t6YpcoyABxjmXQJCuU",
  // redirect 登入要跟網頁同一個網域，不然瀏覽器擋第三方儲存時會失敗；本機開發用 popup，不受影響
  authDomain: onHostedDomain ? location.hostname : "baobu-kingdom.firebaseapp.com",
  projectId: useEmulators ? "demo-baobu-kingdom" : "baobu-kingdom",
  storageBucket: "baobu-kingdom.firebasestorage.app",
  messagingSenderId: "941682816344",
  appId: "1:941682816344:web:5a5aae8b78d4e6e765212d",
});

export const auth = getAuth(app);

// 離線快取：斷網時照樣讀寫，恢復網路後自動同步（之後殼＋網址靠它離線記帳）
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

if (useEmulators) {
  // 跟 vite 一樣用 localhost：不同網站的話，redirect 登入回來時瀏覽器會擋登入結果
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
}

/** 現在只有一個王國（ADR 0001）；上線後要測試資料就換一個 ID */
export const KINGDOM_ID = "baobu";
