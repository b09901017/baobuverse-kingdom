// 網址的 # 與畫面上的字（issue 04）。不用模擬器。

import type { AccountId, Event, EventId, PersonId, Problem } from "@baobu/core";
import { describe, expect, it } from "vitest";
import { dateOf, dayLabel, daysBetween, money, timeOf } from "../src/format";
import { problemTexts, unsettled } from "../src/problems";
import { parseRoute, routeHash, type Route } from "../src/route";

describe("網址", () => {
  it.each<Route>([
    { name: "accounts" },
    { name: "flow" },
    { name: "flow", account: "a b/c" as AccountId },
    { name: "settings" },
    { name: "account", id: "a b/c" as AccountId },
    { name: "newAccount" },
    { name: "newAccount", owner: "bao" as PersonId },
    { name: "record" },
    { name: "edit", event: "a b/c" as EventId },
    { name: "refund", event: "a b/c" as EventId },
    { name: "reconcile", account: "a b/c" as AccountId },
  ])("存得進去、讀得回來：%j", (route) => {
    expect(parseRoute(routeHash(route))).toEqual(route);
  });
  it("空的、不認得的、少 ID 的都回帳戶頁", () => {
    expect(parseRoute("")).toEqual({ name: "accounts" });
    expect(parseRoute("#/nope")).toEqual({ name: "accounts" });
    expect(parseRoute("#/account/")).toEqual({ name: "accounts" });
  });
});

describe("數字與日期", () => {
  it("錢", () => {
    expect(money(0)).toBe("0");
    expect(money(1_234)).toBe("1,234");
    expect(money(-1_234)).toBe("−1,234");
  });
  it("當地日期、時間補零", () => {
    const at = new Date(2026, 0, 5, 7, 9);
    expect(dateOf(at)).toBe("2026-01-05");
    expect(timeOf(at)).toBe("07:09");
  });
  it("過了幾天：跨月、早的是負的", () => {
    expect(daysBetween("2026-10-31", "2026-11-01")).toBe(1);
    expect(daysBetween("2026-11-01", "2026-10-31")).toBe(-1);
    expect(daysBetween("2026-01-01", "2027-01-01")).toBe(365);
  });
  it("星期", () => {
    expect(dayLabel("2026-10-31")).toBe("10/31（六）");
  });
});

describe("問題的白話", () => {
  const problem = (event: string, code: Problem["code"]): Problem => ({ event: event as EventId, code });
  it("畫面上不會出現代碼，重複的只留一句", () => {
    const texts = problemTexts([problem("a", "amount-invalid"), problem("b", "amount-invalid"), problem("a", "refund-target")]);
    expect(texts).toHaveLength(2);
    for (const text of texts) expect(text).not.toMatch(/[a-z]-[a-z]/);
  });
  it("沒算進去的：是哪一則、什麼原因", () => {
    const events = [{ id: "a", date: "2026-10-01", title: "假早餐" }, { id: "b", date: "2026-10-02" }] as unknown as Event[];
    const list = unsettled([problem("a", "refund-target"), problem("a", "refund-too-big"), problem("b", "no-items"), problem("c", "no-items")], events);
    expect(list.map((x) => x.event)).toEqual(["2026-10-01 假早餐", "2026-10-02 沒有名稱的一筆", "（找不到這一則）"]);
    expect(list[0]?.reasons).toHaveLength(2);
  });
});
