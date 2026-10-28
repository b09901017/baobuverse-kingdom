# 07 skill 正本放客廳，專案用一個指令更新複本

Status: done
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

## 做完時留下的

客廳第三個 commit（本機，還沒推；見 06）：`skills/`（37 支）、`agents/`（`impeccable-*` 四個）、`licenses/`（三個授權檔＋`map.json` 記哪個授權管哪幾支）、`tools/sync-skills.mjs`、`skills/README.md`。
複製的是這個 repo **commit 裡的**內容（`git archive`），不是工作目錄：這個 repo 開了 `autocrlf`，工作目錄是 CRLF，正本要存 LF，Linux 上才不會一同步就整份變。

**`sync-skills.mjs`**（node，不用 bash）：在專案資料夾裡跑 `node ~/claude-home/tools/sync-skills.mjs [--dry-run]`。

- 只同步 `<專案>/.claude/project.json` 的 `skills` 選的；沒有這個檔就什麼都不做（所以不小心在上一個專案跑也不會動到東西）。
- 選了的 skill 整個資料夾跟客廳一樣（客廳沒有的檔會刪，並列出來）；**專案獨有的、沒選的 skill 不動**，也列出來。
- 一起帶：檔名以 `<skill>-` 開頭的 agent、`map.json` 用得到的授權檔（→ 專案的 `docs/licenses/`，不刪專案原有的）。
- 比對時 CRLF 當 LF，Windows 的 autocrlf 不會被當成改動。
- 拒絕寫進 `~/.claude` 底下與客廳自己。

**這個 repo**：加了 `.claude/project.json`（選全部 37 支）；`docs/env-notes.md` 的 Skills 表與「重裝時要重做的修改」搬到客廳的 `skills/README.md`，這裡改成三行指過去（kickoff、claude-md 標成自己寫的、正本在客廳）；
`CLAUDE.md` 的 skill 那一行加「這裡是複本，改 skill 改客廳的正本再同步回來」—— 不然在這裡改的會在下次同步被蓋掉。帳號 plugin 會同步進雲端那段留在 `env-notes.md`（是這個專案的環境，不是 skill 的版本）。

**判準**

- 在客廳改一支 skill 的一個字，跑指令後這個 repo 只有那一個檔變？✓（改 `tdd/SKILL.md` 一個字 → 只有它變、diff 一行；改回來再跑 → 沒有差異）。在這個 repo 第一次跑：0 新增、0 改動。
- 專案獨有的 skill 不會被刪？✓（在 scratchpad 建假專案：獨有的 `my-own` 留著、沒選的 `grilling` 不動、選了的 `tdd` 裡多出來的舊檔被刪並列出、`impeccable` 的 agents 與授權檔一起帶進去）
- 上一個專案沒有被跑過這個指令 ✓
- `~/.claude/skills/` 前後都只有帳號同步的 `synced` ✓；指令在 `~/.claude` 與客廳裡跑都拒絕 ✓
