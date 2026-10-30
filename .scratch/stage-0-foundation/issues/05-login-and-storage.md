# 05 Google 登入與存讀事件

Status: todo
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

（段做完填：登入方式、資料路徑、規則檔、模擬器怎麼跑。）

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
