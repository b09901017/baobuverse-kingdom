// 「已上線」開關的兩半要一致（issue 06）：launch.ts 的 LAUNCHED 與 firestore.rules 的 canReset()。不用模擬器。

import { expect, it } from "vitest";
import rules from "../../../firestore.rules?raw";
import { LAUNCHED } from "../src/launch";

it("上線前：重置按鈕在、規則讓人刪；上線後：按鈕不在、規則不讓刪", () => {
  const canReset = /function canReset\(\) \{\s*return (true|false);\s*\}/.exec(rules)?.[1];
  expect(canReset, "firestore.rules 找不到 canReset()").toBeDefined();
  expect(canReset === "true").toBe(!LAUNCHED);
});
