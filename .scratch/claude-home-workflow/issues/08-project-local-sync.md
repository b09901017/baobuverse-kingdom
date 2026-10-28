# 08 這個專案自己的私人同步（.local）與客廳的備份

Status: done
Type: task
Blocked by: 06, 10

## 使用者要的

> 但是我現在是新的專案了誒，總不能都推到那邊吧 ? 我希望可以隔離開，就是如果是那個專案的還是推到私人 repo baobao-wellness-clinic-local中，但是這個專案的可以推到另一個私人repo中

> 然後客廳共用的部分也可以更新到私人repo，然後這個專案的local也可以更新到對應的local 私人repo讓vm可以同步更新到

## 為什麼

`.local/` 已經 clone 好 `b09901017/baobuverse-kingdom-local`（私人、空的），`.gitignore` 擋著。還沒有東西會自動同步進去。
上一個專案的 `autosync.mjs` 只同步它自己的記憶，但會把 `~/.claude/mods-data/handoffs/` **整個資料夾**照抄（10 會處理）。

## 做法

- 同步工具寫成**通用的**放客廳（`tools/`），每個專案只放設定；不從上一個專案複製檔案
- 這個專案同步：Claude 記憶（`~/.claude/projects/<這個專案的資料夾代號>/memory/`，兩個帳號共用同一份，見上一個專案記憶 `claude-code-mods-2026-10-16`）、
  這個專案的交接開場（10 定好的 `~/.claude/mods-data/handoffs/<資料夾名>/`）
- 客廳同步：把 `~/.claude/mods/` 單向複製進客廳（同 06 的排除規則）、commit、push。**不寫回** `~/.claude/mods`。
  **只在家裡的 Windows 電腦做**（13 之後 VM 也有客廳，兩台都推 mods 會撞）；推之前先 `pull --ff-only`，失敗就跳過、寫 log
- `baobuverse-kingdom-local` 現在是空的、沒有 upstream：第一次推要 `push -u`，`@{u}` 不存在時不能當錯誤
- 觸發：這個 repo 的 `.claude/settings.json` 的 SessionStart／SessionEnd hook 跑一支 committed 的 node 腳本；
  `.local/` 或客廳不存在時（例如雲端 session）**安靜地什麼都不做、exit 0**；在背景做、不卡住 Claude Code、失敗只寫 log
- 兩個私人 repo 都裝推送前的 PRIVATE 檢查
- 上一個專案 `.local/README.md` 寫過：Claude 自己的工具呼叫推不上去是 auto mode 擋「資料外流」—— 推送走 hook，不要繞

## 判準

- 先改一份這個專案的記憶，再開、關一次 session：`baobuverse-kingdom-local` 多一個 commit、已推上去？什麼都沒改時是 0 個 commit？
- 上一個專案的記憶與交接開場**沒有**出現在 `baobuverse-kingdom-local`？
- 在沒有 `.local/` 的地方（例如把腳本在暫存資料夾跑一次）不報錯？
- hook 指令在 Windows 上真的跑得起來（Playwright MCP 就是因為 bash 在 Windows 找不到而壞的）？

## 做完時留下的

**客廳 `d0beb35`（已推）**：通用的 `tools/autosync.mjs`＋測試 `tools/autosync.test.mjs`、README「新專案怎麼接」第 4 步與「自動同步」一節、`.gitignore` 加 `*.log`。
**這個 repo**：`.claude/scripts/autosync.mjs`（hook 叫的：客廳在就在背景叫客廳的工具，馬上 exit 0）、`.claude/settings.json` 加 `SessionStart`／`SessionEnd` hook（跟主控加的 `skillOverrides` 合在同一個檔）。

- 專案：記憶（`~/.claude/projects/<路徑代號>/memory/`，也找 `~/.claude-accountN/`）→ `.local/claude-memory/`；開場（`handoffs/<資料夾名，小寫>/`，issue 10）→ `.local/claude-handoffs/`。來源不在就不動 repo 裡的。
- 客廳：只在 Windows；先 `pull --ff-only`，失敗就跳過、寫 log；`~/.claude/mods` 照 06 的排除（`node_modules`、`.git`、`.claude-plugin/types`）複製進 `mods/`，**只 commit `mods/`**，客廳裡別的正在改的檔不碰。不寫回 `~/.claude/mods`。
- 有變動才 commit；沒有 upstream 就 `push -u`；同一個 repo 一次只跑一個（`.git/autosync.lock`）。失敗只寫客廳的 `tools/autosync.log`，永遠 exit 0。
- hook 用 **exec 形式**（`"command": "node"`＋`"args": ["${CLAUDE_PROJECT_DIR}/.claude/scripts/autosync.mjs"]`，官方 hooks 文件建議有路徑時用這個）：不經過 shell，Windows 沒有 Git Bash 也跑得起來。
- 推送前的 PRIVATE 檢查：`.local` 用客廳的 `install-hooks.mjs` 裝好了；客廳在段 3 就裝了。
- **只做「這台 → repo」**：VM 接手要的反方向（repo → 這台）沒做，交給 12、13（記進 HANDOFF）。

**判準**

- 改記憶、開關 session → 多一個 commit、已推？✓ 第一次照 hook 的路跑（`node .claude/scripts/autosync.mjs`）：`.local` 多一個「自動同步」commit（記憶 2 份），已推上 `baobuverse-kingdom-local`，log 寫「推了 1 個 commit」，pre-push 的 PRIVATE 檢查放行。
  沒被 auto mode 擋。什麼都沒改時再跑：0 個檔變、0 個 commit ✓。測試裡也有「改一份記憶 → 多一個 commit」「沒改 → 0 個」。
- 上一個專案的記憶與開場沒有出現在 `baobuverse-kingdom-local`？✓ GitHub 上只有這個專案的 2 份記憶與段 1 的 `research/`；測試另外放了上一個專案（第一層）與別的專案的開場，都沒有進來。
- 沒有 `.local/`、沒有客廳的地方不報錯？✓ hook 腳本用假的家目錄（沒有客廳）跑 exit 0；測試「沒有 .local、沒有客廳 repo」exit 0、沒有 log。
- hook 在 Windows 真的跑得起來？✓ 在暫存資料夾放一個同樣寫法（exec 形式）的 SessionStart／SessionEnd hook，跑一次 `claude -p`：登入過期、但兩個 hook 都執行了，`CLAUDE_PROJECT_DIR` 也拿得到。
- 「推送失敗就跳過、寫 log」用測試驗？✓ `autosync.test.mjs` 10 條全過：推不上去 → exit 0、log「沒推成」、commit 留在本機，下一次補推；客廳兩邊分岔 → log「pull --ff-only 沒成功」、不備份；不是 Windows 不碰客廳；不帶 `node_modules`／型別檔；客廳裡別的改動不 commit；`--dry-run` 不 commit。
