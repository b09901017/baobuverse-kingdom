# 14 桌面 app 也載入 mods

Status: done
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

## 做完時留下的

**`~/.claude/settings.json` 加了 `env.CLAUDE_CODE_PLUGIN_DIRS`**（五支：dash、e2e-progress、limit-guard、notify、guard），沒被 auto mode 擋。客廳 `3731361`（已推）：README「mods 怎麼載入」、新電腦第 8 步、`settings/` 範本與欄位表。

- 正式做法的出處：Claude Code 內建 `plugin-authoring` skill 的 `reference.md`「Developing one」（2.1.309）：
  `CLAUDE_CODE_PLUGIN_DIRS` 給「沒辦法加 `--plugin-dir` 的 session（桌面 app、SDK）」用，從 process 的環境變數或**設定資料夾的 `settings.json` 的 `env`** 讀，**專案的 settings 不算**。
- 為什麼不會動到 VS Code：VS Code 的擴充設了 `CLAUDE_CONFIG_DIR=~/.claude-account2`，讀的是那個資料夾的 `settings.json`；桌面 app 沒設 `CLAUDE_CONFIG_DIR`（這個 session 的環境變數是空的、`CLAUDE_CODE_ENTRYPOINT=claude-desktop`），讀 `~/.claude/`。VS Code 使用者設定一個字沒改。
- 沒選「把 mods 資料夾加成 marketplace、`claude plugin install`」：VS Code 那邊已經用 `CLAUDE_CODE_PLUGIN_DIRS` 載入，再裝一次會在 VS Code 載兩份。
- 終端機直接打 `claude`（沒設 `CLAUDE_CONFIG_DIR`）也會載入這五支；PowerShell 的 `claude1`／`claude2` 不會（各自的設定資料夾沒設）。

**一支一支看（桌面 app 的畫面表有 Box、Text、Button、Input、Select、Svg、Link、Code、Markdown、Client）**

| mod | 在桌面 app | 要注意的 |
|---|---|---|
| dash | Pane、AbovePrompt、狀態列都是走線路畫（不是 Ink），元素都在桌面 app 的表裡 | 帳號頁「用 X 開新對話」改的是 **VS Code** 的設定、開的是 VS Code 的新對話，對桌面 app 沒用（記進 HANDOFF） |
| e2e-progress | Pane，同上 | — |
| limit-guard | 系統提示、`prompt.fill`、toast | 開場照 10 分專案放（這個專案在 `handoffs/baobuverse-kingdom/`） |
| notify | Windows toast 照跳 | `toast.ps1` 只在**最前面是 VS Code（`Code`）**時不跳；桌面 app（`Claude`）在最前面也會跳，而且桌面 app 自己也有通知 → 可能重複。要不要改，留給使用者（HANDOFF） |
| guard | `$.ui.ask` 在桌面 app 是選擇框 | 桌面 app 與終端機現在有 guard；**VS Code 的清單裡本來就沒有 guard**（上一個專案記憶寫「要她自己加進 VS Code」，看起來一直沒加）。照規矩沒動 VS Code，留給使用者（HANDOFF） |

**判準**

- 在桌面 app 開新對話看得到儀表板？**還沒親眼看**：這個 session 是加設定之前開的，段不能自己開 session。
  已驗：用同一份設定起新的 process 跑 `claude plugin list`，五支都是 `@inline`、`✔ loaded`。在桌面 app 開新對話看一次列進 HANDOFF「要使用者做的」。
- guard 在桌面 app 擋得到 `baobu-app` 預設 database 的寫入？規則已用測試證明（issue 09）、guard 在 `~/.claude` 的設定下會載入；真的跳框的那一下列進「要使用者做的」（用沒有登入、打了也寫不進去的 REST 指令試）。
- 在這個專案存開場，在 `handoffs/<資料夾名>/`？✓ 10 的 `handoffDir()` 看 session 的資料夾，不看是哪一種開法；10 的測試已證明。
- VS Code 原本的載入方式沒被改動？✓ VS Code 使用者設定沒改；模擬 VS Code 的環境（`CLAUDE_CONFIG_DIR=~/.claude-account2`＋原本那串 `CLAUDE_CODE_PLUGIN_DIRS`）跑 `claude plugin list`：照舊四支、沒有 guard。
