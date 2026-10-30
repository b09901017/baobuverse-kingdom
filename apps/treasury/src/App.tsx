import {
  openBook,
  type Account,
  type AccountId,
  type Catalog,
  type EntryId,
  type Event,
  type EventId,
  type ItemId,
  type Jar,
  type JarId,
  type LocalDate,
  type Person,
  type PersonId,
} from "@baobu/core";
import { useEffect, useMemo, useState } from "react";
import { redirectError, signIn, signOut, watchSession, type Session } from "./auth";
import { KINGDOM_ID, db, useEmulators } from "./firebase";
import { LAUNCHED } from "./launch";
import { RESET_DELETES, RESET_KEEPS, clearLocalCache, resetMine } from "./reset";
import { findMember, foundKingdom, save, watchCatalog, watchEvents } from "./store";

// 驗證地基用的頁面（issue 05）：登入 → 用 core 建一則事件 → 存 → 讀回來 → 用 core 算餘額。階段 1 換成真正的記帳畫面。
// 第一版畫面乾淨簡單；畫風之後整個換（plan.md「方向」）

const 步 = "bu" as PersonId;
const PEOPLE: readonly Person[] = [
  { id: 步, name: "步" },
  { id: "bao" as PersonId, name: "寶" },
];

export function App() {
  const [session, setSession] = useState<Session | null>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => watchSession(setSession), []);
  useEffect(() => {
    void redirectError().then((message) => message && setError(`登入失敗：${message}`));
  }, []);

  return (
    <main>
      <h1>國庫</h1>
      {useEmulators && <p className="note">模擬器（資料只在這台電腦）</p>}
      {session === undefined && <p>載入中…</p>}
      {session === null && (
        <button type="button" onClick={() => signIn().catch((e: Error) => setError(`登入失敗：${e.message}`))}>
          用 Google 登入
        </button>
      )}
      {session && <Kingdom session={session} onError={setError} />}
      {error && <p className="error">{error}</p>}
    </main>
  );
}

function Kingdom({ session, onError }: { session: Session; onError: (message: string) => void }) {
  const [me, setMe] = useState<PersonId | null>();

  useEffect(() => {
    findMember(db, KINGDOM_ID, session.uid)
      .then(setMe)
      .catch((e: Error) => onError(`讀不到成員資料：${e.message}`));
  }, [session.uid, onError]);

  const found = () =>
    foundKingdom(db, KINGDOM_ID, session.uid, 步, PEOPLE)
      .then(() => setMe(步))
      .catch((e: Error) => onError(`建不了王國（已經有人建了，或沒有網路）：${e.message}`));

  const name = PEOPLE.find((person) => person.id === me)?.name;
  return (
    <>
      <p>
        {session.name ?? "已登入"}
        {name && `（${name}）`}{" "}
        <button type="button" onClick={() => void signOut()}>
          登出
        </button>
      </p>
      {me === undefined && <p>載入中…</p>}
      {me === null && (
        <>
          <p>你還不是這個王國的成員。王國還沒有人的話，第一個建的人是步。</p>
          <button type="button" onClick={() => void found()}>
            建立王國（我是步）
          </button>
        </>
      )}
      {me && <Treasury me={me} onError={onError} />}
    </>
  );
}

function Treasury({ me, onError }: { me: PersonId; onError: (message: string) => void }) {
  const [catalog, setCatalog] = useState<Catalog>();
  const [events, setEvents] = useState<readonly Event[]>();
  const [offline, setOffline] = useState(false);

  useEffect(() => watchCatalog(db, KINGDOM_ID, me, setCatalog, (e) => onError(e.message)), [me, onError]);
  useEffect(
    () =>
      watchEvents(
        db,
        KINGDOM_ID,
        me,
        (list, fromCache) => {
          setEvents(list);
          setOffline(fromCache);
        },
        (e) => onError(e.message),
      ),
    [me, onError],
  );

  const book = useMemo(() => (catalog && events ? openBook(catalog, events) : undefined), [catalog, events]);
  if (!catalog || !events || !book) return <p>載入中…</p>;

  const addTest = () => {
    const account: Account = {
      id: "test-account" as AccountId,
      name: "測試帳戶",
      kind: "bank",
      owners: [me],
      currency: "TWD",
    };
    const jar: Jar = { id: "test-jar" as JarId, name: "測試罐子", owners: [me] };
    const event: Event = {
      id: crypto.randomUUID() as EventId,
      date: today(),
      title: "測試支出",
      recordedBy: me,
      recordedAt: Date.now(),
      source: "manual",
      status: "confirmed",
      effects: [
        {
          type: "money",
          id: "m1" as EntryId,
          kind: "expense",
          payer: me,
          account: account.id,
          amount: 120,
          beneficiary: { kind: "person", person: me },
          tags: [],
          items: [{ id: "i1" as ItemId, amount: 120, jar: jar.id, tags: [] }],
        },
      ],
    };
    const result = save(db, KINGDOM_ID, { accounts: [account], jars: [jar], events: [event] }, { catalog, events });
    if (!result.ok) onError(`core 檢查不過：${result.problems.map((p) => p.code).join("、")}`);
    // 斷網時不等：離線快取已經看得到，恢復網路後才會完成
    else result.written.catch((e: Error) => onError(`存不進去：${e.message}`));
  };

  return (
    <>
      {offline && <p className="note">離線中：記的會先存在這台裝置，恢復網路後同步</p>}
      <button type="button" onClick={addTest}>
        建一個測試帳戶與一筆測試支出（120 元）
      </button>
      <h2>帳戶</h2>
      {catalog.accounts.length === 0 && <p>還沒有帳戶</p>}
      <ul>
        {catalog.accounts.map((account) => (
          <li key={account.id}>
            {account.name}：{book.total({ measure: "balance", where: { account: account.id } }).toLocaleString("zh-TW")} 元
          </li>
        ))}
      </ul>
      <p className="note">
        看得到的事件 {events.length} 則{book.problems.length > 0 && `，沒算進去的 ${book.problems.length} 則`}
      </p>
      {!LAUNCHED && (
        <section className="settings">
          <h2>設定</h2>
          <Reset me={me} />
        </section>
      )}
    </>
  );
}

/** 上線前的一鍵重置（issue 06）：上線後（launch.ts）整個不出現 */
function Reset({ me }: { me: PersonId }) {
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

function today(): LocalDate {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
