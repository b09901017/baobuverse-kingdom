# 13 guard：刪東西時救得回來的不問、框上說清楚刪什麼

Status: done（客廳 `fbf35e9`；量測與收尾在段 3b 續）
Blocked by: 02（同一個檔；02 已做完，客廳 `3950996`）
動工前先讀：這份 HANDOFF「每一段共同的規矩」、spec「不能違反」guard 那一條與「行為會變的」01、02；issues/02 的「做完時留下的」；
客廳 `mods/guard/hooks/classify.ts`（`TEMP` 與 `deletes` 約 `:243-269`、`KIND_WORD`、`shown`）、`mods/guard/hooks/register.ts`（框上的字「Claude 要刪東西，要讓它做嗎？」從哪裡組出來、hook 拿不拿得到 cwd）、`mods/guard/tests/`（`legacy-parity`、`strict-default`、`not-executed`）

## 使用者要的

（2026-10-29，主控 session）

> 有一些刪除的檔案，其實不太重要，可能就是一些過程檔或是測試檔，你想刪就刪……除非是你覺得會有後果的，或是真的需要我判斷的，在問我就好，然後也要說清楚我準備刪什麼

> 我想要連auto mode 的權限系統自己跳出來的允許框也少跳

（主控查過：四份 settings.json 都沒有權限規則，刪檔時跳的框是 guard 的，不是 auto mode。）

使用者貼了一個框問「像這個是guard跳出來的嗎 ? 但是他也沒有說清楚我要刪的是甚麼?」：

```
Claude 要刪東西，要讓它做嗎？
・刪檔案：rm -rf $S/exp
指令：S="/c/Users/DELL/AppData/Local/Temp/claude/…/scratchpad"; diff -r -q … && echo same; rm -rf $S/exp; mkdir -p $S/home/mods && cp -r …
```

`$S` 在同一串前面設成 scratchpad（暫存區），guard 只看 `rm` 那一段、不知道 `$S` 是什麼，所以問了；框上也只貼指令，看不出刪的是什麼、救不救得回來。

主控提的範圍，使用者答「好，照建議」（issue 13，段 3 之後單獨一段，high）。

## 做法

1. **找出要刪的東西**：`rm`／`rmdir`／`unlink`、PowerShell `Remove-Item`／`del`／`rd`…的路徑參數（跳過旗標）。
   - 同一串前面設定的變數代進去：Bash `S=…;`、`export S=…`；PowerShell `$S = "…"`；`$TEMP`、`$env:TEMP`、`~`。
   - 相對路徑照 hook 拿到的 cwd 算；前面有 `cd` 的跟著 `cd` 算，算不出來就當成看不出來。
   - 看不出來的（萬用字元 `*`、`$(…)`、沒設定的變數、`cd` 算不出來）→ 照舊問。
2. **全部的目標都是下面其中一種才不問**；有一個不是就問：
   - 暫存區（現在的 `TEMP`）。
   - 在 git repo 裡、已追蹤，而且底下沒有沒 commit 的修改、沒有沒追蹤的檔、沒有被 ignore 的檔（`git status --porcelain --ignored -- <目標>` 是空的）→ 從 git 救得回來。
   - 跑測試或建置產生、重跑就有的資料夾：路徑裡有 `node_modules`、`coverage`、`test-results`、`playwright-report`、`blob-report`、`.pytest_cache`、`.nyc_output`、`__pycache__`。`build`、`dist` 這種有些專案是原始碼的，拿不準就不放（記進中途發現）。
3. **照舊問**（不管救不救得回來）：
   - `.local/` 底下（私人資料，記憶會被同步鏡像出去）、`~/.claude/` 底下（設定、mods 即時生效、記憶）、`.git` 本身、repo 根目錄或家目錄整個。
   - `git clean`、`git reset --hard`、`git checkout --`／`git restore`、`git branch -D`、強推、「程式裡刪檔案」：照現在，不動。
   - git 指令跑失敗或逾時（hook 裡跑 git 要有時間上限）→ 問。
4. **框上說清楚**：要問的時候，用白話寫刪什麼、幾個、救不救得回來，例如「刪 3 個檔：a.md、b.md、c.md（沒進 git，救不回來）」「刪資料夾 tmp-x（裡面 12 個檔，2 個有沒 commit 的修改）」「刪 $S/exp（看不出 $S 是哪裡）」。名字太多列前 5 個＋「等 N 個」。原本那行指令照樣留著。
   不要改既有的 `why`（`legacy-parity` 逐條比整個 Verdict）：新的說明另外放（例如 Risk 多一個欄位、框上優先顯示它），怎麼放段裡定。
5. PowerShell 也一樣（`Remove-Item -Recurse -Force coverage`、`$S = "$env:TEMP\x"; Remove-Item -Recurse $S\y`）。

## 判準

1. 少問（先紅，現在會問）：
   - `S=<scratchpad 路徑>; …; rm -rf $S/exp`（使用者貼的那個）→ 不問
   - 暫存 git repo 裡已 commit、沒改過的 `rm notes/old.md`、`rm -rf notes/`（底下全都 commit 過）→ 不問
   - `rm -rf node_modules`、`rm -rf test-results playwright-report` → 不問
   - PowerShell `Remove-Item -Recurse -Force coverage`、`$S = "$env:TEMP\x"; Remove-Item -Recurse "$S\y"` → 不問
2. 照舊要問（守住的綠燈測試，改完還要問）：
   - 沒進 git 的檔、已追蹤但有沒 commit 修改的檔、資料夾底下有一個沒追蹤的檔、被 ignore 的檔
   - `rm -rf *`、`rm -rf $UNKNOWN/x`、`rm -rf $(cat list)`、`cd "$(…)" && rm x`
   - 已 commit 也照問：`.local/claude-memory/x.md`、`~/.claude/settings.json`、`~/.claude/mods/guard`、`.git`、repo 根目錄、`~`
   - 一次刪兩個、一個救得回來一個救不回來 → 問，框上只列救不回來的那個（或兩個都列、各寫救不救得回來）
   - git 跑失敗（例如不是 git repo、`git` 找不到）→ 問
3. 框上的字：上面每一條要問的，測試斷言框上的說明有檔名（或「看不出」）、個數、救不救得回來。
4. 既有 guard 測試（56）斷言一條都不改就全過；`legacy-parity` 有 CASES 因為「救得回來不問」而判斷變了的，先停、SendMessage 問主控（不要自己改既有測試）。
5. 這是「少問」的改動：改完在 spec「行為會變的」逐條列出不再問的寫法；拿過去對話真的跑過的刪除指令量一次（只算筆數：少問幾條、多問幾條），寫進「做完時留下的」。
6. hook 跑 git 的時間：量一下最慢一次多久，寫進「做完時留下的」；超過 1 秒的想辦法（只在有刪除指令時才跑、一次問完）。

## 做完時留下的

（段 3b，客廳 `fbf35e9`）

- **怎麼放**：新檔 `hooks/removals.ts`（純函式）找每一段刪檔案（rm／rmdir／unlink、PowerShell 的 Remove-Item／del／rd…，跟 `deletes` 共用 `removeVerbs`，位置對得上）的目標：
  Bash 用 02 的 `parseShell` 找段、代同一串前面**無條件**的 `S=…`／`export S=…`（`a && S=x`、`S=x rm $S`、`source`／`eval`／`read`…之後都不認）、`$TEMP`／`$TMPDIR`／`$HOME`／`~` 用 hook 讀到的環境變數；
  cd 只認「無條件開頭、一路 `&&` 接到 rm」的（`cd x; rm y` 照問：cd 失敗會刪到原本的資料夾）；PowerShell 自己切句，`$S = "…"` 代進去，cd 一律算不出（PowerShell 的 cd 失敗也會往下跑）。
  萬用字元、`$(…)`、`{…}`、沒設定的變數、被 `|` 接進來的、`find -exec`／`xargs`／`bash -c` 裡的 → 看不出 → 問。
- **判斷**：只看路徑就知道的先判（`.local`、`.git`、`~/.claude`、整個專案或家目錄或更上層 → 問；暫存區、`node_modules` 等 8 個建置產物資料夾 → 不問）；其他 `register.ts` 問 git：
  每個上一層資料夾 `rev-parse --show-toplevel`，每個 repo `--literal-pathspecs ls-files -z -v -s` 與 `status --porcelain=v1 -z --ignored=matching --untracked-files=all`（同時跑、各 3 秒上限、失敗就問）。
  ls-files 的標記要是 `H`、不是子模組（assume-unchanged／skip-worktree／子模組當救不回來）；status 底下有任何一筆（沒 commit 的修改、沒追蹤、被 ignore）就問；兩邊都沒有＝找不到 → 問。
- **框上**：`Risk` 多一個 `say`，框上優先顯示（`why` 不動，legacy-parity 照過）：「刪 tmp-x（資料夾，裡面 3 個檔：1 個有沒 commit 的修改、1 個沒進 git，這些救不回來）」「刪 2 個：draft.txt（沒進 git，救不回來）；notes/old.md（在 git 裡、沒改過，救得回來）」「刪 $UNKNOWN/x（看不出 $UNKNOWN 是哪裡）」。同一種下場放一起，名字列前 5 個＋「等 N 個」。原本那行指令照樣留著。
- `classify` 第 5 個參數 `gone`（register 判斷過的結果）；沒傳就照舊只看字，所以既有 56 條一字不改全過。guard 56 → 64（`tests/recoverable.test.ts` 8 條：判準 1 的 15 條先驗改之前會問、改完不問；判準 2、3 的 34 條先驗改之前也問、改完還問、框上的字；多問 3 條；git 壞掉；接起來 2 條）。tsc 0 錯、validate 過。
- **hook 拿得到 shell 現在的資料夾**：`$.session.cwd()`。live 探測過：cd 進一個暫存 git repo 之後，下一個 Bash 的 `rm a.txt`（只在那個 repo 裡有、已 commit）沒跳框——用的是 shell cd 之後的資料夾。
- **git 的時間**：三個 git 呼叫依序跑共 0.11 秒（hook 裡 ls-files 與 status 同時跑）；只有指令裡有刪檔案才跑。

跟 issue 寫的不同：

1. **會多問的**：以前整段看到暫存區的字就不問（`rm -rf important /tmp/x`、`rm -rf "$X/scratchpad/y"`），現在一個一個目標看，`important`、看不出的 `$X` 照問。
2. `~/.claude` 只認家目錄底下那一份；專案的 `.claude/` 照 git 判斷。
3. 段 3b 刪探測資料夾（`.scratch` 底下沒追蹤的空資料夾）那兩下：使用者說「有跳」（框上的字沒說）＝照設計（沒追蹤 → 找不到 → 問），沒查 goneOf。

（段 3b 續）

- **判準 5，拿過去真的跑過的刪除指令量**（`~/.claude/projects/` 底下這個專案與上一個專案的 transcript，連 subagent；只印筆數與遮過的形狀）：
  每條用改之前（`classify` 不傳 gone）與改之後（`removals`＋`judge`＋真的 git，唯讀，跟 `gitFacts` 同樣的三個呼叫、路徑照 transcript 那一行的 `cwd` 算）比「刪東西」問不問。

  | | 有刪檔案的指令 | 少問 | 多問 | 兩邊都問 | 兩邊都不問 | 改之後要問裡「找不到」 | 「問不到 git」 | 最慢一條（含 git） |
  |---|---|---|---|---|---|---|---|---|
  | 這個專案（Bash／PowerShell 2725 條） | 58 | 19 | 1 | 30 | 8 | 2 | 0 | 74 ms |
  | 上一個專案（18904 條） | 227 | 13 | 14 | 190 | 10 | 48 | 1 | 113 ms |

  - 少問的幾乎都是使用者貼的那種：同一串前面 `S=<暫存區>`、後面 `rm -rf $S/…`；其餘是 `cd <資料夾> && rm <git 裡沒改過的檔>`。
  - 多問 15 條都是照設計的類型：cd 後面不是一路 `&&` 接到 rm（`cd x && cp … && node …` 換行或 `;` 再 `rm`）11 條、`$TEMP` 前面有指令可能改了變數 2 條、萬用字元 1 條、一段同時刪暫存區與 cd 算不出的 1 條。以前是整段看到暫存區的字（`/tmp/`、`$TEMP`）就不問。
  - 「找不到」50 條、「問不到 git」1 條（cwd 已經不在、檔案已經刪掉或當時在別的 worktree）全部落在「兩邊都問」，不影響少問／多問的筆數；但這表示「少問」是用**現在**的 git 狀態算的，當時救不救得回來可能不同。
- limit-guard 58 跑一次全過；guard 64 再跑一次全過（一支一支跑）。`~/.claude/mods/guard` 與客廳 `mods/guard` 逐檔相同。

