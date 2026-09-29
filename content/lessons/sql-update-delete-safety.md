---
slug: "sql-update-delete-safety"
title: "UPDATE 和 DELETE 怎样避免误改整张表"
description: "用事务预览目标、限定主键、核对受影响行数，再决定提交或回滚。"
subject: "数据库"
order: 145
minutes: 18
lab: "sql"
objectives: ["解释漏写 WHERE 的影响", "用事务和目标查询校验更新", "区分回滚与备份的保护范围"]
prerequisites: ["sql-basics", "database-transactions"]
---

# UPDATE 和 DELETE 怎样避免误改整张表

## 先确认影响范围

`UPDATE` 与 `DELETE` 不带 `WHERE` 时，会作用于表中所有适用的行；`WHERE` 写错也可能匹配过多行。稳妥操作需要同时确认**目标条件**、**预计行数**、**实际影响行数**和**是否能回滚**。下面用 SQLite 的事务做演练，实验每次从新内存库开始；最后故意 `ROLLBACK`，不会留下改动。[SQLite：UPDATE](https://www.sqlite.org/lang_update.html) [SQLite：DELETE](https://www.sqlite.org/lang_delete.html)

## 实验代码

```sql
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  owner TEXT NOT NULL,
  balance INTEGER NOT NULL
);
INSERT INTO accounts VALUES
  (1, '甲', 100), (2, '乙', 200), (3, '丙', 300);

BEGIN;
SELECT id, owner, balance FROM accounts WHERE id = 2;
UPDATE accounts SET balance = balance + 50 WHERE id = 2;
SELECT changes() AS affected_rows;
SELECT id, owner, balance FROM accounts ORDER BY id;
ROLLBACK;
SELECT id, owner, balance FROM accounts ORDER BY id;
```

预览结果是乙一行；`changes()` 为 1；事务中余额为 100、250、300；回滚后恢复 100、200、300。`changes()` 是 SQLite 对最近一次 `INSERT`、`UPDATE` 或 `DELETE` 的直接改动计数，查询、触发器和外键级联等场景有细节，不能把它当所有数据库统一接口。[SQLite：changes()](https://www.sqlite.org/lang_corefunc.html#changes)

## 真正执行前如何检查

在受控环境里先用**完全相同**的 `WHERE` 条件执行 `SELECT`，确认目标主键和行数；开启事务，执行限定更新，核对实际行数与数据，再 `COMMIT` 或 `ROLLBACK`。生产环境还要考虑并发导致预览后数据变化，必要时使用恰当隔离、锁或版本条件；事务能回滚未提交操作，却不能替代备份，也不能保证提交后随时撤销。[SQLite：Transactions](https://www.sqlite.org/lang_transaction.html)

试把实验里的 `WHERE id = 2` 从 `UPDATE` 去掉：三个余额都会加 50，`changes()` 为 3。若对 `DELETE FROM accounts` 省略 `WHERE`，三行都会被删除；不要在真实库靠“先运行看看”验证这种语句。

## 面试回答

UPDATE、DELETE 漏写或写错 WHERE 会扩大影响范围。先用相同条件预览目标行，最好按唯一键限定；在事务里执行，检查受影响行数与结果，确认无误再提交，发现异常则回滚。事务保护当前未提交修改，不能代替备份、权限限制与并发控制。

## 常见误区

- **“写了 WHERE 就一定只改一行。”** 条件可能匹配多行；应核对唯一键与实际行数。
- **“有事务就不用备份。”** 已提交误操作和其他故障仍需恢复策略。

## 选择题

本课把 `UPDATE` 的 `WHERE id = 2` 删除，但保留 `ROLLBACK`，最终三行余额是多少？

- A. 100、250、300
- B. 150、250、350
- C. 100、200、300
- D. 只剩乙一行

**答案：C。** 事务中会暂时改三行，但最后整体回滚到初值；这不意味着漏写 WHERE 没风险。

## 参考资料

- [SQLite：UPDATE](https://www.sqlite.org/lang_update.html)
- [SQLite：DELETE](https://www.sqlite.org/lang_delete.html)
- [SQLite：Transactions](https://www.sqlite.org/lang_transaction.html)
