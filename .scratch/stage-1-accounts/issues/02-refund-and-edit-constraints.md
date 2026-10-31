# 02 core：退款註記查得到、改刪不會讓退款失效、存得進去的帳本一定算

Status: todo
Blocked by: 無

動工前先讀：`../spec.md`；GLOSSARY「退款」；`packages/core/src/validate.ts`（`refund` 那段、`findItem`、`refundedBefore`）；`packages/core/src/ledger.ts`（`refund`、`refundProblems`、`byTime`）；`packages/core/src/book.items.test.ts` 的退款；階段 0 HANDOFF「中途發現 · 段三」第二條。

## 使用者要的

「**退款**：在原來那筆上作註記。」（`docs/plan.md`）
階段表：「退款註記」。流水頁可以改、可以刪是這一輪主控定的（`../spec.md`）。

## 為什麼會這樣

- 退款是一則新事件、指到原本那一項（ADR 0001 第 1 點）；註記要從事件找，core 現在沒有公開的查法（`refundedBefore` 是內部的，也只回傳加總）。
- `validateEvent` 只在存退款時對照原本那項；**反過來存原本那筆時不看退款**。把金額改到比已退的少、把品項拿掉、把日期改到退款之後、把那則刪掉，都存得進去，然後帳本的 `refundProblems` 把退款整則丟進 `problems`，數字默默變了。
- `byTime` 排序時「沒寫時間的排前面」。原本那筆有時間、同一天的退款沒寫時間（或時間比較早）時，退款排在原本那筆前面：`validateEvent` 用 `findItem` 找得到、存得進去，帳本卻 `spent.get` 不到、算 `refund-target`。**存得進去卻不算**。

## 做法

照 `tdd`，一條規則一支測試、先紅後綠。

1. 公開 `refundsOf(events, ref)`（只算已確認的）：回傳每一筆退款的事件 ID、日期、金額；品項的 `refundedAmount` 可以從它加。不改 `Line`（`../spec.md`）。
2. `validateEvent(event, catalog, events)`（給了 events 才檢查）：
   - 存退款：照 `byTime` 的先後，退款要在原本那筆之後，不然 `refund-target`。先後的比較共用 `byTime`（`ledger.ts` 已經 import `validate.ts`，要搬位置的話注意循環）。
   - 存退款：退回的帳戶要是原本那筆誰出的人的（新的 `ProblemCode`）。01 開放帳戶之後 `unknown-ref` 不再擋：步付 1,000、退到寶的帳戶，現在存得進去，步的淨資產少 1,000、寶的多 1,000。
   - 同一則事件裡好幾筆退款指到同一項：加起來不能超過還沒退的（現在是一筆一筆比，60＋60 對 100 存得進去、帳本不算）。
   - 存支出：如果這一則（同 ID）已經被退款：被退的品項要還在、金額不能比已退的少、時間不能晚於最早的那筆退款、誰出與幫誰不能改；不然新的 `ProblemCode`（例如 `refunded-item-changed`）。
     誰出、幫誰也要擋，是因為退款文件的參與者是存退款時算的：幫步改成幫共之後，寶看不到那筆退款，寶的我用的會多算（要改就先刪退款）。
3. 公開一個問「這則能不能刪」的函式（例如 `blockersOfDelete(eventId, events)`，回傳擋著的退款）。畫面照它把刪除按鈕換成說明。
4. 註解、`ProblemCode` 的說明寫白話；`index.ts` 匯出。

## 判準

- 原本那筆 14:00、同一天退款沒寫時間：存得進去嗎？（應該被擋，不是存進去之後不算）
- 原本那筆 1,000 已退 300：改成 200 存得進去嗎？改成 300 呢？（前者擋、後者可以）
- 原本那筆 10/20、10/25 退款：改成 10/26 存得進去嗎？改成 10/25 同一天但時間更晚呢？
- 把已退的品項換成新 ID（等於拿掉）存得進去嗎？
- 有退款的那筆，幫步改成幫共、誰出步改成寶，存得進去嗎？（應該擋）改名稱、罐子、標籤呢？（可以）
- 步付的那筆，退到寶的帳戶存得進去嗎？（應該擋）退到步的另一個帳戶呢？（可以）
- 同一則裡退 60＋60，那項只剩 100 可退：存得進去嗎？（應該擋）
- 有退款的那則能刪嗎？退款先刪掉之後呢？
- 退款改金額時，`refund-too-big` 會不會把自己算進去？（`refundedBefore` 有 `except`，加測試鎖住）
- 這些檢查有沒有影響 `checkForBook`（帳本讀的時候）？已經存進去的舊資料還是算，不會因為新檢查讓帳本丟掉事件。
- `refundsOf` 把收件匣（`pending`）或別項的退款算進來嗎？

## Comments
