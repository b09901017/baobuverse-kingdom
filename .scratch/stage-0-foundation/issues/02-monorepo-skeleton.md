# 02 monorepo 骨架與驗證指令

Status: done
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

2026-10-30 段一。

- **工具版本**：node 24.20.0；pnpm 12.16.1（`corepack enable` 要寫 Node 安裝資料夾（`Program Files` 底下）被權限擋，改用 `npm i -g pnpm@12.16.1` 裝在使用者的 npm 資料夾；根目錄 `packageManager` 寫死這個版本，CI 照它裝）。
  TypeScript 7.0.2、Vite 8.3.5、Vitest 5.0.5、React 19.3.1、`@vitejs/plugin-react` 6.1.2、`vite-plugin-pwa` 2.0.0（generateSW、autoUpdate）。版本都寫死、不用 `^`。
- **驗證指令**：`pnpm verify`＝`pnpm -r typecheck` → `pnpm -r test` → `pnpm -r build`。寫進 `CLAUDE.md`「環境」。本機與乾淨 clone 都過。
- **資料夾長相**：

  ```
  package.json            # workspace 根、verify
  pnpm-workspace.yaml     # apps/*、packages/*
  tsconfig.base.json      # strict、noUncheckedIndexedAccess、exactOptionalPropertyTypes
  packages/core/          # @baobu/core：src/index.ts、src/index.test.ts；exports 直接指 src（沒有建置步驟，給 Vite 打包）
  apps/treasury/          # @baobu/treasury：Vite＋React，index.html、src/、public/icon-192.png、icon-512.png
  .github/workflows/verify.yml
  ```

- **core 擋得住什麼**：`packages/core/tsconfig.json` 的 `lib` 只有 ES2023、`types: []`，用到 `document`／`window` 型別檢查就失敗；core 的 `package.json` 沒有任何依賴，pnpm 不會把 React、Firebase 裝到它看得到的地方，import 就找不到模組。
  段一用暫時的探針檔驗過（`import "react"` → TS2307、`document` → TS2584、`window` → TS2304），驗完刪掉。
- **PWA**：建置出 `manifest.webmanifest`（名稱「國庫」、standalone、192／512 圖示、512 兼 maskable）與 `sw.js`。圖示是暫時的（綠底金圓，用沒有依賴的 node 腳本產生，腳本沒進 repo），畫風之後整個換。
- **CI 檔名**：`.github/workflows/verify.yml`，push 與 PR 都跑：checkout v7 → pnpm/action-setup v6 → setup-node v7（node 24、pnpm 快取）→ `pnpm install --frozen-lockfile` → `pnpm verify`。JDK 21 在 05 補（檔裡留了註解）。
- `.gitignore` 補 `node_modules/`、`dist/`、`dev-dist/`、`*.tsbuildinfo`、`.env`、`.env.*`（`!.env.example`）。
- 沒有建 `packages/ui`、`apps/nest-diary`。
