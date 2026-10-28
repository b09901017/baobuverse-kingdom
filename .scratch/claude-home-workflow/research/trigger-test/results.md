# kickoff／claude-md 改版的評估（段 2，2026-10-28）

skill-checklist 的 G3（舊版 vs 新版）、G6（觸發）、G7（拿一個全新的 Claude 當受試者）各試一次。

## 怎麼做的，與限制

- **原本要用 `run_trig.py`**：每一句開一個真的 `claude -p`，看它第一個 Skill 呼叫是哪一支（skill-creator 的 Description Optimization 就是這樣量）。
  這次跑不了：本機 CLI 的登入過期（`OAuth session expired`），不能代登入。CLI 登入好之後可以重跑：
  `python run_trig.py <放好 .claude/skills 與 CLAUDE.md 的資料夾> out.jsonl`。腳本用 `--setting-sources project` 加 `disableAllHooks`，
  不會觸發使用者層級的 hook（那裡有上一個專案的 autosync）。
- **改用替代做法**：兩個 subagent（Opus，與實際使用的模型相同，衝突 7），一個拿舊版、一個拿新版，彼此不知道哪版新哪版舊。
  各自拿到：模型在系統提示裡看得到的 skill 清單（名字＋description，`disable-model-invocation` 的不列）、那一版的 `CLAUDE.md`、16 句使用者的第一句話。
  先判斷路由，**之後**才讀那一版的 `kickoff/SKILL.md` 做同一個情境題。
- 限制：路由是模型「說它會叫哪支」，不是真的 harness 量出來的；subagent 自己的環境裡看得到新版清單（叫它忽略）。舊版照樣過度觸發，污染看起來不大。每句只跑一次。

## 路由（G6）

| 類別 | 句子 | 舊版 | 新版 |
|---|---|---|---|
| 該走 kickoff | 這一輪要加預算功能和固定支出… | kickoff | kickoff |
| | 這一輪要改的東西比較多…幫我開 issue 然後分段 | kickoff | kickoff |
| | 段 2 做完了，給我下一段的開場 | kickoff | kickoff |
| | 收件匣合併通知的規則要改…先跟我解釋為什麼當初這樣設計 | kickoff | kickoff |
| | 接下來要把發票載具接進來，還要改事件的資料形狀… | kickoff | kickoff |
| 該走 grill-with-docs（`grilling`／`domain-modeling`） | 我們來討論一下記帳的資料要怎麼存 | **kickoff ✗** | grilling＋domain-modeling |
| | 帳戶跟錢包到底要不要分開，一直問我問題直到想清楚 | grilling | grilling＋domain-modeling |
| | 主畫面打開第一眼要看到什麼我還沒想好，幫我想想怎樣比較合理 | **kickoff ✗** | grilling |
| | 「事件」跟「效果」這兩個詞用得很亂，來講清楚 | domain-modeling | domain-modeling |
| 該走 claude-md | CLAUDE.md 越來越肥了，幫我瘦身 | claude-md | claude-md |
| | Claude 一直忘記專案規則… | claude-md | claude-md |
| | 剛跑完 /init，幫我把產出的規則檔整理一下 | claude-md | claude-md |
| 差一點、都不該 | 存檔按鈕被鍵盤擋住，幫我修 | 不叫 | 不叫 |
| | README 錯字 | 不叫 | 不叫 |
| | 幫我寫這個 PR 的說明 | pr | pr |
| | plan.md 的階段表加一列 | 不叫 | 不叫 |

舊版 14/16，新版 16/16。舊版錯的兩句，理由都是 description 的「就算只說幫我想想…也一樣」「一定要」—— 正是衝突 1（強烈語氣造成過度觸發）。

## 情境（G3、G7）

情境：這一輪加預算與固定支出，issue 01～04 已過目；分四段；在桌面 app、看得到 `start_session`；有載入 limit-guard；專案沒寫合併規定。
問：(a) 段 1 的開場 (b) 接下來的動作 (c) 段 1 做完，一條中途發現擋住段 2、一條不擋 (d) CI 綠了怎麼合併。

| 斷言 | 舊版 | 新版 |
|---|---|---|
| 開場提醒「改之前 grep／graphify 找所有呼叫端與畫面上的字」 | ✗ | ✓ |
| 開場提醒「使用者說要修的中途發現，修前再 grep 牽連」 | ✗ | ✓ |
| 開場的「先讀」具體到 HANDOFF 的哪幾節 | ✗（只列檔名） | ✓ |
| 開場寫「不要自己開 session、不要存 limit-guard 開場 JSON」 | ✗ | ✓ |
| 主控用 `start_session` 開段 | ✗（貼給使用者） | ✓ |
| 用 `start_session` 開了就不存 limit-guard 的開場 JSON | ✗（存了） | ✓ |
| 收到通知後自己看 commit 與 HANDOFF | ✓ | ✓ |
| 擋住下一段的先問、不擋的留到下一段跑的時候問 | ✗（兩題一起問、停下來） | ✓ |
| 專案沒寫合併規定時不自己合、先問 | ✓ | ✓ |

舊版 2/9，新版 9/9。兩版都沒有 develop／staging 的字。

新版受試者在 (d) 自己附了「建議直接 squash merge」—— skill 只說「問一次、寫進 CLAUDE.md」，沒指定建議；建議哪一個是使用者還沒決定的事（HANDOFF「要使用者決定的」第一題）。
