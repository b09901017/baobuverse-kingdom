// 部署腳本的檢查（issue 06 判準）：目標是 baobu-app 時一定拒絕；不寫 site 也拒絕。不用模擬器。

import { describe, expect, it } from "vitest";
import firebasercText from "../../../.firebaserc?raw";
import firebaseJsonText from "../../../firebase.json?raw";
import { planDeploy } from "../scripts/deploy-plan";

const firebaserc: unknown = JSON.parse(firebasercText);
const firebaseJson: unknown = JSON.parse(firebaseJsonText);

const hostingWith = (site: Record<string, unknown>) => ({ ...(firebaseJson as object), hosting: site });

describe("部署的目標", () => {
  it("repo 現在的設定：部署到 baobu-kingdom，明寫專案與要部署的東西", () => {
    expect(planDeploy({ firebaserc, firebaseJson, args: [] })).toEqual({
      ok: true,
      firebaseArgs: ["deploy", "--project", "baobu-kingdom", "--only", "hosting,firestore:rules,firestore:indexes"],
    });
  });

  it("--dry-run 照樣帶過去", () => {
    const plan = planDeploy({ firebaserc, firebaseJson, args: ["--dry-run"] });
    expect(plan.ok && plan.firebaseArgs.at(-1)).toBe("--dry-run");
  });

  it(".firebaserc 指到 baobu-app：拒絕", () => {
    const plan = planDeploy({ firebaserc: { projects: { default: "baobu-app" } }, firebaseJson, args: [] });
    expect(plan.ok).toBe(false);
  });

  it(".firebaserc 多一個 baobu-app 的別名：拒絕", () => {
    const plan = planDeploy({
      firebaserc: { projects: { default: "baobu-kingdom", diary: "baobu-app" } },
      firebaseJson,
      args: [],
    });
    expect(plan.ok).toBe(false);
  });

  it("hosting 的 site 是 baobu-app、或沒寫 site：拒絕", () => {
    const { site: _, ...noSite } = (firebaseJson as { hosting: Record<string, unknown> }).hosting;
    expect(planDeploy({ firebaserc, firebaseJson: hostingWith({ ...noSite, site: "baobu-app" }), args: [] }).ok).toBe(false);
    expect(planDeploy({ firebaserc, firebaseJson: hostingWith(noSite), args: [] }).ok).toBe(false);
  });

  it("從外面帶 --project baobu-app 或別的參數：拒絕", () => {
    expect(planDeploy({ firebaserc, firebaseJson, args: ["--project", "baobu-app"] }).ok).toBe(false);
    expect(planDeploy({ firebaserc, firebaseJson, args: ["-P", "other"] }).ok).toBe(false);
    expect(planDeploy({ firebaserc, firebaseJson, args: ["--only", "hosting"] }).ok).toBe(false);
  });

  it("其他設定裡出現 baobu-app：拒絕", () => {
    const plan = planDeploy({
      firebaserc,
      firebaseJson: { ...(firebaseJson as object), firestore: { database: "(default)", project: "baobu-app" } },
      args: [],
    });
    expect(plan.ok).toBe(false);
  });
});
