# 14 桌面 app 也載入 mods

Status: todo
Type: task
Blocked by: 09, 10

## 使用者要的

主控問「桌面 app 要不要也載入 mods（儀表板等）」，使用者 2026-10-28 答：

> 好

## 為什麼

上一個專案的 mods（儀表板、E2E 進度、limit-guard、notify、guard）是靠 VS Code 擴充的設定
`claudeCode.environmentVariables` 裡的 `CLAUDE_CODE_PLUGIN_DIRS` 載入的（上一個專案記憶 `claude-code-mods-2026-10-16`）。
使用者現在用 Claude 桌面 app 的 Code 分頁，那裡看起來沒有載入任何 mod。

## ⚠️ 為什麼排在 09、10 之後

- limit-guard 載入後，每個對話的系統提示都會叫 Claude 把開場寫進 `~/.claude/mods-data/handoffs/`。10 沒做完之前，這個專案的開場會被上一個專案的同步推進它的私人 repo
- guard 載入後要能認得這個專案的 Firebase 與「絕對不寫入」清單（09），不然它在這裡只會用上一個專案的規則

## 做法

- 先用 Skill 工具叫 `plugin-authoring`（這個 session 的清單裡有），查桌面 app 怎麼載入 mod、哪些 UI（Pane、AbovePrompt band、狀態列）在桌面 app 畫得出來
- 找出讓桌面 app 每個新對話都載入 `~/.claude/mods/*` 的正式做法（例如 settings 的 `env`、app 自己的設定）。查官方文件，不要猜
- 上一個專案記憶寫過：auto mode 會擋 Claude 改自己的設定檔。被擋就停，把要使用者自己做的那一步寫成一步一步的說明，放進 HANDOFF「要使用者做的」
- 一支一支看在桌面 app 能不能用：儀表板、E2E 進度、limit-guard、notify（它判斷「VS Code 在最前面就不跳」，桌面 app 在最前面時要怎麼辦，記下來）、guard
- 改法寫進客廳 README 的「新電腦怎麼接」

## 判準

- 在桌面 app 開一個新對話，看得到儀表板（或明確知道桌面 app 畫不出哪一部分、為什麼）？
- guard 在桌面 app 擋得到對 `baobu-app` 預設 database 的寫入？
- 在這個專案存開場，它在 `mods-data/handoffs/<資料夾名>/`，不在上一個專案會抄走的位置？
- VS Code 那邊原本的載入方式沒有被改動？
