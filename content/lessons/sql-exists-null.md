---
slug: "sql-exists-null"
title: "NOT EXISTS、NOT IN 与 NULL"
subject: "数据库"
description: "找没有成绩的学生，观察一个 NULL 如何改变 NOT IN 的查询结果。"
order: 132
minutes: 17
lab: "sql"
objectives: ["用相关子查询找缺失记录", "推导 NOT IN 遇到 NULL 的三值逻辑", "解释 EXISTS 为什么只关心是否有行"]
prerequisites: ["sql-basics", "sql-join"]
---

# NOT EXISTS、NOT IN 与 NULL

## 面试回答

`EXISTS` 判断子查询是否至少返回一行，`NOT EXISTS` 可表达“对当前外层记录找不到匹配行”。`NOT IN` 在右侧集合可能含 `NULL` 时必须小心：对未匹配的值，比较结果可能是未知（UNKNOWN）而不是真，`WHERE` 会过滤它。找“没有关联记录”时，相关 `NOT EXISTS` 往往更直接；具体性能仍要看索引与执行计划，不能只凭关键字断言更快。[SQLite 官方文档：SQL Expressions](https://www.sqlite.org/lang_expr.html)

## 用四条成绩记录观察

实验数据库初始有学生 `(1,Lin)、(2,Zhou)、(3,Xu)`，成绩表有 `(1,80)、(1,90)、(2,60)`。先额外插入一条 `student_id=NULL` 的成绩，表示这条成绩没有已知归属；它并不等于任何学生编号。

```text
students: 1 Lin | 2 Zhou | 3 Xu
scores.student_id: 1 | 1 | 2 | NULL
```

对 Xu 的 `id=3`，相关 `NOT EXISTS` 查不到 `student_id=3` 的成绩行，因此返回 Xu。`3 NOT IN (1,1,2,NULL)` 则不能判真：虽然 3 不等于 1 或 2，但 `3 <> NULL` 的结果是未知；整个否定成员判断不为真，`WHERE` 不保留 Xu。

| 外层学生 | `NOT EXISTS` 有匹配行吗 | `NOT EXISTS` 保留吗 | `NOT IN` 在含 NULL 集合中为真吗 |
| --- | --- | --- | --- |
| Lin，id 1 | 有 | 否 | 否 |
| Zhou，id 2 | 有 | 否 | 否 |
| Xu，id 3 | 无 | 是 | 否，结果未知 |

## 实验代码

```sql
INSERT INTO scores (student_id, score) VALUES (NULL, 70);

SELECT s.id, s.name
FROM students AS s
WHERE NOT EXISTS (
  SELECT 1 FROM scores AS c WHERE c.student_id = s.id
)
ORDER BY s.id;

SELECT s.id, s.name
FROM students AS s
WHERE s.id NOT IN (SELECT student_id FROM scores)
ORDER BY s.id;
```

在网站里运行：第一份结果应出现 `3, Xu`，第二份结果没有行。然后删除第一句 `INSERT` 再运行，两句查询都会找到 Xu。每次运行都重建初始 SQLite 数据，因此不必手动清理上一次的插入。SQLite 对 `IN`、`NOT IN` 和空集合还有专门规则；本例讨论的是**非空且含 NULL**的右侧集合。[SQLite 官方文档：IN/NOT IN Operators](https://www.sqlite.org/lang_expr.html#the_in_and_not_in_operators)

## 为什么 WHERE 过滤未知

SQL 的逻辑结果除了 TRUE 和 FALSE，还有 UNKNOWN。`NULL` 表示未知或缺失，不能用 `= NULL` 判断；应使用 `IS NULL`。`WHERE` 只保留条件为 TRUE 的行，FALSE 和 UNKNOWN 都不会出现。这不是“NULL 等于所有值”，恰好相反：与未知值做普通相等比较，无法得出真或假。[SQLite 官方文档：NULL Values](https://www.sqlite.org/lang_expr.html)

## 把三值逻辑展开一次

`3 IN (1,NULL)` 可理解为 `(3=1) OR (3=NULL)`，即 FALSE OR UNKNOWN，结果 UNKNOWN；对它取 NOT 仍是 UNKNOWN。`1 IN (1,NULL)` 则是 TRUE OR UNKNOWN，结果 TRUE，所以 `1 NOT IN (...)` 为 FALSE。不是“有 NULL 就把所有比较都变 UNKNOWN”，已确定为真的匹配仍影响整体结果。

| p | NOT p | TRUE AND p | FALSE OR p |
| --- | --- | --- | --- |
| TRUE | FALSE | TRUE | TRUE |
| FALSE | TRUE | FALSE | FALSE |
| UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |

如果业务保证右侧键非空，可用显式 `WHERE student_id IS NOT NULL` 去除未知值；但仍要看外层 id 是否可能 NULL、是否符合要表达的关系。改写不是因为 EXISTS 关键字更“高级”，而是为了精确表达“无匹配行”。

## 误区辨析

- **“`NOT IN` 和 `NOT EXISTS` 永远互换。”** 右侧可能有 NULL 时结果可能不同；还要注意关联条件、重复行和空集合边界。
- **“`NULL = NULL` 是 TRUE。”** 普通等号比较得到 UNKNOWN，判断缺失用 `IS NULL`。
- **“`SELECT 1` 会让 EXISTS 只返回数字 1。”** EXISTS 只看是否有至少一行，子查询选择列表的具体值不决定真假。

## 选择题

在 SQLite 中，右侧非空集合为 `(1, NULL)`，`3 NOT IN (1, NULL)` 在 `WHERE` 中会怎样？

- A. 为 TRUE，保留行
- B. 为 FALSE，保留行
- C. 为 UNKNOWN，不保留行
- D. 抛出语法错误

**答案：C。** 3 与 1 不相等，但与 NULL 比较无法判定，最终条件不是 TRUE，`WHERE` 会过滤。B 即便假设为 FALSE，也不可能“保留行”；D 不符合 SQLite 语法。

## 参考资料

- [SQLite 官方文档：SQL Language Expressions](https://www.sqlite.org/lang_expr.html)
