# 客廳：跨專案共用的工作流

> 這一輪**不寫 app 的程式碼**。做的是開發環境與工作流程。

## 使用者要的（原話）

> 還是你可以幫我把客廳的東西那些會共用到的東西也開成一個私人 repo ? 這樣之後我就不用一直重複說了 ?

> 我希望這個新專案在vm中也可以有一個資料夾，這樣我在vm上可以選我要動哪個專案 ? 可以嗎 ?

> 然後你說現在榜的是舊專案不能幫我把這個綁的變成一個變數之類的嗎，就是我開心專案就可以綁這個新的
> 也就是我希望我之後新增專案也可以用那個專案的firebase

> 目前我的想法是，開不同的firebase，以及同一個vm中的不同資料夾

> 我希望可以保留上次專案中的工作流程，雖然之可能會再優化，但是我希望這個優化是可以持續跌帶更新的，像是你說的客廳那樣，我只要更新客廳的東西，我的所有專案都可以更上
> 想是 Matt 整套，graphify 幫助ai更懂整份程式碼的關聯claude-md，kickoff，mods，VM的操作firebase，e2e，playwrite gcloud 的預設專案等等

> 就是我會希望能夠開啟vm後，我可以再claude 這邊一樣選擇資料夾不同repo等等，然後客廳共用的部分也可以更新到私人repo，然後這個專案的local也可以更新到對應的local 私人repo讓vm可以同步更新到

> 不要影響到上個專案，畢竟那個專案還在進行中還在維護測試

> 我都是kickoff完，你開一個subagent 去檢查issue，不用給我看過，然後直接開始做，然後乳果你覺得要分幾段不同的新session 就幫我分，但也不用硬要分 …… 我希望你全自動完成，也怕同一個session context太多會導致上下文汙染

> 我希望你這幾分skill可以根據資深工程師的專業以及官方出的 /skill-creator 去檢查
> 以及可以參考matt那整套的流程，放進客廳前去幫我優化我之前的kickoff skill 等等
> 然後像其實現在我還在專案初期還在和你討論階段，就可以參考matt的那個grill-me-with-doc啊 ? kickoff比較像是之後地基打好後要慢慢優化加東西上去的時可以用的 …… 要更具官方最新的指示去優化skill以及寫claude.md

## 談定的策略

### 三層，加上不進任何 repo 的機密

| 層 | 放什麼 | 在哪 |
|---|---|---|
| 客廳 | 所有專案共用的工具：mods、狀態列、hook 腳本、VM 操作、skill 的正本、設定範本 | 私人 repo `b09901017/claude-home`（這一輪建） |
| 專案 | 程式碼、`.claude/skills/` 的複本、`CLAUDE.md`、專案設定 | 專案自己的 repo（這個是公開的） |
| 專案的私人資料 | Claude 記憶、交接開場 | 私人 repo `b09901017/baobuverse-kingdom-local`，clone 在 `.local/`（已建、已 gitignore） |
| 機密 | 登入備份（`~/.claude/mods-data/login-backup-*`）、服務帳號金鑰、ADC | **不進任何 repo** |

原則：

- **工具不寫死專案名字**，從「目前在哪個資料夾」讀那個專案的設定（`.firebaserc` 等）。新增專案＝加設定，不改工具。
- **每樣東西只有一個正本**，其他都是複本、只從正本更新。
- **雲端 session 不讀 `~/.claude/`**（`docs/env-notes.md`），所以 skill 的正本在客廳，但每個專案仍 commit 一份複本到 `.claude/skills/`（使用者的決定，`docs/plan.md`「Skill」）。
- **一台 VM、每個專案一個資料夾**，不是一個專案一台。

### 上一個專案（`baobao-wellness-clinic-scheduler`）一律不能壞

分三個階段，這一輪只做 1 與 2：

1. **只動新的**：建客廳、這個專案自己的同步、VM 上加這個專案。上一個專案的檔案一個都不改。
2. **共用工具改成讀專案設定**：guard、limit-guard、儀表板。**上一個專案的行為必須完全一樣**（它既有的測試不改就要全過）。
   全域的 autosync hook **不分流**（issue 11，過目時發現分流會讓「回家」把 mods 蓋回舊版）。
3. **（不在這一輪）上一個專案改用客廳的工具**，mods 改由客廳管。要使用者點頭、挑它不忙的時候。

第 1、2 階段期間，**mods 跨機器的搬運照舊由上一個專案的 `.local` 負責**（VM 的「出門」會 `--restore` 它）。客廳只做單向備份，不寫回 `~/.claude/mods`，免得兩套同步互相蓋掉。

### 工作流程本身

- 早期討論（現在這個專案）用 Matt 的 `grill-with-docs` 這一路；`kickoff` 定位成「地基打好之後，一輪一輪加東西」。
- 使用者的常態（上一個專案 `big-rounds-split-into-sessions-with-openers` 記憶，2026-10-08／10-15 確認）：
  kickoff → subagent 過目 issue（不給她看）→ 直接做 → 需要才分段，每段給開場與 effort → 中途發現記下、段末一次問 →
  `/matt-code-review` 單獨一段 xhigh → 開 PR、合併。這一輪起，**下一段由主控自動開新 session**，開場同時寫進 `HANDOFF.md`。
- skill 依官方 `skill-creator`、官方最新文件、`writing-for-agents` 檢查與優化。

## 不做（這一輪）

- app 的任何程式碼
- 第 3 階段（上一個專案搬家）
- Playwright MCP 的改法（使用者還沒在 A／B／C 之間選）
- gcloud／Firebase 每個專案的設定（等這個專案真的要用 Firebase；這個專案的 Firebase 要新開還是放在 `baobu-app` 另開 database，是 `docs/plan.md`「要去試」的事）
- 刪除任何 skill（`docs/plan.md`：Matt 整套是使用者的決定；只提建議）
