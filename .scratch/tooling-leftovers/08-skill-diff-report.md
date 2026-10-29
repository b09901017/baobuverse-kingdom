# 08 差異報告：上一個專案的 skill 跟客廳版差在哪（2026-10-29，段 6）

比的是上一個專案 `develop`（`3a39a17`，PR #186 合進去之後）的 `.claude/skills/` 與客廳 `skills/`（客廳 `24d8413`）。換行不算差。
上一個專案自己才有的 6 支（`calendar-sheet-merge`、`customer-availability-sheet`、`frontend-design`、`month-end-reconciliation`、`pixel-exact-screenshot-extraction`、`test-speed`）不會被同步動到（`sync-skills` 只動 `project.json` 選了的）。

## 一支一列

| skill | 差在哪 | 換了之後在上一個專案會有什麼不同 | 建議 |
|---|---|---|---|
| `grill-with-docs` | 逐檔相同 | 現在沒有不同；選了之後客廳更新會跟著同步。它叫 `grilling` 與 `domain-modeling`，哪一版看那兩支選不選 | **換**（選進 `skills`） |
| `grilling` | 上游 v1.3.1：一輪可以問好幾題（範例多一題 Q2）、多一句「問法讓『是』就是接受建議」 | 問問題的格式小改，跟使用者「附建議、可以只回照建議」的習慣一致 | **換** |
| `matt-code-review` | 上游新版：破折號改冒號（大部分）；找標準檔改成「搜整個 repo、有 `CODING_STANDARDS.md`／`CONTRIBUTING.md` 一定要列」；明寫「兩個 subagent 一起在前景開」；issue tracker 不再寫死 `docs/agents/issue-tracker.md` | 上一個專案有 `docs/agents/issue-tracker.md`，照樣讀得到；兩個 subagent 一起開跟「同時最多兩個」不衝突 | **換** |
| `graphify` | 上游新版（客廳記的 `0a8cd4e`）：存掃描根目錄改成不把路徑放進指令（防路徑裡的 `$(…)` 被執行）、認 build 的排除與 `.gitignore`、`extract` 多傳 `root=`、分塊多一個「最多約 6000 行」、多一步檢查每個檔有沒有讀到最後一行、`references/` 5 份跟著改 | 這台裝的 `graphifyy` 0.9.51 有新版要用的函式（`graphify.paths.out_path`、`_read_build_excludes`、`_read_build_gitignore`、`extract(root=)`，段 6 用 python 確認過）；上一個專案 repo 裡沒有 `graphify-out/` | **換** |
| `claude-md` | 自己寫的，客廳版是後來改好的：先量行數、`/doctor prompt-audit`、200 行上限、刪掉的多了 `.claude/rules/`（`paths:`）、`settings.json` 的 `attribution`、`<!-- -->` 這幾個去處；寫法多了「寫成可以驗證的」「同一件事只寫一處」；不再要求「每次改動前先給 diff」（使用者已經交代怎麼改時改完再給） | 上一個專案的 `CLAUDE.md` 186 行；換了之後健檢時會建議把根目錄那張大連動表搬到子目錄或 rules（新版寫「會讓檔案只加不減的規則本身也要檢查」，舉的例子正是「新發現的連動補進 CLAUDE.md 的表」——上一個專案 `CLAUDE.md:71` 有這條）。只在叫 `/claude-md` 時才有差 | **換** |
| `kickoff` | **改寫過的通用版**（客廳寫明「從上一個專案的版本改寫成通用版」）。上一個專案那份寫死它自己的流程：從 `develop` 開分支、`npm run verify`、手動清單在 staging 點、「CI 全綠之後合進 develop」（她 10/15 的原話）、「進 main 不在這一輪」、「合完 staging 會自動部署；拍照的 Function 照 `docs/STAGING.md`」、「第一段結束一定停下來」（她 10/08 的原話）、每段結束停下來把開場交給她。客廳版：專案限定的事（基底分支、驗證指令、合併規定）**看專案的 `CLAUDE.md`**；主控用 `start_session` **自動開下一段**；issue 預設不給使用者看（subagent 過目後直接做）；額度用 limit-guard；開 PR 內文用 `pr` skill | 基底 `develop`、`npm run verify` 在它的 `CLAUDE.md:39`、`:53` 有寫，照得到。**合併規定它的 `CLAUDE.md` 沒寫** → 客廳版會在 CI 綠了之後問一次、答案寫進它的 `CLAUDE.md`。「進 main 要她另外說」「合完 staging 自動部署、Function 照 STAGING.md」兩句會不見，除非補進它的 `CLAUDE.md`。分段變成主控自動開（跟這個專案現在一樣）。`pr` skill 它沒有（沒選就由 Claude 自己寫 PR 內文，不會壞） | 要你決定（見下面第 2 題） |
| `domain-modeling` | 上游 v1.3.1 把詞彙表檔名從 `CONTEXT.md` 改成 `GLOSSARY.md`（`CONTEXT-FORMAT.md` → `GLOSSARY-FORMAT.md`、`CONTEXT-MAP.md` → `GLOSSARY-MAP.md`），其餘是破折號改冒號 | **會壞**：上一個專案根目錄有 `CONTEXT.md`，它的 `CLAUDE.md:12`、`:172`、`docs/agents/domain.md`、自己的 `calendar-sheet-merge`（SKILL、`references/findings.md`、`scripts/merge.mjs`）、幾十支舊 issue 都寫 `CONTEXT.md`。換了之後 skill 找 `GLOSSARY.md` 找不到，會另開一份新的，詞彙表分成兩份。`sync-skills` 是鏡像，`CONTEXT-FORMAT.md` 會被刪 | **不換**（要換得先把 `CONTEXT.md` 改名、改所有引用，另開一輪） |
| `setup-matt-pocock-skills` | 同上改成 `GLOSSARY.md`（新版會提議把舊的 `CONTEXT.md` `git mv` 過去）；多了「GitHub／GitLab 要有 remote」「建缺的 label」「`CLAUDE.md` 與 `AGENTS.md` 不要兩份」；`issue-tracker-local.md` 多一句「一支 issue 一個檔」 | 上一個專案已經設定好了（`docs/agents/` 三份都在），平常不會再叫；跟 `domain-modeling` 一起才一致 | **不換**（跟 `domain-modeling` 一起） |
| `test-speed` ↔ `e2e-speed` | `e2e-speed` **不是** `test-speed` 的新版：是 10 拿掉專案細節的通用版（先量、照「省多少÷風險」挑、踩過的坑）＋「一個 worker 一組模擬器」的實驗數字（10 個檔 1 個 worker 6.3 分 → 2 個 3.5 分 → 3 個 3.0 分）。`test-speed` 裡有上一個專案自己的檔名、數字、`scripts/e2e*.mjs` 的流程 | 名字不同，`sync-skills` 不會動 `test-speed`。兩支都放的話，「E2E 好慢」會同時觸發兩支、內容重疊；「一個 worker 一組模擬器」你 10/29 選了先不正式改，現在對上一個專案還用不到 | **留 `test-speed`、不加 `e2e-speed`**；之後正式改成一個 worker 一組模擬器時，再把數字補進 `test-speed` |

## 換的話會一起發生的事（一定要知道的）

- **`sync-skills` 是鏡像**（客廳 `tools/sync-skills.mjs:9`、`:91-97`）：選了的 skill 資料夾會變得跟客廳一模一樣，上一個專案那份多的檔會被刪。上面建議換的 5 支都沒有多的檔（只有不換的 `domain-modeling` 有）。
- **會多出 `docs/licenses/`**（`sync-skills.mjs:72-75`）：選了 `grilling`、`grill-with-docs`、`matt-code-review` 會帶 `mattpocock-skills.LICENSE`，選了 `graphify` 會帶 `graphify.LICENSE`。上一個專案現在沒有這個資料夾；它是 public repo，PR 會列出來。
- **之後客廳更新不會自動跟上**（客廳 `skills/README.md:3-10`）：要在上一個專案的資料夾跑一次 `node ~/claude-home/tools/sync-skills.mjs`、commit，照它的 `CLAUDE.md` 開 PR 進 `develop`；**合進 `develop` 會重新部署 staging**（PR #186 合併後的「測試與部署」就是）。
  使用者第一輪說的「我只要更新客廳的東西，我的所有專案都可以更上」要做成自動的，得另開一支（記進中途發現）。
- 上一個專案加了 `skills` 之後，客廳 `mods/guard/tests/legacy-parity.test.ts:84-92` 的 `OLD_JSON`（註解寫「develop 上那一份的複本」）不再逐字相同：規則結果不變、測試照樣過，**不改測試**，記進中途發現。
- 上一個專案自己才有的 6 支不會被刪或蓋掉；`project.json` 是 guard 即時讀的，改完先用 node 讀一次確認是合法 JSON。
