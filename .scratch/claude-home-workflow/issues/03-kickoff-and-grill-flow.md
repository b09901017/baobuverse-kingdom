# 03 重新定位並優化 kickoff；早期討論走 grill-with-docs

Status: todo
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
