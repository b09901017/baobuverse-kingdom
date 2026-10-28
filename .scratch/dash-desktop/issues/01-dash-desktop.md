# 01 儀表板在桌面 app：帳號認錯、版面超出框

Status: done
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
5. **輸入框上方那一條**（使用者 10/29 追加：「我還發現為甚麼我儀表板打開了但是輸入框上面還有」）：桌面 app 右邊的儀表板開著時，輸入框上方那一條（AbovePrompt）要讓開；VS Code 與終端機照舊，加測試。

## 規矩

- 照 issue 09 的規矩：既有測試一條都不改要全過（基準：dash 16）、新行為加新測試、tsc 0 錯（`npx -y -p typescript@5 tsc -p <mod 資料夾> --noEmit`）、`claude plugin validate` 過；
  改完複製進客廳 `mods/dash`、一個 commit、推客廳；客廳 `mods/` 跟 `~/.claude/mods` 逐檔相同。
- 改任何函式或畫面上的字之前，grep 找出所有用到它的地方。
- 這個 repo 是公開的：issue、commit、PR 不寫真名、email、帳號名字（用「帳號 A／B」）。

## 驗收

- 桌面 app 的新對話：儀表板最上面是桌面 app 登入的帳號；`mods-data/limits/` 寫到對的檔。
- 桌面 app 的儀表板「總覽」「帳號」「Context」「花費」「雲端」每一頁都沒有超出框 —— **截圖確認**（使用者的規矩：畫面類的東西交付前自己看過、截圖確認）。
- 桌面 app 的儀表板開著時，輸入框上方沒有那一條；關掉儀表板，那一條回來 —— 截圖確認。
- VS Code 的畫面與帳號切換照舊（測試）。

## 做完時留下的（2026-10-29）

客廳 commit `b923ca8`、`5dd5d8a`（輸入框上方那一條，做法 5）、`d02937a`（花費的月圖寬度；前面還有一個自動同步 `c856baf`，見中途發現 ①）。改的是 `mods/dash` 的 `hooks/register.tsx`、`types/index.d.ts`，加 `tests/desktop.test.tsx`。

### 一、帳號（做法 1、2）

| 開在哪 | 怎麼認「現在的帳號」 | 額度寫進 |
|---|---|---|
| 桌面 app（`CLAUDE_CODE_ENTRYPOINT=claude-desktop`） | `CLAUDE_CODE_USER_EMAIL` 對 `accounts.json` 每個資料夾登入的 email；對不到就多一列（key `email:<email>`，名字照 `names`，不能按切換） | `limits/<那個 email>.json` |
| VS Code、終端機 | 照舊：`CLAUDE_CONFIG_DIR`（`keyForDir`），**就算環境裡也有 `CLAUDE_CODE_USER_EMAIL`** | 照舊 |

- 帳號頁在桌面 app：選「**改字**」不收起來。按鈕寫「在 VS Code 用「X」開新對話」，標籤「新對話」改「VS Code 新對話」，
  底下兩行：「桌面 app 換帳號：左下角帳號選單 → 登出 → 用另一個帳號登入（一次只能登入一個）。」與「上面的按鈕開的是 VS Code 的新對話（改 VS Code 的設定），桌面 app 的帳號不會變。」
  按下去之後的訊息與 toast 也帶「在 VS Code」。總覽底下的「新對話會用「X」」在桌面 app 寫「VS Code 新對話會用「X」」。
- `DashAccounts` 多一格 `isDesktop?: true`（選填，舊的值照讀）。

### 二、版面（做法 3）

原因比主控查到的再多一層：Box 的寬度在桌面 app 是照格數畫的（`bodyColumns` 是用等寬字換算的格數），但 **Text 是比例字**，`━ ┅ █` 比一格寬；
`TextProps` 雖然有 `mono`，這一版的桌面 app **不收**（`Text prop "mono" is not allowed`，整個面板會被換掉）。另外網頁的 flex 不讓不換行的字縮到比字本身窄。

只在 `surface === 'desktop'`（面板的 render 把 `desk` 掛在元素表上）：

- 用量、5 小時預報、依模型／依專案、帳號頁的量表、Context 那一條、近 14 天：改畫一張 SVG，放在照格數算寬的 Box 裡，比例照百分比算，不看字型。預報那一截是淡色的實線（不是 ┅）。
- E2E 那一條還是用字畫（既有測試認 `█`）：格數乘 0.6，外面包一層會切的 Box。
- 卡片 `overflow: hidden`；會縮的格子（量表右邊的說明、模型名、路徑、時間）加 `minWidth: 0`＋`overflow: hidden`；分頁那一行可以換行。
- 花費的月圖（原本就是 SVG）寫死 560px：第一輪截圖量到桌面 app 一格約 9px、卡片裡面約 420px，會超出。桌面 app 改成卡片格數 × 8px（往小估，寧可窄一點）。
- 終端機、VS Code：每一頁（總覽、Context、花費、帳號、雲端）× 寬 50／66／80／120 × VS Code／終端機的環境，畫出來的樹跟改之前**逐字相同**（只差每次不同的按鈕 handle 編號；比對用的暫時測試沒進 repo）。

### 三、額度預報（做法 4）：沒有混到帳號，但有兩件事

- 預報的取樣在 limit-guard 自己的 `$.state`（每個對話一份，不跨對話、不跨帳號），取的是**這個對話**的額度讀數，所以兩個帳號的取樣不會混在一起。
- 「才用幾 % 就說 01:45 用完」的原因是速度的算法：`rate = max(最近 10 分鐘, 最近 30 分鐘)`，而 10 分鐘那段**只要 3 分鐘、漲 1% 就算數**。
  對話剛開的那幾分鐘（讀一大堆檔、開 subagent）漲得快，就被外推成「每 10 分鐘 +9.3%」。這是 limit-guard 的事，**沒修**，見中途發現 ②。

### 四、輸入框上方那一條（做法 5）

- 原因：那一條看 `shownA` 讓開，`shownA` 是 `$.ui.panes()` 裡儀表板的 `isShown`。截圖時面板開在右邊、那一條還在，表示桌面 app 上 `isShown` 沒有變 true（桌面 app 的對話沒有自己的終端機；型別說 `isShown` 是「畫面顯示的那一個」，沒有講桌面 app）。測試裡沒辦法看到真的桌面 app 回什麼，所以**不靠它**。
- 做法：自己記「面板開著」（`paneOpen`：mod 呼叫 `$.ui.open` 打開儀表板之後記 true ——對話開始、「打開儀表板」、`/dash`；`ui.close` 記 false）。**只在桌面 app**，那一條看到開著就讓開；終端機、VS Code 照舊只看 `shownA`。
- 注意：關掉儀表板之後那一條回來，靠的是 `ui.close`；測試工具丟不出 `ui.close`，這一點只能截圖確認。

### 測試

- dash：既有 16 條一條沒改全過，新加 7 條（`tests/desktop.test.tsx`），共 23 pass（月圖寬度併在版面那一條）；新的 4 條在舊程式上會失敗（確認過）。
- `tsc` 0 錯，`claude plugin validate` 過（警告跟改之前一樣）。
- 客廳 `mods/` 跟 `~/.claude/mods` 逐檔相同（產生的 `.claude-plugin/types/` 不進版控）。
- 截圖第一輪（10/29，主控與這一段都看過）：帳號、總覽、Context、雲端都沒超出框；帳號是桌面 app 登入的那個；儀表板開著時輸入框上方沒有那一條。
  帳號頁兩個資料夾登入的是同一個帳號，所以有兩張一樣的卡（設定本來就這樣）；那張卡的 5 小時是修之前被寫進去的桌面 app 帳號的數字（中途發現 ④）。
- 還差第二輪：花費頁（月圖改過寬度）、關掉儀表板後那一條回來。

### 中途發現（沒修，等使用者說）

① 客廳的自動同步（`tools/autosync.mjs`，家裡電腦每個 session 開始／結束都跑）在 00:23 把改到一半的 `~/.claude/mods/dash` commit 並推上去了（`c856baf`）。
   照設計就是這樣（單向備份），但「改 mods 一個 commit」在家裡電腦上做不到。建議：改 mods 的那一段，把「一個 commit」改成「最後一個 commit 的狀態是完整的」，或 autosync 跳過正在改的 mod（例如 mods 裡有 `.wip` 檔就不備份）。

② limit-guard 的速度：10 分鐘那段只要 3 分鐘的取樣就算，又跟 30 分鐘取大的，對話剛開時容易喊「快用完」。
   建議：已用的 % 還很低（例如 < 20%）時只看 30 分鐘那段，或 10 分鐘那段至少要 6 分鐘的取樣。改了會影響上一個專案每天看到的提醒，要使用者說。

③ limit-guard 的「其他帳號還有多少」（`otherAccounts`）也是用 `CLAUDE_CONFIG_DIR` 認現在的帳號：在桌面 app 會把預設資料夾的帳號當成「現在的」、把真正在用的那個列成「其他帳號」。
   建議照 dash 這次的做法（桌面 app 用 `CLAUDE_CODE_USER_EMAIL`）。

④ 舊的錯資料：修好之前，桌面 app 把帳號 A 的額度寫進了帳號 B 的 `limits/<email>.json`。那個檔要等帳號 B 的對話下一次量到額度才會蓋掉；在那之前，帳號頁與 limit-guard 看到的帳號 B 是錯的數字。不用動，等它自己蓋過去就好。
