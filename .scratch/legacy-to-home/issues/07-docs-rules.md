# 07 規則文件整理：路由規則只留一處、Status 字串統一、改 mod 的 commit 規矩

Status: done
Type: task
Blocked by: —

## 動工前先讀

- [`../spec.md`](../spec.md)「使用者選的答案」第 6 題
- `.scratch/claude-home-workflow/HANDOFF.md`「段 6 審查結果」→「Standards 軸」的硬違規前兩條
- 這個 repo 的 `CLAUDE.md`「用哪個流程」、`docs/agents/issue-tracker.md`、`docs/agents/triage-labels.md`
- 客廳 `skills/kickoff/SKILL.md`（**正本在客廳**；這個 repo 的 `.claude/skills/kickoff/` 是複本，改正本再用客廳 `tools/sync-skills.mjs` 同步回來，見 `docs/env-notes.md`）
- Skill 叫 `claude-md`（刪除測試）與 `writing-for-agents`

## 使用者要的

第 6 題（自動同步會把改到一半的 mod 備份上去）：「都照建議」＝**不改程式，改規矩**：改 mod 不要求「一個 commit」，只要求最後一個 commit 的狀態完整。

## 為什麼會這樣

- 同一條路由規則（決策沒定走 grill、一輪改動走 kickoff、bug 直接做）寫在三處：`CLAUDE.md` 的「用哪個流程」、kickoff 的 description、kickoff `SKILL.md` 的「兩條路」。
  skill-checklist E4、M8：同一件事寫兩處，模型會猜哪個比較重要，不一致時隨便挑。現在三處一致，但只要改一處就會分岔。
- issue 的狀態字串：`docs/agents/issue-tracker.md` 說用 `triage-labels.md` 的角色字串，kickoff 寫 `todo`／`done`，實際上 issue 都用 `todo`／`done`／`wontfix`。
- 客廳的自動同步（每個對話開始／結束）會把 `~/.claude/mods` 正在改、還沒 commit 的檔先備份成「自動同步」commit，「改 mods 一支一個 commit」在家裡電腦上做不到。

## 做法

1. 路由規則：kickoff 的 description 留著（觸發要用）。`CLAUDE.md` 與 kickoff「兩條路」擇一保留（kickoff 是跨專案的，別的專案的 `CLAUDE.md` 不一定有這段），用 `claude-md` 的刪除測試決定，理由寫進「做完時留下的」。
2. Status 字串：`issue-tracker.md` 其實有三套說法（`:10` 指向 `triage-labels.md` 的角色字串、`:26-30` wayfinding 的 `claimed`／`resolved`、kickoff 的 `todo`／`done`）。
   一般 issue 定成實際在用的 `todo`／`done`／`wontfix`；wayfinding 那一套留給 `/wayfinder` 自己用、寫清楚兩者的分界。改 `docs/agents/issue-tracker.md`（或 `triage-labels.md`）讓說法一致；kickoff 不用改就不改。
3. kickoff 的「段裡每一支 issue」加一句：改的是 `~/.claude/mods` 時，自動同步會先備份半成品，**最後一個 commit 的狀態完整**就算數（第 6 題）。
4. 改 kickoff 改客廳的正本、commit、推，再 `node <客廳>/tools/sync-skills.mjs` 同步回這個 repo。

## 判準

- 改完之後，路由規則還出現在幾處？（description＋一處）
- 一支新開的 issue 該寫什麼 `Status:`，兩份文件給的答案一樣嗎？
- 在家裡電腦改 mod 的那一段，照 kickoff 寫的規矩，會不會因為多了「自動同步」commit 就算違規？
- 這個 repo 的 `.claude/skills/kickoff/` 跟客廳正本逐檔相同嗎（`sync-skills.mjs --dry-run` 0 變動）？

## 規矩

改 skill 可能被 auto mode 當成改自己的設定而擋下（上一輪記下的：由別的 session 轉達的「改 skill」會被擋）。**被擋就停**，寫進 HANDOFF，主控在自己的 session 做。
這個 repo 的 `CLAUDE.md` 不能違反的幾條一定留。

## 做完時留下的（2026-10-29，段 1）

客廳 `0aa707a`（kickoff，已推），`sync-skills.mjs` 同步回這個 repo。改 skill 沒有被 auto mode 擋。

1. **路由規則**：刪 `CLAUDE.md` 的「用哪個流程」，留 kickoff 的「兩條路」。刪除測試：
   - 會不會少了它就做錯？不會：路由真正要生效的時候（還沒叫任何 skill），靠的是每次都載入的 kickoff description，它已經寫了「決策還沒定走 /grill-with-docs（grilling＋domain-modeling）、bug／UI 微調／文案不用」。
   - 留哪一處：kickoff 跨專案，別的專案的 `CLAUDE.md` 不一定有這段；「兩條路」還多一句「談到一半發現決策還沒定就換過去」。`CLAUDE.md` 每次對話都載入，少 6 行。
   - 「不能違反」四條、「決定由使用者做」、「合併」都沒動。
2. **Status 字串**：`docs/agents/issue-tracker.md` 定成一般 issue 用 `todo`／`done`／`wontfix`（kickoff、`/to-tickets` 寫的都是這種）；
   `/triage` 收進來的原始 issue 在分流前可以是 `triage-labels.md` 的其他角色字串，分流完是 `todo`；`claimed`／`resolved` 只給 `/wayfinder` 用、只在有 `map.md` 的資料夾，不混用。
   `triage-labels.md` 把 `ready-for-agent` 對應成 `todo`（`/to-tickets`、`/to-spec` 會照這張表寫），並註明 `done` 不是角色。kickoff 原本就寫 `todo`／`done`，沒改。
3. **改 mod 的 commit 規矩**：kickoff「段裡每一支 issue」加一段：改的是 `~/.claude/mods` 時，客廳那邊不要求一支一個 commit，最後一個 commit 的狀態完整（測試全過、跟 `~/.claude/mods` 逐檔相同）就算數。

**判準**

| 判準 | 結果 |
|---|---|
| 路由規則還出現在幾處 | kickoff 的 description＋「兩條路」（grep「用哪個流程」「兩條路」：只剩 kickoff 的兩份複本） |
| 新開的 issue 該寫什麼 `Status:`，兩份文件答案一樣嗎 | 一樣：`todo`（`issue-tracker.md`、kickoff；`triage-labels.md` 的 `ready-for-agent` 也對應到 `todo`） |
| 多了「自動同步」commit 算違規嗎 | 不算（kickoff 新加的那段） |
| `.claude/skills/kickoff/` 跟客廳正本逐檔相同嗎 | 相同；`sync-skills.mjs --dry-run` 新增、改動、刪除都是 0 |
