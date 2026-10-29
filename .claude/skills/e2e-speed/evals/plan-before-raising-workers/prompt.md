---
tags: [skill-creator]
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write]
---

我們的 playwright E2E 全跑要 22 分鐘，workers 一直是 1，每個測試開頭都會清空 Firestore 模擬器再塞資料。我想直接把 playwright.config.js 的 workers 改成 4 看看會不會快，你覺得呢？先不要跑任何測試，給我一份計畫寫進 plan.md 就好。
