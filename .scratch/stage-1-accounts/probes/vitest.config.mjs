// 這一輪審查用的假資料探針（不進 CI）。在根目錄跑：
// pnpm --filter @baobu/treasury exec vitest run --config ../../.scratch/stage-1-accounts/probes/vitest.config.mjs
// 種子數、步數：環境變數 SEEDS、OPS（預設 150、120，大約 20 秒）。
const repo = new URL("../../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
export default {
  root: import.meta.dirname,
  cacheDir: `${repo}/node_modules/.cache/stage-1-probes`,
  resolve: {
    alias: {
      "@baobu/core": `${repo}/packages/core/src/index.ts`,
      "@repo": `${repo}/apps/treasury/src`,
    },
  },
  server: { fs: { strict: false } },
  test: {
    globals: true,
    include: ["*.probe.ts"],
    environment: "node",
    testTimeout: 600000,
    pool: "threads",
    maxWorkers: 1,
    fileParallelism: false,
  },
};
