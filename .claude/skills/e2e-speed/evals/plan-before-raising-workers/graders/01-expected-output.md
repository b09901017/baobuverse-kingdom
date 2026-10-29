---
type: llm
focus: trace
weight: 1
---

The result matches this description: plan.md does not recommend simply setting workers to 4; it says to measure first, explains that workers sharing one Firestore emulator will wipe each other's data so isolation (a namespace per worker or an emulator set per worker) and a loud wrong-namespace check come first, caps local workers at 2–3 with a heads-up about time and CPU before running, and ranks running only related tests and CI sharding before same-machine parallelism.
