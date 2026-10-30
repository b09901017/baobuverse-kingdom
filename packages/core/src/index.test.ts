import { describe, expect, it } from "vitest";
import { coreReady } from "./index";

describe("core", () => {
  it("接好了：測試跑得到 core", () => {
    expect(coreReady).toBe(true);
  });
});
