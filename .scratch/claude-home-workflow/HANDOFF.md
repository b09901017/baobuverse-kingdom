# HANDOFF：客廳（跨專案共用的工作流）

分支：`claude/claude-home-workflow`（這個 repo）。全貌在 [`spec.md`](./spec.md)，issue 在 [`issues/`](./issues/)。

主控 session 依序自動開下一段；每段做完更新這份、寫好下一段的開場，主控照它開下一個 session。
使用者也可以自己複製開場貼到新 session。

## 分段

| 段 | issue | 建議 effort | 狀態 |
|---|---|---|---|
| 1 盤點與檢查基準 | 01、02 | high | 待開始 |
| 2 kickoff、CLAUDE.md、skill 重疊 | 03、04、05 | xhigh | 等 1 |
| 3 客廳 repo 與 skill 正本 | 06、07 | high | 等 2 |
| 4 交接開場分專案、專案同步、guard、桌面 app 載入 mods | 10 → 08 → 09 → 14 | high | 等 3 |
| 5 VM 多專案 | 12 → 13 | high | 等 4 |
| 6 審查 | `/matt-code-review`：這個 repo 的分支＋客廳 repo 從第一個 commit（未改的 mods）以來 | xhigh | 等 5 |
| 7 收尾 | 手動檢查清單、PR、合併、更新 `docs/env-notes.md` | medium | 等 6 |

11 不做（見 issue 裡的理由）。

## 每一段共同的規矩

- 動工前讀：這份、`spec.md`、這一段的 issue、`CLAUDE.md`、`docs/agents/lessons.md`
- 一支 issue 一個 commit；`Status:` 改 `done`，issue 底下寫「做完時留下的」
- **上一個專案（`C:/Users/DELL/Desktop/baobao-wellness-clinic-scheduler`）的檔案一個都不改**；它的 `.local/references/` 不讀
- 公開 repo：commit、`.scratch`、PR 不帶真名、帳號名字、email、金鑰。引用上一個專案記憶的原話只能放 `.local/`
- **10 做完之前不要在 `~/.claude/mods-data/handoffs/` 存開場 JSON**（會被上一個專案的同步推進它的私人 repo）
- 推到私人 repo 可能被 auto mode 當成資料外流擋下；被擋就停，寫進下面，請使用者自己推，不要繞
- 中途發現的事不岔出去修，記進下面「中途發現」
- 一段做完：更新這份（狀態、中途發現、要使用者決定的）、寫好下一段的開場，然後結束

## 段 1 的開場

```
這一輪在建「客廳」：跨專案共用的工作流。分支 claude/claude-home-workflow（已經在這個 checkout 上）。
這是第 1 段：盤點與檢查基準，做 issue 01、02。

先讀：.scratch/claude-home-workflow/HANDOFF.md、spec.md、issues/01、02、CLAUDE.md、docs/plan.md、docs/env-notes.md、docs/agents/lessons.md。

01 的產出放 .local/research/（私人 repo，commit 在 .local 裡；推送被擋就記下來），不放公開的 .scratch。
02 一定要用 Skill 工具叫 skill-creator，並用 WebFetch／WebSearch 查官方最新文件，每條附出處。
上一個專案 C:/Users/DELL/Desktop/baobao-wellness-clinic-scheduler 只讀不改；它的 .local/references/ 不讀。
不做 03 以後的 issue。

做完要交：每支一個 commit、Status: done、HANDOFF 更新（狀態、中途發現）、段 2 的開場寫進 HANDOFF。
```

## 中途發現

（還沒有）

## 要使用者決定的

（目前沒有）

## 使用者已經決定的（2026-10-28）

- **Playwright MCP 選 B**：只給雲端用，本機關掉。主控已做：`.claude/settings.local.json`（不進 git）＋ `docs/env-notes.md` 補一節。
- **桌面 app 也要載入 mods**：加成 issue 14，排在段 4 的 09、10 之後。
