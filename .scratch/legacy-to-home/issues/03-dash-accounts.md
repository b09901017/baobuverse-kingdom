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
