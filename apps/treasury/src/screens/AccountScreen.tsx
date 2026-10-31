import type { AccountId, AccountKind, EventId, PersonId } from "@baobu/core";
import { useState, type FormEvent } from "react";
import {
  KINDS,
  KIND_LABEL,
  balanceText,
  canFillBalance,
  canWriteNote,
  checkAccountForm,
  newAccountChanges,
  ownerChoices,
  reconcileNote,
  sharesOf,
  withArchived,
  type OwnerChoice,
} from "../accounts";
import { Choice } from "../components/Choice";
import { KINGDOM_ID, db } from "../firebase";
import { dateOf, money } from "../format";
import { problemTexts } from "../problems";
import { routeHash } from "../route";
import { save, saveAccountNote } from "../store";
import type { Screen } from "./Treasury";

/** 帳戶詳情：改名、備註、封存。別人的帳戶（步幫寶建的）沒有餘額、沒有備註 */
export function AccountScreen({ id, screen }: { id: AccountId; screen: Screen }) {
  const { me, catalog, events, book, prefs, back, notify, fail } = screen;
  const account = catalog.accounts.find((a) => a.id === id);
  const [name, setName] = useState(account?.name ?? "");
  const [note, setNote] = useState(prefs.accountNotes?.[id] ?? "");
  const [errors, setErrors] = useState<readonly string[]>([]);

  if (account === undefined) {
    return (
      <>
        <BackLink onBack={back} />
        <p>找不到這個帳戶</p>
      </>
    );
  }

  const mine = account.owners.includes(me);
  const ownerNames = account.owners.map((o) => catalog.people.find((p) => p.id === o)?.name ?? o).join("、");
  const noteWas = prefs.accountNotes?.[id] ?? "";

  const store = (next: typeof account) => {
    const result = save(db, KINGDOM_ID, { accounts: [next] }, { catalog, events });
    if (!result.ok) {
      setErrors(problemTexts(result.problems));
      return false;
    }
    // 不等網路：離線時也馬上看到，恢復網路後才同步
    result.written.catch((e: Error) => fail(`帳戶沒有存到：${e.message}`));
    return true;
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const found = [
      ...(trimmed === "" ? ["要取一個名字"] : []),
      ...(trimmed.length > 40 ? ["名字最多 40 字"] : []),
      ...(note.length > 200 ? ["備註最多 200 字"] : []),
    ];
    setErrors(found);
    if (found.length > 0) return;
    if (trimmed !== account.name && !store({ ...account, name: trimmed })) return;
    if (mine && note.trim() !== noteWas) {
      saveAccountNote(db, KINGDOM_ID, me, id, note.trim()).catch((err: Error) => fail(`備註沒有存到：${err.message}`));
    }
    notify("存好了");
    back();
  };

  const setArchived = (archived: boolean) => {
    if (!store(withArchived(account, archived))) return;
    notify(archived ? "封存了：不會再出現在選單，數字照算" : "解封了");
    back();
  };

  const balance = book.total({ measure: "balance", where: { account: id } });
  const reconcile = reconcileNote(account, events, dateOf(new Date()));

  return (
    <>
      <BackLink onBack={back} />
      <h2>{account.name}</h2>
      {mine && (
        <section className="detail-balance">
          <strong>{balanceText(account, balance)}</strong>
          {sharesOf(account, book, catalog.people).map((s) => (
            <span key={s.name} className="muted">
              {s.name}投入 {money(s.amount)} 元
            </span>
          ))}
          {reconcile && !account.archived && <span className="card-stale">{reconcile}</span>}
        </section>
      )}
      <dl className="facts">
        <dt>種類</dt>
        <dd>
          {KIND_LABEL[account.kind]}
          {account.paidByOthers && "（帳單別人繳，不算淨資產）"}
        </dd>
        <dt>主人</dt>
        <dd>{ownerNames}</dd>
        {account.archived && (
          <>
            <dt>狀態</dt>
            <dd>封存了</dd>
          </>
        )}
      </dl>
      <form onSubmit={submit} className="form">
        <label>
          名字
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </label>
        {mine && (
          <label>
            備註（只有你看得到）
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="例如這個拿來存款" />
          </label>
        )}
        <Errors errors={errors} />
        <button type="submit" className="primary">
          存
        </button>
      </form>
      {mine && (
        <a className="button" href={routeHash({ name: "flow", account: id })}>
          看這個帳戶的流水
        </a>
      )}
      <button type="button" className="quiet" onClick={() => setArchived(!account.archived)}>
        {account.archived ? "解封" : "封存這個帳戶"}
      </button>
      {!account.archived && <p className="muted hint">封存後不會出現在選單，記過的{mine && "與餘額"}照算；隨時可以解封。</p>}
    </>
  );
}

/** 新增帳戶。種類、主人建了就不能改（改成投資會讓舊的對帳不算；換主人會讓記過的對不上），打錯就封存再建一個 */
export function NewAccountScreen({ owner, screen }: { owner: PersonId | undefined; screen: Screen }) {
  const { me, catalog, events, back, notify, fail } = screen;
  const [name, setName] = useState("");
  const [kind, setKind] = useState<AccountKind>("bank");
  const [ownerChoice, setOwnerChoice] = useState<OwnerChoice>(owner ?? me);
  const [paidByOthers, setPaidByOthers] = useState(false);
  const [note, setNote] = useState("");
  const [balance, setBalance] = useState("");
  const [errors, setErrors] = useState<readonly string[]>([]);

  const form = { name, kind, owner: ownerChoice, paidByOthers, note, balance };
  const pickKind = (next: AccountKind) => {
    setKind(next);
    if (next !== "investment" && ownerChoice === "shared") setOwnerChoice(me);
    if (next !== "credit-card") setPaidByOthers(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = checkAccountForm(form, me);
    setErrors(found);
    if (found.length > 0) return;
    const changes = newAccountChanges(form, {
      me,
      people: catalog.people,
      accountId: crypto.randomUUID() as AccountId,
      eventId: crypto.randomUUID() as EventId,
      now: Date.now(),
      today: dateOf(new Date()),
    });
    const result = save(db, KINGDOM_ID, changes, { catalog, events });
    if (!result.ok) {
      setErrors(problemTexts(result.problems));
      return;
    }
    // 不等網路：離線時也馬上看到，恢復網路後才同步
    result.written.catch((err: Error) => fail(`帳戶沒有存到：${err.message}`));
    notify("建好了");
    back();
  };

  return (
    <>
      <BackLink onBack={back} />
      <h2>新增帳戶</h2>
      <form onSubmit={submit} className="form">
        <label>
          名字
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
        </label>
        <Choice label="種類" value={kind} options={KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))} onChange={pickKind} />
        <Choice label="主人" value={ownerChoice} options={ownerChoices(kind, catalog.people, me)} onChange={setOwnerChoice} />
        {kind === "credit-card" && (
          <label className="check">
            <input type="checkbox" checked={paidByOthers} onChange={(e) => setPaidByOthers(e.target.checked)} />
            帳單是別人繳的（寶媽卡這種，不算淨資產）
          </label>
        )}
        {canFillBalance(form, me) && (
          <label>
            {kind === "credit-card" ? "現在欠多少（可以不填）" : "現在的餘額（可以不填）"}
            <input value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="numeric" />
          </label>
        )}
        {canWriteNote(ownerChoice, me) && (
          <label>
            備註（只有你看得到）
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="例如這個拿來存款" />
          </label>
        )}
        <p className="muted hint">種類和主人建了就不能改。</p>
        <Errors errors={errors} />
        <button type="submit" className="primary">
          建立
        </button>
      </form>
    </>
  );
}

function BackLink({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" className="plain back" onClick={onBack}>
      ← 返回
    </button>
  );
}

function Errors({ errors }: { errors: readonly string[] }) {
  if (errors.length === 0) return null;
  return (
    <ul className="errors" role="alert">
      {errors.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );
}
