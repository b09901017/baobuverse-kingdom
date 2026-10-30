import { describe, expect, it } from "vitest";
import { splitEvenly } from "./index";

describe("一鍵平分（有人要還我）", () => {
  it("除不盡的零頭算自己：1,000 元 3 人平分 → 自己 334、朋友各 333", () => {
    expect(splitEvenly(1000, 3)).toEqual([334, 333, 333]);
  });

  it("除得盡就每人一樣：聚餐 2,000、4 人平分 → 各 500", () => {
    expect(splitEvenly(2000, 4)).toEqual([500, 500, 500, 500]);
  });

  it("零頭不只 1 元也全算自己：1,002 元 4 人 → 自己 252", () => {
    expect(splitEvenly(1002, 4)).toEqual([252, 250, 250, 250]);
  });

  it("金額或人數不是正整數就拒絕（金額不用小數）", () => {
    expect(() => splitEvenly(100.5, 2)).toThrow(RangeError);
    expect(() => splitEvenly(100, 0)).toThrow(RangeError);
  });
});
