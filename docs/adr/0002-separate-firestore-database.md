# 在 baobu-app 專案裡新開一個 Firestore database

新系統與國王日記共用 Firebase 專案 `baobu-app`（同一套 Auth、同一組 uid），
但**資料放在另一個具名的 Firestore database**，不與國王日記共用預設 database。

## 為什麼

國王日記已經上線運行很久，最高優先的約束是不能動到它。

Firestore 的 Security Rules **每個 database 各一份，而且部署時會整份覆蓋**。
如果兩邊共用同一個 database，新專案只要有人跑過一次 `firebase deploy --only firestore:rules`，
國王日記的規則就會被蓋掉、當場壞掉。這不是「小心一點就好」——這種事三年內一定會發生一次。

拆開之後，隔離變成**架構保證而非紀律要求**：新專案物理上碰不到舊 database 的規則與資料。

## Considered Options

**共用同一個 database。** 好處是新 app 可以直接讀國王日記的交易，不需要鏡像。
但代價是規則檔案共用、部署互相覆蓋，而保護手段只有「記得不要那樣做」。

**在新 repo 的 `firebase.json` 裡不放 firestore.rules。** 能擋住覆蓋，但新增 collection 的規則
就得回去改國王日記的規則檔——一樣動到了原本的東西。

## Consequences

- 跨 database 無法從 client 直接查詢，因此國王日記的資料必須靠 Cloud Function 鏡像過來
  （見 ADR-0003）。
- 兩個 database 的規則各自部署，互不影響。
- 使用者不需要重新配對：Auth 共用，角色對照直接讀國王日記的 `couples/{id}.member_roles`。
