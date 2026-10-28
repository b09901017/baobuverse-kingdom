# 01 儀表板在桌面 app：帳號認錯、版面超出框

Status: todo
Type: task

## 使用者要的

使用者 2026-10-29 在主控 session 說：

> 儀表板，他好像有點跑版在這桌面板app上 ? 有點突出框框，然後帳號那邊也不對了 ? 為甚麼 ? … 能溝埧桌面板app的設定再幫我調整嗎

主控回報原因與修法之後，使用者說「好，合併後開」（等 PR #4 合併後開一段來修）。

## 主控查到的（2026-10-29，桌面 app 的畫面截圖＋程式）

儀表板是 `~/.claude/mods/dash`（上一個專案每天在用；正本在客廳 `mods/dash`），從 issue 14 起桌面 app 也載入。

### 一、帳號認錯

- 桌面 app 的對話登入的是帳號 A（左下角顯示的那個），儀表板最上面卻寫帳號 B。
- 原因：`hooks/register.tsx` 的 `refreshAccounts`（約 446 行）只用 `CLAUDE_CONFIG_DIR` 認「現在是哪個帳號」（`keyForDir`）。
  那是 VS Code 與終端機用的（兩個帳號各一個資料夾）；**桌面 app 不設它**，所以被當成預設資料夾 `~/.claude`，而那個資料夾登入的是帳號 B。
- 桌面 app 的對話有這些環境變數：`CLAUDE_CODE_ENTRYPOINT=claude-desktop`（VS Code 是 `claude-vscode`）、`CLAUDE_CODE_USER_EMAIL`、`CLAUDE_CODE_ACCOUNT_UUID`（都是桌面 app 登入的帳號）。
- 副作用：`recordLimits` 用「現在的帳號」的 email 當檔名寫 `~/.claude/mods-data/limits/<email>.json`，所以**帳號 A 的 5 小時／7 天用量被寫進帳號 B 的檔**，帳號頁的額度是錯的。
- 桌面 app 一次只能登入一個帳號（官方沒有多帳號切換）。帳號頁的「用 X 開新對話」改的是 VS Code 的設定、開的是 VS Code 的對話（客廳 README 已寫「只管 VS Code」），在桌面 app 按會讓人以為換了桌面 app 的帳號。

### 二、版面超出框（右邊的儀表板面板，約 520px 寬）

- 「總覽」的「用量」那一格：Context 那行的「17%」壓到框線外；「5 小時」那行的紅色虛線（額度預報）一路畫到視窗邊緣。
- 寬度是照終端機「一格一個字」用 `bodyColumns` 算的（`viewOf` 的 `cols`、`fitOf`、各種 `Box width={…}`、`line`、`forecastBar`）。桌面 app 的字寬跟格子對不上，所以超出。
- mod 的型別裡 `Box` 有 `overflow?: 'visible' | 'hidden'`，畫面也分 surface（`terminal`／`desktop`／`vscode`／`mobile`）。

### 三、額度預報可能混到別的帳號（要查，不一定要修）

- 截圖時「5 小時」寫「約 01:45 用完，比重置早 75 分，平均每 10 分鐘 +9.3%」，那時帳號 A 才用了幾 %。預報是 limit-guard 的 `$.state`（`forecast`），儀表板只讀。
- 查 limit-guard 的預報是不是把兩個帳號的取樣混在一起算（同一台電腦、桌面 app 與 VS Code 不同帳號）。

## 做法

1. **帳號**：桌面 app 的對話（`CLAUDE_CODE_ENTRYPOINT=claude-desktop`）用桌面 app 登入的 email 認「現在的帳號」：
   對到 `accounts.json` 裡哪個資料夾的 email 就是那一個；都對不到就多一列，用 email 當 key、名字照 `names`。`recordLimits` 寫到對的檔。
   VS Code、終端機的認法一個字都不變（上一個專案在 VS Code 用）。
2. **帳號頁在桌面 app**：多一行說明「桌面 app 換帳號：左下角帳號選單 → 登出 → 用另一個帳號登入（一次只能登入一個）」；
   「用 X 開新對話」的按鈕在桌面 app 要讓人看得出是**開 VS Code 的新對話**（改字或收起來，選一個、寫進「做完時留下的」）。
3. **版面**：桌面 app 上每一行都不能超出框。做法自己選（例如桌面 app 另外算寬度、留餘量、`overflow="hidden"`、用 flex 撐開長條）；
   終端機與 VS Code 的畫面一個字都不變（既有的 `pane.test.tsx` 等一條都不改要全過）。
4. **額度預報**（三）：查清楚寫進「做完時留下的」。是 limit-guard 混到帳號的話**不修**，記成中途發現、附建議，等使用者說。

## 規矩

- 照 issue 09 的規矩：既有測試一條都不改要全過（基準：dash 16）、新行為加新測試、tsc 0 錯（`npx -y -p typescript@5 tsc -p <mod 資料夾> --noEmit`）、`claude plugin validate` 過；
  改完複製進客廳 `mods/dash`、一個 commit、推客廳；客廳 `mods/` 跟 `~/.claude/mods` 逐檔相同。
- 改任何函式或畫面上的字之前，grep 找出所有用到它的地方。
- 這個 repo 是公開的：issue、commit、PR 不寫真名、email、帳號名字（用「帳號 A／B」）。

## 驗收

- 桌面 app 的新對話：儀表板最上面是桌面 app 登入的帳號；`mods-data/limits/` 寫到對的檔。
- 桌面 app 的儀表板「總覽」「帳號」「Context」「花費」「雲端」每一頁都沒有超出框 —— **截圖確認**（使用者的規矩：畫面類的東西交付前自己看過、截圖確認）。
- VS Code 的畫面與帳號切換照舊（測試）。
