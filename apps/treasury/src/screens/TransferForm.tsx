import type { Account, EventId } from "@baobu/core";
import { useState, type FormEvent } from "react";
import { KIND_LABEL, wallOrder } from "../accounts";
import { DeleteArea, ErrorList, RecordHead, RecordTabs, WhenFields, storeEvent, type RecordTab } from "../components/RecordParts";
import { buildTransfer, checkTransferForm, defaultTransfer, sourceOptions, targetOptions, transferGroups, withSource, type TransferForm as Form } from "../transfer";
import type { Screen } from "./Treasury";

/** 轉帳：記一筆的第三個分頁；改一筆時沒有分頁 */
export function TransferForm({ screen, initial, editing, onTab }: { screen: Screen; initial: Form; editing?: EventId; onTab?: (tab: RecordTab, form: Form) => void }) {
  const { me, catalog, events, prefs, back } = screen;
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<readonly string[]>([]);
  const existing = editing === undefined ? undefined : events.find((e) => e.id === editing);

  const ordered = wallOrder(catalog.accounts, prefs.accounts, events);
  const sources = transferGroups(sourceOptions(ordered, form.from), catalog.people, me);
  const targets = transferGroups(targetOptions(ordered, form.from, form.to), catalog.people, me);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = checkTransferForm(form);
    setErrors(found);
    if (found.length > 0) return;
    const event = buildTransfer(form, { id: crypto.randomUUID() as EventId, me, now: Date.now(), ...(existing === undefined ? {} : { existing }) });
    const problems = storeEvent(screen, event, editing === undefined ? "轉好了" : "改好了");
    setErrors(problems);
    if (problems.length > 0) return;
    // 萬一沒有上一頁可回（直接開這個網址）：新的一筆留下空的表單，才不會同一筆存兩次
    if (editing === undefined) setForm(defaultTransfer({ me, catalog, events, now: new Date() }));
    back();
  };

  return (
    <form onSubmit={submit} className="form record">
      <RecordHead title={editing === undefined ? "記一筆" : "改這筆轉帳"} editing={editing !== undefined} onBack={back} />
      {onTab !== undefined && <RecordTabs value="transfer" onChange={(tab) => tab !== "transfer" && onTab(tab, form)} />}

      <label>
        金額
        <input className="amount" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} inputMode="numeric" autoComplete="off" placeholder="0" autoFocus={editing === undefined} />
      </label>

      <label>
        從
        <select value={form.from} onChange={(e) => setForm((f) => withSource(f, e.target.value as Form["from"], catalog.accounts))}>
          <option value="">選帳戶</option>
          <Groups groups={sources} />
        </select>
      </label>

      <label>
        到
        <select value={form.to} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value as Form["to"] }))}>
          <option value="">選帳戶</option>
          <Groups groups={targets} />
        </select>
      </label>

      <label>
        名稱（可以不填）
        <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoComplete="off" maxLength={200} />
      </label>

      <WhenFields date={form.date} time={form.time} onChange={(change) => setForm((f) => ({ ...f, ...change }))} />

      <p className="muted hint">轉帳不是支出：錢在自己的帳戶之間搬動，淨資產不變。</p>

      <ErrorList errors={errors} />

      <button type="submit" className="primary save-bar">
        {editing === undefined ? "記下來" : "存"}
      </button>

      {editing !== undefined && <DeleteArea id={editing} what="這筆轉帳" screen={screen} onError={setErrors} />}
    </form>
  );
}

function Groups({ groups }: { groups: readonly { readonly label: string; readonly accounts: readonly Account[] }[] }) {
  return (
    <>
      {groups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}（{KIND_LABEL[a.kind]}）{a.archived ? "（封存了）" : ""}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
