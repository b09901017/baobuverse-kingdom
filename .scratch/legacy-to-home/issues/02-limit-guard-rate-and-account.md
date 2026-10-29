# 02 limit-guard：剛開對話不亂喊快用完、桌面 app 認對帳號

Status: done
Type: task
Blocked by: —

## 動工前先讀

- [`../spec.md`](../spec.md)「行為會變的」
- `.scratch/dash-desktop/issues/01-dash-desktop.md` 底下「中途發現」② ③（含建議）與「三、額度預報」
- `~/.claude/mods/limit-guard/hooks/advice.ts`（`forecastOf`、速度的算法）、`hooks/register.ts`（`otherAccounts` `:76-104`）
- 儀表板認帳號的做法：`~/.claude/mods/dash/hooks/register.tsx` 的 `refreshAccounts`（桌面 app 用 `CLAUDE_CODE_USER_EMAIL`，客廳 `b923ca8`）

## 使用者要的

儀表板那一輪的中途發現 ②（剛開對話就喊快用完）與 ③（桌面 app 認錯帳號）要不要一起修：

> 好，併進去

> 沒辦法vscode 看到vscode的，桌面app看到桌面的嗎? 不然limit-guard都會誤報

## 為什麼會這樣

- ②：速度是 `max(最近 10 分鐘, 最近 30 分鐘)`，而「最近 10 分鐘」只要 3 分鐘的取樣、漲 1% 就算數。對話剛開的幾分鐘（讀一堆檔、開 subagent）漲得快，
  被外推成「每 10 分鐘 +9.3%」，額度才用幾 % 就說「01:45 用完」（10/29 截圖）。
- ③：`otherAccounts` 用 `CLAUDE_CONFIG_DIR` 認「現在是哪個帳號」（`register.ts:82-83`）。桌面 app 不設它，所以把預設資料夾的帳號當成現在的、
  把真正在用的帳號列成「其他帳號」。（過了重置時間的舊數字已經當成 0，`:94`，那部分沒錯。）

## 做法

1. ②：只改「已用的 % 低」（**嚴格小於 20%**；`advice.test.ts:26` 在剛好 20% 時期望 short，20% 以上的行為一個字都不變）時的速度：
   10 分鐘那段與 30 分鐘那段**都要**取樣夠長才算（例如 30 分鐘那段至少 15 分鐘；現在只要 4 分鐘，`advice.ts:63`），不夠就改用整個 5 小時視窗的平均。
   只拉長 10 分鐘那段不夠：30 分鐘那段一樣會被開場 4 分鐘外推成 short（過目抓到的）。實際選的寫進「做完時留下的」。
2. ③：桌面 app 的對話（`CLAUDE_CODE_ENTRYPOINT=claude-desktop`）用 `CLAUDE_CODE_USER_EMAIL` 認現在的帳號，跟儀表板同一個認法；
   VS Code、終端機照舊用 `CLAUDE_CONFIG_DIR`。
3. 「其他帳號」以 **email** 為單位，同一個 email 只算一次（兩個資料夾登入同一個帳號時，現在會列兩次）。
   03 會把 `account1` 改成 `switchable: true`，之後 `otherAccounts` 不再跳過它（`register.ts:87`）：測試照「改之後的 `accounts.json`」寫。

## 判準

- 已用 5%、對話開了 4 分鐘、這 4 分鐘漲了 3%、距離重置還有 200 分鐘：預報會不會說「重置前會用完」？（不應該）
- 已用 60%、最近 10 分鐘漲了 10%、距離重置還有 60 分鐘：預報會不會跟改之前一樣？（應該一樣，不能把真的快用完的也壓下去）
- 剛好 20%：跟改之前一樣嗎？（`advice.test.ts:26`）
- 桌面 app 登入帳號 A、預設資料夾登入帳號 B：「其他帳號」會不會把 A 列進去？會不會漏掉 B？
- VS Code（有 `CLAUDE_CONFIG_DIR`）、`accounts.json` 跟今天一樣：「其他帳號」的結果跟改之前逐條相同嗎？

## 規矩

跟 03 同一段做。改 mods 的規矩照 HANDOFF「每一段共同的規矩」（既有測試不改全過、新測試先紅後綠、tsc、validate、複製進客廳、推）。
②會改上一個專案每天看到的提醒：這是使用者點過頭的，「做完時留下的」寫清楚改前改後的差別。

## 做完時留下的（2026-10-29，段 2）

改 `~/.claude/mods/limit-guard`，複製進客廳（客廳 `8419bac`，已推；客廳 `mods/limit-guard` 跟 `~/.claude/mods/limit-guard` 逐檔相同）。

### ② 速度

- 已用的 % **嚴格小於 20** 時：10 分鐘那段要 **8 分鐘**、30 分鐘那段要 **15 分鐘**的取樣才算（原本 3、4 分鐘），兩段都不夠就用整個 5 小時視窗的平均（`advice.ts` 的 `LOW_PCT`）。20% 以上一個字都不變。
- 改前改後（使用者每天看到的差別）：提醒只在 94% 以上才塞給 Claude，所以 **20% 以下不會多塞或少塞任何提醒**；變的只有儀表板「5 小時」那一行的預報。
  改之前：對話剛開、取樣 3～4 分鐘就外推，才用幾 % 就寫「約 01:45 用完」；改之後：前 8～15 分鐘寫「照這 5 小時的平均…用得完」（或速度量不出來），取樣夠長之後才看最近的速度。

### ③ 其他帳號（以 email 為單位）

- 讀帳號那段搬到新檔 `hooks/accounts.ts`，吃一個小的 `Io`（環境變數、讀檔、現在時間），測試直接餵假的。
  （引擎規定 `$.env.get` 要寫字面上的名字，所以 `register.ts` 先讀好五個環境變數再交給它。）
- 認現在的帳號：桌面 app（`CLAUDE_CODE_ENTRYPOINT=claude-desktop`）用 `CLAUDE_CODE_USER_EMAIL`；VS Code、終端機用 `CLAUDE_CONFIG_DIR` 那個資料夾登入的 email——跟儀表板的 `desktopEmail`／`keyForDir` 同一個認法，03 照用。
- 「其他帳號」：現在的帳號登入的 email 不算；同一個 email 只算一次（比對不分大小寫，留第一個資料夾）；沒登入的資料夾照舊一個資料夾一列；`switchable: false` 照舊跳過。

**跟 issue 寫的不同的地方**

1. 判準 5（VS Code、`accounts.json` 跟今天一樣，逐條相同）：**各資料夾登入不同 email 時**逐條相同（測試拿改之前的 `otherAccounts` 比，10 種組合）。
   但今天的 `accounts.json` 有兩個資料夾登入**同一個** email：VS Code 用其中一個時，改之前會把另一個（＝同一個帳號）列成「其他帳號」，改之後不列。這就是做法 3 要修的，不是退步。
2. 抽出 `hooks/accounts.ts`（issue 沒寫）：測試的 `$` 不能直接呼叫模組裡的函式。

**判準**

| 判準 | 結果 |
|---|---|
| 已用 5%、開了 4 分鐘、漲 3%、距離重置 200 分鐘：會說重置前用完嗎 | 不會：改用視窗平均，到重置約 15%（`ok`）；改之前是 `short`（`low-rate.test.ts`） |
| 已用 60%、最近 10 分鐘漲 10%、距離重置 60 分鐘：跟改之前一樣嗎 | 一樣（`toEqual` 改之前的 `forecastOf`），照樣 `short` |
| 剛好 20%：跟改之前一樣嗎 | 一樣：20、20.5、35、60、93、94、97 × 4 種重置時間 × 7 種取樣逐條相同；`advice.test.ts:26` 沒改照過 |
| 桌面 app 登入 A、預設資料夾登入 B：會把 A 列進去、漏掉 B 嗎 | 不會（`other-accounts.test.ts`，兩個方向都測；email 大小寫不同也認得） |
| VS Code、`accounts.json` 跟今天一樣：逐條相同嗎 | 各資料夾不同 email 時相同；同一個 email 的見上面第 1 點 |

驗證：`claude plugin test limit-guard` 51 過（基準 30 一條沒改＋新 21）、`tsc` 0 錯、`claude plugin validate` 過（警告只有原本的「沒有 author」）。
新測試對改之前的程式跑會紅 7 條（速度 2、帳號 5），改之後全綠。
