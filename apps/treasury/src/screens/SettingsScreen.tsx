import { useState, type ChangeEvent } from "react";
import { KIND_LABEL, myAccounts, othersAccounts } from "../accounts";
import { signOut } from "../auth";
import { KINGDOM_ID, db } from "../firebase";
import { LAUNCHED } from "../launch";
import { parsePresets, type Presets } from "../presets";
import { problemTexts } from "../problems";
import { RESET_DELETES, RESET_KEEPS, clearLocalCache, resetMine } from "../reset";
import { routeHash } from "../route";
import { applyPresets, savePresets } from "../store";
import type { Screen } from "./Treasury";

export function SettingsScreen({ screen }: { screen: Screen }) {
  const { me, session, catalog } = screen;
  const myName = catalog.people.find((p) => p.id === me)?.name;
  const others = catalog.people.filter((p) => p.id !== me);
  const accounts = othersAccounts(catalog, me);

  return (
    <>
      <h2>設定</h2>

      <section className="panel">
        <h3>登入</h3>
        <p>
          {session.name ?? "已登入"}
          {myName && `（${myName}）`}
        </p>
        <button type="button" onClick={() => void signOut()}>
          登出
        </button>
      </section>

      {others.map((person) => {
        const theirs = accounts.filter((a) => a.owners.includes(person.id));
        return (
          <section className="panel" key={person.id}>
            <h3>{person.name}的帳戶</h3>
            <p className="muted hint">幫{person.name}記時選得到這些帳戶。這裡看不到餘額，也沒有備註。</p>
            {theirs.length === 0 && <p className="muted">還沒有</p>}
            <ul className="rows">
              {theirs.map((account) => (
                <li key={account.id}>
                  <a className="row" href={routeHash({ name: "account", id: account.id })}>
                    <span>{account.name}</span>
                    <span className="muted">
                      {KIND_LABEL[account.kind]}
                      {account.archived && " · 封存了"}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <a className="button" href={routeHash({ name: "newAccount", owner: person.id })}>
              ＋ 新增{person.name}的帳戶
            </a>
          </section>
        );
      })}

      {!LAUNCHED && (
        <section className="panel">
          <h3>預設資料</h3>
          <ImportPresets screen={screen} />
          <ApplyPresets screen={screen} />
        </section>
      )}

      {!LAUNCHED && (
        <section className="panel">
          <h3>重置</h3>
          <Reset screen={screen} />
        </section>
      )}
    </>
  );
}

/** 選檔匯入預設（上線前才有）：檢查、預覽幾個，按確定才存；存了也還沒套用，數字不會變 */
function ImportPresets({ screen }: { screen: Screen }) {
  const { me, catalog, presets, notify, fail } = screen;
  const [errors, setErrors] = useState<readonly string[]>([]);
  const [preview, setPreview] = useState<Presets>();

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同一個檔改完可以再選一次
    setPreview(undefined);
    setErrors([]);
    if (file === undefined) return;
    let raw: unknown;
    try {
      raw = JSON.parse(await file.text());
    } catch {
      setErrors(["這個檔不是 JSON，打不開（什麼都沒有存）"]);
      return;
    }
    const parsed = parsePresets(raw, me, catalog.people.map((p) => p.id));
    if (parsed.ok) setPreview(parsed.presets);
    else setErrors(parsed.errors);
  };

  const confirm = () => {
    if (preview === undefined) return;
    // 不等網路：存到之後監聽會回來，「套用預設」就出現
    savePresets(db, KINGDOM_ID, me, preview).catch((e: Error) => fail(`預設資料沒有存到：${e.message}`));
    setPreview(undefined);
    notify("匯入了，還沒套用");
  };

  return (
    <>
      {presets !== null && <p className="muted hint">已經匯入過（{presets.asOf} 的數字）。再選一次檔案會蓋掉那一份。</p>}
      <label className="button">
        選檔匯入預設
        <input type="file" accept=".json,application/json" className="hidden-input" onChange={(e) => void pick(e)} />
      </label>
      {errors.length > 0 && (
        <div role="alert">
          <p className="error">這個檔有問題，什麼都沒有存：</p>
          <ul className="errors">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {preview !== undefined && (
        <div className="confirm-box">
          <p>
            {preview.accounts.length} 個帳戶、{preview.jars.length} 個罐子、{preview.tags.length} 個標籤、{preview.transfers.length} 筆投入（{preview.asOf} 的數字）。
          </p>
          <button type="button" onClick={() => setPreview(undefined)}>
            取消
          </button>{" "}
          <button type="button" className="primary" onClick={confirm}>
            確定匯入
          </button>
        </div>
      )}
    </>
  );
}

/** 「套用預設」：上線前、沒有任何自己的帳戶、匯入過才出現（issue 03） */
export function ApplyPresets({ screen }: { screen: Screen }) {
  const { me, catalog, events, presets, notify, fail } = screen;
  if (LAUNCHED || presets === null || myAccounts(catalog, me).length > 0) return null;

  const apply = () => {
    const result = applyPresets(db, KINGDOM_ID, me, presets, { catalog, events }, Date.now());
    if (!result.ok) {
      fail(`套用不了：${problemTexts(result.problems).join("；")}`);
      return;
    }
    // 不等網路；錯誤訊息已經是白話（可能已經套用過了）
    result.written.catch((e: Error) => fail(e.message));
    notify("套用了");
  };

  return (
    <button type="button" className="primary" onClick={apply}>
      套用預設
    </button>
  );
}

/** 上線前的一鍵重置（issue 06）：上線後（launch.ts）整個不出現 */
function Reset({ screen }: { screen: Screen }) {
  const { me } = screen;
  const [step, setStep] = useState<"idle" | "confirm" | "working">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const reset = async () => {
    setStep("working");
    setMessage(null);
    let count: number;
    try {
      count = await resetMine(db, KINGDOM_ID, me);
    } catch (e) {
      setStep("confirm");
      setMessage(`沒有刪任何東西（要有網路才能重置）：${(e as Error).message}`);
      return;
    }
    try {
      await clearLocalCache(db);
    } catch {
      setMessage(
        `雲端的 ${count} 份已經刪了，但這台裝置的離線資料沒清掉（其他分頁也開著國庫）。關掉其他分頁、重新整理，再按一次重置。`,
      );
      return;
    }
    location.reload();
  };

  if (step === "idle") {
    return (
      <button type="button" onClick={() => setStep("confirm")}>
        一鍵重置（上線前才有）
      </button>
    );
  }
  return (
    <div className="confirm" role="alertdialog" aria-labelledby="reset-title">
      <p id="reset-title">
        <strong>確定要重置嗎？刪了就救不回來。</strong>
      </p>
      <p>會刪掉：</p>
      <ul>
        {RESET_DELETES.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>會留著：{RESET_KEEPS.join("、")}。</p>
      <button type="button" disabled={step === "working"} onClick={() => setStep("idle")}>
        取消
      </button>{" "}
      <button type="button" className="danger" disabled={step === "working"} onClick={() => void reset()}>
        {step === "working" ? "刪除中…" : "確定刪掉"}
      </button>
      {message && <p className="error">{message}</p>}
    </div>
  );
}
