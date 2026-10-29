# 01 guard：上一個專案的特例規則變成資料，沒有設定檔時用「最嚴的一份」

Status: todo
Type: task
Blocked by: —

## 動工前先讀

- [`../spec.md`](../spec.md)「換手的順序」「使用者選的答案」第 3 題、「上一個專案一律不能壞」、「允許改的既有測試」
- 客廳 `docs/project-config.md`（格式只在這裡定，要加欄位改這份）
- `~/.claude/mods/guard/hooks/classify.ts`（`Rules`、`LEGACY` `:39-44`、`rulesFrom` `:58-68`、每一個 `rules.legacy` 分支、預設參數 `:94`、`:196`）、`hooks/register.ts`（`rulesOf` `:62-70`、`:91`）
- `tests/legacy-parity.test.ts`（拿 `e8f9058` 那一版的 classify 逐條比）、`tests/project-config.test.ts`（`:31`、`:112` 用到 `legacy`）、`tests/guard.test.ts`（靠預設參數）
- `.scratch/claude-home-workflow/HANDOFF.md`「中途發現」段 4（09）：`firebase deploy --project <不認得的 id>` 在上一個專案不問

## 使用者要的

> 我只要更新客廳的東西，我的所有專案都可以更上

> 不要影響到上個專案，畢竟那個專案還在進行中還在維護測試

第 3 題（guard 在上一個專案碰到不認得的 Firebase 專案 id 要不要問）：「都照建議」＝**要問**。

## 為什麼會這樣

guard 用「沒有 `.claude/project.json`」認上一個專案（`classify.ts:60` 的 `legacy = cfg === undefined`），再用 `rules.legacy` 分支 8 處：
staging 比對不加邊界（`:83-86`）、`firebase` 帶 `--project` 但認不出時照預設環境（`:212`）、npm 腳本對照（`:236`）、特定腳本當成寫入（`:243`）、
讀正式站的腳本（`:246`）、`reset-staging`（`:247`）、`git push` 到 main 算寫正式站（`:283`）、`gh workflow run ... deploy --ref main`（`:289`），加上 `register.ts:91`。
另外三處內建預設也是上一個專案的：`.firebaserc` 讀不到時退回寫死的專案 id（`:65` 用 `LEGACY`）、讀不到專案資料夾就用 `LEGACY`（`register.ts:66,68`）、`envOf`／`classify` 的預設參數（`:94`、`:196`）。
段 6 審查把這列成 Repeated Switches：上一個專案限定的規則應該是 `Rules` 裡的資料。

**為什麼不是「拿掉特例」**：`project.json` 只會出現在含有那次合併的分支上；上一個專案有好幾條分支與 `.claude/worktrees/`，guard 讀的是 `session.root()` 底下的檔（`register.ts:69`）。
沒有設定檔的分支或 worktree 如果掉到「一般規則」，推 main 不問、`npm run restore` 不算寫入 —— 會**少問**，違反「只會多問」。
所以：**沒有設定檔＝最嚴的一份**，那一份就是今天上一個專案的規則（它本來就是「沒有設定檔」的那一種）。

## 做法

1. 每一個 `rules.legacy` 分支改成讀 `Rules` 裡的一個欄位（例如 `pushMainDeploysProd`、`writeScripts`、`prodReadScripts`、`npmScripts`、`looseStagingMatch`、`unknownProjectUsesDefault`；名字自己定，用白話）。
   欄位可以從 `project.json` 讀（新增的欄位寫進客廳 `docs/project-config.md` 的表：誰讀、意思）。
2. `LEGACY` 改名成「沒有設定檔時的最嚴預設」（例如 `STRICT`），欄位值＝今天的行為。`rules.legacy` 這個布林拿掉。
   寫死的上一個專案 Firebase 專案 id（`.firebaserc` 讀不到時的退路）拿掉：讀不到就是「不知道是哪一個環境」→ 照第 3 題要問。
3. 第 3 題：`firebase deploy --project <不認得的 id>` 一律要問（包括最嚴預設）。這是唯一一處行為改變。
4. 這個專案的 `.claude/project.json` 不加新欄位（有設定檔、沒有那些欄位＝沒有那些特例，跟今天一樣）。

## 判準

- 沒有 `project.json` 的資料夾（上一個專案的任何分支、worktree、隨便一個資料夾）：任何一個指令的判斷結果，跟 `e8f9058` 那一版相同嗎？
  只允許兩種不同：「`--project` 帶不認得的 id」變成要問；`.firebaserc` 讀不到時，原本靠寫死 id 認出的正式站／staging 變成「不知道」而要問。（都是多問）
- 一份寫了所有新欄位、值等於最嚴預設的 `project.json`：判斷結果跟最嚴預設逐條相同嗎？（issue 06 就靠這一條）
- 這個專案（有 `project.json`、沒有那些欄位）：判斷結果跟改之前逐條相同嗎？
- 程式裡還有沒有 `rules.legacy`、寫死的上一個專案 Firebase 專案 id？（測試的假資料可以有）

## 規矩

改 `~/.claude/mods` 的規矩照 HANDOFF「每一段共同的規矩」。允許改的既有測試只有 spec「允許改的既有測試」列的幾條，其他一條都不改。
