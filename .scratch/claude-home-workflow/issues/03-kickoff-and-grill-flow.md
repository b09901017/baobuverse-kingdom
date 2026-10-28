# 03 重新定位並優化 kickoff；早期討論走 grill-with-docs

Status: done
Type: task
Blocked by: 01, 02

## 使用者要的

> 參考matt那整套的流程，放進客廳前去幫我優化我之前的kickoff skill 等等
> 然後像其實現在我還在專案初期還在和你討論階段，就可以參考matt的那個grill-me-with-doc啊 ? kickoff比較像是之後地基打好後要慢慢優化加東西上去的時可以用的

> 我都是kickoff完，你開一個subagent 去檢查issue，不用給我看過，然後直接開始做，然後乳果你覺得要分幾段不同的新session 就幫我分，但也不用硬要分，就是你懂嗎，我希望你全自動完成，也怕同一個session context太多會導致上下文汙染，稀釋，你越做越吃力，所以才讓你分session，然後也要給我給下一個session的開場

## 為什麼

現在的 `.claude/skills/kickoff/SKILL.md`（125 行）：

- description 說「需求動到資料模型……就算只說幫我想想也一定要用」，在專案初期會搶走 `grill-with-docs` 該做的事
- 跟 Matt 的 `to-spec`、`to-tickets`、`implement`、`handoff`、`wayfinder` 大量重疊，各寫一套
- 第一、二段結尾寫「停下來、問 issue 要不要逐支看」，跟使用者的常態（subagent 過目、不給她看、直接做）衝突
- 沒有「主控自動開下一段 session」：現在只會把開場貼給使用者

## 做法的方向（細節由你依 01、02 決定）

- 寫清楚兩條路：**專案初期／決策還沒定** → `grill-with-docs`（ADR、詞彙表邊談邊寫）；**地基打好、一輪一輪加東西** → `kickoff`。兩支的 description 互相指路，不重疊觸發
- kickoff 能用 Matt 的 skill 做的步驟就叫它們（例如 issue 格式交給 `to-tickets` 的慣例、審查交給 `matt-code-review`），只保留使用者自己的偏好：
  subagent 過目（主控再對最重的幾條）、不給她看直接做、需要才分段、每段 effort、中途發現段末一次問、審查單獨 xhigh、開 PR 合併、
  **主控用 start_session 自動開下一段**（開場同時寫進 `HANDOFF.md`，使用者也能自己貼）
- 只屬於上一個專案的東西（develop 分支、staging、真名掃描）不放進通用版；放「各專案在 CLAUDE.md 自己寫」的位置
- 給使用者看的東西照 `reports-for-her-one-question-at-a-time`：只問真的要她想的、一次一題、附建議
- 自動開下一段要跟 limit-guard 的「新對話自動放進開場」（`~/.claude/mods/limit-guard`，只在有載入 mods 的地方）不重複：寫清楚 kickoff 開了 session 之後不再另存開場 JSON，或反過來
- 照 02 的清單過一遍，用 `skill-creator` 的評估方式至少試一次觸發（例如給三句話：該觸發 kickoff、該觸發 grill-with-docs、都不該）

## 判準

- 使用者說「我們來討論一下記帳的資料要怎麼存」時，會走 grill-with-docs 而不是 kickoff 嗎？
- 使用者說「這一輪要加預算功能和固定支出」時，kickoff 會不問她 issue、直接 subagent 過目後開工嗎？
- 新 session 只拿到開場，能不能不問任何問題就接著做？
- 02 清單每一條都打勾，或寫了為什麼不適用？
- 通用版裡沒有 develop／staging／真名掃描這類上一個專案限定的字？

## 做完時留下的

`.claude/skills/kickoff/SKILL.md` 改寫（125 → 166 行，description 579 → 322 字）。舊版快照在段 2 的 scratchpad；評估在 [`research/trigger-test/results.md`](../research/trigger-test/results.md)。

**兩條路**

- kickoff 的 description 改成「地基打好之後的一輪改動」，拿掉「一定要」「就算只說幫我想想…也一樣」，並指路：決策還沒定 → `/grill-with-docs`。正文開頭一張「兩條路」表。
- `grill-with-docs` 沒改：它是 Matt 的上游檔，而且 `disable-model-invocation: true` —— 模型叫不到它，它的 description 也不進 context，改了沒用。
  改成由 kickoff 的 description 與 `CLAUDE.md`（issue 04）指路：模型自己判斷時用 Skill 叫 `grilling`＋`domain-modeling`（就是 `grill-with-docs` 的內容）。

**補回盤點第四節掉的**：開場與「整輪都適用的規矩」都有「改之前 grep／graphify 找所有呼叫端與畫面上的字」「使用者說要修的中途發現，修前再 grep 牽連、照一支 issue 的規矩」「類似的問題也記」；
另外補回：過目的 subagent 只回報、主控改；使用者說要逐支看時先給清單（理由）；使用者給過的參考也算紀錄；想清楚順手、不照字面；`git fetch` 的理由；手動清單的第二種寫壞法；審查很吃額度、大的一輪不要接在實作後面跑；開場的「先讀」具體到哪幾節、「先問的題目」「審查要特別看的」。

**使用者的常態**：第一段結束不再問「issue 要不要逐支看」，第二段結束不再停；只有真的要使用者決定的才問，一次一題附建議。

**主控自動開下一段**：第三段寫主控用 `mcp__ccd_session__start_session`（`user_asked`、`fresh`、開場全文、`effort`、共用 checkout）開段；段做完，主控自己看 commit 與 HANDOFF，擋住下一段的先問、不擋的留著問，再開下一段；段自己不開；開不了就貼給使用者。

**跟 limit-guard 不重複**：用 `start_session` 開了的段不存 `~/.claude/mods-data/handoffs/` 的 JSON；只有「開不了、改成給使用者貼」與「額度快用完、中途收尾要接著做同一段」兩種情況照 limit-guard 存。開場模板也寫進這句，所以段的 session 不會照 limit-guard 的系統提示自己存。

**Matt 的 skill**：issue 的切法指到 `to-tickets` 第 3 步（它是 `disable-model-invocation`，所以用檔案路徑指，不用 Skill 叫；C5），跳過它「給使用者逐支確認」那步；審查叫 `matt-code-review`；PR 內文用 `pr`。

**合併（待使用者決定）**：skill 寫「照專案 `CLAUDE.md` 的合併規定；沒寫就 CI 綠了問一次，答案寫進專案的 `CLAUDE.md`」，沒有替使用者選。

**專案限定的**：develop／staging／真名掃描都不在通用版；基底分支、驗證指令、合併規定、推之前要掃什麼、手動驗收環境寫成「看專案的 `CLAUDE.md`」。

**02 清單**

- A1～A6 ✓（名字 `kickoff`、frontmatter 第一行）。B1～B5、B8、B9、B11 ✓：說做什麼與何時用、使用者會講的字、322 字、沒有命令句與強調字、指路到 grill-with-docs。B6：同義觸發詞收掉（「先規劃不要動 code」「幫我想想」）。
- **C1 刻意不設 `disable-model-invocation`**：它有副作用（開 session、commit、合併），官方建議這種流程關掉模型呼叫；但使用者的常態是用一般的話（「這一輪要加…」）叫它，判準也要它自己觸發。有副作用的那幾步各自有閘門（合併照專案規定或先問）。
- C5 ✓。D1 ✓（166 行）。D2 ✓（只指一層：`to-tickets`、`issue-tracker.md`、`lessons.md`）。D4 ✓。D6、D7 ✓：最上面一節是整輪都要記著的常駐規矩（compaction 後只留前 5,000 token）。D8：沒有一定要硬擋的，不加 hook。D9、D10 ✓（開場與交付是編號清單）。
- E1～E7 ✓（理由寫在會改變行為的地方；沒有日期；用詞統一成「主控」「段」）。E11 ✓。E12 ✓（MCP 工具寫全名）。E13 ✓（grep 過，沒有名字與帳號）。
- G3 ✓、G6 △、G7 ✓：見 results.md。真的用 `claude -p` 量觸發沒跑成（CLI 登入過期），腳本留在 `research/trigger-test/run_trig.py`。G8：只測 Opus（衝突 7）。G9 沒量。**G10、G11（`/doctor prompt-audit`）沒跑**：這個 session 叫不到 CLI 的指令，記進 HANDOFF。

**判準**

- 「我們來討論一下記帳的資料要怎麼存」→ 新版走 `grilling`＋`domain-modeling`；舊版走 kickoff。
- 「這一輪要加預算功能和固定支出」→ 走 kickoff；情境題裡新版不問 issue，直接開段。
- 新 session 只拿開場能不能不問就做：開場模板有 7 項，情境題新版的開場照著寫出來。真的段 session 在段 3 會驗到（段 3 的開場就照這個模板寫）。
