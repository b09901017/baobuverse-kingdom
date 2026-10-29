# 02 limit-guard：剛開對話不亂喊快用完、桌面 app 認對帳號

Status: todo
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
