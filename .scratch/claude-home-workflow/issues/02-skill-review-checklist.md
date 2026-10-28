# 02 skill 與 CLAUDE.md 的檢查基準

Status: done
Type: research
Blocked by: —

## 使用者要的

> 我希望你這幾分skill可以根據資深工程師的專業以及官方出的 /skill-creator 去檢查
> …… 要更具官方最新的指示去優化skill以及寫claude.md

## 為什麼

03、04 要照同一把尺改。尺要來自官方，不是印象。

## 動工前先讀

- 用 Skill 工具叫 `skill-creator`（官方），讀它對 skill 結構、description、漸進揭露、評估的要求
- 官方最新文件（用 WebFetch／WebSearch，查證日期）：Claude Code 的 Skills、Memory（CLAUDE.md）、Settings、Hooks、Plugins 頁；Agent Skills 的 best practices
- repo 裡的 `writing-for-agents`、`claude-md` 兩支 skill
- Matt 那套怎麼寫 skill：挑 `grill-with-docs`、`to-spec`、`to-tickets`、`implement`、`handoff`、`wayfinder` 看寫法

## 要交的

`.scratch/claude-home-workflow/research/skill-checklist.md`：

- skill 的檢查清單（每一條附官方出處連結）：description 怎麼寫才會被正確觸發、正文長度與拆檔、什麼該寫什麼不該寫、`disable-model-invocation` 何時用、評估方式
- CLAUDE.md 的檢查清單：什麼該放（每次都要的）、什麼不該放（能從 code 推出來的、只偶爾用的 → 改放 skill 或文件）、長度
- 官方文件與 `writing-for-agents`／`claude-md` 意見不一致的地方，列出來並說以哪個為準

## 判準

- 每一條都有可點的官方出處，或明確標「資深工程師的判斷，非官方」？
- 03、04 的作者照這份就能逐條打勾嗎？

## 做完時留下的（2026-10-28，段 1）

- 產出：[`research/skill-checklist.md`](../research/skill-checklist.md)。skill 的清單分 A～H（名字、description、誰能叫、長度與漸進揭露、寫什麼、腳本、評估、分發），CLAUDE.md 的清單 M1～M18，每條標〔官方〕附連結或〔判斷〕。
- 用 Skill 工具載入了官方 `skill-creator`；查了 Claude Code 的 Skills、Memory、Settings、Hooks、Plugins、Commands、Extend 頁，Agent Skills best practices、Prompting best practices、agentskills.io 的評估頁（查證日期 2026-10-28）。
- 十一個衝突列在第三節，最要緊的兩個：description 要多強勢（skill-creator 說寫 pushy、Prompting 說強烈語氣會過度觸發 → 起點放軟、用觸發測試量）；`claude-md` 裡「刪掉超過 80% 規則」查不到出處 → 刪。
- 第四節量了現在 repo 的 skill：`graphify`（793 行）、`firestore-rules-creation`（600 行）超過 500 行，都是上游的，留給 05。
