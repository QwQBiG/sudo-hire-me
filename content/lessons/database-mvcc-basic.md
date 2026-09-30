---
slug: "database-mvcc-basic"
title: "MVCC 为什么让读者看到旧版本"
description: "用 PostgreSQL 的 Repeatable Read 快照追踪两次更新前后的可见行。"
subject: "数据库"
order: 147
minutes: 19
lab: "workbench"
objectives: ["按事务快照判断版本可见性", "区分 Read Committed 与 Repeatable Read 的再次读取", "说明旧版本需要适时回收"]
prerequisites: ["database-transactions", "database-isolation"]
---

# MVCC 为什么让读者看到旧版本

## 先规定数据库与隔离级别

**多版本并发控制**（Multi-Version Concurrency Control，MVCC）允许一行的多个版本在一段时间内并存，读操作按快照判断哪个版本可见。下面**明确使用 PostgreSQL 的 Repeatable Read**：事务 T1 在首次普通读取时建立快照，此后重复读取仍按该快照看数据。其他数据库的版本存储和隔离细节可能不同；PostgreSQL 的 Read Committed 也不是这个重复读结果。[PostgreSQL：MVCC Introduction](https://www.postgresql.org/docs/current/mvcc-intro.html) [PostgreSQL：Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)

初始已提交版本 V1：`account 1, balance 100`。T1 只读，不修改这行；T2 稍后更新余额为 120 并提交，产生新版本 V2。

## 逐步推演

### T1 第一次读取：建立旧快照

T1 使用 Repeatable Read，第一次 `SELECT balance` 看到 V1 的 100。此时尚无 V2。

### T2 更新并提交：新版本出现

T2 把余额更新为 120 后提交。对新开始的合适事务，V2 已是可见的已提交版本；V1 不能立即无条件删除，因为 T1 的旧快照可能还需要它。这不表示“读取永远不会遇到任何锁等待”，写写冲突、DDL 和锁模式另有规则。

### T1 再读与 T3 新读

T1 在原事务中再次普通读取仍看到 100；T3 在 T2 提交后新开始并读取看到 120。若把 T1 改成 PostgreSQL 默认的 Read Committed，第二条语句通常使用新的语句级快照，可看到 120。T1 结束后，旧版本何时可回收还要由 PostgreSQL 的可见性和清理规则决定，不能把“结束立即删”当固定行为。[PostgreSQL：Routine Vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html)

## 面试回答

MVCC 让读取按某个快照选择可见行版本，写入产生新版本时，仍可能保留旧版本供早先读者使用。以 PostgreSQL Repeatable Read 为例，T1 首次读到 100 后，T2 提交 120，T1 再读仍是 100，新事务可读到 120。快照何时更新、版本怎样存储及回收，取决于数据库和隔离级别，不能用这个例子概括所有引擎。

## 常见误区

- **“MVCC 就是任何读都不加锁、任何写都不阻塞。”** 并发冲突与显式锁仍存在。
- **“PostgreSQL Read Committed 的两次 SELECT 必然同一快照。”** 默认是语句级快照，结果可能变化。
- **“旧版本在新事务提交瞬间就无用。”** 旧快照可能仍需读取。

## 选择题

按本课 PostgreSQL Repeatable Read 的时间线，T2 提交后 T1 再读、T3 新读分别得到什么？

- A. 100、100
- B. 100、120
- C. 120、120
- D. 120、100

**答案：B。** T1 沿用旧快照，T3 在提交后建立新快照。

## 参考资料

- [PostgreSQL：MVCC Introduction](https://www.postgresql.org/docs/current/mvcc-intro.html)
- [PostgreSQL：Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
