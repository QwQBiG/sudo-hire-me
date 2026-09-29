---
slug: "database-write-ahead-log"
title: "WAL 为何要先记日志再改数据页"
description: "切换日志追加、提交、检查点和崩溃时刻，观察恢复后的值。"
subject: "数据库"
order: 148
minutes: 20
lab: "wal"
objectives: ["区分主数据页、日志记录和提交标记", "按崩溃时刻判断可恢复值", "解释检查点不等于事务提交"]
prerequisites: ["database-transactions", "file-io-buffering"]
---

# WAL 为何要先记日志再改数据页

## 先定义实验模型

**预写式日志**（Write-Ahead Logging，WAL）的核心是：要使修改可恢复，相关日志记录须先于被它描述的数据页写入持久存储；提交后的恢复再依据日志重建状态。不同引擎有不同日志格式、同步设置与恢复规则。本实验把它简化为“主数据页余额 100，拟改为 130，日志先记录更新，再有提交标记，之后检查点把已提交值整理进主文件”。这是教学模型，不是 SQLite WAL 文件的逐字节实现。[SQLite：Write-Ahead Logging](https://www.sqlite.org/wal.html)

## 动手制造两个崩溃点

先在实验里“开始修改”，此时只在事务内计划把余额改到 130，主文件仍为 100；再“追加日志”，日志里有待提交变更。若此刻崩溃，该事务没有提交，恢复后应保留 100。重置后重复，并“提交”后再崩溃：在模型假设提交记录已持久化的条件下，恢复应得到 130，即使尚未检查点、主文件仍显示 100。最后试“检查点”：把已提交值整理到主文件，**不是**再次提交事务。[SQLite：How WAL Works](https://www.sqlite.org/wal.html#how_wal_works)

真实系统的持久性受 `fsync`、存储硬件和同步配置影响。例如 SQLite 的 `PRAGMA synchronous` 设置会改变 WAL 模式下某些崩溃场景的保证，不能脱离设置说“COMMIT 返回就必然抵御任何断电”。WAL 也不等于全程无锁或总是更快。[SQLite：PRAGMA synchronous](https://www.sqlite.org/pragma.html#pragma_synchronous)

## 面试回答

WAL 把恢复所需的日志先于对应数据页持久化。事务提交可以先让日志中出现可恢复的已提交状态，主数据文件稍后由检查点整理；所以主文件暂时还是旧值，不代表提交失败。崩溃恢复要区分提交前后：未提交更新不能当成已生效，已提交更新应按持久化保证恢复。具体提交持久性要看引擎及同步配置。

## 常见误区

- **“检查点才算真正提交。”** 提交与检查点是不同动作。
- **“写进进程内存的日志就是持久日志。”** 断电保证依赖实际持久化与配置。
- **“WAL 永远使读写互不干扰。”** 仍有锁、检查点和实现上的约束。

## 选择题

在本实验“提交记录已持久化”的前提下，提交后、检查点前崩溃，恢复后余额应是多少？

- A. 0
- B. 100
- C. 130
- D. 无法从任何日志恢复

**答案：C。** 已持久化的提交日志足以恢复本次更新；主文件尚未检查点不改变这一点。

## 参考资料

- [SQLite：Write-Ahead Logging](https://www.sqlite.org/wal.html)
- [SQLite：PRAGMA synchronous](https://www.sqlite.org/pragma.html#pragma_synchronous)
