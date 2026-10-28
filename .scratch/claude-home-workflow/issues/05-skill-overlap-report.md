# 05 37 支 skill 的重疊與衝突（只提建議）

Status: done
Type: research
Blocked by: 02

## 使用者要的

`docs/plan.md`「Skill」：使用者的原則是**有用、但不重複**。

## 為什麼

repo 裡有幾組看起來做同一件事：`grill-me`／`grilling`／`grill-with-docs`、`implement`／`implement-spec`、
`codebase-design`／`improve-codebase-architecture`、`handoff` 與 kickoff 的開場、`to-spec`／`to-tickets` 與 kickoff 的 issue。
另外上一個專案用過的 `frontend-design` 已經被 `impeccable` 取代（plan 已記）。

## 要交的

在 `HANDOFF.md` 的「要使用者決定的」加一題：每一組重疊的 skill，說它們差在哪、建議留哪支或兩支都留的理由。
**不刪任何 skill**（Matt 整套是使用者的決定）。

## 判準

- 每一組都講得出「什麼情況用 A、什麼情況用 B」，或明說它們真的重複？
- 建議是一題一個、使用者可以只回「照建議」？

## 做完時留下的

- 報告在 [`HANDOFF.md`](../HANDOFF.md)「要使用者決定的」→「skill 重疊（issue 05，段 2）：一組一題」，九組，每組一題、附建議，使用者可以只回「照建議」。
- 結論：沒有一組該刪。Matt 那些流程型 skill 都是 `disable-model-invocation: true`（description 不進 context，零成本，skill-checklist C1），留著不花任何東西。
- 真的會搶觸發的只有 `impeccable`／`frontend-design`（兩支模型都能叫、都管 UI 設計，B9）。建議用 `skillOverrides` 關 `frontend-design`（C6），等使用者說好。
- 比 issue 列的多看了三組：`matt-code-review`／內建 `/code-review`、`claude-md`／`writing-for-agents`、`research`／`deep-research`。
- 兩支超過 500 行的上游 skill（`graphify`、`firestore-rules-creation`）記成「不改」：改了每次同步上游都要重做。
- 沒刪、沒改任何 skill。
