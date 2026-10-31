import type { Account, AccountId, EventId } from "@baobu/core";
import { useState, type FormEvent } from "react";
import { balanceText } from "../accounts";
import { DeleteArea, ErrorList, RecordHead, WhenFields, storeEvent } from "../components/RecordParts";
import { buildReconciliation, checkReconcileForm, defaultReconcile, reconcilePreview, type ReconcileForm as Form } from "../reconcile";
import type { Screen } from "./Treasury";

/** 對帳（新的）：從帳戶詳情進來。投資帳戶不對帳；別人的帳戶沒有餘額，也不對帳 */
export function ReconcileScreen({ id, screen }: { id: AccountId; screen: Screen }) {
  const { me, catalog, back } = screen;
  const account = catalog.accounts.find((a) => a.id === id);
  if (account === undefined || !canReconcile(account, me)) {
    return (
      <>
        <button type="button" className="plain back" onClick={back}>
          ← 返回
        </button>
        <p>這個帳戶不能對帳。</p>
      </>
    );
  }
  return <ReconcileForm screen={screen} account={account} initial={defaultReconcile(id, new Date())} />;
}

/** 看得到餘額的（主人有我）、不是投資的帳戶才對帳 */
export const canReconcile = (account: Account, me: Screen["me"]): boolean => account.owners.includes(me) && account.kind !== "investment";

export function ReconcileForm({ screen, account, initial, editing }: { screen: Screen; account: Account; initial: Form; editing?: EventId }) {
  const { me, catalog, events, book, back } = screen;
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<readonly string[]>([]);
  // 新的一筆排在現在：開著表單時數字變了也對得上；改一筆用原本記下來的時間
  const [openedAt] = useState(() => Date.now());
  const existing = editing === undefined ? undefined : events.find((e) => e.id === editing);
  const credit = account.kind === "credit-card";
  const preview = reconcilePreview(form, account, { catalog, events, recordedAt: existing?.recordedAt ?? openedAt, ...(editing === undefined ? {} : { self: editing }) });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = checkReconcileForm(form, account);
    setErrors(found);
    if (found.length > 0) return;
    const event = buildReconciliation(form, account, { id: crypto.randomUUID() as EventId, me, now: Date.now(), ...(existing === undefined ? {} : { existing }) });
    const problems = storeEvent(screen, event, editing === undefined ? "對好了" : "改好了");
    setErrors(problems);
    if (problems.length > 0) return;
    back();
  };

  return (
    <form onSubmit={submit} className="form record">
      <RecordHead title={editing === undefined ? `對帳：${account.name}` : `改這次對帳：${account.name}`} editing={editing !== undefined} onBack={back} />
      {editing === undefined && <p className="muted">現在算出來 {balanceText(account, book.total({ measure: "balance", where: { account: account.id } }))}</p>}

      <label>
        {credit ? (form.overpaid ? "多繳了多少" : "現在欠多少") : "實際餘額"}
        <input className="amount" value={form.actual} onChange={(e) => setForm((f) => ({ ...f, actual: e.target.value }))} inputMode={credit ? "numeric" : "text"} autoComplete="off" placeholder="0" autoFocus={editing === undefined} />
      </label>

      {credit && (
        <label className="check">
          <input type="checkbox" checked={form.overpaid} onChange={(e) => setForm((f) => ({ ...f, overpaid: e.target.checked }))} />
          這張卡多繳了（銀行要還我）
        </label>
      )}

      <p className={preview.opening || preview.diff === 0 || preview.diff === undefined ? "preview" : "preview off"} role="status">
        {preview.text}
      </p>

      <WhenFields date={form.date} time={form.time} onChange={(change) => setForm((f) => ({ ...f, ...change }))} />

      <p className="muted hint">差額不算支出也不算收入，另外列在帳戶頁下面。差 0 也存一下，「幾天沒對帳」才會歸零。</p>

      <ErrorList errors={errors} />

      <button type="submit" className="primary save-bar">
        {editing === undefined ? "對好了" : "存"}
      </button>

      {editing !== undefined && <DeleteArea id={editing} what="這次對帳" screen={screen} onError={setErrors} />}
    </form>
  );
}
