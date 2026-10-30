# 01 新的 Firebase 專案

Status: done
Blocked by: 無
動工前先讀：`../spec.md`；`../HANDOFF.md`「每一段共同的規矩」；`docs/plan.md`「方向」（資料放在新的免費 Firebase 專案）；`docs/agents/lessons.md` 第七條（指令裡有 firebase 字樣會跳框）；
skill `wizard`、`firebase-basics`、`firebase-auth-basics`。

## 使用者要的

「好，不要跟國王日記擠在同一個專案裡」（2026-10-30）。背景：在 `baobu-app` 開第二個資料庫要升級付費；新專案自己的第一個資料庫免費。

## 為什麼會這樣

- `baobu-app` 現在只有國王日記：預設資料庫（`asia-east1`）與預設網址 `baobu-app.web.app`（2026-10-30 只讀查過）。
- 這台電腦的 `gcloud` 有登入；`firebase` CLI 沒有登入（`firebase login:list` 沒有帳號）。
- 建專案、開 Google 登入、建資料庫要使用者的帳號；有些步驟只能在 Firebase 主控台點，或 `firebase login` 要使用者自己在瀏覽器按。

## 做法（段可以改細節，改了寫進「做完時留下的」）

1. 用 `wizard` 產生一個一步一步的精靈，讓使用者照著做只有他能做的：
   - `firebase login`（在終端機自己跑，瀏覽器授權）
   - 建專案：建議 ID `baobu-kingdom`（被用走就加尾碼，由使用者在精靈裡確認），**方案維持免費（Spark），不要升級、不要綁卡**；Google Analytics 不開
   - Authentication 開 Google 登入
   - Firestore 建預設資料庫：位置 `asia-east1`（跟國王日記一樣在台灣），正式模式（規則先全部拒絕）
   - 註冊一個網頁 app，拿到網頁設定（apiKey 那一組，網頁設定本來就是公開的，可以進 repo）
2. Claude 能自己做的自己做（使用者登入 CLI 之後）：確認專案存在、方案是 Spark、資料庫位置，**只讀**。
3. 專案 ID 與網頁設定記下來給 05、06 用（放 `apps/treasury` 的設定檔或 `.env` 範例，05 決定）；`.firebaserc` 在 06 建。
4. 精靈本身是一次性的：放 scratchpad 或 `.scratch/stage-0-foundation/`，不放進 app。

## 判準

- 新專案的帳單方案是不是 Spark？（是 Blaze 就停下來問使用者）
- 有沒有任何一步對 `baobu-app` 做了寫入或設定變更？（必須沒有）
- 新專案的預設資料庫是不是 `asia-east1`、正式模式？
- Google 登入是不是已經開了？
- repo 裡有沒有出現 email、帳號、服務帳號金鑰或其他私人資料？（網頁設定可以）
- 資料庫位置建了就不能改：精靈裡有沒有讓使用者在建之前確認 `asia-east1`？

## 做完時留下的

2026-10-30 段一。

- **專案 ID：`baobu-kingdom`**（沒被用走，沒有尾碼；專案編號 941682816344）。建在國王日記同一個 Google 帳號底下（使用者選「同國王日記的帳號」）。
- **跟 issue 寫的不一樣**：Firebase CLI 其實**已經登入**了，登入的就是擁有 `baobu-app` 的帳號，所以精靈沒有 `firebase login` 那步，只剩四步（建專案、Google 登入、資料庫、網頁 app）。
  這台電腦**沒有全域的 `firebase` 指令**，都用 `npx -y firebase-tools@latest`（段一時是 15.34.2）。
- **使用者卡住過的步驟**：沒有，四步一次跑完。精靈是一次性的，放在段一的 scratchpad，沒進 repo。
- **段一只讀確認過的**（2026-10-30，`firebase-tools` 與 gcloud 的讀取，沒有寫入）：

  | 判準 | 結果 |
  |---|---|
  | 方案 | 沒綁帳單（`billingEnabled: False`）＝ Spark |
  | 資料庫 | `(default)`、Standard、`FIRESTORE_NATIVE`、位置 `asia-east1` |
  | 規則 | 正式模式：`match /{document=**} { allow read, write: if false; }` |
  | Google 登入 | `google.com` 的 `enabled = True` |
  | 網頁 app | `treasury`，App ID `1:941682816344:web:5a5aae8b78d4e6e765212d`，沒有開 Hosting |
  | `baobu-app` | 沒動：只在一開始 `projects:list` 列專案清單時出現在名單裡 |

- **網頁設定**（公開的，可以進 repo；05 決定放 `apps/treasury` 的哪個設定檔，`firebase apps:sdkconfig WEB <App ID> --project baobu-kingdom` 可以再讀一次）：

  ```json
  {
    "apiKey": "AIzaSyAmR2pMj3iH41mx8t6YpcoyABxjmXQJCuU",
    "authDomain": "baobu-kingdom.firebaseapp.com",
    "projectId": "baobu-kingdom",
    "storageBucket": "baobu-kingdom.firebasestorage.app",
    "messagingSenderId": "941682816344",
    "appId": "1:941682816344:web:5a5aae8b78d4e6e765212d"
  }
  ```

  `authDomain` 現在是預設的 `firebaseapp.com`；過目說 redirect 登入要用部署網域，05／06 改。
