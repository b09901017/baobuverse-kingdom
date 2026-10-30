import { defineConfig } from "vitest/config";

// 這裡的測試都要 Firestore 模擬器：pnpm test 用 firebase emulators:exec 開模擬器再跑
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    // 兩支測試檔共用同一個模擬器，一支清資料時另一支不能在跑
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
