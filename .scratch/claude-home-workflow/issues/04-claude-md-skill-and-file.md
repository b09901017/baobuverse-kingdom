# 04 優化 claude-md skill，並照官方指引改寫這個 repo 的 CLAUDE.md

Status: done
Type: task
Blocked by: 01, 02, 03

## 使用者要的

> 要更具官方最新的指示去優化skill以及寫claude.md

## 為什麼

- 上一個專案的 `CLAUDE.md` 長到約 7 萬 token，`claude-md` skill 沒擋住它變肥
- 這個 repo 的 `CLAUDE.md` 很短，但缺「什麼情況用哪個流程」（03 定的兩條路）、缺「客廳／.local／機密」三層的一句指路
- `CLAUDE.md` 的「回覆語言」一節是使用者這幾天加的，**保留原意**

## 動工前先讀

01、02 的產出、03 改完的 kickoff、`CLAUDE.md`、`docs/plan.md`、`docs/env-notes.md`

## 做法的方向

- `claude-md` skill 照 02 的清單改：怎麼判斷一條規則該不該進 CLAUDE.md、太肥時怎麼搬出去
- 這個 repo 的 `CLAUDE.md`：只放每次都要的；不違反的規則（README 那幾條、國王日記不寫入）一定留；細節用一行指到文件
- `docs/plan.md` 的「使用者的決定」**不准加 AI 的提議**（CLAUDE.md 自己的規則）

## 判準

- 刪掉的每一條，都還找得到它搬去哪（或為什麼不需要）？
- 「絕對不寫入國王日記」與「轉帳不是支出」等不能違反的規則還在？
- 新 session 只讀 CLAUDE.md，知道早期討論該用 grill-with-docs、一輪改動該用 kickoff 嗎？

## 做完時留下的

舊版快照在段 2 的 scratchpad；評估在 [`research/trigger-test/results.md`](../research/trigger-test/results.md)（觸發 3/3 兩版相同；情境斷言舊 3/8 → 新 8/8）。

**`claude-md` skill（68 → 87 行，description 323 → 206 字）**，照 skill-checklist 第三節：

- 衝突 1、11：description 拿掉「一定要使用這個 skill」，改成描述 skill 做什麼與何時用。
- 衝突 2：「不解釋原因，除非原因會改變行為」改寫成「理由只在會改變行為時寫」，附一個什麼叫會改變行為的例子。
- 衝突 3：「刪掉了超過 80% 的規則」整句刪（官方查不到出處），改成「先量，再對照模型」：指官方 Prompting best practices 的 migration 幾節與 `/doctor prompt-audit`。
- 衝突 4：去處表補 `.claude/rules/*.md` 加 `paths:`；另補 commit／PR 規則 → `settings.json`（M16）、維護註記 → `<!-- -->`（M13）、`@import` 不省 context（M10）。
- 衝突 5：維護模式改成新增（`/insights`，只補第二次的錯，M3）與修剪（`/doctor`、`/doctor prompt-audit`）成對。
- 衝突 6：結尾一行說名字裡的 `claude` 在 Claude Code 沒問題、上傳 claude.ai 才要改，不改名。
- 盤點第四節：開頭加 200 行的官方建議與「CLAUDE.md 是 context 不是強制設定」（M1、M9）；「先量」；「會讓檔案只加不減的規則本身要檢查」。
- AGENTS.md 那條照官方改成「Claude Code 只讀 CLAUDE.md，寫一行 `@AGENTS.md`」（M15）。
- 完成標準最後一條：使用者已經交代怎麼改（寫在 issue 裡）時，改完再給 diff —— 給 kickoff 這種不給使用者逐支看的流程一個出口。

**這個 repo 的 `CLAUDE.md`（44 → 47 行）**

| 改了什麼 | 去哪了／為什麼 |
|---|---|
| 加「用哪個流程」三行 | 03 定的兩條路＋「bug、UI、文案直接做」。`grill-with-docs` 模型叫不到，寫明模型自己判斷時叫 `grilling`＋`domain-modeling` |
| 加「三層」一行 | 客廳／`.local/`／機密，不寫 repo 名字（客廳 repo 段 3 才建） |
| 「Playwright 的瀏覽器路徑有陷阱」一行 | 併進 skill 那一行：「skill 的來源與版本、Playwright 與 MCP 的坑見 `docs/env-notes.md`」，指的是同一份文件 |
| 「回覆語言」「決定由使用者做」「不能違反」 | 一字未改 |
| 其他（Agent skills 三小節、lessons） | 留：Matt 的 skill 靠這幾行找 issue tracker 與 domain docs |

沒有刪掉任何規則，所以沒有東西要搬；刪除測試逐條過了一次，沒有可以交給 Explore 的（目前沒有程式碼）。
**沒加合併規定**：還沒決定（HANDOFF「要使用者決定的」第一題），使用者回答後加一行。「絕對不寫入國王日記」該配 hook（M9），段 1 已記，不在這一輪。

**判準**

- 刪掉的每一條都找得到去處：上表。
- 「絕對不寫入國王日記」「轉帳不是支出」等四條不能違反的規則還在，原文不動。
- 新 session 只讀 CLAUDE.md 知道早期討論走 grill-with-docs、一輪改動走 kickoff：「用哪個流程」一節；路由評估裡新版 4/4 走 grill、5/5 走 kickoff。
- skill-checklist 第二節：M1（47 行）、M2、M4、M5、M7、M8（跟 kickoff 的分工一致）、M15、M16（沒有 commit 規則）✓；M9 見上；M11～M14、M17、M18 不適用或已符合。**G11 的 `/doctor prompt-audit` 沒跑**（這個 session 叫不到），記進 HANDOFF。
