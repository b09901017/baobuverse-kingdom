# 01 guard：上一個專案的特例規則變成資料，沒有設定檔時用「最嚴的一份」

Status: done
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

## 做完時留下的（2026-10-29，段 1）

改 `~/.claude/mods/guard`，複製進客廳（客廳 `30a7191`＋`2e1f9b5`，已推；客廳 `mods/` 跟 `~/.claude/mods` 逐檔相同，49 個檔）。客廳 `docs/project-config.md` 加「guard 的特例」一節。

- `rules.legacy` 拿掉，換成六個欄位（`Rules` 與 `project.json` 同名）：`mainDeploysProd`（推 main／PR 合進 main／`gh workflow run …deploy… --ref main` ＝ 部署正式站，`register.ts` 的 `branchRisks` 也看它）、
  `npmScripts`、`writeScripts`、`prodReadScripts`、`stagingScripts`、`looseStaging`。有 `project.json` 卻沒寫＝沒有那個特例；型別不對當成沒寫。
- `LEGACY` → `STRICT`（＝原本上一個專案的規則），**不帶任何 Firebase 專案 id**。沒有 `project.json` 用它；讀不到專案資料夾（`register.ts`）也用它；`envOf`／`classify` 的預設參數也是它。
  專案 id 只從 `.firebaserc` 讀。`project.json` 壞掉照舊當成「有設定、沒有特例」。
- 第 3 題：`firebase … --project <認不出的 id>` 每個專案都要問。框上的字改成「--project 不是這個專案的正式站或 staging」（原本那句「沒寫 --project」不對）。

**跟 issue 寫的不同的地方**

1. **`firebase use <認不出的專案>` 也要問**（issue 沒寫）。不加的話，最嚴預設沒有寫死的 id，`firebase use <上一個專案正式站的 id>` 在讀不到 `.firebaserc` 時會從「要問」變成「不問」——少問。
   切過去之後沒寫 `--project` 的指令都會打它，跟第 3 題是同一件事，所以每個專案都套用。**這個專案受影響的只有這一條**（`firebase use <不是 .firebaserc 正式站或 staging 的專案>` 原本不問、現在問）；`firebase use`（不帶目標）、`firebase use --add`、模擬器 `demo-*` 照舊不問。
2. **spec 原本沒列、後來補進去的既有測試兩行**（主控 2026-10-29 照建議，spec「允許改的既有測試」已補）：`guard.test.ts:30` 的 `touched('firebase deploy --only hosting')`（只改期待值：`staging:write` → `unknown:write`）、
   `project-config.test.ts:51` 的「讀設定那條路」（原本跟 `classify()` 預設參數比，改成跟「最嚴預設＋那份 `.firebaserc` 的 id」比，保留「讀 `.firebaserc` 得到的規則＝最嚴預設加上它的 id」的意思，跟 `legacy-parity.test.ts` 拿 `e8f9058` 逐條比互相補；客廳 `2e1f9b5`）。
   兩行都靠 `classify()` 預設參數裡寫死的 id；預設參數改成最嚴預設之後，就是判準允許的第 2 類（多問）。
3. 指令清單從 `legacy-parity.test.ts` 搬到 `tests/fixtures/parity-cases.ts` 共用（指令一個字沒改）。

**改到的既有測試**（spec 允許的）：`legacy-parity.test.ts`（兩類例外寫成 `onlyMoreAsking`：原本要問的照樣要問、多出來的只能是寫正式站、認得的環境只能變成「看不出」）、`project-config.test.ts:31`（比 `STRICT`＋`.firebaserc` 的 id）、`:112`（看 `mainDeploysProd`）。

**判準**

| 判準 | 結果 |
|---|---|
| 沒有 `project.json`：跟 `e8f9058` 逐條比 | 讀得到 `.firebaserc`：只有 `firebase deploy --project some-other-id` 不同（變成要問）；讀不到：每一條都是「一樣或只多問」（`legacy-parity.test.ts`） |
| 寫了全部新欄位、值＝最嚴預設的 `project.json` | 規則與每一條判斷都跟沒有 `project.json` 一樣（`strict-default.test.ts`，issue 06 靠這條） |
| 這個專案（有 `project.json`、沒有那些欄位） | 拿改之前的 `classify`（`tests/fixtures/classify-881473b.ts`）逐條比，只有上面第 1 點那一類不同（`strict-default.test.ts`，另外比了空的 `project.json`、有 `.firebaserc` 的新專案、壞掉的 `project.json`） |
| 程式裡還有 `rules.legacy`、寫死的上一個專案 Firebase 專案 id 嗎 | `hooks/` 沒有（grep `wellness`、`legacy`、`LEGACY` 0 筆；測試的假資料有） |

驗證：`claude plugin test guard` 31 過（基準 24＋新 7）、`tsc` 0 錯、`claude plugin validate` 過（警告只有原本的「沒有 author」）。新測試先紅（`STRICT` 不存在，檔案載不進來）再綠。
