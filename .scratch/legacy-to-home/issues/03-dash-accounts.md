# 03 儀表板帳號頁：同一個帳號一張卡、另一個帳號能在 VS Code 一鍵切

Status: todo
Type: task
Blocked by: —

## 動工前先讀

- [`../spec.md`](../spec.md)「使用者選的答案」第 4 題
- `~/.claude/mods/dash/hooks/register.tsx`：`accountsFile`、`refreshAccounts`、`accountView`、`switchTo`；`tests/desktop.test.tsx`、`tests/switch.test.tsx`、`tests/stale-limits.test.tsx`
- `~/.claude/mods-data/accounts.json`（使用者的資料，不在任何 repo；裡面有 email 與名字，**不要抄進公開 repo**）

## 使用者要的

> 為甚麼帳號都寫[帳號 B] ? 之後會改嗎

第 4 題（另一個帳號的資料夾要不要能在 VS Code 一鍵切）：「都照建議」＝**要**。

## 為什麼會這樣

- 帳號頁是「`accounts.json` 的一個資料夾一張卡」。預設資料夾（`~/.claude`）與 `account2` 資料夾登入的是同一個帳號，所以出現兩張一樣的。
- 另一個帳號的資料夾（`account1`）在 `accounts.json` 是 `switchable: false`（標成「終端機 claude1」），所以不出現在切換清單，
  只有剛好在用它的時候才看得到。

## 做法

1. 帳號頁以 **email** 為單位：同一個 email 的幾個資料夾合成一張卡。按鈕切到哪個資料夾：選「VS Code 下一個新對話已經在用的那個」，沒有就選第一個；寫進「做完時留下的」。
   「這個對話」「VS Code 新對話」的標籤照舊。
2. 第 4 題：`accounts.json` 的 `account1` 改成 `switchable: true`。這是 `~/.claude/mods-data/` 裡的使用者資料，改之前先備份一份到 scratchpad；
   不進任何 repo。
3. 讀不到 email 的資料夾（沒登入）照舊一張卡、寫「沒有登入資訊」。

## 判準

- 兩個資料夾登入同一個 email：帳號頁會不會出現兩張卡？
- 合成一張之後，按「用 X 開新對話」會不會切到一個沒登入、或跟 VS Code 現在用的不同的資料夾，害 VS Code 多換一次？
- 桌面 app 與 VS Code：現在的帳號、「VS Code 新對話」標籤、過了重置時間顯示「已重置」，跟改之前一樣嗎？
- `switchable: true` 之後，VS Code 的「切換」會不會把 `CLAUDE_CONFIG_DIR` 寫成 `account1` 的資料夾（`switchTo` 的路徑格式跟另外兩個一樣）？

## 規矩

跟 02 同一段做（都是「以 email 為單位」，認法要一致）。改 mods 的規矩照 HANDOFF「每一段共同的規矩」。
判準 1、2、4 照 `tests/desktop.test.tsx`、`tests/switch.test.tsx` 的做法 mock 自動測；判準 3 靠截圖。這一支會改到 VS Code 的畫面（上一個專案也看得到）：只有「合成一張卡」與「多一個可以切的帳號」兩處。
畫面改了要截圖：電腦操作不能控制 Claude 自己的視窗，截圖請使用者點（主控安排，見主控記憶 `desktop-ui-check-needs-user-clicks`）。

## 做完時留下的（2026-10-29，段 2；**截圖還沒看，03 還不算 done**）

改 `~/.claude/mods/dash`，複製進客廳（客廳 `06369c8`，已推；客廳 `mods/` 跟 `~/.claude/mods` 逐檔相同）。`~/.claude/mods-data/accounts.json` 照第 4 題改（備份在段 2 的 scratchpad，不進 repo）。

1. **一個 email 一張卡**（`hooks/register.tsx` 的 `accountCards`）：只在帳號頁**畫的時候**合；`acc.list` 本身照舊一個資料夾一列（額度寫進哪個檔的 `recordLimits`、總覽、`switchTo` 都照資料夾認，一個字沒動）。
   - 按鈕切到哪個資料夾：同一個 email 裡 **VS Code 下一個新對話已經在用的那個**（`acc.next`），沒有就切**第一個能切的**（`accounts.json` 的順序）。卡上的 key（`acc-`、`a5-`、`sw-`…）用同一個。
   - 「這個對話」：那個 email 的任何一個資料夾是現在的就標；「VS Code 新對話」／「新對話」同理。額度取那幾個資料夾裡最新記的那份（同一個 email 本來就是同一個檔）。
   - 讀不到 email 的資料夾照舊各自一張卡、寫「（沒有登入資訊）」，不跟別的合。
2. **第 4 題**：`accounts.json` 的 `account1` 從 `switchable: false` 改成 `true`，**只改了那一個字**（跟備份比只差一行）。它的 `label` 還寫著「終端機」，但那個資料夾讀得到 email，畫面上用的是 `names` 的名字，看不到 `label`；`_說明` 是通用說明，沒有提到 account1，沒改。
3. 認帳號的做法跟 02 一致：桌面 app 用 `CLAUDE_CODE_USER_EMAIL`、VS Code 與終端機用 `CLAUDE_CONFIG_DIR` 那個資料夾（`refreshAccounts` 原本就是這樣，沒改）；「同一個帳號」都是比 email、不分大小寫。

**跟 issue 寫的不同的地方**：沒有。issue 說「只有兩處」：合成一張卡、多一個可以切的帳號——總覽那行「新對話會用「X」」沒動（見 HANDOFF 段 2 中途發現 1）。

**判準**

| 判準 | 結果 |
|---|---|
| 兩個資料夾登入同一個 email：會出現兩張卡嗎 | 不會：VS Code、桌面 app 各測一次，那個 email 只出現一次、一個帳號一顆按鈕（`tests/merge-email.test.tsx`） |
| 合成之後按「用 X 開新對話」：會切到沒登入、或跟 VS Code 現在用的不同的資料夾嗎 | 不會：VS Code 新對話用 account2 → 切 account2（設定不變）；用預設資料夾 → 切預設資料夾；用另一個帳號 → 切第一個（預設資料夾）；桌面 app 也測了 |
| 桌面 app 與 VS Code：現在的帳號、「VS Code 新對話」標籤、「已重置」跟改之前一樣嗎 | 自動測試：既有 `desktop.test.tsx`、`stale-limits.test.tsx`、`switch.test.tsx` 一條沒改全過（各資料夾不同 email 時畫面跟改之前一樣）。**截圖待看** |
| `switchable: true` 之後，切換會把 `CLAUDE_CONFIG_DIR` 寫成 account1 的資料夾嗎（路徑格式跟另外兩個一樣） | 會：寫進去的字＝`accounts.json` 的 `configDir` 原字（測試用 Windows 反斜線，跟 account2 同格式）；實際的 `accounts.json` 裡 account1、account2 都是反斜線 |

驗證：`claude plugin test dash` 34 過（基準 27 一條沒改＋新 7）、`tsc` 0 錯、`claude plugin validate` 過（警告只有原本的「沒有 author」）。新的 7 條裡跟合併有關的 5 條在舊程式上會紅（確認過），另外 2 條（另一個帳號的按鈕寫進的路徑、沒登入的資料夾）是改之前就成立、要守住的。

### 要截圖看的（主控請使用者在**新對話**點；mod 在新對話才載入新版）

| # | 在哪 | 怎麼點 | 要看到 |
|---|---|---|---|
| 1 | VS Code 新對話 | 打 `/dash` → 儀表板「帳號」分頁 | **兩張卡**（帳號 A、帳號 B），不是三張；現在的帳號那張標「這個對話」（VS Code 新對話也是它的話標「這個對話 · 新對話」）；另一張有「用「帳號 X」開新對話」的按鈕 |
| 2 | 桌面 app 新對話 | 右邊儀表板 →「帳號」分頁 | **兩張卡**；桌面 app 登入的那張標「這個對話」；VS Code 新對話用的那張標「VS Code 新對話」；按鈕寫「在 VS Code 用「X」開新對話」；底下兩行桌面 app 換帳號的說明還在；卡沒有超出框 |
| 3 | 1、2 都看 | — | 另一個帳號過了 5 小時重置時間的，寫「HH:MM 已重置」、0% |

**按鈕不用按**（按了會改 VS Code 設定、開一個 VS Code 新對話；切換的路徑有自動測試）。
