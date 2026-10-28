# 01 盤點上一個專案實際怎麼工作

Status: todo
Type: research
Blocked by: —

## 使用者要的

> 你再次去看看我上專案的流程，看深入點，看每次我怎麼做，也可以看看那時的claude.md等等

## 為什麼

kickoff、claude-md 這兩支 skill 是從上一個專案搬過來的通用版，但上一個專案裡真正的做法散在 `CLAUDE.md`（187 行、約 7 萬 token）、
`.claude/skills/`、`.local/claude-memory/`（69 份記憶，feedback 類的最重要）、`.scratch/*/HANDOFF.md`、`docs/agents/lessons.md`。
沒有先盤點，02～05 的優化會憑印象做。

## 動工前先讀（全部唯讀，**一個檔都不能改**）

`C:/Users/DELL/Desktop/baobao-wellness-clinic-scheduler/` 底下：

- `CLAUDE.md`（太大，用 Grep 找標題、分段讀）
- `.claude/skills/kickoff/SKILL.md`、`.claude/skills/claude-md/SKILL.md`，以及它專案限定的 skill 清單
- `.local/claude-memory/MEMORY.md` 與所有 `type: feedback` 的記憶（例如 `big-rounds-split-into-sessions-with-openers.md`、`reports-for-her-one-question-at-a-time.md`、`no-nine-parallel-subagents.md`）
- 兩三份最近的 `.scratch/<slug>/HANDOFF.md`（看分段、開場、中途發現實際長怎樣）
- `docs/agents/`

⚠️ `.local/` 有真實客戶的名字與健康資訊。**只讀流程類的檔案**；`references/` 一律不讀。產出寫在公開 repo，不能帶任何真名、病歷號、帳號。

## 要交的

**`.local/research/old-workflow.md`**（私人 repo `baobuverse-kingdom-local`，不是公開的 `.scratch`）：
上一個專案的記憶裡有帳號名字、email、人名，原話摘錄只能放私人的地方。公開 repo 裡只放歸納過、不含任何名字的規則（03、04 寫進 skill 的那些）。

- 一輪工作從頭到尾實際的步驟，每一步標出處（哪份記憶／哪段 CLAUDE.md）
- 使用者明確說過的偏好（原話＋日期），分成「通用」與「只屬於上一個專案」
- 上一個專案的 CLAUDE.md 哪些是通用規則、哪些是專案限定、哪些已經不該放在 CLAUDE.md
- 現在這個 repo 的 `kickoff`、`claude-md` 跟上一個專案的版本差在哪，有沒有改寫時掉了的東西

## 判準

- 03～05 的作者只讀這一份，就知道使用者的常態流程，不用再翻上一個專案嗎？
- 每一條偏好都有出處，沒有「我覺得她應該想要」？
- 產出在 `.local/`（`git -C .local status` 看得到、`git status` 看不到）？這一段 commit 進公開 repo 的檔案沒有引用記憶原文？
