# HANDOFF：客廳（跨專案共用的工作流）

分支：`claude/claude-home-workflow`（這個 repo）。全貌在 [`spec.md`](./spec.md)，issue 在 [`issues/`](./issues/)。

主控 session 依序自動開下一段；每段做完更新這份、寫好下一段的開場，主控照它開下一個 session。
使用者也可以自己複製開場貼到新 session。

## 分段

| 段 | issue | 建議 effort | 狀態 |
|---|---|---|---|
| 1 盤點與檢查基準 | 01、02 | high | ✅ 10/28（01：私人 repo `20f9eb9`，已推；02：`7bfd180`） |
| 2 kickoff、CLAUDE.md、skill 重疊 | 03、04、05 | xhigh | ✅ 10/28（03：`435506f`；04：`3e141d3`；05：`c0cd4fe`） |
| 3 客廳 repo 與 skill 正本 | 06、07 | high | ✅ 10/28（06：`63f4a65`；07：`9f1fe71`；客廳 GitHub repo 使用者點頭後主控建好、PRIVATE、已推；共用 CLAUDE.md 加兩條 `4ad4390`） |
| 4 交接開場分專案、專案同步、guard、桌面 app 載入 mods | 10 → 08 → 09 → 14 | high | ⏸ 額度用完中斷（10/28）：10 ✅（`254518e`，客廳 `2c6ec10`）、08 ✅（`ea91111`，客廳 `d0beb35`）；09 做一半、14 沒開始，見下面「段 4 停在哪」 |
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
- 中途發現的事不岔出去修，記進下面「中途發現」；使用者說要修的，修之前再 grep 一次牽連
- 改一個函式、一段文件或畫面上的字之前，grep／graphify 找出所有用到它的地方
- subagent 同時最多兩個
- 段自己不開 session、不存 limit-guard 的開場 JSON：主控照這份的開場開下一段（kickoff「第三段」）
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

## 段 2 的開場

建議 effort：**xhigh**。

```
這一輪在建「客廳」：跨專案共用的工作流。分支 claude/claude-home-workflow（已經在這個 checkout 上）。
段 1 做完了：01 盤點在私人 repo（.local/research/old-workflow.md），02 檢查基準在 .scratch/claude-home-workflow/research/skill-checklist.md。
這是第 2 段：做 issue 03（kickoff 與 grill-with-docs 的分工）、04（claude-md skill 與這個 repo 的 CLAUDE.md）、05（skill 重疊報告），照 03 → 04 的順序，05 不依賴 03、04。

先讀：.scratch/claude-home-workflow/HANDOFF.md（含「中途發現」「要使用者決定的」）、spec.md、issues/03、04、05、
.local/research/old-workflow.md（第一節步驟、第二節偏好、第四節 kickoff 掉了的東西 —— 原話只能留在 .local，不能抄進公開 repo）、
research/skill-checklist.md（第三節的十一個衝突與裁定、第四節現況）、CLAUDE.md、docs/plan.md、docs/env-notes.md、docs/agents/lessons.md。

要特別注意：
- 03：舊版 kickoff 改寫時掉了「開場提醒 grep／graphify 找每個要改的函式的所有呼叫端與畫面上的字」「她說要修的中途發現，修前再 grep 牽連」，兩條是使用者確認常態時明確補的，要補回來（盤點第四節）。
- 03：「合併要不要等使用者說」新舊版意思不同，還沒決定 —— 不要自己挑，寫成「待使用者決定」，記進 HANDOFF「要使用者決定的」。
- 03、04 改 skill 前先把舊版快照到 scratchpad，照 skill-checklist 的 G3（舊版 vs 新版）與 G6（觸發測試）至少試一次；description 照衝突 1、11 放軟、用測試量。
- 04：claude-md skill 照 checklist 第三節衝突 2～6 改（「80%」那句刪、去處表補 .claude/rules/、維護模式加 /doctor prompt-audit）。這個 repo 的 CLAUDE.md 不能違反的幾條一定留。
- 05：只寫報告進 HANDOFF「要使用者決定的」，不刪任何 skill；可以建議用 skillOverrides（checklist C6）。
- subagent 一次最多兩個（使用者的額度規矩）。不做 06 以後的 issue。
- 上一個專案 C:/Users/DELL/Desktop/baobao-wellness-clinic-scheduler 只讀不改；它的 .local/references/ 不讀。公開 repo 不帶真名、帳號、email。
- 10 做完之前不要在 ~/.claude/mods-data/handoffs/ 存開場 JSON。

做完要交：每支一個 commit（推到 origin claude/claude-home-workflow）、Status: done、issue 底下「做完時留下的」、
HANDOFF 更新（狀態、中途發現、要使用者決定的）、段 3 的開場寫進 HANDOFF。
```

## 段 3 的開場

建議 effort：**high**。

```
這一輪在建「客廳」：跨專案共用的工作流。分支 claude/claude-home-workflow（已經在這個 checkout 上）。
段 1、2 做完了：01 盤點（私人 repo .local/research/old-workflow.md）、02 檢查基準（.scratch/claude-home-workflow/research/skill-checklist.md）、
03 kickoff 改寫（435506f）、04 claude-md skill 與 CLAUDE.md（3e141d3）、05 skill 重疊報告（c0cd4fe，題目在 HANDOFF「要使用者決定的」）。
這是第 3 段：做 issue 06（建客廳私人 repo）→ 07（skill 正本放客廳、專案用一個 node 指令更新複本），照這個順序。不做 08 以後的 issue。

先讀：.scratch/claude-home-workflow/HANDOFF.md 的「每一段共同的規矩」「中途發現」「要使用者決定的」「使用者已經決定的」、
spec.md「談定的策略」、issues/06、07 全文、issues/03、04 底下的「做完時留下的」、
research/skill-checklist.md 第一節 C6 與 H、docs/env-notes.md 的「Skills」一節、CLAUDE.md、docs/agents/lessons.md。

要特別注意：
- 06：動工前先存一份 ~/.claude/mods/ 的 sha256 清單，做完比對完全相同。客廳的第一個 commit 是還沒改過的 mods 複本（段 6 審查的基準）。
  絕對不放 ~/.claude/mods-data/、~/.claude/backups/、任何 credentials、金鑰、ADC；推之前 git ls-files 自己看一遍。
- 推到私人 repo 可能被 auto mode 當成資料外流擋下：被擋就停，記進 HANDOFF，請使用者自己推，不要繞。
- 07：同步指令用 node（Windows 與 Linux 都能跑），不用 bash；不刪專案獨有的 skill；不在上一個專案跑；不裝進 ~/.claude/skills/。
  版本表從 docs/env-notes.md 搬到客廳時，「重裝時要重做的修改」一起搬，並記 kickoff、claude-md 是自己寫的、正本在客廳。
- 06 也要管共用的 ~/.claude/CLAUDE.md 的正本（使用者已決定，見 HANDOFF「使用者已經決定的」與 issues/06「做法」）：
  內容只取 .local/research/old-workflow.md 第二節標「通用」、而且有使用者原話出處的偏好；原話留在私人的地方，不進公開 repo。
- HANDOFF「要使用者決定的」裡跟這段有關的：skill 重疊第 7 組（skillOverrides）。動到時先看 HANDOFF 有沒有記下使用者的答案；沒有就不做，留位置、記進 HANDOFF。
- 改任何函式或文件裡的字之前，grep 找出所有用到它的地方。中途發現的事記進 HANDOFF，不岔出去修。
- subagent 一次最多兩個。主控會開下一段：不要自己開 session，也不要存 limit-guard 的開場 JSON（10 做完前本來就不能存）。
- 上一個專案 C:/Users/DELL/Desktop/baobao-wellness-clinic-scheduler 只讀不改；它的 .local/references/ 不讀。公開 repo 不帶真名、帳號、email、金鑰。

做完要交：每支一個 commit（這個 repo 的推到 origin claude/claude-home-workflow；客廳的推到它自己的 repo）、Status: done、issue 底下「做完時留下的」、
HANDOFF 更新（狀態、中途發現、要使用者決定的）、段 4 的開場與建議 effort 寫進 HANDOFF。最後回覆用繁體中文簡短說做了什麼、卡在哪。
```

## 段 4 的開場

建議 effort：**high**。

```
這一輪在建「客廳」：跨專案共用的工作流。分支 claude/claude-home-workflow（已經在這個 checkout 上）。
段 1～3 做完了。段 3：客廳 repo 在本機 C:/Users/DELL/claude-home（3 個 commit：e8f9058 是未改過的 mods ＝ 審查基準；06 骨架；07 skill 正本＋tools/sync-skills.mjs），
共用的 ~/.claude/CLAUDE.md 已生效（正本在客廳 user/CLAUDE.md），這個 repo 加了 .claude/project.json（skills）。
GitHub 上的 b09901017/claude-home 已建好（PRIVATE，使用者點頭後主控建）並推上去；主控另外在共用 CLAUDE.md 加了兩條（客廳 4ad4390），在 .claude/settings.json 關掉 frontend-design。
這是第 4 段：做 issue 10（交接開場分專案）→ 08（這個專案的私人資料同步）→ 09（guard 讀專案設定）→ 14（桌面 app 載入 mods），照這個順序。不做 12 以後的 issue。

先讀：.scratch/claude-home-workflow/HANDOFF.md 的「每一段共同的規矩」「中途發現」「使用者已經決定的」、
spec.md「談定的策略」（特別是「上一個專案一律不能壞」的三個階段）、issues/10、08、09、14 全文、issues/06、07 底下的「做完時留下的」、
客廳的 README.md 與 docs/project-config.md（專案設定的格式只在那裡定，08、09 照它讀，不要另發明）、CLAUDE.md、docs/agents/lessons.md。

要特別注意：
- 客廳 repo 已在 GitHub（PRIVATE），動工前 git -C ~/claude-home pull --ff-only。08 的「推送失敗就跳過、寫 log」還是要用測試驗。
- 這個 repo 的 .claude/settings.json 已經有 skillOverrides（主控加的）：08 加 hook 時合併進同一個檔，不要蓋掉。
- 10、09 改的是 ~/.claude/mods（上一個專案每天在用）：既有測試一條都不改就要全過，新行為加新測試；改完複製一份進客廳、commit（客廳的第一個 commit e8f9058 是段 6 審查的基準）。
- 10：順便處理段 2 中途發現的 limit-guard segmentRule()（advice.ts）—— 讓它說「下一段已經用 start_session 開了就不存開場 JSON」，從源頭解。10 做完之前不要在 ~/.claude/mods-data/handoffs/ 存開場 JSON。
- 09：這個 repo 的 .claude/project.json 加 neverWrite（baobu-app 的 (default) database、baobu_money_track），格式照客廳 docs/project-config.md。
- 08：同步工具寫成通用的放客廳 tools/；兩個私人 repo（.local 與客廳）的推送前檢查用客廳的 node tools/install-hooks.mjs <repo 路徑> 裝。Claude 自己推私人 repo 可能被 auto mode 擋：被擋就停，記進 HANDOFF，不要繞（推送走 hook）。
- 14：先用 Skill 叫 plugin-authoring；改 app 或使用者設定被 auto mode 擋就停，把使用者要做的寫成一步一步，放 HANDOFF「要使用者做的」。
- 改任何函式或文件裡的字之前，grep／graphify 找出所有用到它的地方。中途發現的事記進 HANDOFF，不岔出去修。
- subagent 一次最多兩個。主控會開下一段：不要自己開 session，也不要存 limit-guard 的開場 JSON。
- 上一個專案 C:/Users/DELL/Desktop/baobao-wellness-clinic-scheduler 的檔案只讀不改（~/.claude/mods 照 issue 改，但它的行為必須完全一樣）；它的 .local/references/ 不讀。公開 repo 不帶真名、帳號、email、金鑰。

做完要交：每支一個 commit（這個 repo 的推到 origin claude/claude-home-workflow；客廳的 commit 在客廳，repo 建好才推）、Status: done、issue 底下「做完時留下的」、
HANDOFF 更新（狀態、中途發現、要使用者決定的）、段 5 的開場與建議 effort 寫進 HANDOFF。最後回覆用繁體中文簡短說做了什麼、卡在哪。
```

## 段 4 停在哪（額度用完，10/28）

- **09 做一半**：`~/.claude/mods/guard/hooks/classify.ts`、`register.ts` 已改（**沒 commit、還沒複製進客廳**）：
  `rulesFrom(.firebaserc, .claude/project.json)`；沒有 `project.json` 的專案（上一個專案）＝ `LEGACY`，判斷跟以前一樣；
  有的專案：`.firebaserc` default 不是 staging 時認不出的 firebase 寫入要問、npm 名稱與「推 main＝部署」不套用、新的 `neverWrite` 風險（firebase CLI／gcloud firestore／REST／腳本／`git push`／gh 寫入，`git push origin` 會問 `git remote get-url`）。
  **既有 10 條測試不改全過、`tsc` 0 錯**。還沒做：新測試（用上一個專案 `.firebaserc` 的複本跑舊案例走 `rulesFrom` 那條路；`firebase deploy --project baobu-app`、對 `baobu-app` `(default)` 的 REST 寫入、`git push` 到 `baobu_money_track`）、這個 repo `.claude/project.json` 加 `neverWrite`、複製進客廳＋commit＋推、issue 09 收尾。
- **14 沒開始**（`plugin-authoring` 已讀過：桌面 app 用 `CLAUDE_CODE_PLUGIN_DIRS` 或 `--plugin-dir` 載入）。
- 段 5 的開場還沒寫：下一段先接完段 4 的 09、14，再寫段 5 的開場。

## 中途發現

- **段 4**：上一個專案的 `autosync.mjs --dry-run` 其實會把記憶與 mods 抄進它的 `.local` 工作目錄，所以 10 的判準改用它的 `sync-claude.mjs` 複本在暫存資料夾驗。
- **段 4**：`tools/autosync.mjs` 只做「這台 → repo」；VM 接手的反方向（repo → 這台）留給 12、13。

- **段 1**：`docs/env-notes.md` 寫「新建一個原本不存在的頂層 skills 目錄時要重開」—— 官方現在有 `/reload-skills` 可以不重開（[Commands](https://code.claude.com/docs/en/commands)、[Skills](https://code.claude.com/docs/en/skills)「Live change detection」）。建議段 7 更新 `env-notes.md` 時一起改。
- **段 1**：上一個專案的 `docs/agents/domain.md` 有一段「推翻舊 ADR 的慣例」（舊的一個字不改、新的寫「推翻：」、同一個 commit 改索引、測試盯著），這個 repo 的 `domain.md` 沒有帶過來。這個專案還沒有 ADR，建議第一支 ADR 出現時再補。
- **段 1**：這個 repo `CLAUDE.md` 的「絕對不寫入國王日記」只是文字；官方說一定要成立的要用 hook（skill-checklist M9、衝突 8）。等開始寫 Firebase 的程式時再考慮加 PreToolUse hook，不在這一輪。
- **段 1**：`claude-md` 這個名字含 `claude`，Agent Skills 的命名規則不允許，但 Claude Code 照常載入（skill-checklist 衝突 6）。只有要上傳 claude.ai 時才要改名。
- **段 1**：上游的 `graphify`（793 行）、`firestore-rules-creation`（600 行）超過官方建議的 500 行。上游的不改，交給 05 一起報告。
- **段 2**：本機 CLI 的登入過期（`claude -p` 回 `OAuth session expired`），所以觸發測試沒辦法用真的 session 量，改用兩個 subagent 當受試者（`research/trigger-test/results.md`）。
  腳本 `research/trigger-test/run_trig.py` 留著；使用者在終端機重新登入 `claude` 之後可以重跑。不是這一輪必要的事。
- **段 2**：`/doctor prompt-audit`（skill-checklist G11）這個 session 叫不到，03、04 改完都沒跑。建議段 7 收尾時在終端機跑一次 `/doctor prompt-audit CLAUDE.md` 與 `.claude/skills/kickoff`、`.claude/skills/claude-md`。
- **段 2**：limit-guard 的 `segmentRule()`（`~/.claude/mods/limit-guard/hooks/advice.ts`）在系統提示裡叫 Claude「每段做完都存開場 JSON」，跟新的「主控用 `start_session` 開了就不存」相反。
  現在靠 kickoff 與開場裡的一句話蓋過去（評估裡有效）。建議段 4 做 10（交接開場分專案）時，順便讓 `segmentRule()` 說「下一段已經用 start_session 開了就不存」，從源頭解。
- **段 2**：`grill-with-docs` 是 `disable-model-invocation: true`，模型自己叫不到它。沒改上游，改成 kickoff 的 description 與 `CLAUDE.md`「用哪個流程」指路：模型自己判斷時叫 `grilling`＋`domain-modeling`。評估裡 4/4 走對。
- **段 2**：這個 session 的工作目錄加了上一個專案的資料夾，所以它的 skill 也載進來（`baobao-wellness-clinic-scheduler:kickoff` 這種有範圍的名字），清單裡同時有兩支 kickoff、兩支 claude-md。
  有範圍限定、不會用錯檔，但多佔 context。主控開段時沒有要讀上一個專案的話，不必加那個資料夾。
- **段 3**：`gh repo create`（建私人 repo）被 auto mode 以「Public Data-Sharing Upload」擋下。客廳在本機做完、commit 好，建 repo 與推送交給使用者（下面「要使用者做的」）。
- **段 3**：skill 重疊第 7 組，主控說桌面 app 的 skill 清單裡沒有 `frontend-design`，所以不做。但**段 3 這個 session 的清單裡有一支沒有範圍前綴的 `frontend-design`**（不是上一個專案那支 `baobao-wellness-clinic-scheduler:` 開頭的）。
  照指示沒動；要不要關，留給使用者（第 7 題）。
- **段 3**：`subagent 同時最多兩個`、`一次一題` 只寫在 kickoff（共用的 `~/.claude/CLAUDE.md` 照 issue 06「已經在 kickoff 的不重複放」）。所以**本機不走 kickoff 的 session 沒有這兩條**。見下面「要使用者決定的」第 10 題。
- **段 3**：`docs/plan.md` 第 82 行、`README.md` 第 44 行說「skill 的來源與版本見 `env-notes.md`」—— 現在 `env-notes.md` 一行指到客廳，路還通。`plan.md` 是使用者決定的文件，沒動；段 7 更新 `env-notes.md` 時可以一起看要不要改字。
- **段 3**：客廳的推送前檢查裝在 `.git/hooks/pre-push`，是一行轉呼叫客廳 `tools/pre-push.mjs` 的**絕對路徑**。客廳搬家，hook 會找不到檔而拒絕推送（擋住，不會放行），重跑 `install-hooks.mjs` 就好。
- **段 3**：這個 repo 開了 `autocrlf`，工作目錄是 CRLF；客廳的 skill 正本照 commit 裡的存（LF），`sync-skills.mjs` 比對時 CRLF 當 LF。只有 `impeccable/scripts/impeccable.cmd` 在 commit 裡本來就是 CRLF，照原樣。

## 要使用者做的

（目前沒有。段 3 的「建客廳的 GitHub repo」使用者在主控 session 點頭後，主控建好、確認 PRIVATE、推上去了。）

## 要使用者決定的

（目前沒有）

## 使用者已經決定的（2026-10-28）

- **Playwright MCP 選 B**：只給雲端用，本機關掉。主控已做：`.claude/settings.local.json`（不進 git）＋ `docs/env-notes.md` 補一節。
- **桌面 app 也要載入 mods**：加成 issue 14，排在段 4 的 09、10 之後。
- **合併：「綠了直接合」**（主控轉達，使用者在主控 session 說的）：一輪做完，CI 綠了就直接合，不用等使用者說；kickoff 寫成專案可以另訂的預設。
  kickoff 不用改：它本來就寫「合併照專案 `CLAUDE.md`」，主控把這個決定寫進這個 repo 的 `CLAUDE.md`「合併」一節（`cb6a4c8`）。
- **共用的 `~/.claude/CLAUDE.md`：「好」**（主控轉達）：要有一份所有專案共用的，客廳 repo 是正本，只放使用者說過、跨專案都成立的。交給 06。
- **skill 重疊九組（issue 05）與共用 CLAUDE.md 的第 10、11 題：「都照建議」**（使用者在主控 session 說的）。
  - 1～6、8、9：都留、照建議的用法（一輪改動走 kickoff、不用 `/implement-spec`；段與段之間用 kickoff 的開場，`/handoff` 留給一般對話；審查只跑 `matt-code-review`；查資料預設 `research`）。不刪任何 skill。
  - 7：主控在這個 repo 的 `.claude/settings.json` 加了 `"skillOverrides": {"frontend-design": "off"}`（官方格式查過：code.claude.com/docs/en/skills「Override skill visibility from settings」；plugin 帶的 skill 不吃這個）。
  - 10：「一次一題、附建議」「subagent 同時最多兩個」加進共用 CLAUDE.md（客廳 `4ad4390`，已複製到 `~/.claude/CLAUDE.md`，現在 7 條）。
  - 11：「公開 repo 不寫藏了什麼」不放。
- **客廳的 GitHub repo**：使用者點頭後主控建好 `b09901017/claude-home`（PRIVATE），4 個 commit 都推上去了。
