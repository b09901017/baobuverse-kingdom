// 「已上線」開關（issue 06）。上線前可以一鍵重置，上線後不行；上線由使用者說了才算（plan.md「一個網址」）。
//
// 上線時兩個地方一起切，再 pnpm run deploy（網站與規則一起部署）：
// 1. 這裡改成 true：設定裡的重置按鈕整個不出現
// 2. firestore.rules 的 canReset() 改成 return false：規則不再讓人真的刪文件
// test/launch.test.ts 會檢查兩邊一致，只切一邊驗證指令會紅。

export const LAUNCHED = false;
