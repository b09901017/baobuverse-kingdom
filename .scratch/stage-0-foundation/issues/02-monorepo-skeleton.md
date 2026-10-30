# 02 monorepo 骨架與驗證指令

Status: todo
Blocked by: 無（可以跟 01 同一段，先後都行）
動工前先讀：`../spec.md`；`../HANDOFF.md`「每一段共同的規矩」；`docs/plan.md`「方向」（monorepo、APK 只當殼）與「APK 與網址」；`.gitignore`；`CLAUDE.md`「合併」。

## 使用者要的

monorepo：「好，照這樣分」——`apps/treasury`（國庫）、`packages/core`（兩個 app 共用的規則）現在建；`packages/ui` 用到再建；`apps/nest-diary` 開工時才建。每個 app 各自打包。
第一版畫面：「先選a」（乾淨簡單）。

## 為什麼會這樣

- repo 現在只有文件與 `.claude/`，沒有任何 app 程式碼。
- `CLAUDE.md`「合併」：還沒有 CI 時以驗證全過為準；這一支補上 CI，之後就照「CI 綠了就合」。
- 之後會用 Capacitor 包成載入網址的殼（階段 2），所以 app 是一般的 Vite 網頁、PWA。

## 做法（段可以改細節，改了寫進「做完時留下的」）

1. pnpm workspace：根目錄 `package.json`、`pnpm-workspace.yaml`（`apps/*`、`packages/*`）、共用的 `tsconfig` 基底。先查這台電腦的 node／pnpm 版本，沒有 pnpm 就用 `corepack` 開。
2. `packages/core`：純 TypeScript 函式庫，**不依賴 Firebase、React**；Vitest；先放一支會過的測試證明接好了（真正的形狀是 03）。
3. `apps/treasury`：Vite＋React＋TypeScript；PWA（manifest、service worker，用 `vite-plugin-pwa` 或同等）；一個乾淨的空白頁寫「國庫」；能 import `packages/core`。
4. 根目錄一個驗證指令（例如 `pnpm verify`）：型別檢查、測試、建置全部跑。寫進 `CLAUDE.md` 的「環境」一行（只寫指令，不寫表格）。
5. GitHub Actions：push 與 PR 跑驗證指令（05 會加模擬器，到時要 `actions/setup-java` 裝 JDK 21，05 補）。
6. `.gitignore` 補 `node_modules/`、`dist/`、建置產物、`.env`（`.env.example` 可以進）。

## 判準

- `packages/core` 有沒有 import 任何 Firebase、React、瀏覽器 API？（必須沒有）
- 驗證指令在乾淨的 clone 上跑得過嗎？CI 是不是綠的？
- `apps/treasury` 建置出來的是不是可安裝的 PWA（有 manifest、service worker）？
- 有沒有預先建 `packages/ui`、`apps/nest-diary` 的空殼？（不應該有）

## 做完時留下的

（段做完填：工具版本、驗證指令、資料夾長相、CI 檔名。）
