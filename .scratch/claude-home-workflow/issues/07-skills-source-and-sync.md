# 07 skill 正本放客廳，專案用一個指令更新複本

Status: todo
Type: task
Blocked by: 06

## 使用者要的

> 我只要更新客廳的東西，我的所有專案都可以更上
> 想是 Matt 整套，graphify ……claude-md，kickoff

## 為什麼

雲端 session 不讀 `~/.claude/skills/`，每個專案必須 commit 一份到 `.claude/skills/`（`docs/env-notes.md`、`docs/plan.md`「Skill」）。
所以「更新客廳就全部跟上」對 skill 來說是：客廳改正本 → 每個專案跑一個指令 → commit。

## 做法

- 客廳 `skills/`：這個 repo 目前 37 支（含 03、04 改過的 kickoff、claude-md）＋ `.claude/agents/impeccable-*.md`，以及版本表（從 `docs/env-notes.md` 的 Skills 表搬過去，`env-notes.md` 改成一行指過去）與「重裝時要重做的修改」
- 客廳 `tools/sync-skills.mjs`（node，Windows 與 Linux 都能跑，**不要 bash**）：把客廳的 skill 複製到目前專案的 `.claude/skills/`，列出新增／改動／專案獨有的；**不刪**專案獨有的 skill（上一個專案有 `month-end-reconciliation` 這類）
- 上游 skill 的授權檔跟著走：客廳也放一份，專案的 `docs/licenses/` 保留
- 讓專案選要哪些 skill（例如專案裡一個清單檔），不要一律全部塞
- 在這個 repo 跑一次，結果應該是沒有差異（或只有 03、04 的改動）

## 判準

- 在客廳改一支 skill 的一個字，跑指令後這個 repo 只有那一個檔變？
- 專案獨有的 skill 不會被刪？
- 上一個專案沒有被跑過這個指令（第 3 階段才做）？
- 同名的 skill 沒有被裝進 `~/.claude/skills/`（會在本機蓋過專案版，`env-notes.md` 寫過）？
