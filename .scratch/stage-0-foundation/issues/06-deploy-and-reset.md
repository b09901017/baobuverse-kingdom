# 06 部署到一個網址、上線前一鍵重置

Status: done
Blocked by: 01、02、05
動工前先讀：`../spec.md`；`../HANDOFF.md`「每一段共同的規矩」；01、05 的「做完時留下的」；`docs/plan.md`「方向」裡的「一個網址」「APK 只當殼」與「APK 與網址」；
skill `firebase-hosting-basics`；`docs/agents/lessons.md` 第七條；國王日記的 `firebase.json` 長相（只讀，`gh api repos/b09901017/baobu_money_track/contents/firebase.json`）。

## 使用者要的

「直接一個網址就好……現在正是的網站就是我測試的網站，沒有差別，能夠一件重置(但上線之後就不能一件重置了喔)，甚麼時候真的上限我會和你說，你不用做到一半就問我」（2026-10-30）

## 為什麼會這樣

- 國王日記部署在 `baobu-app` 的預設網址，它的 `firebase.json` 沒寫 site，`firebase deploy` 什麼都不指定就是整個部署。新 repo 若照抄、又指到錯的專案，會蓋掉國王日記。
- 新專案獨立之後風險小很多，但部署指令仍要寫死目標，防手滑。

## 做法（段可以改細節，改了寫進「做完時留下的」）

1. `.firebaserc` 只有新專案；`firebase.json`（05 已建 firestore 與 emulators）補 hosting：寫明 site（新專案的預設網址）、指到 `apps/treasury` 的建置結果。
2. 部署腳本（例如 `pnpm run deploy`）：先跑驗證指令；檢查目標專案 ID 是新專案、**是 `baobu-app` 就拒絕**；用 `--project` 與 `--only` 明確指定。
3. 部署由段來做（使用者 01 已登入 CLI）。**部署要使用者先答應**（全域規則：傳到外部服務先問）：主控開段五之前會問，答應了寫進 HANDOFF「使用者已經決定的」；
   段裡部署前先看那一條在不在，不在就停下來問；
   部署之後打開網址，**請使用者自己按登入**（Claude 不能輸入 Google 密碼），確認 Google 登入能用（新網址要在授權網域裡，`web.app` 預設就有）。
4. 一鍵重置：設定裡一個按鈕，刪掉**目前登入的人**在新專案裡的所有資料，**也清掉本機的離線快取**（05 開的），先跳確認框（白話寫要刪什麼、救不回來）。
   一個「已上線」的開關（程式裡的常數）打開時，按鈕整個不出現；開關怎麼切寫進 `docs/plan.md` 旁的說明或 HANDOFF，上線時使用者說了才切。
5. 手機上能「加到主畫面」。

## 判準

- 部署腳本在目標是 `baobu-app` 時會不會照跑？（必須拒絕；寫一支測試或可重現的檢查）
- `firebase.json` 有沒有任何設定在沒寫目標時會部署到預設網址以外的地方？
- 一鍵重置會不會刪到別人的資料？重置後重新整理，舊資料會不會從本機快取冒回來？上線開關打開後按鈕還在嗎？
- 正式網址打得開、登入得了、記一筆存得進去嗎？（段自己在網址上走一次）

## 做完時留下的

2026-10-30 段五。程式在 commit `013d6f2`（部署與重置）、`5512275`（正式網址的登入修正）。

- **網址：https://baobu-kingdom.web.app**（Firebase Hosting，site `baobu-kingdom`；`baobu-kingdom.firebaseapp.com` 也是同一個網站）。
- **部署指令**：在根目錄 `pnpm run deploy`（**不是** `pnpm deploy`：那是 pnpm 內建的別的指令）。先看目標不部署：`pnpm run deploy --dry-run`。

  | 步驟 | 做什麼 |
  |---|---|
  | 1. 檢查目標 | `apps/treasury/scripts/deploy-plan.ts`：`.firebaserc` 的每個專案、`firebase.json` 的 `hosting.site` 都要是 `baobu-kingdom`；設定或參數裡出現 `baobu-app` 就停；參數只收 `--dry-run`（不能從外面換專案） |
  | 2. 驗證 | `pnpm verify` |
  | 3. 部署 | `firebase deploy --project baobu-kingdom --only hosting,firestore:rules,firestore:indexes`（`apps/treasury/scripts/deploy.mjs`）。網站與規則一起部署，不會不同步 |

  判準「目標是 `baobu-app` 會不會照跑」：`test/deploy.test.ts` 7 支（`.firebaserc` 指到或多一個 `baobu-app`、`site` 是 `baobu-app` 或沒寫、參數帶 `--project baobu-app`、其他設定出現 `baobu-app`，都拒絕）；
  實際跑 `pnpm run deploy --project baobu-app` 也是第一步就停（沒跑驗證、沒叫 firebase）。
- **`firebase.json` 的 hosting**：`site` 寫明、`public` 是 `apps/treasury/dist`、所有路徑改寫到 `/index.html`、`sw.js`／`index.html`／manifest 不快取、`/assets/` 長快取（檔名有雜湊）。
  判準「沒寫目標時會不會部署到別的地方」：不會，`site` 寫死，而且腳本永遠帶 `--project baobu-kingdom`。
- **重置按鈕在哪**：國庫驗證頁最下面「設定」→「一鍵重置（上線前才有）」（`apps/treasury/src/App.tsx` 的 `Reset`）。按了先出現紅框的確認（會刪什麼、會留什麼、救不回來），再按「確定刪掉」。
  - 刪什麼（`src/reset.ts` 的 `resetMine`）：我記的事件（包括標記刪除的）、主人有我的帳戶與罐子（**包括跟別人共有的**）、標籤（沒有主人，整個王國的）、我的固定花費、我的排序。
    **留著**：`kingdoms/baobu`、`members`、`people`（段四的中途發現：刪了王國文件，任何登入的人都能搶先建王國）、別人記的事件、只屬於別人的帳戶與罐子。
    （段六審查後把確認框的字改成「包括跟別人共有的」「只屬於別人的」，原本寫「別人的帳戶」會留著，對共有的帳戶是誤導。）
  - 要有網路：先等還沒送出的寫入送完，再從伺服器查（不從快取查）；斷網時查詢丟錯、什麼都不刪。
  - 刪完清本機離線快取（`terminate` → `clearIndexedDbPersistence`）再重新整理。其他分頁也開著國庫時清不掉，畫面會說「雲端已經刪了，關掉其他分頁、重新整理，再按一次」。
  - 規則：`firestore.rules` 加 `canReset()`（現在 `true`），本人可以真的刪上面那幾種；王國、成員、人永遠不能刪。規則測試「一鍵重置（上線前）」4 支；`test/reset.test.ts` 3 支（模擬器上只刪步的 9 份、再按一次 0 份、斷網不刪）。
- **上線開關在哪**：兩個地方一起切，再 `pnpm run deploy`：
  1. `apps/treasury/src/launch.ts` 的 `LAUNCHED` 改成 `true`：重置按鈕整個不出現（段五在模擬器上切過，按鈕消失）
  2. `firestore.rules` 的 `canReset()` 改成 `return false`：規則不再讓人真的刪文件；規則測試「一鍵重置（上線前）」那一段要改成全部拒絕
  
  `test/launch.test.ts` 檢查兩邊一致：只切一邊，`pnpm verify` 會紅（段五試過）。上線時也可以順便打開資料庫的刪除保護（HANDOFF 中途發現 · 段一）。
- **正式網址的登入**：第一次部署後，按「用 Google 登入」停在「載入中」。原因：PWA 的 service worker 把所有網頁導向（連 `/__/auth/handler`）都換成國庫的頁面。
  `vite.config.ts` 加 `navigateFallbackDenylist: [/^\/__\//]` 後重新部署，接著 Google 跳 `redirect_uri_mismatch`（段四預料的）：
  **使用者在 Google Cloud 主控台 `baobu-kingdom` 的 OAuth 用戶端「Web client (auto created by Google Service)」加了重新導向 URI `https://baobu-kingdom.web.app/__/auth/handler`**，之後登入成功。
  之後換網域（自訂網域、測試網址）也要在那裡加一次。
- **使用者在正式網址走過一次**（2026-10-30，使用者自己按）：

  | 判準 | 結果 |
  |---|---|
  | 打得開、登入得了 | 電腦 Chrome：可以（加了重新導向 URI 之後），顯示（步） |
  | 記一筆存得進去 | 可以：測試帳戶從 -120 變 -240 |
  | 一鍵重置 | 可以：重新整理後還是（步）、「還沒有帳戶」「看得到的事件 0 則」；再重新整理一次，舊的沒有冒回來 |
  | 手機登入、加到主畫面 | 都可以：手機上登入看得到（步）、加到主畫面，從圖示打開是全螢幕、還登入著 |

  所以 `baobu-kingdom` 現在只剩王國 `baobu`、步的成員文件、`people`（測試帳戶、罐子、支出都被重置清掉了）。
- **段五自己驗過的**：模擬器上建王國、記兩筆、重置 → 重新整理後 0 則、帳戶空、還是步；`LAUNCHED = true` 時按鈕不見；正式網址上 manifest、`sw.js`（不快取）、深的路徑（改寫回首頁）、`/__/auth/handler` 都是 200，主控台沒有錯誤。
  `pnpm verify` 通過：core 153 支、treasury 45 支（規則 30、存讀 4、重置 3、部署 7、開關 1）、建置。
- 建置有「chunk 超過 500 kB」的提醒（主程式 885 kB，大部分是 Firebase）：只是提醒，沒有處理（見 HANDOFF 中途發現 · 段五）。
