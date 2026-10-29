# 10 E2E 加速的通用 skill＋「一個 worker 一顆模擬器」實驗

Status: todo
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
