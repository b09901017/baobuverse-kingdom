# 08 這個專案自己的私人同步（.local）與客廳的備份

Status: todo
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
