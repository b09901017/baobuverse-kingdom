# 同一台機器開多個 worker：模擬器怎麼隔離

用在 E2E 打的是本機模擬器（Firebase Emulator Suite 這類）、想把 `workers` 從 1 往上調的時候。

## 兩種隔離

| | 同一組模擬器、每個 worker 一個命名空間 | 每個 worker 一整組模擬器 |
|---|---|---|
| 怎麼分 | 每個 worker 用自己的 `projectId`（Firestore 模擬器一顆裝得下多個，第一次寫到時自己長出來） | 每組不同 port、各自 `--project`，app 依 worker 號連自己那一組 |
| 共用的東西 | 模擬器行程（Firestore 是單一 Java 行程）、Auth（分不了專案）、Functions | 只剩 hosting（靜態檔，可以只開一份大家共用）與這台機器的 CPU |
| 要改的地方 | projectId 的推導（app、塞資料的 fixture、開模擬器的腳本三邊） | 上面那些＋**每一個寫死 port 的地方** |
| 量過的 | 上一個專案 2026-09-09，見下 | 2026-10-29 實驗，見下 |

### 量到的數字

**同一組、3 個 worker**（上一個專案 2026-09-09，全量 193 個測試，無頭，同一台筆電）：

| | 過 | 紅 | 時間 |
|---|---|---|---|
| 1 個 worker | 193 | 0 | 23.9 分鐘 |
| 3 個 worker 共用一組、各自 projectId | 183 | 10 | 14.2 分鐘 |

紅的 10 個沒有一個是資料串台（那幾個檔在 1 個 worker 下重跑 60 個測試全過）：6 個連不上／載不起來（`page.goto` 逾時、等不到登入按鈕、Firestore 說 client is offline）、1 個寫入卡住、3 個畫面第二段還沒畫完。
當時判斷瓶頸是那一顆 Firestore Java 行程、加上每個測試從 CDN 重抓 SDK。

**每個 worker 一組、2 個 worker**（2026-10-29，上一個專案的另一份 clone、實驗分支，無頭，同一台筆電；10 個檔）：

| | 過 | 紅 | 時間 | 整機 CPU（每 5 秒取樣） |
|---|---|---|---|---|
| 1 組模擬器、1 個 worker | 78 | 0 | 6.3 分鐘 | 平均 23%、最高 49% |
| 2 組模擬器、2 個 worker（第 1 次） | 70 | 8 | 7.4 分鐘 | 平均 19%、最高 56% |
| 2 組模擬器、2 個 worker（重跑） | 78 | 0 | 3.5 分鐘 | 平均 29%、最高 62% |

- 第 1 次的 8 個紅**全是斷網**：跑到一半連 `fonts.gstatic.com` 被重置、接著 DNS 查不到，之後每個測試等不到登入按鈕、各燒滿 30 秒。斷網前兩個 worker 一個都沒紅；網路恢復後同樣的設定重跑全過。
- 重跑那次每個檔的秒數跟 1 個 worker 幾乎一樣（測試時間加總 6.3 vs 6.2 分鐘）：兩組之間沒有互搶。
- 兩個 worker 分得不平均：Playwright 照檔分，一個拿到 51 個測試（3.5 分鐘才跑完）、一個 27 個（2.9 分鐘）。**牆上時間由分到最多的那個 worker 決定**，最大的檔越大越吃虧。
- 一組模擬器起來約 10～11 秒，一組一組開。
- 只量了 10 個檔，沒量全量；全量要不要這樣跑，先量一次全量再說。

出處：baobuverse-kingdom `.scratch/tooling-leftovers/issues/10-e2e-speed-skill.md` 的「做完時留下的」。

## 一個 worker 一組怎麼接

做法（2026-10-29 在上一個專案的實驗分支做過、接線驗證過）：

1. **一支推導 port 的函式當唯一來源**，跟 projectId 的推導放在一起（例如 `emulatorPortsFor(slot)`）。組號沒給 → 平常那一份（手動開 app、一顆模擬器的 E2E 照舊）；組號 k → 每個 port 加一個固定位移（實驗用 `+20000+10k`，連 0 號組都避開平常的 port，平常的模擬器開著也能跑）。
   一組要的 port 不只五種服務：還有 Hub、logging、UI、Firestore 的 websocket，全部都要推，UI 可以關掉。
2. **找出每一個寫死 port 的地方**：`grep -rn "9099\|8080\|5001\|9199\|5000" public tests-e2e playwright.config.*`。上一個專案是 7 個檔、12 行（`firebase.json` 以外）：app 連 Auth／Firestore／Storage／Functions 的地方、Functions 的網址（還寫死 0 號專案，app 與測試的 fixture 各一份）、fixture 的 Auth 網址／Firestore port／app origin、Functions 網址的 route regex、`baseURL`。過目時以為是三處，後來是八處，實際改的時候又多找到一處：**以 grep 的結果為準，不要以清單為準**。
3. **瀏覽器那側怎麼知道自己是第幾組**：Playwright 在 context 那一層 `addInitScript` 塞 `window.__E2E_PORT_SLOT`（掛在 context，不是某個 fixture——有測試自己 `page.goto()`）。只有開了「一個 worker 一組」才塞，沒塞就是平常那一份。
4. **每組一份設定檔**：從 `firebase.json` 複製、換掉 `emulators` 那一段。設定檔放專案根目錄（`firebase.json` 裡的相對路徑照它算），每組從自己的資料夾啟動（`*-debug.log` 寫在啟動的資料夾，才不會兩組寫同一個檔）。
5. **一組起好再開下一組**（同時開兩組都卡住，見 `pitfalls.md`）。Hosting 只在 0 號組開，`baseURL` 指它。
6. **驗接線**：跑一個檔、`--fully-parallel` 讓兩個 worker 都分到測試，跑完直接問每一組模擬器「這個專案有幾份文件」——worker k 的資料只該出現在第 k 組。
7. **Auth**：一個 worker 一組時，Auth 也是那一組自己的，預設專案就是 `projectIdFor(k)`；清帳號要打那一組。

## 收乾淨

依實驗用的 port 範圍找行程停掉，再確認：沒有 `java`、沒有在聽的實驗 port、沒有啟動腳本的行程。只認實驗的 port 與指令列，**不要碰平常 port 上的模擬器**（使用者可能正在用）。
