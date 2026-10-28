---
status: accepted
supersedes: ADR-0005
---

# 兩個 app 先做成同一網域下的兩個 PWA，需要時再包 APK

唯一硬需求是自動抓銀行與 LINE Pay 通知，而這件事由手機上的 MacroDroid 監聽、POST 到雲端函式完成，
前端是 PWA 還是 APK 都一樣。兩個使用者都用 Android，Chrome 對 PWA 支援最好。
所以先不打包：改完程式手機上就是新版，不用簽章與發佈兩次。

國庫與窩日記放在同一網域的不同路徑、各自一份 manifest，保留 ADR-0005 想要的
「兩個桌面圖示、兩種節奏」，而且登入狀態共用，比兩個 APK 各登入一次更好。

## Consequences

- 做不到：顯示餘額的桌面小工具、app 關著時的本地排程通知、NFC 讀悠遊卡。
  前兩項先以 manifest `shortcuts` 與 FCM 網頁推播替代。
- 使用者決定（2026-10-28）：測試沒問題後用 Capacitor 包成 APK。觸發點是想要上述原生功能，
  或想讓 app 自己讀通知、不經 MacroDroid。悠遊卡 NFC 屆時再研究可行性。
- 要先驗證 PWA 的網頁版 Google 登入能登入國王日記同一個帳號（國王日記 APK 用原生登入外掛）。
- 日後若真的需要原生功能，再用 Capacitor 包同一份 build，程式不用重寫。
