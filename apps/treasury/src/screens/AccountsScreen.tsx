import type { AccountId } from "@baobu/core";
import { useState } from "react";
import { balanceText, myAccounts, reconcileNote, sharesOf, wallOrder } from "../accounts";
import { AccountWall, type CardView } from "../components/AccountWall";
import { KINGDOM_ID, db } from "../firebase";
import { dateOf, money } from "../format";
import { LAUNCHED } from "../launch";
import { unsettled } from "../problems";
import { routeHash } from "../route";
import { saveAccountOrder } from "../store";
import { ApplyPresets } from "./SettingsScreen";
import type { Screen } from "./Treasury";

export function AccountsScreen({ screen }: { screen: Screen }) {
  const { me, catalog, events, book, prefs, go, fail } = screen;
  const mine = myAccounts(catalog, me);
  const today = dateOf(new Date());

  // 放開之後馬上照新的順序：等 prefs 的監聽回來前不要跳回去一下
  const [dragged, setDragged] = useState<{ readonly order: readonly AccountId[]; readonly basis: unknown }>();
  const order = wallOrder(mine, dragged !== undefined && dragged.basis === prefs.accounts ? dragged.order : prefs.accounts, events);

  const view = (account: (typeof mine)[number]): CardView => ({
    account,
    balance: balanceText(account, book.total({ measure: "balance", where: { account: account.id } })),
    shares: sharesOf(account, book, catalog.people).map((s) => `${s.name}投入 ${money(s.amount)}`),
    note: prefs.accountNotes?.[account.id],
    reconcile: account.archived ? null : reconcileNote(account, events, today),
    owners: account.owners.length > 1 ? "共有" : undefined,
  });

  const reorder = (next: readonly AccountId[]) => {
    setDragged({ order: next, basis: prefs.accounts });
    // 不等網路：離線時也馬上看到，恢復網路後才同步
    saveAccountOrder(db, KINGDOM_ID, me, next).catch((e: Error) => fail(`順序沒有存到：${e.message}`));
  };

  const active = order.filter((a) => !a.archived);
  const archived = order.filter((a) => a.archived);
  const problems = unsettled(book.problems, events);

  return (
    <>
      <section className="net-worth">
        <span className="muted">淨資產</span>
        <strong>{money(book.total({ measure: "netWorth", person: me }))} 元</strong>
      </section>

      {mine.length === 0 ? (
        <section className="empty">
          <p>還沒有帳戶</p>
          {!LAUNCHED && <ApplyPresets screen={screen} />}
          {!LAUNCHED && (
            <a className="button" href={routeHash({ name: "settings" })}>
              到設定匯入預設
            </a>
          )}
        </section>
      ) : (
        <AccountWall
          cards={active.map(view)}
          order={order.map((a) => a.id)}
          onOpen={(id) => go({ name: "account", id })}
          onReorder={reorder}
        />
      )}

      <a className="button add" href={routeHash({ name: "newAccount" })}>
        ＋ 新增帳戶
      </a>

      {archived.length > 0 && (
        <details className="fold">
          <summary>封存的帳戶（{archived.length}）</summary>
          <AccountWall cards={archived.map(view)} onOpen={(id) => go({ name: "account", id })} />
        </details>
      )}

      {problems.length > 0 && (
        <details className="fold warn">
          <summary>沒算進去的 {problems.length} 則</summary>
          <ul className="problems">
            {problems.map((p) => (
              <li key={p.event}>
                <strong>{p.event}</strong>
                <br />
                {p.reasons.join("；")}
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
