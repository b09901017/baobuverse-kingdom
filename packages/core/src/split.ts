// 一鍵平分（有人要還我）。規則的實作在 issue 04。

import type { Amount } from "./model";

/**
 * 把 amount 平分成 ways 份，除不盡的零頭算自己（第 0 份）。
 * 例：1,000 分 3 份 → [334, 333, 333]；app 用 amount − 自己那份當作待收。
 */
export function splitEvenly(amount: Amount, ways: number): readonly Amount[] {
  throw new Error("還沒做：issue 04");
}
