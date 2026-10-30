# 05 Google 登入與存讀事件

Status: done
Blocked by: 01、03（04 最好也做完，餘額才算得出來）
動工前先讀：`../spec.md`；`../HANDOFF.md`「每一段共同的規矩」；01、03 的「做完時留下的」與 ADR；skill `firebase-auth-basics`、`firebase-firestore`、`firestore-rules-creation`、`firebase-security-rules-auditor`；`docs/agents/lessons.md` 第五、七條。

## 使用者要的

- 「好，不要跟國王日記擠在同一個專案裡」——用新專案自己的登入，跟國王日記是不同的使用者（同一個 Google 帳號）。
- 隱私（README）：兩個人各自的紀錄互相看不到；共享的只有跟兩個人都有關的錢（幫對方、幫共、往來帳、還款）（階段 6 才做共享）。
- 第一版畫面乾淨簡單。

## 為什麼會這樣

- 階段 0 的端到端：登入 → 用 core 建一則事件 → 存 → 讀回來 → 用 core 算餘額 → 顯示。階段 1 在這條路上長出真正的記帳畫面。
- 手機上的 PWA 用 popup 登入常被擋，通常用 redirect；段自己查 `firebase-auth-basics` 決定。
  redirect 要把 `authDomain` 設成部署的網域（`<專案>.web.app`），不然瀏覽器擋第三方儲存時會失敗。
- **階段 2 的 APK 殼在 WebView 裡載入網址，Google 會擋 WebView 裡的登入**（disallowed_useragent）。所以登入包成一個模組，
  網頁用 Firebase 的網頁登入，APK 之後換原生登入再 `signInWithCredential`（國王日記用過 `@capacitor-firebase/authentication`）。
- 登入要使用者自己按（Claude 不能輸入 Google 密碼）：本機驗登入時約使用者在場。

## 做法（段可以改細節，改了寫進「做完時留下的」）

1. `apps/treasury` 接新專案（01 的網頁設定）；Google 登入、登出；顯示目前登入的是誰（只顯示名字，不要把 email 寫進任何會進 repo 的檔案）。
2. 照 03 的 Firestore 路徑存讀事件、帳戶；轉換只在 app 這一層，`packages/core` 不知道 Firestore。
3. 開離線快取（之後殼＋網址靠它離線記帳）。
4. 驗證用的頁面（之後會被階段 1 取代）：一個按鈕建一個測試帳戶與一筆測試支出，下面列出帳戶與 core 算出的餘額。
5. 安全規則：自己只能讀寫自己的；寫規則測試（Firestore 模擬器＋`@firebase/rules-unit-testing`），放進驗證指令。
   `firebase.json` 的 firestore 與 emulators 設定在這一支建（06 只補 hosting 與 `.firebaserc`）；模擬器用 `demo-` 開頭的專案 ID，保證碰不到任何真的專案。
   模擬器要 Java（新版 firebase-tools 要 JDK 21，這台電腦已有）；CI 用 `actions/setup-java` 裝 21。
   03 對「寶幫共付、步記的」「步幫步付」誰讀得到的答案，寫成規則測試案例（現在先只開給自己，案例寫「目前拒絕、階段 6 再開」也行，要寫明）。

## 判準

- 另一個登入的人讀得到我的事件嗎？（不應該）沒登入讀得到嗎？（不應該）
- 存進去再讀回來的事件，用 core 算出的餘額跟存之前一樣嗎？
- 有沒有任何程式碼、設定指到 `baobu-app`？（必須沒有）
- 斷網時還能建一筆、恢復網路後同步上去嗎？（模擬器測試用 `disableNetwork`／`enableNetwork` 驗；做不到就寫手動步驟並記下結果）
- 規則測試在驗證指令裡、CI 跑得到嗎？

## 做完時留下的

2026-10-30 段四。程式在 commit `2018bf5`。

- **檔案**：

  | 檔 | 做什麼 |
  |---|---|
  | `.firebaserc` | 只寫 `baobu-kingdom`（所有 firebase 指令另外明寫 `--project`） |
  | `firebase.json` | firestore（規則、索引）與模擬器（auth 9099、firestore 8080、UI 4000）。06 只補 hosting |
  | `firestore.rules`、`firestore.indexes.json` | 安全規則；索引現在是空的（日記的 `participants`＋`date` 複合索引等日記畫面再加） |
  | `apps/treasury/src/firebase.ts` | 接新專案、離線快取（`persistentLocalCache`＋多分頁）、`--mode emulators` 時接模擬器、王國 ID `baobu` |
  | `apps/treasury/src/auth.ts` | 登入模組：`watchSession`、`signIn`、`signOut`、`redirectError`。只拿名字，不拿 email |
  | `apps/treasury/src/store.ts` | 存讀與轉換：`toEventDoc`／`fromEventDoc`、`findMember`、`foundKingdom`、`save`（存之前 `validateEvent`）、`watchCatalog`、`watchEvents` |
  | `apps/treasury/src/App.tsx` | 驗證頁（階段 1 換掉）；`coreReady` 拿掉了（連同它唯一的測試 `packages/core/src/index.test.ts`） |
  | `apps/treasury/test/` | `rules.test.ts`（26 支）、`store.test.ts`（4 支），都跑在模擬器 |

- **登入方式**：Google。部署的網址（`baobu-kingdom.web.app`、`.firebaseapp.com`）上用 **redirect**，`authDomain` 設成**目前的網址**（同網域，瀏覽器擋第三方儲存也不怕）；
  本機 `localhost` 用 **popup**，`authDomain` 用 `baobu-kingdom.firebaseapp.com`。模擬器的假登入也用 redirect（Claude 的內建瀏覽器開不了 popup），
  而且模擬器要用 `localhost`、不能用 `127.0.0.1`（跟 vite 不同網站的話，redirect 回來拿不到登入結果，實際試過）。
  APK 殼之後只換 `auth.ts` 的做法（原生登入 → `signInWithCredential`），畫面不用改。
- **資料路徑**：照 ADR 0001，全部在 `kingdoms/baobu/` 底下。事件文件＝`Event` ＋ `participants`（`participantsOf`，排序過的）、`updatedAt`（伺服器時間）、`deleted`（false）、`v`（1）。
  讀事件：`events where participants array-contains 我`（一般監聽，`includeMetadataChanges` 看是不是從快取來的）；讀帳戶：`accounts where owners array-contains 我`。
- **第一份成員文件怎麼建**：王國文件還不存在時，第一個登入的人按「建立王國（我是步）」，同一批寫入建 `kingdoms/baobu`（`founder` 是自己的 uid）、
  自己的 `members/{uid}`（`{ person: "bu" }`）、`people/bu`、`people/bao`。規則：王國不能改、成員文件建了不能改，所以王國有人之後別人加不進來（寶加入是階段 6 的事）。
  風險：部署規則到步按下去之間、或王國文件被刪掉之後，任何登入的人都可以先按（見 HANDOFF 中途發現）。2026-10-30 步已經按了，現在 `baobu` 的步是使用者。
- **規則**（`firestore.rules` 開頭有資料的樣子）：沒登入、不是成員：每個路徑都拒絕；王國以外全部拒絕；不能刪任何文件（刪除只做標記）。
  事件：讀＝參與者；建＝記的人是自己、參與者有自己、`updatedAt` 是伺服器時間、`v` 是 1、沒有多的欄位；改＝記的人（誰記的、什麼時候記的不能改，別人的有疑問不能動）；
  其他參與者只能改 `doubts.{自己}`。帳戶：只有 `owners` 讀寫，自己要一直在主人裡。人、罐子、標籤：成員讀寫。固定花費、排序：本人。
  **規則只檢查欄位的種類、大小與誰能動；效果的內容（金額、品項、幫誰）靠存之前的 `validateEvent`**，記的人只寫得壞自己記的事件。
- **段二的案例怎麼寫成測試**：「寶幫共付、步記的」寶還沒有成員文件也存得進去、步讀得到改得了；寶沒有成員文件時讀不到，寫成「目前拒絕，階段 6 再開」；
  另一組用模擬的寶的成員文件（階段 6 的樣子）驗：寶讀得到、只能改 `doubts.bao`。「步幫步付」寶讀不到（有沒有成員文件都一樣）。
  測試會不會漏：把「事件只有參與者讀得到」放寬、拿掉「記的人要是自己」，3 支變紅（`不能冒用別人記`、`讀得到參與者有步的`、`步幫步付`），還原後全綠。
- **模擬器怎麼跑**：要 JDK 21（這台已有；CI 用 `actions/setup-java@v6` temurin 21，模擬器的下載用 `actions/cache` 存起來）。`firebase-tools` 是 `apps/treasury` 的 devDependency，固定 15.34.2。
  - `pnpm verify` 會跑 `apps/treasury` 的 `test`：`firebase emulators:exec --only firestore --project demo-baobu-kingdom "vitest run"`（約 20 秒）。
  - `pnpm --filter @baobu/treasury dev:emulators`：模擬器（auth＋firestore，UI 在 4000）＋ vite，用假的 Google 帳號點驗證頁。`.claude/launch.json` 有 `treasury-emulators` 與 `treasury`（接真的專案）。
  - 專案是 `demo-` 開頭的，模擬器保證不連任何真的專案。
- **斷網測試的結果**（`store.test.ts`「斷網」）：`disableNetwork` 後 `save` 一筆，監聽馬上從本機快取看得到（`fromCache` 是 true）、伺服器上還沒有；
  `enableNetwork` 後寫入完成，伺服器上有了，`participants` 對。測試用的是記憶體快取（node 沒有 IndexedDB）；瀏覽器裡的持久快取（關掉分頁再開也在）沒有自動測，階段 1 手動驗。
- **判準**：

  | 判準 | 結果 |
  |---|---|
  | 另一個登入的人讀得到我的事件嗎？沒登入呢？ | 都讀不到（規則測試「沒登入」「登入了但不是成員」「步幫步付」） |
  | 存進去再讀回來，core 算出的餘額一樣嗎？ | 一樣：4 則事件（對帳、家樂福兩項共付、轉帳、寶幫共付）存了再讀，事件逐欄相同，郵局 8,180、錢包、我用的、我付的、往來帳、淨資產六個數字都一樣 |
  | 有沒有程式碼、設定指到 `baobu-app`？ | 沒有（`git grep` 只有 guard 的禁止清單與 README） |
  | 斷網時還能建一筆、恢復後同步嗎？ | 可以（上一條） |
  | 規則測試在驗證指令裡、CI 跑得到嗎？ | 在：`pnpm verify` 裡；CI `2018bf5` 綠，log 裡 core 8 檔、treasury 2 檔都過 |

- **部署與真的登入**（使用者答應後，2026-10-30）：`firebase deploy --only firestore:rules,firestore:indexes --project baobu-kingdom`（先 `--dry-run` 確認目標）。
  使用者在自己的 Chrome 開本機的國庫（`localhost`、popup）用 Google 登入、建王國、按一次測試按鈕，畫面顯示「測試帳戶：-120 元」。
  所以 `baobu-kingdom` 現在有王國 `baobu`、步的成員文件、`people`、測試帳戶、測試罐子、一則測試支出（06 的一鍵重置要清掉的就是這些）。
- **驗證**：`pnpm verify` 通過：core 153 支（拿掉 `coreReady` 那一支）、treasury 30 支、建置。
- pnpm 12 擋了三個套件的安裝腳本（`@firebase/util`、`protobufjs`、`re2`），都不需要，`pnpm-workspace.yaml` 的 `allowBuilds` 設成 false。

## Comments

### 段二（03）留給 05 的（2026-10-30）

路徑、每個集合誰讀得到、事件文件多存的四個欄位（`participants`、`updatedAt`、`deleted`、`v`）照 ADR 0001「Firestore 上怎麼放」。
存之前用 core 的 `validateEvent` 檢查、`participantsOf` 算參與者。讀取量的計畫在 ADR「後果」：05 先用一般的監聽就好，文件格式從第一天就照 ADR。

03 判準的答案，寫成規則測試案例：

- 沒登入、或登入了但王國裡沒有自己的 `members/{uid}`：每個路徑都拒絕。
- 步：讀得到參與者有步的事件；建事件時 `recordedBy` 要是步、`participants` 要有步；改、刪（標記）只能動自己記的。
- 「寶幫共付、步記的」：參與者是步和寶；寶還沒有成員文件也存得進去；步讀得到、改得了。
  寶讀得到、只能改 `doubts.寶`——寶要到階段 6 才有成員文件，現在可以寫成「目前拒絕、階段 6 再開」，要寫明。
- 「步幫步付」：參與者只有步；寶讀不到（現在、階段 6 都一樣）。
- 帳戶：只有 `owners` 讀寫得到；共有的投資帳戶兩個人都可以。
- 王國以外的路徑全部拒絕。
