import type { Person, PersonId } from "@baobu/core";
import { useEffect, useState } from "react";
import { redirectError, signIn, signOut, watchSession, type Session } from "./auth";
import { KINGDOM_ID, db, useEmulators } from "./firebase";
import { Treasury } from "./screens/Treasury";
import { findMember, foundKingdom } from "./store";

// 登入與王國留在這裡；登入之後的畫面都在 screens/。
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
    <>
      {session ? (
        <Kingdom session={session} onError={setError} />
      ) : (
        <main className="center">
          <h1>國庫</h1>
          {useEmulators && <p className="muted">模擬器（資料只在這台電腦）</p>}
          {session === undefined && <p>載入中…</p>}
          {session === null && (
            <button type="button" className="primary" onClick={() => signIn().catch((e: Error) => setError(`登入失敗：${e.message}`))}>
              用 Google 登入
            </button>
          )}
        </main>
      )}
      {error && (
        <p className="banner error" role="alert">
          <span>{error}</span>
          <button type="button" className="plain" onClick={() => setError(null)}>
            知道了
          </button>
        </p>
      )}
    </>
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

  if (me) return <Treasury me={me} session={session} onError={onError} />;
  return (
    <main className="center">
      <h1>國庫</h1>
      {useEmulators && <p className="muted">模擬器（資料只在這台電腦）</p>}
      {me === undefined && <p>載入中…</p>}
      {me === null && (
        <>
          <p>你還不是這個王國的成員。王國還沒有人的話，第一個建的人是步。</p>
          <button type="button" className="primary" onClick={() => void found()}>
            建立王國（我是步）
          </button>
          <button type="button" onClick={() => void signOut()}>
            登出
          </button>
        </>
      )}
    </main>
  );
}
