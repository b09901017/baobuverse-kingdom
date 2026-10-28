# 06 建客廳 repo `b09901017/claude-home`

Status: done
Type: task
Blocked by: 03, 04

## 使用者要的

> 還是你可以幫我把客廳的東西那些會共用到的東西也開成一個私人 repo ? 這樣之後我就不用一直重複說了 ?
> 我只要更新客廳的東西，我的所有專案都可以更上

## 為什麼

共用的東西現在只在這台電腦的 `~/.claude/`，不在任何 repo；VM 上的設定只在 VM 上；換電腦或 VM 壞掉就沒了。

## 做法

- `gh repo create b09901017/claude-home --private`，建完用 `gh repo view --json visibility` 確認是 `PRIVATE`
- clone 到 `C:/Users/DELL/claude-home`（不放在任何專案裡）
- 目錄（可以調整，README 要寫清楚）：
  - `README.md`：三層＋機密是什麼（照 spec）、新電腦怎麼接、新專案怎麼接、**什麼絕對不能放進來**
  - `mods/`：`~/.claude/mods/` 的**複本**（不含 `node_modules`、`.claude-plugin/types/`）。原位置不動、不改成連結（spec：第 1、2 階段 mods 的搬運照舊由上一個專案的 `.local` 負責）
  - `statusline/`：`~/.claude/statusline-command.sh`
  - `settings/`：`~/.claude/settings.json` 的範本與說明（hook、statusLine、關掉的 synced plugin、effort）
  - `powershell/`：PowerShell profile 裡 `claude1`／`claude2` 那一段
  - `skills/`：留給 07
  - `vm/`：留給 13
  - `user/CLAUDE.md`（名字可以調整）：**`~/.claude/CLAUDE.md` 的正本**（使用者 2026-10-28 決定要有，主控轉達）。
    內容只取 `.local/research/old-workflow.md` 第二節標「通用」、而且有使用者原話出處的偏好，寫成歸納過的一行規則；原話不進公開 repo。
    `~/.claude/CLAUDE.md` 會載入**所有**專案的 session，包括上一個專案：每一條先對過上一個專案的 `CLAUDE.md`，不能跟它矛盾；用 `claude-md` skill 的刪除測試過一遍。
    已經寫在 kickoff 裡的（一次一題、subagent 上限等）擇一處放，不要兩邊都寫。
- `tools/pre-push`：推送前確認目標是 PRIVATE，不是就拒絕（自己寫，不從上一個專案複製檔案）；裝進 `.git/hooks/`
- `package.json`：客廳的工具自己的相依（12 的 `google-auth-library`），不借任何專案的 `node_modules`
- **專案設定的格式在這裡定一次**（08、09、12 共用，不要各發明一份）：
  公開的欄位（Firebase 的正式／staging、絕對不寫入的清單、要哪些 skill）放專案 repo；
  私人的欄位（VM 的 host、GCP 專案與 zone、VM 上的路徑）放客廳或專案的 `.local/`，**不進公開 repo**
- **第一個 commit 是還沒改過的 mods**：段 4、5 會改 `~/.claude/mods`，那些檔不在任何 repo 裡，這個 commit 是審查的基準，也是回復點
- **絕對不放**：`~/.claude/mods-data/`（有登入備份、花費快取）、`~/.claude/backups/`（`.claude.json` 備份有 email）、任何 `.credentials.json`、金鑰、ADC

## 可能卡住的地方

- 第一次 `git push` 可能被 auto mode 當成「把資料推到外部」擋下（上一個專案 `.local/README.md` 寫過）。被擋就停，寫進 HANDOFF，請使用者自己推，不要繞

## 判準

- `gh repo view b09901017/claude-home --json visibility` 是 `PRIVATE`？
- `git -C ~/claude-home ls-files` 裡沒有 `mods-data`、`backups`、`credentials`、`login-backup`、金鑰？
- 動工前先存一份 `~/.claude/mods/` 的 sha256 清單，做完比對完全相同？
- 上一個專案的 `.local`：`git log --since=<開工時間> -- claude-mods claude-handoffs` 沒有因為這支而多出來的 commit？（記憶會照常自動 commit，那不算）
- 只讀 README，知道換一台電腦、開一個新專案各要做哪幾步？

## 做完時留下的

**⚠️ GitHub 上的 repo 還沒建、還沒推**：`gh repo create b09901017/claude-home --private` 被 auto mode 以「Public Data-Sharing Upload」擋下。照規矩不繞，
改成在本機 `C:/Users/DELL/claude-home` `git init`、做完、commit 好，`origin` 已設、推送前的檢查已裝。使用者要自己跑的三步寫在 HANDOFF「要使用者做的」。

客廳的 commit（本機，還沒推）：

| commit | 內容 |
|---|---|
| 第一個 | `mods/`：`~/.claude/mods/` 原封不動的複本（36 個檔，不含 `.claude-plugin/types/`；沒有 `node_modules`）。逐檔 sha256 跟來源相同。段 6 審查的基準 |
| 第二個（06） | `README.md`（三層＋機密、目錄、mods 為什麼還不是正本、絕對不能放、新電腦九步、新專案三步）、`statusline/`、`settings/`（原樣＋每個欄位的說明）、`powershell/claude-accounts.ps1`、`user/`、`tools/pre-push.mjs`＋`tools/install-hooks.mjs`、`docs/project-config.md`、`package.json`（還沒有相依，12 再加 `google-auth-library`）、`vm/README.md`（留給 12、13） |

**推送前的 PRIVATE 檢查**：node 寫的（`tools/pre-push.mjs`），`install-hooks.mjs` 在 `.git/hooks/pre-push` 放一行轉呼叫，檢查邏輯留在客廳，客廳更新就跟上。
認不出 GitHub repo、`gh` 查不到、不是 PRIVATE 一律拒絕。試過：公開的 `baobuverse-kingdom` 擋下、私人的 `baobuverse-kingdom-local` 放行、不存在的 `claude-home` 擋下、本機路徑擋下；裝好的 hook 也擋下公開 repo。

**專案設定的格式**（`docs/project-config.md`，08、09、12 照這份讀）：公開的 `<專案>/.claude/project.json`（`skills`、`neverWrite`）；私人的 `<專案>/.local/project.json`（`vm.path`）；VM 本身的私人設定放客廳 `vm/devbox.json`（一台 VM 給所有專案用）。Firebase 正式／staging 不另寫，guard 直接讀 `.firebaserc`。

**共用的 `~/.claude/CLAUDE.md`**：正本 `user/CLAUDE.md`（5 條），已經複製到 `~/.claude/CLAUDE.md`（這一步沒被擋）。
只取盤點第二節「通用」、有原話出處的；每條對過上一個專案的 `CLAUDE.md`，沒有矛盾（第一行寫「專案的 `CLAUDE.md` 有不同規定時照專案的」）。
已經在 kickoff 的（分段、issue 不給看、一次一題、subagent 上限、想清楚順手、給過的參考）不重複放。出處與「沒放進來的、為什麼」在客廳的 `user/README.md`；原話留在 `.local`。

**判準**

- `gh repo view --json visibility` 是 `PRIVATE`？**還不能驗**：repo 還沒建（見上）。推送前的檢查會在使用者第一次推的時候再驗一次。
- `git ls-files` 沒有 `mods-data`、`backups`、`credentials`、`login-backup`、金鑰：✓（逐一 grep 過，也掃過 email 與 token 的字樣）
- `~/.claude/mods/` 的 sha256：動工前 58 個檔存了清單，做完比對完全相同 ✓
- 上一個專案 `.local` 自開工以來 `claude-mods`、`claude-handoffs` 沒有新 commit ✓；上一個專案的工作目錄沒有改動 ✓
- 只讀 README 知道換電腦、開新專案的步驟：「新電腦怎麼接」「新專案怎麼接」兩節
