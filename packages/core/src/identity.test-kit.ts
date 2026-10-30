// 恆等式（04）：我付的 − 我用的 ＝ 往來帳因支出的變化 ＋ 寵對方 − 被寵（買東西的）＋ 待收的增加 − 寶媽卡幫出。
// 往來帳、待收、寶媽卡幫出都不含還款那幾行；被寵不含直接給錢；寶媽卡幫出 ＝ −（寶媽卡的餘額）。
// 給了期間就只看那段期間裡的那幾行（存量也是看那段期間的變化）。

import type { Book, LocalDate, Measure, PersonId, Where } from "./index";
import { 寶媽卡 } from "./test-kit";

export function 恆等式(book: Book, person: PersonId, 期間: { from?: LocalDate; to?: LocalDate } = {}) {
  const total = (measure: Measure, where: Where = {}) =>
    book
      .lines({ measure, person, where, ...(期間.to === undefined ? {} : { to: 期間.to }) })
      .filter((line) => 期間.from === undefined || line.date >= 期間.from)
      .reduce((sum, line) => sum + line.amount, 0);
  const 不含還款 = (measure: Measure, where: Where = {}) => total(measure, where) - total(measure, { ...where, cause: "repayment" });
  const 寶媽卡幫出 = -不含還款("balance", { account: 寶媽卡 });
  return {
    左邊: total("paid") - total("use"),
    右邊:
      不含還款("tab") +
      total("spoilGiven") -
      // 被寵（買東西的）＝全部扣掉直接給錢的；退款沖回的那幾行要留著（直接給錢的不能退款）
      (total("spoilReceived") - total("spoilReceived", { cause: "giveMoney" })) +
      不含還款("receivable") -
      寶媽卡幫出,
  };
}
