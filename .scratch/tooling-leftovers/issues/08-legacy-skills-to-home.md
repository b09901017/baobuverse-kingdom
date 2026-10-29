# 08 上一個專案的 skill 換成客廳的版本：先出差異報告，使用者決定再換

Status: done
Blocked by: ~~10~~（10 done，客廳 `skills/e2e-speed`；`test-speed` 現在有得比）
動工前先讀：`.scratch/legacy-to-home/spec.md`「使用者選的答案」第 2 題；`docs/env-notes.md`（skill 怎麼從客廳同步到專案、`project.json` 的 `skills`）；客廳 `docs/project-config.md`；上一個專案的 `CLAUDE.md`（它的 PR 與合併規定）

## 使用者要的

> 下一輪，候選清單就一起做吧，全部完成

上一輪（2026-10-29）第 2 題的答案：「這一輪不換（`project.json` 不放 `skills`），下一輪看過差異再換」。
上一輪就定下的原則：

> 不要影響到上個專案，畢竟那個專案還在進行中還在維護測試

## 現在的樣子

上一個專案 `.claude/skills/` 跟客廳 `skills/` 同名的有 8 支：`claude-md`、`domain-modeling`、`graphify`、`grill-with-docs`、`grilling`、`kickoff`、`matt-code-review`、`setup-matt-pocock-skills`。
它自己才有的（`calendar-sheet-merge`、`customer-availability-sheet`、`frontend-design`、`month-end-reconciliation`、`pixel-exact-screenshot-extraction`、`test-speed`）不在這支範圍，除了 `test-speed` 要跟 10 做的通用版比一次。

## 做法

1. **差異報告**（不改任何檔）：每一支一列 —— 差在哪（摘要，不貼全文）、換了之後在上一個專案會有什麼不同（例如觸發條件、提到的檔或流程它有沒有）、建議換／不換／換但保留它的某段。
   `test-speed` 另一列：跟 10 的通用版比，建議留它自己的、換成通用版、或兩支並存。
   報告一定要寫的（過目查到的）：
   - 客廳 `tools/sync-skills.mjs` 是**鏡像**：選了的 skill 資料夾會變得跟客廳一模一樣（`:9`、`:91-97`），它多的檔會被刪。例如上一個專案 `domain-modeling/CONTEXT-FORMAT.md` 會被刪、寫法從 `CONTEXT.md` 變成 `GLOSSARY.md`（`setup-matt-pocock-skills` 也是），
     但上一個專案根目錄有 `CONTEXT.md`、它自己的 `calendar-sheet-merge` 也引用 `CONTEXT.md`。8 支裡只有 `grill-with-docs` 逐檔相同。
   - `sync-skills` 會把 `licenses/map.json` 對到的授權檔複製到上一個專案的 `docs/licenses/`（`:72-75`），它現在沒有這個資料夾；那個 repo 是 public，PR 要列出來。
   - `sync-skills` 是**手動**的（客廳 `skills/README.md:3-10`）：客廳更新之後，要在專案資料夾再跑一次、commit；上一個專案還要照它的 `CLAUDE.md` 開 PR 進 `develop`（合進去會重新部署 staging）。
2. **在段的對話裡問使用者**（一次一題、附建議；全部都能照同一個原則決定的話收成一題「照建議」）。答案寫進 spec「使用者選的答案」。
3. 照答案換：照客廳的同步機制（`project.json` 的 `skills` 或 `env-notes.md` 寫的做法），**照上一個專案自己的 `CLAUDE.md` 開 PR、合併**。從乾淨的 clone 開分支，不動它的工作目錄、分支、worktree。

## 判準

- 報告裡每一支「換了之後會有什麼不同」是不是對著上一個專案的檔與流程查過，不是只比字？
- 換了之後，上一個專案自己才有的 skill 會不會被刪掉或蓋掉？（要：不會）
- 之後客廳更新，上一個專案怎麼跟上？報告與問使用者時要說清楚：照現有機制是「在它的資料夾跑一次 `sync-skills`＋照它的 `CLAUDE.md` 開 PR」，不是自動的
  （使用者第一輪的原話「我只要更新客廳的東西，我的所有專案都可以更上」；要自動化另開一支，記進中途發現）
- 上一個專案的工作目錄、分支、worktree list 前後相同；它的 CI（PR 上的）綠
- 它的 `project.json` 加 `skills` 之後，客廳 `legacy-parity.test.ts:84-92` 的 `OLD_JSON`（註解寫「develop 上那一份的複本」）就不再逐字相同：規則結果不變、測試照樣過，**不改測試**，記進中途發現

## 做完時留下的（段 6，2026-10-29）

- 差異報告：`.scratch/tooling-leftovers/08-skill-diff-report.md`（比上一個專案 `develop` `3a39a17` 與客廳 `24d8413`，換行不算差）。
  issue 寫「8 支裡只有 `grill-with-docs` 逐檔相同」對；另外查到：上一個專案的 `CONTEXT.md` 除了根目錄、`calendar-sheet-merge`，還在 `CLAUDE.md:12`、`:172`、`docs/agents/domain.md`（8 處）與幾十支舊 issue；這台的 `graphifyy` 0.9.51 有新版 `graphify` skill 要用的函式（python 確認過）。
- 使用者答案（spec「使用者選的答案」09、08-1、08-2）：換 6 支（`claude-md`、`graphify`、`grill-with-docs`、`grilling`、`kickoff`、`matt-code-review`）；`domain-modeling`、`setup-matt-pocock-skills` 不換；`test-speed` 留、不加 `e2e-speed`；kickoff 的合併規定搬進它的 `CLAUDE.md`。
- 做法：從 GitHub 網址 clone（`--filter=blob:none`，在這個 session 的 scratchpad，不動它的工作資料夾）、從 `develop` 開 `claude/skills-from-home`；`project.json` 加 `skills`（改完 node 讀過，合法）；跑客廳 `sync-skills`：改 10 個檔、新增 `docs/licenses/` 2 個、刪 0（選了的 6 支沒有客廳沒有的檔）；`CLAUDE.md`「上線」那節 PR 基底後面加一段「合併」。
  14 個檔 +574 −239，一個 commit `b05e3a7`。
- PR [b09901017/baobao-wellness-clinic-scheduler#187](https://github.com/b09901017/baobao-wellness-clinic-scheduler/pull/187)（→ `develop`）。commit 訊息與 PR 內文看過：沒有真名、帳號、email。
  CI：`rules` 54 秒、`test` 42 秒、`e2e` 2 分 57 秒全過（`deploy` 在 PR 上跳過）；使用者「綠了就合」→ 合進 `develop` `869503d`（merge commit，跟 #186 一樣；那個 repo 不允許 GitHub 自動合併，是段在背景等 CI 跑完再合的）。合進去會重新部署 staging。
- 上一個專案的工作資料夾前後相同：`claude/availability-sheet-chart-no`、`5b785ad8`、worktree list 10 行。
