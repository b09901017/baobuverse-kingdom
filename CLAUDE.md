# 寶步宇宙王國

動工前先讀 `README.md`（初衷）與 `docs/plan.md`（使用者的決定、階段、還沒決定的事）。

## 回覆語言

- 給使用者看的回覆一律用**繁體中文**。思考、查資料、處理資料可以用英文。
- 使用者會讀的文件也用繁體中文：`README.md`、`CLAUDE.md`、`docs/plan.md`、PR 說明、`.scratch/` 的 issue。
- 台灣在地的主題（銀行與支付通知、電子發票、悠遊卡等）用中文查。

## 決定由使用者做

- `docs/plan.md` 的「使用者的決定」只寫使用者**親口確認過**的。AI 的提議不寫進去，就算使用者當下說了好。
- 「還沒決定」裡的事，動到時先問，不要自己挑一個做下去。

## 不能違反

- 一次動作寫**一則**事件，事件上可以掛好幾個效果（README）。
- 轉帳不是支出：錢在自己的帳戶之間搬動，淨資產不變（README）。
- 日記不是一張表，是當天所有事件的查詢結果（README）。
- **絕對不寫入**國王日記：`b09901017/baobu_money_track` 的資料，以及 `baobu-app` 的預設 Firestore database。

## 合併

- 一輪做完開 PR，CI 綠了就直接合進 `main`，不用等使用者說（使用者 2026-10-28：「綠了直接合」）。
- 還沒有 CI 的時候，以這一輪的驗證全過、PR 沒有衝突為準。

## Agent skills

### Issue tracker

Issue 以 Markdown 放在 `.scratch/<slug>/`，不用 GitHub Issues。見 `docs/agents/issue-tracker.md`。

### Triage labels

用預設的五個角色名稱。見 `docs/agents/triage-labels.md`。

### Domain docs

單一 context，`GLOSSARY.md` 與 `docs/adr/` 用到時才建立。見 `docs/agents/domain.md`。

## 環境

- 驗證指令：`pnpm verify`（型別檢查、測試、建置；CI 跑同一個）。
- skill 放 `.claude/skills/` 並 commit：雲端 session 不讀 `~/.claude/skills/`。這裡是複本，改 skill 改客廳的正本再同步回來。怎麼同步、Playwright 與 MCP 的坑見 `docs/env-notes.md`。
- 東西分三層：所有專案共用的工具在「客廳」私人 repo；這個專案的私人資料（記憶、交接開場）在 `.local/`（gitignore，另一個私人 repo）；登入備份與金鑰不進任何 repo。
- 之前的 session 一再犯的坑在 `docs/agents/lessons.md`，動工前掃一遍。
