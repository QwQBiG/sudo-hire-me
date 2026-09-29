---
slug: "sql-constraints"
title: "主键、唯一、检查与外键约束"
description: "用一张员工表实际区分五种常见约束，并看清 SQLite 的 NULL 与外键开关边界。"
subject: "数据库"
order: 128
minutes: 22
lab: "sql"
objectives: ["说清五种约束分别防止什么错误", "解释 UNIQUE 和 CHECK 遇到 NULL 的行为", "在 SQLite 连接上启用并检查外键"]
prerequisites: ["sql-basics"]
---

# 主键、唯一、检查与外键约束

## 为什么要让数据库检查数据

数据库约束（Constraint）是写入时维护的数据规则。即使应用程序先检查了输入，另一段程序仍可能直接写库；约束能在数据库边界拒绝不合规则的写入。它们回答不同问题：某行是谁、某列能否重复、能否缺失、数值是否合规、引用的另一行是否存在。

这里用 SQLite 的普通有行号表（rowid table）建两张表：`departments` 是部门，`staff` 是员工。网页 SQL 实验每次运行会新建内存数据库，因此下面的建表语句要和查询一起运行；实验同时预置 `students`、`scores`，本课**不使用**那两张表。

## 实验代码

```sql
PRAGMA foreign_keys = ON;
PRAGMA foreign_keys;

CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
CREATE TABLE staff (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  salary INTEGER NOT NULL CHECK (salary >= 0),
  dept_id INTEGER NOT NULL REFERENCES departments(id)
);
INSERT INTO departments VALUES (1, 'R&D'), (2, 'Ops');
INSERT INTO staff VALUES (10, 'lin@example.test', 'Lin', 100, 1);
INSERT INTO staff VALUES (11, NULL, 'Zhou', 0, 2);
INSERT INTO staff VALUES (12, NULL, 'Xu', 80, 1);
SELECT id, email, salary, dept_id FROM staff ORDER BY id;
```

第一份结果 `PRAGMA foreign_keys` 应为 `1`，表示**当前连接**已开启外键检查；最后一份结果是三位员工。页面用新连接运行每次代码，因此把 `PRAGMA foreign_keys = ON` 保留在实验代码开头。SQLite 官方文档说明：通常默认未开启，但默认值可能随构建或未来版本变化；不能不检查就假定一律为开或关。在事务进行中切换这个开关不会生效，应在事务开始前设置。[SQLite：Foreign Key Support](https://www.sqlite.org/foreignkeys.html#fk_enable)

## 五种规则各管什么

| 规则 | 本例 | 阻止的写入 |
| --- | --- | --- |
| 主键（Primary Key，PK） | `staff.id` | 重复使用同一个员工编号 |
| 唯一（UNIQUE） | `staff.email` | 两个非 NULL 邮箱相同 |
| 非空（NOT NULL） | `staff.name` 等 | 把必填列写为 NULL |
| 检查（CHECK） | `salary >= 0` | 把负工资写入 |
| 外键（Foreign Key，FK） | `staff.dept_id → departments.id` | 引用不存在的部门 |

`UNIQUE` 并不等于 `NOT NULL`。本例的员工 11 和 12 都没有邮箱；SQLite 允许同一唯一列出现多个 NULL，因为 NULL 不当作彼此相同的已知值。若邮箱必须填写，再给 `email` 增加 `NOT NULL`。[SQLite：CREATE TABLE](https://www.sqlite.org/lang_createtable.html#uniqueconst)

`CHECK (salary >= 0)` **单独使用**也不能保证工资有值：在 SQLite 中，CHECK 表达式为零才违反约束；结果为 NULL 不违反。`salary` 同时声明 `NOT NULL`，才拒绝 NULL 和负数。这里的 `salary INTEGER` 是简化的非负整数示例，不讨论真实货币精度。[SQLite：CHECK constraints](https://www.sqlite.org/lang_createtable.html#ckconst)

## 亲自触发错误

先运行上方完整代码。随后每次**单独**在末尾补一条语句再运行，因为一旦出现约束错误，网页会显示错误而不继续提供后续结果：

```sql
INSERT INTO staff VALUES (10, 'other@example.test', 'Duplicate', 10, 1);
```

这会违反 `staff.id` 主键唯一性。把新行编号改为 13，但邮箱改成 `lin@example.test`，则违反邮箱唯一性。把姓名改为 `NULL` 或工资改为 `-1`，分别触发 NOT NULL 或 CHECK。最后把 `dept_id` 改为 `99`，在本课明确开启外键的**当前连接**里会触发外键错误；如果没有开启开关，单有 `REFERENCES` 声明不足以保证 SQLite 执行外键检查。[SQLite：Foreign Key Support](https://www.sqlite.org/foreignkeys.html)

外键不自动使子表列非空：若去掉 `dept_id INTEGER NOT NULL` 中的 `NOT NULL`，子表允许 `dept_id=NULL`，它不需要匹配部门。这里的父表主键可作为合法引用目标；外键引用其他列时，父键还需满足唯一性等要求。

## SQLite 主键的一个例外

按通常关系模型理解，主键应唯一且非空，但 SQLite 的历史兼容行为不能一句“PK 天然拒绝 NULL”盖过。此处的 `id INTEGER PRIMARY KEY` 是普通 rowid 表中的行标识别名：**显式插入 NULL 会自动分配整数编号**，不是报非空错误。某些非 `INTEGER PRIMARY KEY` 的普通 rowid 表主键列甚至可以保存 NULL；`WITHOUT ROWID`、`STRICT` 表或显式 NOT NULL 则不同。面试先讲主键的设计目的，再指出所用数据库的实际行为。[SQLite：PRIMARY KEY](https://www.sqlite.org/lang_createtable.html#primkeyconst)

## 面试回答

主键标识一行并保证键唯一；UNIQUE 约束指定值不重复；NOT NULL 禁止缺失；CHECK 限定表达式；外键维护子表到父表的引用。它们不能互相代替。SQLite 中 UNIQUE 可有多个 NULL，CHECK 对 NULL 结果不会拒绝；外键需在连接上开启并确认 `PRAGMA foreign_keys`。具体主键空值行为也要看表类型，尤其不能把 `INTEGER PRIMARY KEY` 的自动编号误说成插入 NULL 必报错。

## 选择题

在本课 SQLite 表定义和 `PRAGMA foreign_keys = ON` 下，哪条新增员工记录可以成功插入（前面的三位员工仍存在）？

- A. `(13, NULL, 'New', 0, 1)`
- B. `(10, 'new@example.test', 'New', 0, 1)`
- C. `(13, 'new@example.test', 'New', -1, 1)`
- D. `(13, 'new@example.test', 'New', 0, 99)`

**答案：A。** `email` 可为 NULL，已有多个 NULL 不违反 SQLite 的 UNIQUE；工资 0 合法、部门 1 存在。B 复用了主键 10；C 违反非负 CHECK；D 引用了不存在的部门 99。

## 参考资料

- [SQLite：CREATE TABLE constraints](https://www.sqlite.org/lang_createtable.html#constraints)
- [SQLite：Foreign Key Support](https://www.sqlite.org/foreignkeys.html)
- [SQLite：PRAGMA foreign_keys](https://www.sqlite.org/pragma.html#pragma_foreign_keys)
