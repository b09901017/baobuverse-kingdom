import type { AccountId } from "@baobu/core";
import { flowDays } from "../flow";
import { dayLabel } from "../format";
import { routeHash } from "../route";
import type { Screen } from "./Treasury";

/** 流水頁：依日期倒排、同一天一組；點一列打開同一個表單。從帳戶詳情點進來時只列那個帳戶的 */
export function FlowScreen({ account, screen }: { account: AccountId | undefined; screen: Screen }) {
  const { me, catalog, events, book } = screen;
  const days = flowDays(events, catalog, book, me, account === undefined ? {} : { account });
  const filtered = catalog.accounts.find((a) => a.id === account);

  return (
    <>
      <h2>流水</h2>
      {account !== undefined && (
        <p className="filter">
          <span>只看 {filtered?.name ?? "這個帳戶"}</span>
          <a className="button" href={routeHash({ name: "flow" })}>
            看全部
          </a>
        </p>
      )}
      {days.length === 0 && <p className="muted">{account === undefined ? "還沒有記過一筆" : "這個帳戶還沒有記過一筆"}</p>}
      {days.map((day) => (
        <section key={day.date} className="day">
          <h3 className="muted">{dayLabel(day.date)}</h3>
          <ul className="rows">
            {day.rows.map((row) => (
              <li key={`${row.event}/${row.entry}`}>
                <a className={`row flow-row ${row.kind}`} href={routeHash({ name: "edit", event: row.event })}>
                  <span className="flow-main">
                    <span className="flow-title">{row.title}</span>
                    {(row.account ?? row.who) !== undefined && (
                      <span className="muted flow-sub">{[row.account, row.who].filter((x) => x !== undefined).join(" · ")}</span>
                    )}
                    {row.refunded !== undefined && <span className="flow-sub flow-refunded">{row.refunded}</span>}
                  </span>
                  <span className={`flow-amount ${row.kind}`}>{row.amountText}</span>
                </a>
                {row.refundOf !== undefined && (
                  <a className="flow-origin" href={routeHash({ name: "edit", event: row.refundOf.event })}>
                    ↩ 原本那筆：{row.refundOf.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
