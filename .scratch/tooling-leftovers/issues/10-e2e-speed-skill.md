# 10 E2E 加速的通用 skill＋「一個 worker 一顆模擬器」實驗

Status: done（2026-10-29，段 5；客廳 `e977e8b`）
Blocked by: 無
動工前先讀：這份 spec「使用者要的」E2E 那幾句與「使用者選的答案」第 2 題；上一個專案 `.claude/skills/test-speed/SKILL.md`（唯讀）、`.scratch/e2e-speed/issues/03-parallel-workers.md`（2026-09-09 量過的數字）、
`playwright.config.js` 檔頭、`tests-e2e/start-emulators.sh`、`tests-e2e/fixtures/emulator.js`、`public/js/firebase-config.js` 模擬器那一段；上一個專案記憶 `no-sustained-cpu-load-on-her-machine`、`e2e-parallelism-is-blocked-by-the-shared-emulator`、`local-e2e-run-gotchas`（用 `grep -l` 找）；Skill 叫 `skill-creator`

## 使用者要的

> 上個專案就是因為跑太久，如果是vm好像就可以多開幾個worker跑，或是都丟給github跑，本地只要跑必要的就好

> 上個專案不是也有寫優化e2的skill嗎 你可以幫我用skill-creator 幫我去更新那版e2e測試的，然後本基也可以開2 3 個worker跑沒關係，可以試試

> 所以就一定只能共用一顆 Firestore 模擬器 ?

答案：照建議（客廳寫通用 skill；另一份 clone 的實驗分支試 2 個 worker 各一顆模擬器，不推、不開 PR）。

## 現在知道的

| 做法 | 量過嗎 | 結果 |
|---|---|---|
| 1 個 worker | 2026-09-09 | 23.9 分鐘，0 紅 |
| 3 個 worker 共用一顆模擬器、各用自己的 projectId（PR #84） | 2026-09-09 | 14.2 分鐘，**10 紅**（連不上、畫面沒畫完） |
| 每個 worker 自己一顆模擬器（不同 port） | 沒有 | — |

## 做法

1. **實驗**（上一個專案，唯讀以外的事都在 clone 做）：
   - **從 GitHub 網址 clone**（不要從本機資料夾，不然 origin 指著她的工作資料夾）到短路徑（例如 `C:/w/e2e-exp`；`core.longpaths=true`），clone 後 `git remote set-url --push origin <無效值>`，「不推」由 git 擋住。開實驗分支。
   - 模擬器一組是五種：auth、firestore、functions、hosting、storage（`start-emulators.sh:42-44`、`firebase.json:40-47`），每組另有 Hub（4400）、logging（4500）、UI（4000）、Firestore websocket（9150）。
     **對照組（1 個 worker）也一樣**，所有 port 都避開上一個專案平常用的這些（使用者可能同時在跑）。每組用自己的 `--config` 與 `--project projectIdFor(k)`（hub 的 locator 檔才不會撞）；兩組從同一個資料夾啟動時 `*-debug.log` 會寫同一個檔，Windows 上要實際看。
   - port 寫死的地方（過目查到的，不只三處）：`public/js/data/firebase.js:38-39,63`（Auth、Firestore）、`public/js/data/treatmentSheets.js:38`（Storage）、`public/js/data/ai.js:73,79`（Functions；網址寫死 `projectIdFor(0)`，worker 1 會打錯專案）、
     `tests-e2e/fixtures/emulator.js:57-59,72`、`tests-e2e/fixtures/app.js:127`（5001 的 route regex）、`playwright.config.js:64`（baseURL）。做法：在 `firebase-config.js` 加 `emulatorPortsFor(worker)` 當唯一推導，大家都叫它（跟 `projectIdFor` 同一招）；
     省事的話 hosting 只開一組、兩個 worker 共用 baseURL。
   - **電腦負載**（記憶 `no-sustained-cpu-load-on-her-machine`）：先只跑 09-09 那 10 支紅過的檔（1 個 worker 一次、2 個 worker 各一顆一次）；值得的話再分段跑全量、中間冷卻。**每次跑之前在段的對話跟使用者說大約多久、CPU 大約多少，使用者點頭才跑**。
     記時間、紅幾支、紅的原因。
   - 跑完：實驗分支不推、不開 PR；模擬器與瀏覽器程序都關掉；clone 留著或刪掉寫進「做完時留下的」。
2. **skill**：用 skill-creator 把 `test-speed` 改寫成通用版，放客廳 `skills/`（名字段裡定，不跟上一個專案那支同名就好），寫進：先量的方法、本機上限 2～3 個 worker、VM 4 核、全量丟 GitHub Actions 分片、
   模擬器的兩種隔離（同一顆分 projectId／一個 worker 一顆）與這次量到的數字、踩過的坑。**沒量過的數字不寫進任何檔**（test-speed 鐵律 1）。
   客廳 `skills/README.md` 的「來源與版本」表加一列。同步回這個 repo：這個 repo `.claude/project.json` 的 `skills` 加名字（**guard 會即時讀這個檔，JSON 打錯整個 guard 會變成每條都問**：改完先 `node -e` 讀一次確認是合法 JSON）、跑 `sync-skills`。

## 判準

- skill 裡的每一個數字找得到出處（這次實驗、或 09-09 那份）？
- 實驗前後，上一個專案的資料夾、分支、worktree、它平常用的模擬器 port 有沒有被動到？（要：沒有）
- 實驗跑的時候電腦有沒有長時間滿載又放著？（要：一次只跑一組，跑完關乾淨）
- skill 的觸發描述放軟（不寫「一定要使用」），寫清楚什麼時候用（這個 repo `.scratch/claude-home-workflow/research/skill-checklist.md` 第三節衝突 1）

## 做完時留下的

### 實驗量到的（2026-10-29，同一台筆電，無頭，Playwright 1.62.1、firebase-tools 15.28.2、JDK 21）

clone：`C:/w/e2e-exp`（從 GitHub 網址 clone、`origin/develop` 的 `3a39a17` 開 `exp/emulator-per-worker`；push url 設成 `no-push-experiment-only`，實驗 commit `07f73c7` 只在本機）。數字的原始輸出在 `C:/w/runs/<A|B|B2>/`（`pw.log`、`results.json`、`cpu.txt`）。

| 跑的 | 過 | 紅 | 時間 | 整機 CPU（每 5 秒取樣） |
|---|---|---|---|---|
| 接線：2 組、2 個 worker、`21-pool-assignment` 1 個檔（`--fully-parallel`） | 3 | 0 | 33 秒 | 平均 16%、最高 48% |
| A：1 組、1 個 worker、10 個檔 | 78 | 0 | 6.3 分鐘 | 平均 23%、最高 49% |
| B：2 組、2 個 worker、10 個檔 | 70 | 8 | 7.4 分鐘 | 平均 19%、最高 56% |
| B 重跑（網路恢復後，使用者同意） | 78 | 0 | 3.5 分鐘 | 平均 29%、最高 62% |
| C：3 組、3 個 worker、10 個檔（使用者 10/29 經主控要的；跑前確認網路通） | 78 | 0 | 3.0 分鐘 | 平均 40%、最高 77% |

- **B 的 8 個紅全是斷網**：12:14:48（UTC）起連 `fonts.gstatic.com` `ERR_CONNECTION_RESET`、接著 `ERR_NAME_NOT_RESOLVED`，之後每個測試等不到 `[data-signin]` 各燒 30 秒。斷網前兩個 worker 沒有一個紅；worker 1 那時已經跑完自己的 27 個。不是隔離、不是 CPU。
- B 重跑每個檔的秒數跟 A 幾乎一樣（測試時間加總 6.3 vs 6.2 分鐘）：兩組模擬器之間沒有互搶。牆上時間由分到最多的 worker 決定：Playwright 照檔分，51 個測試（3.5 分鐘）對 27 個（2.9 分鐘）。
- 接線驗證：跑完直接問兩組模擬器，`demo-scheduler-w1` 的 `allowedUsers` 只在第 1 組（port 28090）、`demo-scheduler` 只在第 0 組（28080）。
- C（3 組）比 2 組只再快 0.5 分鐘：測試時間加總 7.6 分鐘（2 組 6.3），每個測試開始變慢；照檔分 37／20／21 個測試，最慢的 worker 3.0 分鐘、另外兩個 2.3～2.4。CPU 最高 77%，沒過 85%，skill 沒寫「接近滿載」。跑完收乾淨（沒有 java、實驗的 node、24000～29999 的 port）。原始輸出在 `C:/w/runs/C/`。客廳 `2a0c53a` 把這列補進 skill。
- 一組模擬器約 10～12 秒起來。**兩組同時開兩組都卡住、log 一個字都沒有**（等了 3 分鐘）；一組起好再開下一組就好。
- 只量了 10 個檔，**沒量全量**。全量要不要跑、要不要正式改上一個專案，照 spec 第 2 題「好的話再問」：交給主控問使用者。

**10 個檔跟 issue 寫的不一樣**：09-09 那 10 個紅的完整檔名找不回來（當時的對話紀錄已經不在、commit 與 issue 只點名 `11-todo-drawer`、`16-record-task`、`19-untick-and-drawer-todos`、`21-pool-assignment`）。
用這 4 個＋同時期、沒有寫死 port 的 6 個：`03-health-and-counts`、`04-journey-a-happy`、`05-journey-b-changes`、`12-ask-by-month`、`13-nth-followup`、`20-drawer-one-slot`（共 78 個測試）。`00-smoke` 自己寫死 port，沒選。

### 實驗分支改了什麼（clone 的 `07f73c7`，9 個檔）

- `public/js/firebase-config.js`：`EMULATOR_PORTS`、`emulatorPortsFor(slot)`（沒給組號 → 平常那一份；組號 k → 每個 port ＋20000＋10k，連 0 號組都避開平常的 port）、`emulatorPorts()` 讀 `window.__E2E_PORT_SLOT`。
- 寫死 port 的地方是 **7 個檔、12 行**（過目清單少了 `tests-e2e/fixtures/ai/index.js:13` 的 `EXTRACT_URL`）：`data/firebase.js` 3 行、`data/treatmentSheets.js`、`data/ai.js` 2 行（Functions 網址的 0 號專案也改成跟著 worker）、`fixtures/emulator.js` 3 行（`AUTH_PROJECT_ID` 一個 worker 一組時跟著 `PROJECT_ID`）、`fixtures/app.js` 的 route regex、`fixtures/ai/index.js`、`playwright.config.js` 的 `baseURL`。
- `fixtures/app.js` 的 `addInitScript` 多塞 `__E2E_PORT_SLOT`（只有 `E2E_EMULATOR_PER_WORKER=1` 才塞）。
- 新的 `tests-e2e/start-emulator-sets.mjs N`：每組一份設定檔（根目錄 `firebase.e2e-set-k.json`，沒進 commit）、從 `.artifacts/emu-k/` 啟動、hosting 只開 0 號組、UI 關掉。
- 單元測試：只有「`public/` 跟 shell 快照一樣」那條紅（改了 `public/` 就會紅，正式改要升 VERSION）。

### 上一個專案沒有被動到

開工前、做完各看一次：分支 `claude/availability-sheet-chart-no`、HEAD `5b785ad8`、`git worktree list` 10 行、工作目錄乾淨、push url 照舊。實驗的 port 全在 24400～29209，平常的 4000／4400／4500／5000／5001／8080／9099／9150／9199 沒碰。
每次跑完收乾淨：沒有 java、沒有實驗的 node、24000～29999 沒有在聽的 port（A 那次外層啟動腳本活了下來，手動補收、收尾腳本改成用指令列再找一次）。

**clone 留著**（`C:/w/e2e-exp`，含 `node_modules`）：要量全量或正式改的時候直接用。不要的話整個資料夾刪掉就好（實驗 commit 只在本機，刪了就沒了；改法都寫在上面）。`C:/w/runs/` 是原始輸出，也可以一起刪。

### skill

客廳 `skills/e2e-speed/`（`e977e8b`；名字跟上一個專案的 `test-speed` 不同）：`SKILL.md`、`scripts/durations.mjs`（讀 Playwright JSON 報表印每個檔幾秒）、`references/parallel-emulators.md`（兩種隔離、量到的數字、一個 worker 一組怎麼接）、`references/pitfalls.md`（test-speed 的坑＋上一個專案記憶的坑＋這次踩的 3 個）。客廳 `skills/README.md`「來源與版本」加一列。
這個 repo：`.claude/project.json` 的 `skills` 加 `e2e-speed`（`node` 讀過是合法 JSON）、跑了 `sync-skills`（只新增 10 個檔，跟客廳逐檔相同）。

- 每個數字都標了出處：上一個專案 2026-09-09（test-speed、issue 03）、上一個專案記憶（2026-10-02 CPU、2026-10-16 CI 開機與 `--related`）、這次實驗、客廳 `vm/README.md`（VM 機型）。沒有估的數字。
- 觸發描述是「…時參考」，沒有「一定要使用」。
- skill-creator 的流程只做到「寫草稿＋兩個測試題目」（`evals/plan-before-raising-workers`、`evals/no-unmeasured-numbers`）：**沒跑**有／沒有 skill 的對照評測與觸發描述最佳化。那要再開 4 個 subagent（兩個一批），是真的計費的模型呼叫，交給主控問使用者要不要。
- 這次踩到、寫進 `pitfalls.md` 的：兩組模擬器同時開會卡住；命令列 `--reporter=list` 會換掉 config 的 json reporter（A 那一次的 JSON 因此是 `--list` 留下的「全部跳過」那份，A 的秒數改從 list 輸出算）；`taskkill /T` 之後外層啟動腳本還活著。
