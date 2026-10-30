// 部署前的檢查（issue 06）：目標一定是 baobu-kingdom，國王日記的 baobu-app 絕對不部署。
// 只做判斷、不碰檔案與指令，測試在 test/deploy.test.ts；真的部署是 scripts/deploy.mjs。

export const TARGET = "baobu-kingdom";
/** 國王日記的專案：出現在任何地方都拒絕 */
export const FORBIDDEN = "baobu-app";
/** 網站、規則、索引一起部署，規則跟網站不會不同步 */
export const ONLY = "hosting,firestore:rules,firestore:indexes";

export interface DeployInput {
  /** .firebaserc 的內容 */
  readonly firebaserc: unknown;
  /** firebase.json 的內容 */
  readonly firebaseJson: unknown;
  /** 跑腳本時多帶的參數：只收 --dry-run */
  readonly args: readonly string[];
}

export type DeployPlan =
  | { readonly ok: true; readonly firebaseArgs: readonly string[] }
  | { readonly ok: false; readonly problems: readonly string[] };

export function planDeploy({ firebaserc, firebaseJson, args }: DeployInput): DeployPlan {
  const problems: string[] = [];

  if (JSON.stringify([firebaserc, firebaseJson, args]).includes(FORBIDDEN)) {
    problems.push(`設定或參數裡出現國王日記的專案 ${FORBIDDEN}，絕對不部署到那裡`);
  }

  const projects = values(field(firebaserc, "projects"));
  if (projects.length === 0) problems.push(".firebaserc 沒有寫專案");
  for (const project of projects) {
    if (project !== TARGET) problems.push(`.firebaserc 裡有 ${TARGET} 以外的專案：${String(project)}`);
  }

  const hosting = field(firebaseJson, "hosting");
  const sites = hosting === undefined ? [] : Array.isArray(hosting) ? hosting : [hosting];
  if (sites.length === 0) problems.push("firebase.json 沒有 hosting");
  for (const site of sites) {
    // 沒寫 site 就會部署到「目前專案」的預設網址：要寫明
    const name = field(site, "site");
    if (name !== TARGET) problems.push(`firebase.json 的 hosting.site 要寫 ${TARGET}，現在是 ${String(name)}`);
  }

  // 專案、要部署什麼由腳本決定，不從外面改
  const unknown = args.filter((arg) => arg !== "--dry-run");
  if (unknown.length > 0) problems.push(`只收 --dry-run，不收：${unknown.join(" ")}`);

  if (problems.length > 0) return { ok: false, problems };
  const dryRun = args.includes("--dry-run") ? ["--dry-run"] : [];
  return { ok: true, firebaseArgs: ["deploy", "--project", TARGET, "--only", ONLY, ...dryRun] };
}

function field(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>)[key] : undefined;
}

function values(value: unknown): unknown[] {
  return typeof value === "object" && value !== null ? Object.values(value) : [];
}
