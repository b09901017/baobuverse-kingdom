# HANDOFF：客廳（跨專案共用的工作流）

分支：`claude/claude-home-workflow`（這個 repo）。全貌在 [`spec.md`](./spec.md)，issue 在 [`issues/`](./issues/)。

主控 session 依序自動開下一段；每段做完更新這份、寫好下一段的開場，主控照它開下一個 session。
使用者也可以自己複製開場貼到新 session。

## 分段

| 段 | issue | 建議 effort | 狀態 |
|---|---|---|---|
| 1 盤點與檢查基準 | 01、02 | high | ✅ 10/28（01：私人 repo `20f9eb9`，已推；02：`7bfd180`） |
| 2 kickoff、CLAUDE.md、skill 重疊 | 03、04、05 | xhigh | ✅ 10/28（03：`435506f`；04：`3e141d3`；05：`c0cd4fe`） |
| 3 客廳 repo 與 skill 正本 | 06、07 | high | 可以開始（開場在下面「段 3 的開場」） |
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

## 中途發現

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

## 要使用者決定的

### skill 重疊（issue 05，段 2）：一組一題

先講結論：**沒有一組是真的重複到該刪**，大多是「同一套流程裡不同的一步」。真的會互相搶的只有第 7 組（兩支設計 skill 都會自己跳出來）。
背景：Matt 那幾支（`grill-me`、`grill-with-docs`、`implement`、`implement-spec`、`handoff`、`to-spec`、`to-tickets`、`wayfinder`、`improve-codebase-architecture`）都設成**只有你打 `/名字` 才會用**，平常不佔任何空間，留著沒有成本。

1. **`grill-me`／`grilling`／`grill-with-docs`：都留，不用動？**
   三支是同一種「一直問你問題直到想清楚」。`grilling` 是本體；`grill-with-docs` ＝ 本體＋邊談邊寫詞彙表與決定紀錄；`grill-me` ＝ 本體、什麼都不存（給沒有 repo 的時候）。
   在這個專案裡，你要用的就是 `/grill-with-docs`（`CLAUDE.md` 已寫）。
   建議：**都留，不用動。**

2. **`implement`／`implement-spec`：都留，但一輪改動不用 `implement-spec`？**
   `implement` 做一支 issue；`implement-spec` 一次把整份規格交給好幾個平行的 subagent 做。後者會同時開很多 subagent，違反你「最多兩個」的額度規矩。
   kickoff 的段是一支一支做，用不到它。
   建議：**都留；一輪改動走 kickoff，不用 `/implement-spec`。**

3. **`codebase-design`／`improve-codebase-architecture`：都留？**
   不重複：後者是「掃一遍程式碼，找值得重整的地方」，前者是重整時用的詞彙與原則，後者會叫前者。現在還沒有程式碼，兩支都還用不到。
   建議：**都留。**

4. **`handoff` 與 kickoff 的開場：段與段之間用 kickoff，`/handoff` 留給其他時候？**
   `/handoff` 把目前的對話寫成一份交接檔（放電腦的暫存資料夾）；kickoff 的開場寫進 `HANDOFF.md`、主控自動開下一段。
   建議：**一輪改動的段與段之間用 kickoff 的開場；`/handoff` 只在 kickoff 以外、一般對話太長要換新對話時用。**

5. **`to-spec`／`to-tickets`／`wayfinder` 與 kickoff 開 issue：kickoff 照 `to-tickets` 的切法、但不逐支問你？**
   `to-tickets` 切 issue 的方法（每支是一條從頭到尾做得完的細線、標出誰擋誰）很好，kickoff 第二段已經照它切；
   但它最後一步是「把清單給你逐支確認」，跟你的常態（subagent 過目、不給你看）衝突，所以 kickoff 跳過那一步。
   `to-spec` 不用（kickoff 自己寫規格，而且保留你的原話）。`wayfinder` 只在「大方向還一團霧、一個 session 談不完」時用。
   建議：**照現在 kickoff 寫的；三支都留，你想用時自己打。**

6. **`matt-code-review` 與內建的 `/code-review`：審查段只跑 `matt-code-review`？**
   `matt-code-review` 看兩件事：有沒有照這個 repo 的規矩、有沒有照 issue 做（會開兩個 subagent）；內建的 `/code-review` 專抓程式錯誤。
   兩個都跑會多花一倍額度。
   建議：**審查段只跑 `matt-code-review`；你想多抓 bug 時再另外叫 `/code-review`。**

7. **`impeccable` 與 `frontend-design`：把 `frontend-design` 關掉？**
   兩支都會在「做畫面、改設計」時自己跳出來，會搶。`docs/plan.md` 已經寫 `impeccable` 取代 `frontend-design`。
   `frontend-design` 不在 repo、也不在帳號同步的 skill 裡，看起來是桌面 app 內建的。
   建議：**在 `.claude/settings.json` 加 `"skillOverrides": {"frontend-design": "off"}`**（官方的設定，不刪檔；如果它其實是 plugin 帶的，這個設定不吃，就改成在 claude.ai 關）。
   ⚠️ 這是改設定，要你說好才做。

8. **`claude-md` 與 `writing-for-agents`：都留？**
   改 `CLAUDE.md` 時兩支都可能跳出來，但分工不同：`claude-md` 決定「一條規則留不留、搬去哪」，`writing-for-agents` 教「怎麼寫得讓 AI 照做」。改 skill 時用 `writing-for-agents` 加官方的 `skill-creator`。
   建議：**都留。**

9. **`research` 與帳號的 `deep-research`：查資料用 `research`？**
   `research` 開一個背景 agent、把有出處的結果存成 repo 裡的一個檔；`deep-research` 會開好幾個 subagent 寫一份長報告，比較吃額度。`deep-research` 是帳號那邊來的（`anthropic-skills:deep-research`），repo 的設定關不到它。
   建議：**查資料預設用 `research`；你明說要「深入研究、寫報告」才用 `deep-research`。**

**不用決定，只是記下來**：上游的 `graphify`（793 行）、`firestore-rules-creation`（600 行）超過官方建議的 500 行。改了每次同步上游都要重做，**不改**。

## 使用者已經決定的（2026-10-28）

- **Playwright MCP 選 B**：只給雲端用，本機關掉。主控已做：`.claude/settings.local.json`（不進 git）＋ `docs/env-notes.md` 補一節。
- **桌面 app 也要載入 mods**：加成 issue 14，排在段 4 的 09、10 之後。
- **合併：「綠了直接合」**（主控轉達，使用者在主控 session 說的）：一輪做完，CI 綠了就直接合，不用等使用者說；kickoff 寫成專案可以另訂的預設。
  ⚠️ **kickoff 還沒改**：段 2 收到這個決定時，改 skill 的那一步被 auto mode 以「Self-Modification」擋下（由別的 session 轉達的要求去改 skill 的指示）。
  現在 kickoff 第四段第 4 點仍寫「照專案 `CLAUDE.md`；沒寫就問一次」。要使用者在這個段 2 的 session 或主控直接說「改」，或自己改那一行。
- **共用的 `~/.claude/CLAUDE.md`：「好」**（主控轉達）：要有一份所有專案共用的，客廳 repo 是正本，只放使用者說過、跨專案都成立的。交給 06。
