// 一鍵平分（有人要還我），和 core 裡面分錢共用的整數除法：金額只用整數，零頭照規則給某一份。

import type { Amount } from "./model";

/**
 * 把 amount 平分成 ways 份，除不盡的零頭算自己（第 0 份）。
 * 例：1,000 分 3 份 → [334, 333, 333]；app 用 amount − 自己那份當作待收。
 */
export function splitEvenly(amount: Amount, ways: number): readonly Amount[] {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError(`金額要是整數：${amount}`);
  if (!Number.isSafeInteger(ways) || ways < 1) throw new RangeError(`人數要是正整數：${ways}`);
  const each = quotient(amount, ways);
  return Array.from({ length: ways }, (_, i) => (i === 0 ? amount - each * (ways - 1) : each));
}

/** 整數的無條件捨去除法（都不是負數）。用 % 算，不經過小數 */
export function quotient(dividend: number, divisor: number): number {
  return (dividend - (dividend % divisor)) / divisor;
}

/**
 * 照份數分：每份先捨去，零頭全給 remainderTo 那一份（共付的零頭算誰出、退款照原本的分法沖回）。
 * 份數是正整數；remainderTo 不在裡面時給第一份。
 */
export function splitByWeights<K>(amount: Amount, weights: readonly (readonly [K, number])[], remainderTo: K): Map<K, Amount> {
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  const shares = new Map<K, Amount>();
  let given = 0;
  for (const [key, w] of weights) {
    const share = total === 0 ? 0 : quotient(amount * w, total);
    shares.set(key, (shares.get(key) ?? 0) + share);
    given += share;
  }
  const first = weights[0];
  const target = shares.has(remainderTo) ? remainderTo : first?.[0];
  if (target !== undefined) shares.set(target, (shares.get(target) ?? 0) + amount - given);
  return shares;
}

/** 按月攤：平均分成 months 份，零頭從前面幾個月各放 1 元 */
export function splitMonthly(amount: Amount, months: number): readonly Amount[] {
  const each = quotient(amount, months);
  const extra = amount - each * months;
  return Array.from({ length: months }, (_, i) => each + (i < extra ? 1 : 0));
}
