# 透視關聯（ripple-check）· HANDOFF

使用者 2026-10-31 的要求（原話節錄）：

> 怕引發牽一髮而動全身的連鎖崩潰（Ripple Effects），或是漏改其他具有相同缺陷的關聯地方，所以我想讓你具備「透視關聯」的能力。
> 不知道能不能讓 Graphify 負責「宏觀架構與文件」，讓 Codegraph 負責「微觀程式碼變更與影響評估」。兩者相輔相成。
> 我希望之後的專案也可以這樣用……也要根據不同的階段去使用。

## 分段

| 段 | 做什麼 | effort | 狀態 |
|---|---|---|---|
| 一 | 裝 CodeGraph 1.6.2、ast-grep 0.51.0，graphifyy 升到 0.9.99（加 `[chinese]`）；寫 `.local/README.md` 目錄、`.graphifyignore`、`codegraph.json`；建 CodeGraph 索引與 graphify 的程式碼圖；每個指令在這個 repo 實際跑過；客廳新增 `ripple-check` skill、改 `kickoff`、更新 graphify skill，同步回來；`CLAUDE.md`、`env-notes.md`、`plan.md` 各補一兩行 | high | 做完（2026-10-31） |
| 二 | graphify 第一次完整建圖（含文件的語意分析），照 `ripple-check` 驗收 | medium | 還沒做：等換帳號或週額度重置（段一結束時週額度 91%） |
| 三 | 套用到上一個專案 `baobao-wellness-clinic-scheduler`（見「段三：上一個專案」） | high | 還沒做：使用者 2026-10-31 要做，週額度 93% 交給之後 |
| 四 | VM 裝工具（見「段四：VM」） | medium | 還沒做：開 VM 要花錢，等下一次「出門」用 VM 時順便做 |

段一合進 main：PR #18（`3399ad2`）。之後在同一條線上補了三條 skill（ast-grep 最多試兩次、`GRAPHIFY_MAX_WORKERS`、純 JS 專案要再用 grep 對一次）。

## 使用者已經決定的

- 兩個工具一起用：Graphify 宏觀（架構與文件）、CodeGraph 微觀（程式碼變更與影響）（使用者原話，已寫進 `plan.md`）。
- `.local` 分類放進圖（使用者答「照這樣做」）：放 `research/`、產生預設資料的程式與 json、`.local/README.md` 目錄；真實帳戶與金額的檔、記憶、交接、VM 狀態不放，只在目錄裡寫一行。新檔預設不進圖，`--update` 前用檢查網抓。
- 不掃 `node_modules`、`dist`、`.claude/skills`（使用者原話）。

## 段一順手決定的（AI 判斷，沒有問；使用者可以推翻）

- 不裝 graphify 的常駐 hook（`graphify claude install`），日常程式碼問題交給 CodeGraph。
- CodeGraph 只用 CLI、不接 MCP：Windows 背景程序閃視窗、吃記憶體的 issue，加上每個帳號的設定資料夾都要各設一次。
- CodeGraph 匿名統計關掉。
- 多加 ast-grep：使用者以為 CodeGraph 有 `structural_search (CGQL)`，1.6.2 沒有這個功能（README 與原始碼都查過）。
- `.scratch/` 裡不是 app 的四輪（claude-home-workflow、legacy-to-home、tooling-leftovers、guard-judge）排除在圖外：第一次建的程式碼圖裡，它們佔了一堆社群、中文查詢也會跑出來。排除後文件從 84 份降到 36 份。

## 段一實際量到的（給之後對照）

- `codegraph init`：68 檔、1,379 節點、6,362 邊（排除後）；索引 3.7 秒，但第一次整個指令跑了 2 分 11 秒（初次設定）。`codegraph sync` 約 1 秒。
- `codegraph callers openBook` 找得到 `apps/treasury` 的呼叫端：跨套件可以用，雖然 `packages/core/src/index.ts`（`export type *`）解不出符號。
- `codegraph affected packages/core/src/split.ts` 列出 15 支測試；`impact splitEvenly` 12 個符號。
- `GRAPHIFY_BACKEND=none graphify update .`：44 秒、16 個 worker（會用滿所有核心）；排除後 1,150 節點、3,088 邊、69 個社群。中文查詢要 `graphifyy[chinese]`（jieba）。
- graphify 的忽略規則可以「整個 `.local` 排除、只放回幾個」：detect 的結果 `.local` 只有 5 個檔（目錄、2 份 research、presets 的程式與 json）。

## 中途發現

- 客廳的 `devbox.mjs` 會把 `graphify-out/` 搬到 VM，但 `.codegraph/` 沒有搬，VM 也還沒裝這幾個工具。之後要在 VM 上用時，照 `ripple-check`「第一次在一個專案設定」第 1、3 步做（`.codegraph/` 在 VM 上重建就好，不用搬）。

## 段三：上一個專案（`C:\Users\DELL\Desktop\baobao-wellness-clinic-scheduler`）

使用者 2026-10-31：「那個專案目前應該是大型專案了吧，也已經開始投入使用了，所以之後有甚麼要優化或是調整的感覺就很需要這次的這些東西」。

段一結束時只看了外觀（沒改任何東西）：

| 看到的 | 為什麼重要 |
|---|---|
| 1,463 個 git 檔、481 個 JS 檔、**0 個 TS 檔** | 沒有型別檢查：漏改的呼叫端不會在驗證時變紅，`ripple-check` 在這裡比在王國更重要。CodeGraph 對 CommonJS `require`、同名函式容易連錯（它的 open issue 大多是這類），清單一定要再用 grep 對 |
| 有 `functions/`（Cloud Functions）、`tests/`、`tests-e2e/`、`scripts/` | 是好幾個套件；`codegraph affected` 的測試樣式可能要 `--filter` 指到 `tests/`、`tests-e2e/` |
| `graphify-out/` 有 **499 MB**，是舊版 graphify 建的 | 先看 `graph.json` 的 `graphify_version`；跟 0.9.99 差太多就整個重建，不要在舊的上面 `--update`。客廳的 `devbox.mjs` 會把它 tar 到 VM，500 MB 每次出門都要搬 |
| 沒有 `.claude/project.json`（有 `skills-lock.json`），根目錄 `CLAUDE.md` 沒提 graphify | 它的 skill 不是從客廳同步的。要用 `ripple-check`：先看 `legacy-to-home` 那一輪怎麼決定上一個專案的 skill（`.scratch/legacy-to-home/`、客廳 `docs/project-config.md`），照那個方式加，不要自己發明第二種同步法 |
| `keys/`（已 gitignore） | 兩個工具都照 `.gitignore`，但 `.graphifyignore`、`codegraph.json` 還是明寫排除，多一層保險 |
| `.local/` 已經有 `README.md`，還有 `references/`、`知識庫/`、`pii-scan/`、`tools/`、`claude-memory/`（69 份） | **`references/` 規矩是不讀**（lessons 第五條的例子）：一定排除、不能進圖、目錄也只寫一行「不讀」。先讀現有的 `README.md`，照 `ripple-check`「掃哪些、不掃哪些」補每個檔「是什麼、什麼時候讀」；`知識庫/` 可能是 research 那一類，要分類前先問使用者 |
| 正在給人用（正式資料） | 這幾個工具只讀不寫，但驗證時不要碰正式的 Firebase；照那個專案 `CLAUDE.md` 的規矩 |

建議順序：

1. 讀那個專案的 `CLAUDE.md`、`docs/agents/lessons.md`（有的話）、`.local/README.md`；`git status` 確認分支乾淨（段一看到在 `claude/availability-sheet-chart-no`）。
2. 從那個專案的 main 開分支。寫 `codegraph.json`、`.graphifyignore`、`.gitignore` 加 `.codegraph/`。
3. `codegraph init --yes`（1,400 多個檔，先跟使用者說；第一次在王國跑了 2 分鐘，大部分是初次設定）。
4. **先驗證值不值得**：挑那個專案最近幾個修 bug 的 commit，對改到的函式跑 `codegraph impact`／`callers`，看清單跟實際要改的地方對不對得上、漏了什麼、多了什麼。把結果寫下來（lessons 第八條：原始清單要留）。對不上很多就跟使用者說，不要硬裝。
5. 值得的話：加 `ripple-check`（照第 1 步查到的同步方式）、`CLAUDE.md` 加一行；graphify 照段二的方式重建（`GRAPHIFY_MAX_WORKERS=8`；含文件的語意分析很花額度，先問）。
6. 開 PR，照那個專案的合併規定。

## 段四：VM

- 客廳的 `vm/README.md` 記 VM 怎麼開、怎麼裝東西；`tools/devbox.mjs` 管出門與回家（先讀 `docs/agents/lessons.md` 第一條，不要亂按「回家」）。
- 要裝的：`npm i -g @colbymchenry/codegraph@1.6.2 @ast-grep/cli@0.51.0`、`codegraph telemetry off`、`python3 -m pip install -U "graphifyy[chinese]==0.9.99"`，每個專案 `codegraph init --yes`（`.codegraph/` 在 VM 上重建，不用從家裡搬）。
- 裝完把步驟補進客廳的 `vm/README.md`，`docs/env-notes.md` 的 VM 那一列改成「裝好」。
- VM 是 Linux：可以順便試 CodeGraph 的 MCP（skill 的「坑」裡寫的 Windows 問題在 Linux 上不一定有），試的結果寫回 skill。

## 段二的開場

```
這一輪在做「透視關聯」（.scratch/ripple-check/）。分支：main（段一的 PR 已經合進去了；沒合的話先看 PR 狀態）。
這一段只做一件事：graphify 第一次完整建圖（含文件的語意分析），然後驗收。

先讀：.scratch/ripple-check/HANDOFF.md（全部）、.claude/skills/ripple-check/SKILL.md、CLAUDE.md、docs/agents/lessons.md（第五、十二條）。

步驟：
1. 開工前用 get_usage 看額度；週額度剩不到 15% 就停，跟使用者說。
2. 確認工具版本：graphify --version 是 0.9.99（不是的話照客廳 skills/README.md 裝）。
3. 跑 python 的 detect 看這次會讀哪些檔：.local 只能有 .local/README.md 列在「進圖的」那 5 個；.claude/skills、docs/licenses、非 app 的四輪 .scratch 都不能出現。不對就停。
4. 跑 /graphify .（Skill 叫 graphify）。它會開 subagent 做語意分析：同時最多兩個（使用者的全域規則，graphify skill 寫「全部同時開」也一樣，兩個一批）。這是給模型讀 36 份文件，先跟使用者說大概要多久、花多少。
5. 驗收（每一條都要實際跑、貼結果的重點）：
   - graphify query "對帳差額 怎麼決定的"、"預設帳戶 從哪裡來"：結果要有 docs/plan.md、GLOSSARY.md、.scratch 的 issue 或 .local/research 的節點，不只程式碼。
   - graphify path 選一個文件裡的概念和一個程式碼符號（例如 GLOSSARY 的「轉帳」和 packages/core 的相關函式），看接不接得起來；接不起來就寫下來，不硬湊。
   - 用 grep -l 在 graphify-out/graph.json 比對：kingdom-accounts.md 裡的真實名稱、金額不能出現在圖裡（只印筆數，不印值；照 lessons 第五條）。research 的統計會在圖裡，這是使用者同意的。
   - 跑一次檢查網：node .claude/skills/ripple-check/scripts/private-index-check.mjs，應該印「目錄都寫到了」。
6. 把結果、驗收發現的問題寫進這份 HANDOFF 的段二那一列與「中途發現」；skill 的做法有要改的，改客廳的正本再同步回來，開 PR，CI 綠了直接合（CLAUDE.md「合併」）。

不要做：不要裝 graphify 的常駐 hook（graphify claude install）；不要把 graphify-out/ 或 .codegraph/ 加進 git；不要擴大 .local 進圖的範圍。
建議 effort：medium。
```
