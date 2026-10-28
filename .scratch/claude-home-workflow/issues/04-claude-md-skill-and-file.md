# 04 優化 claude-md skill，並照官方指引改寫這個 repo 的 CLAUDE.md

Status: todo
Type: task
Blocked by: 01, 02, 03

## 使用者要的

> 要更具官方最新的指示去優化skill以及寫claude.md

## 為什麼

- 上一個專案的 `CLAUDE.md` 長到約 7 萬 token，`claude-md` skill 沒擋住它變肥
- 這個 repo 的 `CLAUDE.md` 很短，但缺「什麼情況用哪個流程」（03 定的兩條路）、缺「客廳／.local／機密」三層的一句指路
- `CLAUDE.md` 的「回覆語言」一節是使用者這幾天加的，**保留原意**

## 動工前先讀

01、02 的產出、03 改完的 kickoff、`CLAUDE.md`、`docs/plan.md`、`docs/env-notes.md`

## 做法的方向

- `claude-md` skill 照 02 的清單改：怎麼判斷一條規則該不該進 CLAUDE.md、太肥時怎麼搬出去
- 這個 repo 的 `CLAUDE.md`：只放每次都要的；不違反的規則（README 那幾條、國王日記不寫入）一定留；細節用一行指到文件
- `docs/plan.md` 的「使用者的決定」**不准加 AI 的提議**（CLAUDE.md 自己的規則）

## 判準

- 刪掉的每一條，都還找得到它搬去哪（或為什麼不需要）？
- 「絕對不寫入國王日記」與「轉帳不是支出」等不能違反的規則還在？
- 新 session 只讀 CLAUDE.md，知道早期討論該用 grill-with-docs、一輪改動該用 kickoff 嗎？
